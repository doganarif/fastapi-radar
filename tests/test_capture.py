"""Tests for query capture functionality."""

import time
from unittest.mock import Mock

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool

from fastapi_radar.capture import QueryCapture
from fastapi_radar.middleware import request_context
from fastapi_radar.models import CapturedQuery


@pytest.mark.unit
class TestQueryCapture:
    """Test QueryCapture class."""

    def test_init(self, mock_get_session):
        """Test QueryCapture initialization."""
        capture = QueryCapture(
            get_session=mock_get_session,
            capture_bindings=True,
            slow_query_threshold=100,
        )
        assert capture.get_session == mock_get_session
        assert capture.capture_bindings is True
        assert capture.slow_query_threshold == 100
        assert len(capture._query_start_times) == 0

    def test_register_engine(self, mock_get_session, test_engine):
        """Test registering an engine."""
        capture = QueryCapture(mock_get_session)
        capture.register(test_engine)

        assert id(test_engine) in capture._registered_engines

    def test_unregister_engine(self, mock_get_session, test_engine):
        """Test unregistering an engine."""
        capture = QueryCapture(mock_get_session)
        capture.register(test_engine)
        capture.unregister(test_engine)

        assert id(test_engine) not in capture._registered_engines

    def test_before_cursor_execute(self, mock_get_session):
        """Test before_cursor_execute hook."""
        capture = QueryCapture(mock_get_session)

        # Set request context
        request_context.set("test-request-123")

        # Mock objects
        conn = Mock()
        cursor = Mock()
        context = Mock()
        statement = "SELECT * FROM users"

        capture._before_cursor_execute(conn, cursor, statement, None, context, False)

        # Check that start time was recorded
        context_id = id(context)
        assert context_id in capture._query_start_times

        # Check that request_id was attached
        assert hasattr(context, "_radar_request_id")
        assert context._radar_request_id == "test-request-123"

    def test_after_cursor_execute_captures_query(self, mock_get_session, storage_session):
        """Test after_cursor_execute captures query."""
        capture = QueryCapture(mock_get_session, capture_bindings=True)

        request_context.set("test-request-456")

        # Mock objects
        conn = Mock()
        conn.engine.url = Mock()
        cursor = Mock()
        cursor.rowcount = 5
        context = Mock()

        # Simulate before hook
        context_id = id(context)
        capture._query_start_times[context_id] = time.time()
        setattr(context, "_radar_request_id", "test-request-456")

        statement = "SELECT * FROM users WHERE id = ?"
        parameters = ["1"]

        capture._after_cursor_execute(conn, cursor, statement, parameters, context, False)

        # Verify query was captured
        captured_queries = storage_session.query(CapturedQuery).all()
        assert len(captured_queries) == 1
        assert captured_queries[0].request_id == "test-request-456"
        assert "SELECT * FROM users" in captured_queries[0].sql

    def test_skip_radar_queries(self, mock_get_session, storage_session):
        """Test that radar's own queries are skipped."""
        capture = QueryCapture(mock_get_session)

        request_context.set("test-request-789")

        conn = Mock()
        cursor = Mock()
        context = Mock()
        context_id = id(context)
        capture._query_start_times[context_id] = time.time()
        setattr(context, "_radar_request_id", "test-request-789")

        # Radar query should be skipped
        statement = "INSERT INTO radar_requests ..."

        capture._after_cursor_execute(conn, cursor, statement, None, context, False)

        # No queries should be captured
        captured_queries = storage_session.query(CapturedQuery).all()
        assert len(captured_queries) == 0

    def test_get_operation_type(self, mock_get_session):
        """Test determining operation type from SQL."""
        capture = QueryCapture(mock_get_session)

        test_cases = [
            ("SELECT * FROM users", "SELECT"),
            ("INSERT INTO users VALUES (1)", "INSERT"),
            ("UPDATE users SET name = 'John'", "UPDATE"),
            ("DELETE FROM users WHERE id = 1", "DELETE"),
            ("CREATE TABLE users (id INT)", "CREATE"),
            ("DROP TABLE users", "DROP"),
            ("ALTER TABLE users ADD COLUMN age INT", "ALTER"),
            ("  select * from users", "SELECT"),  # lowercase
            ("EXPLAIN SELECT * FROM users", "OTHER"),
        ]

        for sql, expected in test_cases:
            result = capture._get_operation_type(sql)
            assert result == expected, f"Failed for SQL: {sql}"

    def test_serialize_parameters_list(self, mock_get_session):
        """Test serializing list parameters."""
        capture = QueryCapture(mock_get_session)

        params = ["value1", "value2", 123]
        result = capture._serialize_parameters(params)

        assert isinstance(result, list)
        assert result == ["value1", "value2", "123"]

    def test_serialize_parameters_dict(self, mock_get_session):
        """Test serializing dict parameters."""
        capture = QueryCapture(mock_get_session)

        params = {"id": 1, "name": "John", "active": True}
        result = capture._serialize_parameters(params)

        assert isinstance(result, dict)
        assert result == {"id": "1", "name": "John", "active": "True"}

    def test_serialize_parameters_none(self, mock_get_session):
        """Test serializing None parameters."""
        capture = QueryCapture(mock_get_session)

        result = capture._serialize_parameters(None)
        assert result is None

    def test_serialize_parameters_limit(self, mock_get_session):
        """Test that parameter serialization is limited."""
        capture = QueryCapture(mock_get_session)

        # Test list limit
        params = list(range(200))
        result = capture._serialize_parameters(params)
        assert len(result) == 100

        # Test dict limit
        params = {f"key{i}": i for i in range(200)}
        result = capture._serialize_parameters(params)
        assert len(result) == 100


@pytest.mark.integration
class TestQueryCaptureIntegration:
    """Integration tests for query capture."""

    def test_capture_real_queries(self, mock_get_session, storage_session):
        """Test capturing real database queries."""
        # Create a separate engine for testing
        test_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Create a test table
        with test_engine.connect() as conn:
            conn.execute(text("CREATE TABLE test_users (id INTEGER, name TEXT)"))
            conn.commit()

        # Setup query capture
        capture = QueryCapture(mock_get_session, capture_bindings=True)
        capture.register(test_engine)

        # Set request context
        request_context.set("integration-test-123")

        try:
            # Execute a query
            with test_engine.connect() as conn:
                conn.execute(
                    text("INSERT INTO test_users (id, name) VALUES (:id, :name)"),
                    {"id": 1, "name": "Alice"},
                )
                conn.commit()

            # Verify query was captured
            captured_queries = storage_session.query(CapturedQuery).all()
            assert len(captured_queries) > 0

            # Find the INSERT query
            insert_queries = [q for q in captured_queries if "INSERT" in q.sql.upper()]
            assert len(insert_queries) > 0

        finally:
            capture.unregister(test_engine)
            test_engine.dispose()
