"""SQLAlchemy query capture for FastAPI Radar."""

import time
from typing import Any, Optional, Callable
from sqlalchemy import event
from sqlalchemy.engine import Engine

from .middleware import request_context
from .models import CapturedQuery
from .utils import format_sql


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
        """Register SQLAlchemy event listeners."""
        event.listen(engine, "before_cursor_execute", self._before_cursor_execute)
        event.listen(engine, "after_cursor_execute", self._after_cursor_execute)

    def unregister(self, engine: Engine) -> None:
        """Unregister SQLAlchemy event listeners."""
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

        self._query_start_times[id(context)] = time.time()

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

        duration_ms = (time.time() - start_time) * 1000

        # Skip radar's own queries
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
            pass  # Silently ignore storage errors

    def _serialize_parameters(self, parameters: Any) -> Optional[list]:
        """Serialize query parameters for storage."""
        if not parameters:
            return None

        if isinstance(parameters, (list, tuple)):
            return [str(p) for p in parameters[:100]]  # Limit to 100 params
        elif isinstance(parameters, dict):
            return {k: str(v) for k, v in list(parameters.items())[:100]}

        return [str(parameters)]
