"""Tests for tracing functionality."""

import pytest

from fastapi_radar.models import Span, SpanRelation, Trace
from fastapi_radar.tracing import (
    TraceContext,
    TracingManager,
    create_trace_context,
    get_current_trace_context,
    set_trace_context,
)


@pytest.mark.unit
class TestTraceContext:
    """Test TraceContext class."""

    def test_create_trace_context(self):
        """Test creating a trace context."""
        ctx = TraceContext("trace-123", "test-service")
        assert ctx.trace_id == "trace-123"
        assert ctx.service_name == "test-service"
        assert ctx.root_span_id is None
        assert ctx.current_span_id is None
        assert len(ctx.spans) == 0

    def test_create_span(self):
        """Test creating a span."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("GET /users", span_kind="server")

        assert span_id in ctx.spans
        assert ctx.spans[span_id]["operation_name"] == "GET /users"
        assert ctx.spans[span_id]["span_kind"] == "server"
        assert ctx.root_span_id == span_id

    def test_create_child_span(self):
        """Test creating a child span."""
        ctx = TraceContext("trace-123", "test-service")
        parent_id = ctx.create_span("parent operation")
        ctx.set_current_span(parent_id)

        child_id = ctx.create_span("child operation", span_kind="client")

        assert ctx.spans[child_id]["parent_span_id"] == parent_id
        assert ctx.root_span_id == parent_id  # Root shouldn't change

    def test_create_span_with_tags(self):
        """Test creating a span with tags."""
        ctx = TraceContext("trace-123", "test-service")
        tags = {"http.method": "GET", "http.url": "/users"}
        span_id = ctx.create_span("GET /users", tags=tags)

        assert ctx.spans[span_id]["tags"]["http.method"] == "GET"
        assert ctx.spans[span_id]["tags"]["http.url"] == "/users"

    def test_finish_span(self):
        """Test finishing a span."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("test operation")

        assert ctx.spans[span_id].get("end_time") is None
        assert ctx.spans[span_id].get("duration_ms") is None

        ctx.finish_span(span_id, status="ok")

        assert ctx.spans[span_id]["end_time"] is not None
        assert ctx.spans[span_id]["duration_ms"] is not None
        assert ctx.spans[span_id]["status"] == "ok"

    def test_finish_span_with_additional_tags(self):
        """Test finishing a span with additional tags."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("test operation", tags={"initial": "tag"})

        ctx.finish_span(span_id, status="ok", tags={"final": "tag", "duration": 100})

        assert ctx.spans[span_id]["tags"]["initial"] == "tag"
        assert ctx.spans[span_id]["tags"]["final"] == "tag"
        assert ctx.spans[span_id]["tags"]["duration"] == 100

    def test_add_span_log(self):
        """Test adding a log entry to a span."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("test operation")

        ctx.add_span_log(span_id, "Test message", level="info", custom_field="value")

        logs = ctx.spans[span_id]["logs"]
        assert len(logs) == 1
        assert logs[0]["message"] == "Test message"
        assert logs[0]["level"] == "info"
        assert logs[0]["custom_field"] == "value"
        assert "timestamp" in logs[0]

    def test_add_multiple_logs(self):
        """Test adding multiple log entries."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("test operation")

        ctx.add_span_log(span_id, "Log 1")
        ctx.add_span_log(span_id, "Log 2")
        ctx.add_span_log(span_id, "Log 3")

        logs = ctx.spans[span_id]["logs"]
        assert len(logs) == 3

    def test_set_current_span(self):
        """Test setting the current span."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("test operation")

        assert ctx.current_span_id == span_id  # Set by create_span as root

        span_id2 = ctx.create_span("another operation")
        ctx.set_current_span(span_id2)

        assert ctx.current_span_id == span_id2

    def test_get_trace_summary(self):
        """Test getting trace summary."""
        ctx = TraceContext("trace-123", "test-service")
        span_id = ctx.create_span("GET /users")
        ctx.finish_span(span_id)

        summary = ctx.get_trace_summary()

        assert summary["trace_id"] == "trace-123"
        assert summary["service_name"] == "test-service"
        assert summary["operation_name"] == "GET /users"
        assert summary["span_count"] == 1
        assert summary["status"] == "ok"
        assert "start_time" in summary
        assert "end_time" in summary
        assert "duration_ms" in summary

    def test_trace_summary_with_error_status(self):
        """Test trace summary when spans have errors."""
        ctx = TraceContext("trace-123", "test-service")
        span1 = ctx.create_span("operation 1")
        span2 = ctx.create_span("operation 2")

        ctx.finish_span(span1, status="ok")
        ctx.finish_span(span2, status="error")

        summary = ctx.get_trace_summary()
        assert summary["status"] == "error"

    def test_generate_span_id_format(self):
        """Test that span IDs are generated correctly."""
        span_id = TraceContext._generate_span_id()
        assert len(span_id) == 16
        assert all(c in "0123456789abcdef" for c in span_id)


