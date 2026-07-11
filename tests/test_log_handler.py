"""Tests for RadarLoggingHandler and Radar.attach_logger."""

import logging
from contextlib import contextmanager
from unittest.mock import patch

import pytest
from fastapi import FastAPI

from fastapi_radar import Radar
from fastapi_radar.log_handler import RadarLoggingHandler
from fastapi_radar.models import CapturedLog


@pytest.mark.unit
class TestRadarLoggingHandler:
    """Unit tests for RadarLoggingHandler.emit()."""

    def test_emit_stores_log_record(self, mock_get_session, storage_session):
        """A basic emit call persists a log entry."""
        handler = RadarLoggingHandler(get_session=mock_get_session)
        logger = logging.getLogger("test.emit_basic")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        try:
            logger.info("hello from test")
        finally:
            logger.removeHandler(handler)

        logs = storage_session.query(CapturedLog).all()
        assert len(logs) == 1
        assert "hello from test" in logs[0].message
        assert logs[0].level == "INFO"
        assert logs[0].logger_name == "test.emit_basic"

    def test_emit_stores_all_standard_fields(self, mock_get_session, storage_session):
        """All CapturedLog fields are populated from the LogRecord."""
        handler = RadarLoggingHandler(get_session=mock_get_session)
        logger = logging.getLogger("test.all_fields")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        try:
            logger.warning("field check")
        finally:
            logger.removeHandler(handler)

        log = storage_session.query(CapturedLog).first()
        assert log is not None
        assert log.level == "WARNING"
        assert log.logger_name == "test.all_fields"
        assert log.pathname is not None
        assert log.lineno is not None
        assert log.func_name is not None
        assert log.thread_name is not None
        assert log.created_at is not None
        assert log.exc_info is None

    def test_emit_captures_exc_info(self, mock_get_session, storage_session):
        """exc_info is formatted as a string and stored when present."""
        handler = RadarLoggingHandler(get_session=mock_get_session)
        logger = logging.getLogger("test.exc_info")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        try:
            try:
                raise ValueError("boom")
            except ValueError:
                logger.exception("caught an error")
        finally:
            logger.removeHandler(handler)

        log = storage_session.query(CapturedLog).first()
        assert log is not None
        assert log.exc_info is not None
        assert "ValueError" in log.exc_info
        assert "boom" in log.exc_info

    def test_emit_respects_handler_level_filter(self, mock_get_session, storage_session):
        """Records below the handler's level are not stored."""
        handler = RadarLoggingHandler(get_session=mock_get_session, level=logging.WARNING)
        logger = logging.getLogger("test.level_filter")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        try:
            logger.debug("debug msg")
            logger.info("info msg")
            logger.warning("warn msg")
        finally:
            logger.removeHandler(handler)

        logs = storage_session.query(CapturedLog).all()
        assert len(logs) == 1
        assert logs[0].level == "WARNING"

    def test_emit_calls_handle_error_on_session_failure(self):
        """handleError is invoked when the session context manager raises."""

        @contextmanager
        def bad_get_session():
            raise RuntimeError("DB gone")
            yield  # pragma: no cover

        handler = RadarLoggingHandler(get_session=bad_get_session)
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="test message",
            args=(),
            exc_info=None,
        )

        with patch.object(handler, "handleError") as mock_handle_error:
            handler.emit(record)
            mock_handle_error.assert_called_once_with(record)

    def test_emit_calls_handle_error_on_commit_failure(self, mock_get_session, storage_session):
        """handleError is invoked when session.commit() raises."""
        storage_session.commit = lambda: (_ for _ in ()).throw(RuntimeError("commit failed"))

        handler = RadarLoggingHandler(get_session=mock_get_session)
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="commit failure",
            args=(),
            exc_info=None,
        )

        with patch.object(handler, "handleError") as mock_handle_error:
            handler.emit(record)
            mock_handle_error.assert_called_once_with(record)

    def test_emit_multiple_records(self, mock_get_session, storage_session):
        """Multiple emits each create a separate log entry."""
        handler = RadarLoggingHandler(get_session=mock_get_session)
        logger = logging.getLogger("test.multiple")
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        try:
            logger.info("first")
            logger.info("second")
            logger.error("third")
        finally:
            logger.removeHandler(handler)

        logs = storage_session.query(CapturedLog).order_by(CapturedLog.id).all()
        assert len(logs) == 3
        messages = [log.message for log in logs]
        assert any("first" in m for m in messages)
        assert any("second" in m for m in messages)
        assert any("third" in m for m in messages)


