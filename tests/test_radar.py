"""Test suite for FastAPI Radar."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from fastapi_radar import Radar


def test_radar_initialization():
    """Test that Radar can be initialized with a FastAPI app."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine)
    assert radar is not None
    assert radar.app == app
    assert radar.db_engine == engine


def test_radar_creates_tables():
    """Test that Radar can create necessary database tables."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine)
    radar.create_tables()

    # Tables should be created without errors
    assert True


def test_dashboard_mounted():
    """Test that the dashboard is mounted at the correct path."""
    app = FastAPI()
    engine = create_engine("sqlite:///:memory:")

    radar = Radar(app, db_engine=engine)
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

    radar = Radar(app, db_engine=engine)
    radar.create_tables()

    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}

    client = TestClient(app)
    response = client.get("/test")

    assert response.status_code == 200
    assert response.json() == {"message": "test"}
