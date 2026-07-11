"""Tracing core functionality module."""

import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from .models import Span, SpanRelation, Trace

# Trace context for the current request
trace_context: ContextVar[Optional["TraceContext"]] = ContextVar("trace_context", default=None)


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

    def finish_span(self, span_id: str, status: str = "ok", tags: Optional[Dict[str, Any]] = None):
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

    def save_trace_context(self, trace_ctx: TraceContext, session: Session = None):
        """Persist the trace context into the database."""
        if session is not None:
            self._save_trace_data(session, trace_ctx)
        else:
            with self.get_session() as new_session:
                self._save_trace_data(new_session, trace_ctx)
                new_session.commit()

    def _save_trace_data(self, session: Session, trace_ctx: TraceContext):
        """Write trace, spans, and relations to the given session."""
        trace_summary = trace_ctx.get_trace_summary()
        trace = Trace(**trace_summary)
        session.add(trace)

        for span_data in trace_ctx.spans.values():
            span = Span(**span_data)
            session.add(span)

        self._save_span_relations(session, trace_ctx)

    def _save_span_relations(self, session: Session, trace_ctx: TraceContext):
        """Store parent-child span relations for optimized querying."""

        def calculate_depth(span_id: str, spans: Dict[str, Dict], depth: int = 0) -> List[tuple]:
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

    def get_waterfall_data(self, trace_id: str) -> List[Dict[str, Any]]:
        """Return data for the waterfall view."""
        with self.get_session() as session:
            from sqlalchemy import text

            waterfall_query = text(
                """
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
                    COALESCE(r.depth, 0) as depth
                FROM radar_spans s
                LEFT JOIN radar_span_relations r ON s.span_id = r.child_span_id
                WHERE s.trace_id = :trace_id
                ORDER BY s.start_time, depth
            """
            )

            result = session.execute(waterfall_query, {"trace_id": trace_id})

            rows = [
                {
                    "span_id": row.span_id,
                    "parent_span_id": row.parent_span_id,
                    "operation_name": row.operation_name,
                    "service_name": row.service_name,
                    "start_time": row.start_time,
                    "end_time": row.end_time,
                    "duration_ms": row.duration_ms,
                    "status": row.status,
                    "tags": row.tags,
                    "depth": row.depth,
                }
                for row in result
            ]

        # Compute offset_ms in Python to avoid dialect-specific date functions
        # (DuckDB uses julian(), SQLite uses julianday())
        start_times = [r["start_time"] for r in rows if r["start_time"] is not None]
        min_start = min(start_times, default=None)

        for row in rows:
            st = row["start_time"]
            if st is not None and min_start is not None:
                delta = st - min_start if hasattr(st, "__sub__") else None
                row["offset_ms"] = delta.total_seconds() * 1000 if delta is not None else 0.0
            else:
                row["offset_ms"] = 0.0
            row["start_time"] = st.isoformat() if st and hasattr(st, "isoformat") else st
            et = row["end_time"]
            row["end_time"] = et.isoformat() if et and hasattr(et, "isoformat") else et

        return rows


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
