"""Test suite for FastAPI Radar core functionality."""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine

from fastapi_radar import Radar
from fastapi_radar.models import CapturedRequest


@pytest.mark.unit
class TestRadarInitialization:
    """Test Radar initialization."""

    def test_radar_basic_initialization(self, test_engine, storage_engine):
        """Test basic Radar initialization."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)

        assert radar is not None
        assert radar.app == app
        assert radar.db_engine == test_engine

    def test_radar_without_db_engine(self, storage_engine):
        """Test Radar initialization without db_engine (no SQL monitoring)."""
        app = FastAPI()
        radar = Radar(app, storage_engine=storage_engine)

        assert radar is not None
        assert radar.db_engine is None
        assert radar.query_capture is None

    def test_radar_custom_config(self, test_engine, storage_engine):
        """Test Radar with custom configuration."""
        app = FastAPI()
        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            dashboard_path="/custom-radar",
            max_requests=500,
            retention_hours=12,
            slow_query_threshold=200,
            capture_sql_bindings=False,
            exclude_paths=["/health", "/metrics"],
            theme="dark",
        )

        assert radar.dashboard_path == "/custom-radar"
        assert radar.max_requests == 500
        assert radar.retention_hours == 12
        assert radar.slow_query_threshold == 200
        assert radar.capture_sql_bindings is False
        assert "/health" in radar.exclude_paths
        assert radar.theme == "dark"

    def test_radar_auto_excludes_dashboard_path(self, test_engine, storage_engine):
        """Test that dashboard path is automatically excluded."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)

        assert radar.dashboard_path in radar.exclude_paths

    def test_radar_with_async_engine(self, storage_engine):
        """Test Radar with async storage engine."""
        app = FastAPI()
        async_engine = create_async_engine("sqlite+aiosqlite:///:memory:")

        radar = Radar(app, storage_engine=async_engine)

        assert radar._is_async_storage is True
        assert radar.storage_engine == async_engine

    def test_radar_with_custom_db_path(self, test_engine):
        """Test Radar with custom database path."""
        app = FastAPI()

        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "custom"

            radar = Radar(app, db_engine=test_engine, db_path=str(db_path))
            assert radar.db_path == str(db_path)

    def test_radar_reload_worker_detection(self, test_engine):
        """Test detection of reload worker mode."""
        app = FastAPI()

        # Simulate reload worker
        os.environ["UVICORN_RELOAD"] = "true"
        try:
            radar = Radar(app, db_engine=test_engine)
            # Should use in-memory storage
            assert "memory" in str(radar.storage_engine.url)
        finally:
            del os.environ["UVICORN_RELOAD"]


@pytest.mark.unit
class TestRadarTableManagement:
    """Test Radar table management."""

    def test_create_tables(self, test_engine, storage_engine):
        """Test creating tables."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)

        # Should not raise
        radar.create_tables()

    def test_create_tables_idempotent(self, test_engine, storage_engine):
        """Test that create_tables can be called multiple times."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)

        radar.create_tables()
        radar.create_tables()  # Should not fail

    def test_drop_tables(self, test_engine, storage_engine):
        """Test dropping tables."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)

        radar.create_tables()
        radar.drop_tables()

        # Tables should be dropped
        # Recreating should work
        radar.create_tables()


@pytest.mark.unit
class TestRadarCleanup:
    """Test Radar cleanup functionality."""

    def test_cleanup_old_requests(self, test_engine, storage_engine, mock_get_session):
        """Test cleaning up old requests."""
        from datetime import datetime, timedelta, timezone

        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        # Create old and recent requests
        with radar.get_session() as session:
            old_time = datetime.now(timezone.utc) - timedelta(hours=48)
            old_request = CapturedRequest(
                request_id="old",
                method="GET",
                url="http://test.com",
                path="/old",
                created_at=old_time,
            )
            recent_request = CapturedRequest(
                request_id="recent",
                method="GET",
                url="http://test.com",
                path="/recent",
            )
            session.add_all([old_request, recent_request])
            session.commit()

        # Cleanup data older than 24 hours
        _ = radar.cleanup(older_than_hours=24)

        # Verify old request was deleted
        with radar.get_session() as session:
            remaining = session.query(CapturedRequest).all()
            assert len(remaining) == 1
            assert remaining[0].request_id == "recent"


@pytest.mark.integration
class TestRadarFullIntegration:
    """Full integration tests for Radar."""

    def test_full_request_lifecycle(self, test_engine, storage_engine):
        """Test full request lifecycle capture."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}

        client = TestClient(app)
        response = client.get("/test?param=value")

        assert response.status_code == 200
        assert response.json() == {"message": "test"}

        # Verify request was captured
        with radar.get_session() as session:
            requests = session.query(CapturedRequest).all()
            assert len(requests) > 0

            captured = requests[-1]
            assert captured.method == "GET"
            assert "/test" in captured.path
            assert captured.status_code == 200
            assert captured.query_params["param"] == "value"

    def test_dashboard_accessible(self, test_engine, storage_engine):
        """Test that dashboard is accessible."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        client = TestClient(app)
        response = client.get("/__radar")

        assert response.status_code in [200, 307]

    def test_api_endpoints_accessible(self, test_engine, storage_engine):
        """Test that API endpoints are accessible."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        client = TestClient(app)

        # Test various API endpoints
        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code == 200

        response = client.get("/__radar/api/requests")
        assert response.status_code == 200

        response = client.get("/__radar/api/queries")
        assert response.status_code == 200

        response = client.get("/__radar/api/exceptions")
        assert response.status_code == 200
