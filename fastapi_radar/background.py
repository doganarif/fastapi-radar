"""Background task monitoring for FastAPI Radar."""

import inspect
import time
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Callable, Any

from .models import BackgroundTask


def track_background_task(get_session: Callable):
    """Decorator to track background tasks.

    Can optionally accept request_id as kwarg:
    background_tasks.add_task(my_task, arg1, request_id="abc123")
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            task_id = str(uuid.uuid4())
            # Extract request_id from kwargs if provided
            req_id = kwargs.pop("_radar_request_id", None)
            # Clean task name (just function name, not full module path)
            task_name = func.__name__

            # Create task record
            with get_session() as session:
                task = BackgroundTask(
                    task_id=task_id,
                    request_id=req_id,
                    name=task_name,
                    status="running",
                    start_time=datetime.now(timezone.utc),
                )
                session.add(task)
                session.commit()

            start_time = time.time()
            error = None

            try:
                result = await func(*args, **kwargs)
                status = "completed"
                return result
            except Exception as e:
                status = "failed"
                error = str(e)
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000

                with get_session() as session:
                    task = session.query(BackgroundTask).filter(
                        BackgroundTask.task_id == task_id
                    ).first()
                    if task:
                        task.status = status
                        task.end_time = datetime.now(timezone.utc)
                        task.duration_ms = duration_ms
                        task.error = error
                        session.commit()

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            task_id = str(uuid.uuid4())
            # Extract request_id from kwargs if provided
            req_id = kwargs.pop("_radar_request_id", None)
            # Clean task name (just function name, not full module path)
            task_name = func.__name__

            # Create task record
            with get_session() as session:
                task = BackgroundTask(
                    task_id=task_id,
                    request_id=req_id,
                    name=task_name,
                    status="running",
                    start_time=datetime.now(timezone.utc),
                )
                session.add(task)
                session.commit()

            start_time = time.time()
            error = None

            try:
                result = func(*args, **kwargs)
                status = "completed"
                return result
            except Exception as e:
                status = "failed"
                error = str(e)
                raise
            finally:
                duration_ms = (time.time() - start_time) * 1000

                with get_session() as session:
                    task = session.query(BackgroundTask).filter(
                        BackgroundTask.task_id == task_id
                    ).first()
                    if task:
                        task.status = status
                        task.end_time = datetime.now(timezone.utc)
                        task.duration_ms = duration_ms
                        task.error = error
                        session.commit()

        # Return appropriate wrapper based on function type
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
