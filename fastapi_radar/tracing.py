"""Tracing core functionality module."""
"""Tracing core functionality module."""

import functools
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from contextvars import ContextVar
from urllib.parse import urlsplit
from sqlalchemy.orm import Session
import traceback
# Query optimized for DuckDB
from sqlalchemy import text
from .models import Trace, Span, SpanRelation

# Trace context for the current request
trace_context: ContextVar[Optional["TraceContext"]] = ContextVar(
    "trace_context", default=None
)


class TraceContext:
    """Tracing context that manages trace and span data for a request."""

    def __init__(self, trace_id: str, service_name: str = "fastapi-app"):
        self.trace_id = trace_id
        self.service_name = service_name
        self.root_span_id: Optional[str] = None
        self.current_span_id: Optional[str] = None
        self.spans: Dict[str, Dict[str, Any]] = {}
        self.start_time = datetime.now(timezone.utc)

    def create_span(
        self,
        operation_name: str,
        parent_span_id: Optional[str] = None,
        span_kind: str = "server",
        tags: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a new span."""
        span_id = self._generate_span_id()

        span_data = {
            "span_id": span_id,
            "trace_id": self.trace_id,
            "parent_span_id": parent_span_id or self.current_span_id,
            "operation_name": operation_name,
            "service_name": self.service_name,
            "span_kind": span_kind,
            "start_time": datetime.now(timezone.utc),
            "tags": tags or {},
            "logs": [],
            "status": "ok",
        }

        self.spans[span_id] = span_data

        # Set root span if not already set
        if self.root_span_id is None:
            self.root_span_id = span_id

        return span_id

    def finish_span(
        self, span_id: str, status: str = "ok", tags: Optional[Dict[str, Any]] = None
    ):
        """Finish a span."""
        if span_id not in self.spans:
            return

        span_data = self.spans[span_id]
        span_data["end_time"] = datetime.now(timezone.utc)
        span_data["duration_ms"] = (
            span_data["end_time"] - span_data["start_time"]
        ).total_seconds() * 1000
        span_data["status"] = status

        if tags:
            span_data["tags"].update(tags)

    def add_span_log(self, span_id: str, message: str, level: str = "info", **fields):
        """Add a log entry to a span."""
        if span_id not in self.spans:
            return

        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
            **fields,
        }

        self.spans[span_id]["logs"].append(log_entry)

    def set_current_span(self, span_id: str):
        """Set the current active span."""
        self.current_span_id = span_id

    def get_trace_summary(self) -> Dict[str, Any]:
        """Return a trace summary for persistence and display."""
        if not self.spans:
            return {}

        all_times = []
        error_count = 0

        for span in self.spans.values():
            if span.get("start_time"):
                all_times.append(span["start_time"])
            if span.get("end_time"):
                all_times.append(span["end_time"])
            if span.get("status") == "error":
                error_count += 1

        start_time = min(all_times) if all_times else self.start_time
        end_time = max(all_times) if all_times else datetime.now(timezone.utc)

        return {
            "trace_id": self.trace_id,
            "service_name": self.service_name,
            "operation_name": self.spans.get(self.root_span_id, {}).get(
                "operation_name", "unknown"
            ),
            "start_time": start_time,
            "end_time": end_time,
            "duration_ms": (end_time - start_time).total_seconds() * 1000,
            "span_count": len(self.spans),
            "status": "error" if error_count > 0 else "ok",
            "tags": {},
        }

    @staticmethod
    def _generate_span_id() -> str:
        """Generate a 16-character hexadecimal span ID."""
        return uuid.uuid4().hex[:16]


class TracingManager:
    """Tracing manager responsible for persistence and querying."""

    def __init__(self, get_session):
        self.get_session = get_session

    def save_trace_context(self, trace_ctx: TraceContext):
        """Persist the trace context into the database."""
        with self.get_session() as session:
            # Save trace
            trace_summary = trace_ctx.get_trace_summary()
            trace = Trace(**trace_summary)
            session.add(trace)

            # Save spans
            for span_data in trace_ctx.spans.values():
                span = Span(**span_data)
                session.add(span)

            self._save_span_relations(session, trace_ctx)

            session.commit()

    def _save_span_relations(self, session: Session, trace_ctx: TraceContext):
        """Store parent-child span relations for optimized querying."""

        def calculate_depth(
            span_id: str, spans: Dict[str, Dict], depth: int = 0
        ) -> List[tuple]:
            """Recursively compute span depth."""
            relations = []
            span = spans.get(span_id)
            if not span:
                return relations

            # Find all child spans
            for sid, s in spans.items():
                if s.get("parent_span_id") == span_id:
                    relations.append((span_id, sid, depth + 1))
                    relations.extend(calculate_depth(sid, spans, depth + 1))

            return relations

        # Start from the root span
        if trace_ctx.root_span_id:
            relations = calculate_depth(trace_ctx.root_span_id, trace_ctx.spans)

            for parent_id, child_id, depth in relations:
                relation = SpanRelation(
                    trace_id=trace_ctx.trace_id,
                    parent_span_id=parent_id,
                    child_span_id=child_id,
                    depth=depth,
                )
                session.add(relation)

    @classmethod
    def get_waterfall_data(
        cls, session_local, trace_id: str
    ) -> List[Dict[str, Any]]:
        """Return data for the waterfall view using the provided session."""


        #print(f"[DEBUG] get_waterfall_data called with trace_id: {trace_id}")

        waterfall_query = text(
            """
            WITH span_timeline AS (
                SELECT
                    s.span_id,
                    s.parent_span_id,
                    s.operation_name,
                    s.service_name,
                    s.start_time,
                    s.end_time,
                    s.duration_ms,
                    s.status,
                    s.tags,
                    COALESCE(r.depth, 0) as depth,
                    -- Offset relative to trace start
                    EXTRACT(EPOCH FROM (
                        s.start_time - MIN(s.start_time)
                            OVER (PARTITION BY s.trace_id)
                    )) * 1000 as offset_ms
                FROM radar_spans s
                LEFT JOIN radar_span_relations r ON s.span_id = r.child_span_id
                WHERE s.trace_id = :trace_id
            )
            SELECT * FROM span_timeline
            ORDER BY offset_ms, depth
        """
        )

        #print(f"[DEBUG] Getting SessionLocal from session_local function")
        SessionLocal = session_local()  # 获取SessionLocal (sessionmaker)
        #print(f"[DEBUG] SessionLocal type: {type(SessionLocal)}")

        session = SessionLocal()  # 创建实际的session实例
        #print(f"[DEBUG] Session created, type: {type(session)}")

        try:
            #print(f"[DEBUG] Executing waterfall query for trace_id: {trace_id}")
            result = session.execute(waterfall_query, {"trace_id": trace_id})
            #print(f"[DEBUG] Query executed successfully")

            # 不需要 commit，因为这是 SELECT 查询
            rows = []
            for row in result:
                rows.append({
                    "span_id": row.span_id,
                    "parent_span_id": row.parent_span_id,
                    "operation_name": row.operation_name,
                    "service_name": row.service_name,
                    "start_time": row.start_time.isoformat() if row.start_time else None,
                    "end_time": row.end_time.isoformat() if row.end_time else None,
                    "duration_ms": row.duration_ms,
                    "status": row.status,
                    "tags": row.tags,
                    "depth": row.depth,
                    "offset_ms": float(row.offset_ms) if row.offset_ms else 0.0,
                })

            #print(f"[DEBUG] Processed {len(rows)} rows from query result")
            return rows

        except Exception as e:
            print(f"[ERROR] Exception in get_waterfall_data: {str(e)}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            session.rollback()
            raise
        finally:
            #print(f"[DEBUG] Closing session")
            session.close()


def _extract_http_host(url: Optional[str]) -> Optional[str]:
    if not url:
        return None

    try:
        parsed = urlsplit(url)
        return parsed.netloc or None
    except Exception:
        return None


def _create_http_span(
    method: Optional[str], url: Optional[str]
) -> Tuple[Optional["TraceContext"], Optional[str]]:
    trace_ctx = get_current_trace_context()
    if not trace_ctx:
        return None, None

    method_name = str(method).upper() if method else "GET"
    url_value = str(url) if url is not None else ""
    tags: Dict[str, Any] = {
        "component": "http",
        "http.method": method_name,
        "http.url": url_value,
    }

    host = _extract_http_host(url_value)
    if host:
        tags["http.host"] = host

    span_id = trace_ctx.create_span(
        operation_name=f"HTTP {method_name}",
        span_kind="client",
        tags=tags,
    )

    return trace_ctx, span_id


def _extract_status_code(response: Any) -> Optional[int]:
    for attr in ("status_code", "status"):
        value = getattr(response, attr, None)
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                return None
    return None


def _extract_content_length(response: Any) -> Optional[str]:
    headers = getattr(response, "headers", None)
    if not headers:
        return None

    try:
        return headers.get("content-length")
    except Exception:
        return None


def _finish_http_span(
    trace_ctx: Optional["TraceContext"],
    span_id: Optional[str],
    response: Any = None,
    error: Optional[BaseException] = None,
) -> None:
    if not trace_ctx or not span_id:
        return

    tags: Dict[str, Any] = {}
    status = "ok"

    if response is not None:
        status_code = _extract_status_code(response)
        if status_code is not None:
            tags["http.status_code"] = status_code

        content_length = _extract_content_length(response)
        if content_length:
            tags["http.response_content_length"] = content_length

    if error is not None:
        status = "error"
        tags["error.type"] = type(error).__name__
        tags["error.message"] = str(error)
        trace_ctx.add_span_log(
            span_id,
            f"HTTP request failed: {error}",
            level="error",
            exception_type=type(error).__name__,
        )

    trace_ctx.finish_span(span_id, status=status, tags=tags if tags else None)


def _instrument_requests() -> None:
    try:
        import requests  # type: ignore[import-not-found]
    except ImportError:
        return

    session_cls = requests.sessions.Session
    original_request = session_cls.request
    if getattr(original_request, "_radar_instrumented", False):
        return

    @functools.wraps(original_request)
    def wrapped_request(self, method, url, *args, **kwargs):
        trace_ctx, span_id = _create_http_span(method, url)
        try:
            response = original_request(self, method, url, *args, **kwargs)
            _finish_http_span(trace_ctx, span_id, response=response)
            return response
        except Exception as exc:
            _finish_http_span(trace_ctx, span_id, error=exc)
            raise

    wrapped_request._radar_instrumented = True  # type: ignore[attr-defined]
    wrapped_request._radar_original = original_request  # type: ignore[attr-defined]
    session_cls.request = wrapped_request


def _instrument_httpx() -> None:
    try:
        import httpx  # type: ignore[import-not-found]
    except ImportError:
        return

    if hasattr(httpx, "Client"):
        original_client_request = httpx.Client.request
        if not getattr(original_client_request, "_radar_instrumented", False):

            @functools.wraps(original_client_request)
            def client_request(self, method, url, *args, **kwargs):
                trace_ctx, span_id = _create_http_span(method, url)
                try:
                    response = original_client_request(self, method, url, *args, **kwargs)
                    _finish_http_span(trace_ctx, span_id, response=response)
                    return response
                except Exception as exc:
                    _finish_http_span(trace_ctx, span_id, error=exc)
                    raise

            client_request._radar_instrumented = True  # type: ignore[attr-defined]
            client_request._radar_original = original_client_request  # type: ignore[attr-defined]
            httpx.Client.request = client_request

    if hasattr(httpx, "AsyncClient"):
        original_async_request = httpx.AsyncClient.request
        if not getattr(original_async_request, "_radar_instrumented", False):

            @functools.wraps(original_async_request)
            async def async_client_request(self, method, url, *args, **kwargs):
                trace_ctx, span_id = _create_http_span(method, url)
                try:
                    response = await original_async_request(self, method, url, *args, **kwargs)
                    _finish_http_span(trace_ctx, span_id, response=response)
                    return response
                except Exception as exc:
                    _finish_http_span(trace_ctx, span_id, error=exc)
                    raise

            async_client_request._radar_instrumented = True  # type: ignore[attr-defined]
            async_client_request._radar_original = original_async_request  # type: ignore[attr-defined]
            httpx.AsyncClient.request = async_client_request

    if hasattr(httpx, "request"):
        original_module_request = httpx.request
        if not getattr(original_module_request, "_radar_instrumented", False):

            @functools.wraps(original_module_request)
            def module_request(method, url, *args, **kwargs):
                trace_ctx, span_id = _create_http_span(method, url)
                try:
                    response = original_module_request(method, url, *args, **kwargs)
                    _finish_http_span(trace_ctx, span_id, response=response)
                    return response
                except Exception as exc:
                    _finish_http_span(trace_ctx, span_id, error=exc)
                    raise

            module_request._radar_instrumented = True  # type: ignore[attr-defined]
            module_request._radar_original = original_module_request  # type: ignore[attr-defined]
            httpx.request = module_request


def _instrument_aiohttp() -> None:
    try:
        import aiohttp  # type: ignore[import-not-found]
    except ImportError:
        return

    original_request = aiohttp.ClientSession._request
    if getattr(original_request, "_radar_instrumented", False):
        return

    @functools.wraps(original_request)
    async def wrapped_request(self, method, url, *args, **kwargs):
        trace_ctx, span_id = _create_http_span(method, url)
        try:
            response = await original_request(self, method, url, *args, **kwargs)
            _finish_http_span(trace_ctx, span_id, response=response)
            return response
        except Exception as exc:
            _finish_http_span(trace_ctx, span_id, error=exc)
            raise

    wrapped_request._radar_instrumented = True  # type: ignore[attr-defined]
    wrapped_request._radar_original = original_request  # type: ignore[attr-defined]
    aiohttp.ClientSession._request = wrapped_request


def instrument_outbound_http_clients() -> None:
    _instrument_requests()
    _instrument_httpx()
    _instrument_aiohttp()


def get_current_trace_context() -> Optional[TraceContext]:
    """Get the current trace context."""
    return trace_context.get()


def set_trace_context(ctx: TraceContext):
    """Set the current trace context."""
    trace_context.set(ctx)


def create_trace_context(service_name: str = "fastapi-app") -> TraceContext:
    """Create a new trace context."""
    trace_id = uuid.uuid4().hex
    return TraceContext(trace_id, service_name)
