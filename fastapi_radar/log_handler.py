import logging
import traceback
from datetime import datetime, timezone
from typing import Callable, Optional

from .models import CapturedLog


class RadarLoggingHandler(logging.Handler):
    """A logging handler that persists log records to the FastAPI Radar database.

    Usage::

        radar = Radar(app)
        handler = RadarLoggingHandler(get_session=radar.get_session)
        logging.getLogger().addHandler(handler)

    Or use the convenience method::

        radar = Radar(app)
        radar.attach_logger()            # root logger, all levels
        radar.attach_logger(level=logging.WARNING)
    """

    def __init__(self, get_session: Callable, level: int = logging.NOTSET):
        super().__init__(level)
        self._get_session = get_session

    def emit(self, record: logging.LogRecord) -> None:
        try:
            message = self.format(record)

            exc_text: Optional[str] = None
            if record.exc_info:
                exc_text = "".join(traceback.format_exception(*record.exc_info))

            log_entry = CapturedLog(
                logger_name=record.name,
                level=record.levelname,
                message=message,
                pathname=record.pathname,
                lineno=record.lineno,
                func_name=record.funcName,
                thread_name=record.threadName,
                exc_info=exc_text,
                request_id=None,
                created_at=datetime.fromtimestamp(record.created, tz=timezone.utc),
            )
            with self._get_session() as session:
                session.add(log_entry)
                session.commit()
        except Exception:
            self.handleError(record)