@pytest.mark.unit
class TestAttachLogger:
    """Tests for Radar.attach_logger()."""

    def test_attach_logger_returns_radar_logging_handler(self, test_engine, storage_engine):
        """attach_logger returns a RadarLoggingHandler instance."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()
        named_logger = logging.getLogger("test.returns_handler")
        handler = radar.attach_logger(logger=named_logger)
        try:
            assert isinstance(handler, RadarLoggingHandler)
        finally:
            named_logger.removeHandler(handler)

    def test_attach_logger_default_targets_root_logger(self, test_engine, storage_engine):
        """When no logger is given, attach_logger uses the root logger."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        root_logger = logging.getLogger()
        handler = radar.attach_logger(level=logging.WARNING)
        try:
            assert handler in root_logger.handlers
        finally:
            root_logger.removeHandler(handler)

    def test_attach_logger_named_logger(self, test_engine, storage_engine):
        """When a named logger is supplied, the handler is attached to it."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        named_logger = logging.getLogger("test.named_attach")
        handler = radar.attach_logger(logger=named_logger)
        try:
            assert handler in named_logger.handlers
        finally:
            named_logger.removeHandler(handler)

    def test_attach_logger_raises_logger_level_when_too_restrictive(
        self, test_engine, storage_engine
    ):
        """Logger level is raised to the requested level when currently more restrictive."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        named_logger = logging.getLogger("test.level_raise")
        named_logger.setLevel(logging.ERROR)  # more restrictive than DEBUG
        handler = radar.attach_logger(logger=named_logger, level=logging.DEBUG)
        try:
            assert named_logger.level == logging.DEBUG
        finally:
            named_logger.removeHandler(handler)
            named_logger.setLevel(logging.NOTSET)

    def test_attach_logger_does_not_override_more_verbose_level(
        self, test_engine, storage_engine
    ):
        """Logger level is left unchanged when it's already more verbose than requested."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        named_logger = logging.getLogger("test.level_preserve")
        named_logger.setLevel(logging.DEBUG)  # already more verbose than WARNING
        handler = radar.attach_logger(logger=named_logger, level=logging.WARNING)
        try:
            assert named_logger.level == logging.DEBUG
        finally:
            named_logger.removeHandler(handler)
            named_logger.setLevel(logging.NOTSET)

    def test_attach_logger_stores_logs_in_db_end_to_end(self, test_engine, storage_engine):
        """Integration: a log message emitted after attach_logger is stored in the DB."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        named_logger = logging.getLogger("test.e2e_store")
        handler = radar.attach_logger(logger=named_logger, level=logging.INFO)
        try:
            named_logger.info("stored in db")
        finally:
            named_logger.removeHandler(handler)

        with radar.get_session() as session:
            logs = (
                session.query(CapturedLog)
                .filter(CapturedLog.logger_name == "test.e2e_store")
                .all()
            )
        assert len(logs) >= 1
        assert any("stored in db" in log.message for log in logs)

    def test_attach_logger_custom_level(self, test_engine, storage_engine):
        """Handler uses the supplied level to filter records."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        named_logger = logging.getLogger("test.custom_level")
        named_logger.setLevel(logging.DEBUG)
        handler = radar.attach_logger(logger=named_logger, level=logging.ERROR)
        try:
            named_logger.warning("should not appear")
            named_logger.error("should appear")
        finally:
            named_logger.removeHandler(handler)
            named_logger.setLevel(logging.NOTSET)

        with radar.get_session() as session:
            logs = (
                session.query(CapturedLog)
                .filter(CapturedLog.logger_name == "test.custom_level")
                .all()
            )
        assert len(logs) == 1
        assert logs[0].level == "ERROR"
