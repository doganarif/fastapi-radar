"""Tests for database models."""

from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from fastapi_radar.models import (
    BackgroundTask,
    CapturedException,
    CapturedQuery,
    CapturedRequest,
    Span,
    SpanRelation,
    Trace,
)


@pytest.mark.unit
class TestCapturedRequest:
    """Test CapturedRequest model."""

    def test_create_captured_request(self, test_session, sample_request_data):
        """Test creating a captured request."""
        request = CapturedRequest(**sample_request_data)
        test_session.add(request)
        test_session.commit()

        assert request.id is not None
        assert request.request_id == "test-request-123"
        assert request.method == "GET"
        assert request.path == "/api/users"
        assert request.status_code == 200
        assert request.created_at is not None

    def test_request_id_unique(self, test_session, sample_request_data):
        """Test that request_id must be unique."""
        request1 = CapturedRequest(**sample_request_data)
        test_session.add(request1)
        test_session.commit()

        request2 = CapturedRequest(**sample_request_data)
        test_session.add(request2)

        with pytest.raises(IntegrityError):
            test_session.commit()

    def test_request_with_queries(self, test_session, sample_request_data, sample_query_data):
        """Test request with associated queries."""
        request = CapturedRequest(**sample_request_data)
        test_session.add(request)
        test_session.commit()

        query = CapturedQuery(**sample_query_data)
        test_session.add(query)
        test_session.commit()

        test_session.refresh(request)
        assert len(request.queries) == 1
        assert request.queries[0].sql == sample_query_data["sql"]

    def test_request_with_exceptions(
        self, test_session, sample_request_data, sample_exception_data
    ):
        """Test request with associated exceptions."""
        request = CapturedRequest(**sample_request_data)
        test_session.add(request)
        test_session.commit()

        exception = CapturedException(**sample_exception_data)
        test_session.add(exception)
        test_session.commit()

        test_session.refresh(request)
        assert len(request.exceptions) == 1
        assert request.exceptions[0].exception_type == "ValueError"

    def test_cascade_delete(self, test_session, sample_request_data, sample_query_data):
        """Test that deleting request cascades to queries and exceptions."""
        request = CapturedRequest(**sample_request_data)
        test_session.add(request)
        test_session.commit()

        query = CapturedQuery(**sample_query_data)
        test_session.add(query)
        test_session.commit()

        test_session.delete(request)
        test_session.commit()

        assert test_session.query(CapturedQuery).count() == 0


@pytest.mark.unit
class TestCapturedQuery:
    """Test CapturedQuery model."""

    def test_create_captured_query(self, test_session, sample_query_data):
        """Test creating a captured query."""
        query = CapturedQuery(**sample_query_data)
        test_session.add(query)
        test_session.commit()

        assert query.id is not None
        assert query.request_id == "test-request-123"
        assert query.sql == sample_query_data["sql"]
        assert query.duration_ms == 12.34

    def test_query_with_parameters(self, test_session):
        """Test query with different parameter types."""
        # List parameters
        query1 = CapturedQuery(
            request_id="test-1",
            sql="SELECT * FROM users WHERE id = ?",
            parameters=["1", "2"],
            duration_ms=10.0,
        )
        test_session.add(query1)

        # Dict parameters
        query2 = CapturedQuery(
            request_id="test-2",
            sql="SELECT * FROM users WHERE id = :id",
            parameters={"id": "1"},
            duration_ms=10.0,
        )
        test_session.add(query2)

        test_session.commit()

        assert isinstance(query1.parameters, list)
        assert isinstance(query2.parameters, dict)


@pytest.mark.unit
class TestCapturedException:
    """Test CapturedException model."""

    def test_create_captured_exception(self, test_session, sample_exception_data):
        """Test creating a captured exception."""
        exception = CapturedException(**sample_exception_data)
        test_session.add(exception)
        test_session.commit()

        assert exception.id is not None
        assert exception.request_id == "test-request-123"
        assert exception.exception_type == "ValueError"
        assert exception.traceback is not None