@pytest.mark.unit
class TestTracingManager:
    """Test TracingManager class."""

    def test_save_trace_context(self, mock_get_session, storage_session):
        """Test saving trace context to database."""
        manager = TracingManager(mock_get_session)
        ctx = TraceContext("trace-456", "test-service")

        span1 = ctx.create_span("root operation")
        ctx.set_current_span(span1)
        span2 = ctx.create_span("child operation")

        ctx.finish_span(span1)
        ctx.finish_span(span2)

        manager.save_trace_context(ctx)

        # Verify trace was saved
        traces = storage_session.query(Trace).all()
        assert len(traces) == 1
        assert traces[0].trace_id == "trace-456"

        # Verify spans were saved
        spans = storage_session.query(Span).all()
        assert len(spans) == 2

        # Verify relations were saved
        relations = storage_session.query(SpanRelation).all()
        assert len(relations) == 1

    def test_save_span_relations(self, mock_get_session, storage_session):
        """Test saving span relations."""
        manager = TracingManager(mock_get_session)
        ctx = TraceContext("trace-789", "test-service")

        # Create a hierarchy: root -> child1 -> grandchild
        root = ctx.create_span("root")
        ctx.set_current_span(root)
        child1 = ctx.create_span("child1")
        ctx.set_current_span(child1)
        _ = ctx.create_span("grandchild")

        manager.save_trace_context(ctx)

        relations = storage_session.query(SpanRelation).order_by(SpanRelation.depth).all()
        assert len(relations) == 2

        # Check depths
        assert relations[0].depth == 1
        assert relations[1].depth == 2

    def test_get_waterfall_data(self, mock_get_session, storage_session):
        """Test getting waterfall data."""
        manager = TracingManager(mock_get_session)

        # Create and save a trace
        ctx = TraceContext("trace-waterfall", "test-service")
        span1 = ctx.create_span("operation 1")
        ctx.finish_span(span1)

        manager.save_trace_context(ctx)

        # Get waterfall data
        waterfall = manager.get_waterfall_data("trace-waterfall")

        assert len(waterfall) == 1
        assert waterfall[0]["operation_name"] == "operation 1"
        assert "offset_ms" in waterfall[0]
        assert "depth" in waterfall[0]


@pytest.mark.unit
class TestTracingGlobalFunctions:
    """Test tracing global functions."""

    def test_create_trace_context(self):
        """Test creating a trace context."""
        ctx = create_trace_context("my-service")
        assert ctx.service_name == "my-service"
        assert len(ctx.trace_id) == 32  # UUID hex

    def test_set_and_get_trace_context(self):
        """Test setting and getting trace context."""
        ctx = TraceContext("trace-123", "test-service")
        set_trace_context(ctx)

        retrieved_ctx = get_current_trace_context()
        assert retrieved_ctx is not None
        assert retrieved_ctx.trace_id == "trace-123"
        assert retrieved_ctx.service_name == "test-service"

    def test_get_trace_context_none(self):
        """Test getting trace context when none is set."""
        # Reset context by setting None
        set_trace_context(None)
        ctx = get_current_trace_context()
        assert ctx is None
