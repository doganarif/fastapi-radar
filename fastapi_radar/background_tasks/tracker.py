from __future__ import annotations

import asyncio
import inspect
import threading
import traceback
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple

from fastapi import APIRouter, WebSocket
from fastapi.websockets import WebSocketDisconnect
from starlette.websockets import WebSocketState

TrackedArgs = Tuple[Any, ...]
TrackedKwargs = Dict[str, Any]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_serializable(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (list, tuple, set)):
        return [_to_serializable(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _to_serializable(val) for key, val in value.items()}
    return repr(value)


def _function_key(func: Callable[..., Any]) -> str:
    module = getattr(func, "__module__", "unknown")
    qualname = getattr(func, "__qualname__", getattr(func, "__name__", "callable"))
    return f"{module}:{qualname}"


@dataclass
class TrackedTask:
    """Represents a background task lifecycle."""

    id: str
    function_key: str
    function_name: str
    queued_at: datetime
    status: str = "queued"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    args_serialized: List[Any] = field(default_factory=list)
    kwargs_serialized: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    error_trace: Optional[str] = None
    _args: TrackedArgs = field(default_factory=tuple, repr=False)
    _kwargs: TrackedKwargs = field(default_factory=dict, repr=False)

    def duration_ms(self) -> Optional[float]:
        if self.started_at is None or self.ended_at is None:
            return None
        delta = self.ended_at - self.started_at
        return round(delta.total_seconds() * 1000.0, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "function_key": self.function_key,
            "function_name": self.function_name,
            "status": self.status,
            "queued_at": self.queued_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_ms": self.duration_ms(),
            "params": {
                "args": self.args_serialized,
                "kwargs": self.kwargs_serialized,
            },
            "error_message": self.error_message,
            "error_trace": self.error_trace,
        }


class BackgroundTaskTracker:
    """Track FastAPI background task execution and provide live updates."""

    def __init__(self, max_tasks: int = 10000) -> None:
        self._max_tasks = max_tasks
        self._tasks: Dict[str, TrackedTask] = {}
        self._functions: Dict[str, Callable[..., Any]] = {}
        self._lock = threading.Lock()
        self._connections: Set[WebSocket] = set()
        self._connections_lock = threading.Lock()

    # ------------------------------------------------------------------ #
    # Public API                                                         #
    # ------------------------------------------------------------------ #
    def wrap(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Callable[[], None]:
        """Wrap a callable so we can observe its lifecycle."""
        task_id = str(uuid.uuid4())
        func_key = _function_key(func)
        queued_at = _now()

        serialized_args, serialized_kwargs = self._serialize_call_arguments(func, args, kwargs)

        tracked = TrackedTask(
            id=task_id,
            function_key=func_key,
            function_name=getattr(func, "__name__", func_key),
            queued_at=queued_at,
            args_serialized=serialized_args,
            kwargs_serialized=serialized_kwargs,
            _args=args,
            _kwargs=kwargs,
        )

        with self._lock:
            self._tasks[task_id] = tracked
            self._functions[func_key] = func
            self._enforce_limit_locked()

        self._broadcast_snapshot()

        def runner() -> None:
            self._mark_running(task_id)
            try:
                result = func(*args, **kwargs)
                if inspect.isawaitable(result):
                    self._await_async_callable(result)
                self._mark_finished(task_id)
            except Exception as exc:  # pragma: no cover - defensive
                self._mark_failed(task_id, exc)
            finally:
                self._finalize(task_id)

        return runner

    def list_tasks(self) -> List[Dict[str, Any]]:
        with self._lock:
            tasks = list(self._tasks.values())
        tasks.sort(key=lambda task: task.queued_at, reverse=True)
        return [task.to_dict() for task in tasks]

    def clear(self) -> None:
        with self._lock:
            self._tasks.clear()
            self._functions.clear()
        self._broadcast_snapshot()

    def rerun(self, task_id: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                raise KeyError(task_id)
            func = self._functions.get(task.function_key)
            if not func:
                raise KeyError(task.function_key)
            args = task._args
            kwargs = task._kwargs

        runner = self.wrap(func, *args, **kwargs)
        thread = threading.Thread(target=runner, daemon=True)
        thread.start()

    async def handle_websocket(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._add_connection(websocket)
        try:
            await websocket.send_json({"tasks": self.list_tasks()})
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            self._remove_connection(websocket)

    # ------------------------------------------------------------------ #
    # Internal helpers                                                   #
    # ------------------------------------------------------------------ #
    def _add_connection(self, websocket: WebSocket) -> None:
        with self._connections_lock:
            self._connections.add(websocket)

    def _remove_connection(self, websocket: WebSocket) -> None:
        with self._connections_lock:
            self._connections.discard(websocket)

    def _serialize_call_arguments(
        self,
        func: Callable[..., Any],
        args: Iterable[Any],
        kwargs: Dict[str, Any],
    ) -> Tuple[List[Any], Dict[str, Any]]:
        serialized_args = [_to_serializable(item) for item in args]
        serialized_kwargs = {key: _to_serializable(val) for key, val in kwargs.items()}

        if not kwargs:
            try:
                signature = inspect.signature(func)
                bound = signature.bind_partial(*args)
                bound.apply_defaults()
                serialized_kwargs = {
                    key: _to_serializable(val) for key, val in bound.arguments.items()
                }
                serialized_args = []
            except Exception:
                # Fall back to positional rendering; best effort only.
                pass

        return serialized_args, serialized_kwargs

    def _await_async_callable(self, awaitable: Any) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            asyncio.run(awaitable)
            return

        future = asyncio.run_coroutine_threadsafe(awaitable, loop)
        future.result()

    def _mark_running(self, task_id: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.status = "running"
            task.started_at = _now()
        self._broadcast_snapshot()

    def _mark_finished(self, task_id: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.status = "finished"
        self._broadcast_snapshot()

    def _mark_failed(self, task_id: str, exc: Exception) -> None:
        formatted_trace = traceback.format_exc()
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.status = "failed"
            task.error_message = str(exc)
            task.error_trace = formatted_trace
        self._broadcast_snapshot()

    def _finalize(self, task_id: str) -> None:
        with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            task.ended_at = _now()
            self._enforce_limit_locked()
        self._broadcast_snapshot()

    def _enforce_limit_locked(self) -> None:
        if len(self._tasks) <= self._max_tasks:
            return
        tasks = sorted(
            self._tasks.values(),
            key=lambda task: (
                task.ended_at or datetime.max.replace(tzinfo=timezone.utc),
                task.started_at or datetime.max.replace(tzinfo=timezone.utc),
                task.queued_at,
            ),
        )
        excess = len(self._tasks) - self._max_tasks
        for i in range(excess):
            to_remove = tasks[i]
            self._tasks.pop(to_remove.id, None)

    def _broadcast_snapshot(self) -> None:
        snapshot = {"tasks": self.list_tasks()}

        async def _send() -> None:
            to_remove: List[WebSocket] = []
            with self._connections_lock:
                connections = list(self._connections)
            for websocket in connections:
                if websocket.client_state != WebSocketState.CONNECTED:
                    to_remove.append(websocket)
                    continue
                try:
                    await websocket.send_json(snapshot)
                except Exception:
                    to_remove.append(websocket)
            if to_remove:
                with self._connections_lock:
                    for websocket in to_remove:
                        self._connections.discard(websocket)

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            asyncio.run(_send())
        else:
            loop.create_task(_send())


_ACTIVE_TRACKER: Optional[BackgroundTaskTracker] = None
_ORIGINAL_ADD_TASK: Optional[Callable[..., Any]] = None
_PATCH_LOCK = threading.Lock()


def get_background_task_tracker() -> Optional[BackgroundTaskTracker]:
    return _ACTIVE_TRACKER


def install_background_task_tracker(tracker: BackgroundTaskTracker) -> None:
    from fastapi import BackgroundTasks

    global _ACTIVE_TRACKER, _ORIGINAL_ADD_TASK

    with _PATCH_LOCK:
        _ACTIVE_TRACKER = tracker
        if _ORIGINAL_ADD_TASK is not None:
            return

        _ORIGINAL_ADD_TASK = BackgroundTasks.add_task

        def patched_add_task(self: BackgroundTasks, func: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
            active = get_background_task_tracker()
            if active is None:
                return _ORIGINAL_ADD_TASK(self, func, *args, **kwargs)
            wrapped = active.wrap(func, *args, **kwargs)
            return _ORIGINAL_ADD_TASK(self, wrapped)

        BackgroundTasks.add_task = patched_add_task  # type: ignore[assignment]


def create_tasks_websocket_router(tracker: BackgroundTaskTracker) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws/background-tasks")
    async def background_tasks_socket(websocket: WebSocket) -> None:
        await tracker.handle_websocket(websocket)

    return router
