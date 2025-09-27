"""SQLAlchemy query capture for FastAPI Radar."""

import time
from typing import Any, Callable, Dict, List, Union

from sqlalchemy import event
from sqlalchemy.engine import Engine

from .middleware import request_context
from .models import CapturedQuery
from .utils import format_sql
from .tracing import get_current_trace_context


class QueryCapture:
    def __init__(
        self,
        get_session: Callable,
        capture_bindings: bool = True,
        slow_query_threshold: int = 100,
    ):
        self.get_session = get_session
        self.capture_bindings = capture_bindings
        self.slow_query_threshold = slow_query_threshold
        self._query_start_times = {}

    def register(self, engine: Engine) -> None:
        event.listen(engine, "before_cursor_execute", self._before_cursor_execute)
        event.listen(engine, "after_cursor_execute", self._after_cursor_execute)

    def unregister(self, engine: Engine) -> None:
        event.remove(engine, "before_cursor_execute", self._before_cursor_execute)
        event.remove(engine, "after_cursor_execute", self._after_cursor_execute)

    def _before_cursor_execute(
        self,
        conn: Any,
        cursor: Any,
        statement: str,
        parameters: Any,
        context: Any,
        executemany: bool,
    ) -> None:
        request_id = request_context.get()
        if not request_id:
            return

        context_id = id(context)
        self._query_start_times[context_id] = time.time()

        trace_ctx = get_current_trace_context()
        if trace_ctx:
            formatted_sql = format_sql(statement)
            operation_type = self._get_operation_type(statement)
            span_id = trace_ctx.create_span(
                operation_name=f"DB {operation_type}",
                span_kind="client",
                tags={
                    "db.statement": formatted_sql[:500],  # limit SQL length
                    "db.operation_type": operation_type,
                    "component": "database",
                },
            )
            setattr(context, "_radar_span_id", span_id)

    def _after_cursor_execute(
        self,
        conn: Any,
        cursor: Any,
        statement: str,
        parameters: Any,
        context: Any,
        executemany: bool,
    ) -> None:
        request_id = request_context.get()
        if not request_id:
            return

        start_time = self._query_start_times.pop(id(context), None)
        if start_time is None:
            return

        duration_ms = round((time.time() - start_time) * 1000, 2)

        trace_ctx = get_current_trace_context()
        if trace_ctx and hasattr(context, "_radar_span_id"):
            span_id = getattr(context, "_radar_span_id")
            additional_tags = {
                "db.duration_ms": duration_ms,
                "db.rows_affected": (
                    cursor.rowcount if hasattr(cursor, "rowcount") else None
                ),
            }

            status = "ok"
            if duration_ms >= self.slow_query_threshold:
                status = "slow"
                additional_tags["db.slow_query"] = True

            trace_ctx.finish_span(span_id, status=status, tags=additional_tags)

        if "radar_" in statement:
            return

        captured_query = CapturedQuery(
            request_id=request_id,
            sql=format_sql(statement),
            parameters=(
                self._serialize_parameters(parameters)
                if self.capture_bindings
                else None
            ),
            duration_ms=duration_ms,
            rows_affected=cursor.rowcount if hasattr(cursor, "rowcount") else None,
            connection_name=(
                str(conn.engine.url).split("@")[0] if hasattr(conn, "engine") else None
            ),
        )

        try:
            with self.get_session() as session:
                session.add(captured_query)
                session.commit()
        except Exception:
            pass

    def _get_operation_type(self, statement: str) -> str:
        if not statement:
            return "unknown"

        statement = statement.strip().upper()

        if statement.startswith("SELECT"):
            return "SELECT"
        elif statement.startswith("INSERT"):
            return "INSERT"
        elif statement.startswith("UPDATE"):
            return "UPDATE"
        elif statement.startswith("DELETE"):
            return "DELETE"
        elif statement.startswith("CREATE"):
            return "CREATE"
        elif statement.startswith("DROP"):
            return "DROP"
        elif statement.startswith("ALTER"):
            return "ALTER"
        else:
            return "OTHER"

    def _serialize_parameters(
        self, parameters: Any
    ) -> Union[Dict[str, str], List[str], None]:
        """Serialize query parameters for storage."""
        if not parameters:
            return None

        if isinstance(parameters, (list, tuple)):
            return [str(p) for p in parameters[:100]]
        elif isinstance(parameters, dict):
            return {k: str(v) for k, v in list(parameters.items())[:100]}

        return [str(parameters)]
