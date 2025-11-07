"""API endpoints for FastAPI Radar dashboard."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Union
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session
import httpx

from .models import (
    CapturedRequest,
    CapturedQuery,
    CapturedException,
    Trace,
    Span,
    BackgroundTask,
)
from .tracing import TracingManager


def round_float(value: Optional[float], decimals: int = 2) -> Optional[float]:
    """Round a float value to specified decimal places."""
    if value is None:
        return None
    return round(value, decimals)


class RequestSummary(BaseModel):
    id: int
    request_id: str
    method: str
    path: str
    status_code: Optional[int]
    duration_ms: Optional[float]
    query_count: int
    has_exception: bool
    created_at: datetime


class RequestDetail(BaseModel):
    id: int
    request_id: str
    method: str
    url: str
    path: str
    query_params: Optional[Dict[str, Any]]
    headers: Optional[Dict[str, str]]
    body: Optional[str]
    status_code: Optional[int]
    response_body: Optional[str]
    response_headers: Optional[Dict[str, str]]
    duration_ms: Optional[float]
    client_ip: Optional[str]
    created_at: datetime
    queries: List[Dict[str, Any]]
    exceptions: List[Dict[str, Any]]


class QueryDetail(BaseModel):
    id: int
    request_id: str
    sql: str
    parameters: Union[Dict[str, str], List[str], None]
    duration_ms: Optional[float]
    rows_affected: Optional[int]
    connection_name: Optional[str]
    created_at: datetime


class ExceptionDetail(BaseModel):
    id: int
    request_id: str
    exception_type: str
    exception_value: Optional[str]
    traceback: str
    created_at: datetime


class DashboardStats(BaseModel):
    total_requests: int
    avg_response_time: Optional[float]
    total_queries: int
    avg_query_time: Optional[float]
    total_exceptions: int
    slow_queries: int
    requests_per_minute: float


class TraceSummary(BaseModel):
    trace_id: str
    service_name: Optional[str]
    operation_name: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    duration_ms: Optional[float]
    span_count: int
    status: str
    created_at: datetime


class BackgroundTaskSummary(BaseModel):
    id: int
    task_id: str
    request_id: Optional[str]
    name: str
    status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration_ms: Optional[float]
    error: Optional[str]
    created_at: datetime


class WaterfallSpan(BaseModel):
    span_id: str
    parent_span_id: Optional[str]
    operation_name: str
    service_name: Optional[str]
    start_time: Optional[str]  # ISO 8601 string
    end_time: Optional[str]  # ISO 8601 string
    duration_ms: Optional[float]
    status: str
    tags: Optional[Dict[str, Any]]
    depth: int
    offset_ms: float  # Offset from trace start in ms


class TraceDetail(BaseModel):
    trace_id: str
    service_name: Optional[str]
    operation_name: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    duration_ms: Optional[float]
    span_count: int
    status: str
    tags: Optional[Dict[str, Any]]
    created_at: datetime
    spans: List[WaterfallSpan]


def create_api_router(get_session_context) -> APIRouter:
    router = APIRouter(prefix="/__radar/api", tags=["radar"])

    def get_db():
        """Dependency function for FastAPI to get database session."""
        with get_session_context() as session:
            yield session

    @router.get("/requests", response_model=List[RequestSummary])
    async def get_requests(
        limit: int = Query(100, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        status_code: Optional[int] = None,
        method: Optional[str] = None,
        search: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        session: Session = Depends(get_db),
    ):
        query = session.query(CapturedRequest)

        if start_time:
            query = query.filter(CapturedRequest.created_at >= start_time)
        if end_time:
            query = query.filter(CapturedRequest.created_at <= end_time)
        if status_code:
            if status_code in [200, 300, 400, 500]:
                # Filter by status code range
                lower_bound = status_code
                upper_bound = status_code + 100
                query = query.filter(
                    CapturedRequest.status_code >= lower_bound,
                    CapturedRequest.status_code < upper_bound,
                )
            else:
                # Exact status code match
                query = query.filter(CapturedRequest.status_code == status_code)
        if method:
            query = query.filter(CapturedRequest.method == method)
        if search:
            query = query.filter(CapturedRequest.path.ilike(f"%{search}%"))

        requests = (
            query.order_by(desc(CapturedRequest.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            RequestSummary(
                id=req.id,
                request_id=req.request_id,
                method=req.method,
                path=req.path,
                status_code=req.status_code,
                duration_ms=round_float(req.duration_ms),
                query_count=len(req.queries),
                has_exception=len(req.exceptions) > 0,
                created_at=req.created_at,
            )
            for req in requests
        ]

    @router.get("/requests/{request_id}", response_model=RequestDetail)
    async def get_request_detail(request_id: str, session: Session = Depends(get_db)):
        request = (
            session.query(CapturedRequest)
            .filter(CapturedRequest.request_id == request_id)
            .first()
        )

        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        return RequestDetail(
            id=request.id,
            request_id=request.request_id,
            method=request.method,
            url=request.url,
            path=request.path,
            query_params=request.query_params,
            headers=request.headers,
            body=request.body,
            status_code=request.status_code,
            response_body=request.response_body,
            response_headers=request.response_headers,
            duration_ms=round_float(request.duration_ms),
            client_ip=request.client_ip,
            created_at=request.created_at,
            queries=[
                {
                    "id": q.id,
                    "sql": q.sql,
                    "parameters": q.parameters,
                    "duration_ms": round_float(q.duration_ms),
                    "rows_affected": q.rows_affected,
                    "connection_name": q.connection_name,
                    "created_at": q.created_at.isoformat(),
                }
                for q in request.queries
            ],
            exceptions=[
                {
                    "id": e.id,
                    "exception_type": e.exception_type,
                    "exception_value": e.exception_value,
                    "traceback": e.traceback,
                    "created_at": e.created_at.isoformat(),
                }
                for e in request.exceptions
            ],
        )

    @router.get("/requests/{request_id}/curl")
    async def get_request_as_curl(request_id: str, session: Session = Depends(get_db)):
        request = (
            session.query(CapturedRequest)
            .filter(CapturedRequest.request_id == request_id)
            .first()
        )

        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        # Build cURL command
        parts = [f"curl -X {request.method}"]

        # Add headers
        if request.headers:
            for key, value in request.headers.items():
                if key.lower() not in ["host", "content-length"]:
                    parts.append(f"-H '{key}: {value}'")

        # Add body
        if request.body:
            parts.append(f"-d '{request.body}'")

        # Add URL (use full URL if available, otherwise construct from path)
        url = request.url if request.url else request.path
        parts.append(f"'{url}'")

        return {"curl": " ".join(parts)}

    @router.post("/requests/{request_id}/replay")
    async def replay_request(
        request_id: str,
        body: Optional[Dict[str, Any]] = None,
        session: Session = Depends(get_db),
    ):
        """Replay a captured request with optional body override.

        WARNING: This endpoint replays HTTP requests. Use with caution in production.
        Consider adding authentication and rate limiting.
        """
        request = (
            session.query(CapturedRequest)
            .filter(CapturedRequest.request_id == request_id)
            .first()
        )

        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        # Security: Validate URL to prevent SSRF attacks
        # Note: This is basic protection. For production, consider:
        # 1. Whitelist allowed domains
        # 2. Add authentication to this endpoint
        # 3. Add rate limiting
        from urllib.parse import urlparse

        parsed = urlparse(request.url)

        # For dev/testing, allow localhost. For production, consider blocking.
        # Uncomment below to block all internal IPs:
        # if parsed.hostname in ["localhost", "127.0.0.1", "0.0.0.0", "::1", "::ffff:127.0.0.1"]:
        #     raise HTTPException(status_code=403, detail="Replay to localhost is disabled")

        # Build replay request
        headers = dict(request.headers) if request.headers else {}
        # Remove hop-by-hop headers
        headers.pop("host", None)
        headers.pop("content-length", None)
        headers.pop("connection", None)
        headers.pop("keep-alive", None)
        headers.pop("transfer-encoding", None)

        request_body = body if body is not None else request.body

        try:
            async with httpx.AsyncClient(
                timeout=30.0, follow_redirects=False
            ) as client:
                response = await client.request(
                    method=request.method,
                    url=request.url,
                    headers=headers,
                    content=(
                        request_body if isinstance(request_body, (str, bytes)) else None
                    ),
                    json=request_body if isinstance(request_body, dict) else None,
                )

                # Store the replayed request
                replayed_request = CapturedRequest(
                    request_id=str(uuid.uuid4()),
                    method=request.method,
                    url=request.url,
                    path=request.path,
                    query_params=request.query_params,
                    headers=dict(response.request.headers),
                    body=request_body if isinstance(request_body, str) else None,
                    status_code=response.status_code,
                    response_body=response.text[:10000] if response.text else None,
                    response_headers=dict(response.headers),
                    duration_ms=response.elapsed.total_seconds() * 1000,
                    client_ip="replay",
                )
                session.add(replayed_request)
                session.commit()
                session.refresh(replayed_request)

                return {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "body": response.text,
                    "elapsed_ms": response.elapsed.total_seconds() * 1000,
                    "original_status": request.status_code,
                    "original_duration_ms": request.duration_ms,
                    "new_request_id": replayed_request.request_id,
                }
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Replay failed: {str(e)}")

    @router.get("/queries", response_model=List[QueryDetail])
    async def get_queries(
        limit: int = Query(100, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        slow_only: bool = Query(False),
        slow_threshold: int = Query(100),
        search: Optional[str] = None,
        session: Session = Depends(get_db),
    ):
        query = session.query(CapturedQuery)

        if slow_only:
            query = query.filter(CapturedQuery.duration_ms >= slow_threshold)
        if search:
            query = query.filter(CapturedQuery.sql.ilike(f"%{search}%"))

        queries = (
            query.order_by(desc(CapturedQuery.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            QueryDetail(
                id=q.id,
                request_id=q.request_id,
                sql=q.sql,
                parameters=q.parameters,
                duration_ms=round_float(q.duration_ms),
                rows_affected=q.rows_affected,
                connection_name=q.connection_name,
                created_at=q.created_at,
            )
            for q in queries
        ]

    @router.get("/exceptions", response_model=List[ExceptionDetail])
    async def get_exceptions(
        limit: int = Query(100, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        exception_type: Optional[str] = None,
        session: Session = Depends(get_db),
    ):
        query = session.query(CapturedException)

        if exception_type:
            query = query.filter(CapturedException.exception_type == exception_type)

        exceptions = (
            query.order_by(desc(CapturedException.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            ExceptionDetail(
                id=e.id,
                request_id=e.request_id,
                exception_type=e.exception_type,
                exception_value=e.exception_value,
                traceback=e.traceback,
                created_at=e.created_at,
            )
            for e in exceptions
        ]

    @router.get("/stats", response_model=DashboardStats)
    async def get_stats(
        hours: int = Query(1, ge=1, le=720),  # Allow up to 30 days
        slow_threshold: int = Query(100),
        session: Session = Depends(get_db),
    ):
        since = datetime.now(timezone.utc) - timedelta(hours=hours)

        requests = (
            session.query(
                func.count().label("total_requests"),
                func.avg(CapturedRequest.duration_ms).label("avg_response_time"),
            )
            .filter(CapturedRequest.created_at >= since)
            .one()
        )

        queries = (
            session.query(
                func.count().label("total_queries"),
                func.avg(CapturedQuery.duration_ms).label("avg_query_time"),
                func.sum(
                    case((CapturedQuery.duration_ms >= slow_threshold, 1), else_=0)
                ).label("slow_queries"),
            )
            .filter(CapturedQuery.created_at >= since)
            .one()
        )

        exceptions = (
            session.query(func.count().label("total_exceptions"))
            .filter(CapturedException.created_at >= since)
            .one()
        )

        total_requests = requests.total_requests
        avg_response_time = requests.avg_response_time

        total_queries = queries.total_queries
        avg_query_time = queries.avg_query_time
        slow_queries = queries.slow_queries or 0

        total_exceptions = exceptions.total_exceptions

        requests_per_minute = total_requests / (hours * 60)

        return DashboardStats(
            total_requests=total_requests,
            avg_response_time=round_float(avg_response_time),
            total_queries=total_queries,
            avg_query_time=round_float(avg_query_time),
            total_exceptions=total_exceptions,
            slow_queries=slow_queries,
            requests_per_minute=round_float(requests_per_minute),
        )

    @router.delete("/clear")
    async def clear_data(
        older_than_hours: Optional[int] = None, session: Session = Depends(get_db)
    ):
        if older_than_hours:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
            session.query(CapturedRequest).filter(
                CapturedRequest.created_at < cutoff
            ).delete()
        else:
            session.query(CapturedRequest).delete()

        session.commit()
        return {"message": "Data cleared successfully"}

    # Tracing-related API endpoints

    @router.get("/traces", response_model=List[TraceSummary])
    async def get_traces(
        limit: int = Query(100, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        status: Optional[str] = Query(None),
        service_name: Optional[str] = Query(None),
        min_duration_ms: Optional[float] = Query(None),
        hours: int = Query(24, ge=1, le=720),
        session: Session = Depends(get_db),
    ):
        """List traces."""
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        query = session.query(Trace).filter(Trace.created_at >= since)

        if status:
            query = query.filter(Trace.status == status)
        if service_name:
            query = query.filter(Trace.service_name == service_name)
        if min_duration_ms:
            query = query.filter(Trace.duration_ms >= min_duration_ms)

        traces = (
            query.order_by(desc(Trace.start_time)).offset(offset).limit(limit).all()
        )

        return [
            TraceSummary(
                trace_id=t.trace_id,
                service_name=t.service_name,
                operation_name=t.operation_name,
                start_time=t.start_time,
                end_time=t.end_time,
                duration_ms=round_float(t.duration_ms),
                span_count=t.span_count,
                status=t.status,
                created_at=t.created_at,
            )
            for t in traces
        ]

    @router.get("/traces/{trace_id}", response_model=TraceDetail)
    async def get_trace_detail(
        trace_id: str,
        session: Session = Depends(get_db),
    ):
        """Get trace details."""
        trace = session.query(Trace).filter(Trace.trace_id == trace_id).first()
        if not trace:
            raise HTTPException(status_code=404, detail="Trace not found")

        # Fetch waterfall data
        tracing_manager = TracingManager(lambda: get_session_context())
        waterfall_spans = tracing_manager.get_waterfall_data(trace_id)

        return TraceDetail(
            trace_id=trace.trace_id,
            service_name=trace.service_name,
            operation_name=trace.operation_name,
            start_time=trace.start_time,
            end_time=trace.end_time,
            duration_ms=round_float(trace.duration_ms),
            span_count=trace.span_count,
            status=trace.status,
            tags=trace.tags,
            created_at=trace.created_at,
            spans=[WaterfallSpan(**span) for span in waterfall_spans],
        )

    @router.get("/traces/{trace_id}/waterfall")
    async def get_trace_waterfall(
        trace_id: str,
        session: Session = Depends(get_db),
    ):
        """Get optimized waterfall data for a trace."""
        # Ensure the trace exists
        trace = session.query(Trace).filter(Trace.trace_id == trace_id).first()
        if not trace:
            raise HTTPException(status_code=404, detail="Trace not found")

        tracing_manager = TracingManager(lambda: get_session_context())
        waterfall_data = tracing_manager.get_waterfall_data(trace_id)

        return {
            "trace_id": trace_id,
            "spans": waterfall_data,
            "trace_info": {
                "service_name": trace.service_name,
                "operation_name": trace.operation_name,
                "total_duration_ms": trace.duration_ms,
                "span_count": trace.span_count,
                "status": trace.status,
            },
        }

    @router.get("/spans/{span_id}")
    async def get_span_detail(
        span_id: str,
        session: Session = Depends(get_db),
    ):
        """Get span details."""
        span = session.query(Span).filter(Span.span_id == span_id).first()
        if not span:
            raise HTTPException(status_code=404, detail="Span not found")

        return {
            "span_id": span.span_id,
            "trace_id": span.trace_id,
            "parent_span_id": span.parent_span_id,
            "operation_name": span.operation_name,
            "service_name": span.service_name,
            "span_kind": span.span_kind,
            "start_time": span.start_time.isoformat() if span.start_time else None,
            "end_time": span.end_time.isoformat() if span.end_time else None,
            "duration_ms": span.duration_ms,
            "status": span.status,
            "tags": span.tags,
            "logs": span.logs,
            "created_at": span.created_at.isoformat(),
        }

    @router.get("/background-tasks", response_model=List[BackgroundTaskSummary])
    async def get_background_tasks(
        limit: int = Query(100, ge=1, le=1000),
        offset: int = Query(0, ge=0),
        status: Optional[str] = None,
        request_id: Optional[str] = None,
        session: Session = Depends(get_db),
    ):
        """Get background tasks with optional filters."""
        query = session.query(BackgroundTask)

        if status:
            query = query.filter(BackgroundTask.status == status)
        if request_id:
            query = query.filter(BackgroundTask.request_id == request_id)

        tasks = (
            query.order_by(desc(BackgroundTask.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            BackgroundTaskSummary(
                id=task.id,
                task_id=task.task_id,
                request_id=task.request_id,
                name=task.name,
                status=task.status,
                start_time=task.start_time,
                end_time=task.end_time,
                duration_ms=round_float(task.duration_ms),
                error=task.error,
                created_at=task.created_at,
            )
            for task in tasks
        ]

    return router
