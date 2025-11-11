"""Tests for background task tracking."""

import asyncio

import pytest

from fastapi_radar.background import track_background_task
from fastapi_radar.models import BackgroundTask


@pytest.mark.unit
class TestBackgroundTaskTracking:
    """Test background task tracking decorator."""

    def test_track_sync_task_success(self, mock_get_session, storage_session):
        """Test tracking a successful sync task."""

        @track_background_task(mock_get_session)
        def sync_task(value):
            return value * 2

        result = sync_task(21)

        assert result == 42

        # Verify task was tracked
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].name == "sync_task"
        assert tasks[0].status == "completed"
        assert tasks[0].duration_ms is not None
        assert tasks[0].error is None

    def test_track_sync_task_failure(self, mock_get_session, storage_session):
        """Test tracking a failed sync task."""

        @track_background_task(mock_get_session)
        def failing_task():
            raise ValueError("Task failed")

        with pytest.raises(ValueError, match="Task failed"):
            failing_task()

        # Verify task was tracked as failed
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].name == "failing_task"
        assert tasks[0].status == "failed"
        assert tasks[0].error == "Task failed"

    @pytest.mark.asyncio
    async def test_track_async_task_success(self, mock_get_session, storage_session):
        """Test tracking a successful async task."""

        @track_background_task(mock_get_session)
        async def async_task(value):
            await asyncio.sleep(0.01)
            return value * 2

        result = await async_task(21)

        assert result == 42

        # Verify task was tracked
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].name == "async_task"
        assert tasks[0].status == "completed"
        assert tasks[0].duration_ms >= 10  # At least 10ms due to sleep

    @pytest.mark.asyncio
    async def test_track_async_task_failure(self, mock_get_session, storage_session):
        """Test tracking a failed async task."""

        @track_background_task(mock_get_session)
        async def failing_async_task():
            await asyncio.sleep(0.01)
            raise RuntimeError("Async task failed")

        with pytest.raises(RuntimeError, match="Async task failed"):
            await failing_async_task()

        # Verify task was tracked as failed
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].name == "failing_async_task"
        assert tasks[0].status == "failed"
        assert tasks[0].error == "Async task failed"

    def test_track_task_with_request_id(self, mock_get_session, storage_session):
        """Test tracking a task with request_id."""

        @track_background_task(mock_get_session)
        def task_with_request():
            return "done"

        # Call with request_id
        result = task_with_request(_radar_request_id="request-123")

        assert result == "done"

        # Verify task has request_id
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].request_id == "request-123"

    def test_track_task_without_request_id(self, mock_get_session, storage_session):
        """Test tracking a task without request_id."""

        @track_background_task(mock_get_session)
        def independent_task():
            return "done"

        result = independent_task()

        assert result == "done"

        # Verify task has no request_id
        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].request_id is None

    def test_task_timing(self, mock_get_session, storage_session):
        """Test that task timing is recorded correctly."""
        import time

        @track_background_task(mock_get_session)
        def timed_task():
            time.sleep(0.05)  # 50ms
            return "done"

        timed_task()

        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 1
        assert tasks[0].duration_ms >= 50
        assert tasks[0].start_time is not None
        assert tasks[0].end_time is not None
        assert tasks[0].end_time > tasks[0].start_time

    def test_multiple_tasks(self, mock_get_session, storage_session):
        """Test tracking multiple tasks."""

        @track_background_task(mock_get_session)
        def task_a():
            return "a"

        @track_background_task(mock_get_session)
        def task_b():
            return "b"

        task_a()
        task_b()
        task_a()

        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 3

        task_names = [t.name for t in tasks]
        assert task_names.count("task_a") == 2
        assert task_names.count("task_b") == 1

    def test_task_unique_ids(self, mock_get_session, storage_session):
        """Test that each task gets a unique ID."""

        @track_background_task(mock_get_session)
        def repeated_task():
            return "done"

        repeated_task()
        repeated_task()
        repeated_task()

        tasks = storage_session.query(BackgroundTask).all()
        assert len(tasks) == 3

        task_ids = [t.task_id for t in tasks]
        assert len(set(task_ids)) == 3  # All unique