@pytest.mark.unit
class TestTrace:
    """Test Trace model."""

    def test_create_trace(self, test_session):
        """Test creating a trace."""
        trace = Trace(
            trace_id="abc123",
            service_name="test-service",
            operation_name="GET /users",
            start_time=datetime.now(timezone.utc),
            span_count=3,
            status="ok",
        )
        test_session.add(trace)
        test_session.commit()

        assert trace.trace_id == "abc123"
        assert trace.service_name == "test-service"
        assert trace.span_count == 3

    def test_trace_with_spans(self, test_session):
        """Test trace with associated spans."""
        trace = Trace(
            trace_id="trace-123",
            service_name="test-service",
            operation_name="GET /users",
            start_time=datetime.now(timezone.utc),
        )
        test_session.add(trace)
        test_session.commit()

        span = Span(
            span_id="span-123",
            trace_id="trace-123",
            operation_name="db.query",
            service_name="test-service",
            start_time=datetime.now(timezone.utc),
        )
        test_session.add(span)
        test_session.commit()

        test_session.refresh(trace)
        assert len(trace.spans) == 1


@pytest.mark.unit
class TestSpan:
    """Test Span model."""

    def test_create_span(self, test_session):
        """Test creating a span."""
        span = Span(
            span_id="span-123",
            trace_id="trace-123",
            operation_name="db.query",
            service_name="test-service",
            start_time=datetime.now(timezone.utc),
            span_kind="client",
        )
        test_session.add(span)
        test_session.commit()

        assert span.span_id == "span-123"
        assert span.trace_id == "trace-123"
        assert span.span_kind == "client"

    def test_span_with_tags_and_logs(self, test_session):
        """Test span with tags and logs."""
        span = Span(
            span_id="span-456",
            trace_id="trace-123",
            operation_name="db.query",
            service_name="test-service",
            start_time=datetime.now(timezone.utc),
            tags={"db.statement": "SELECT * FROM users", "db.system": "postgresql"},
            logs=[{"timestamp": "2024-01-01T00:00:00", "message": "Query started"}],
        )
        test_session.add(span)
        test_session.commit()

        assert "db.statement" in span.tags
        assert len(span.logs) == 1


@pytest.mark.unit
class TestSpanRelation:
    """Test SpanRelation model."""

    def test_create_span_relation(self, test_session):
        """Test creating a span relation."""
        relation = SpanRelation(
            trace_id="trace-123",
            parent_span_id="span-parent",
            child_span_id="span-child",
            depth=1,
        )
        test_session.add(relation)
        test_session.commit()

        assert relation.trace_id == "trace-123"
        assert relation.depth == 1


@pytest.mark.unit
class TestBackgroundTask:
    """Test BackgroundTask model."""

    def test_create_background_task(self, test_session):
        """Test creating a background task."""
        task = BackgroundTask(
            task_id="task-123",
            request_id="request-123",
            name="send_email",
            status="pending",
            start_time=datetime.now(timezone.utc),
        )
        test_session.add(task)
        test_session.commit()

        assert task.task_id == "task-123"
        assert task.name == "send_email"
        assert task.status == "pending"

    def test_background_task_completion(self, test_session):
        """Test completing a background task."""
        start_time = datetime.now(timezone.utc)
        task = BackgroundTask(
            task_id="task-456",
            name="process_data",
            status="running",
            start_time=start_time,
        )
        test_session.add(task)
        test_session.commit()

        # Complete the task
        task.status = "completed"
        task.end_time = datetime.now(timezone.utc)
        task.duration_ms = 150.5
        test_session.commit()

        assert task.status == "completed"
        assert task.duration_ms == 150.5
        assert task.end_time > task.start_time

    def test_background_task_failure(self, test_session):
        """Test failed background task."""
        task = BackgroundTask(
            task_id="task-789",
            name="failing_task",
            status="failed",
            start_time=datetime.now(timezone.utc),
            error="Task failed due to network error",
        )
        test_session.add(task)
        test_session.commit()

        assert task.status == "failed"
        assert task.error is not None
