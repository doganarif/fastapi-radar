"""Test suite for FastAPI Radar."""

import time

from fastapi import BackgroundTasks, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from fastapi_radar import Radar


def test_radar_initialization():
    """Test that Radar can be initialized with a FastAPI app."""
    app = FastAPI()
    # Use in-memory SQLite for test database (not for storage)
    engine = create_engine("sqlite:///:memory:")
    # Use in-memory SQLite for storage as well to avoid DuckDB requirement in tests
    storage_engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine, storage_engine=storage_engine)
    assert radar is not None
    assert radar.app == app
    assert radar.db_engine == engine


def test_radar_creates_tables():
    """Test that Radar can create necessary database tables."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")
    storage_engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine, storage_engine=storage_engine)
    radar.create_tables()

    # Tables should be created without errors
    assert True


def test_dashboard_mounted():
    """Test that the dashboard is mounted at the correct path."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")
    storage_engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine, storage_engine=storage_engine)
    radar.create_tables()

    client = TestClient(app)

    # Dashboard should be accessible
    response = client.get("/__radar")
    # Should return HTML or redirect
    assert response.status_code in [200, 307]


def test_middleware_captures_requests():
    """Test that middleware captures HTTP requests."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")
    # Use a file-based SQLite for storage to persist tables
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".db") as temp_db:
        storage_engine = create_engine(f"sqlite:///{temp_db.name}")

        radar = Radar(app, db_engine=engine, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}

        client = TestClient(app)
        response = client.get("/test")

        assert response.status_code == 200
        assert response.json() == {"message": "test"}


def test_background_tasks_api():
    """Background task tracker should expose task lifecycle endpoints."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")
    storage_engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine, storage_engine=storage_engine)
    radar.create_tables()

    execution_log = []

    def sample_task():
        execution_log.append("ran")

    @app.post("/trigger-task")
    async def trigger_task(background_tasks: BackgroundTasks):
        background_tasks.add_task(sample_task)
        return {"ok": True}

    client = TestClient(app)
    trigger_response = client.post("/trigger-task")
    assert trigger_response.status_code == 200
    time.sleep(0.05)
    assert execution_log, "background task should have executed at least once"

    tasks_response = client.get("/__radar/api/background-tasks")
    assert tasks_response.status_code == 200
    tasks = tasks_response.json()
    assert isinstance(tasks, list)
    assert tasks, "expected at least one tracked task"

    task_id = tasks[0]["id"]
    rerun_response = client.post(
        f"/__radar/api/background-tasks/{task_id}/rerun",
    )
    assert rerun_response.status_code == 200
    time.sleep(0.05)
    assert len(execution_log) >= 2, "rerun should execute the task again"

    clear_response = client.delete("/__radar/api/background-tasks")
    assert clear_response.status_code == 200

    cleared_tasks = client.get("/__radar/api/background-tasks").json()
    assert cleared_tasks == []
