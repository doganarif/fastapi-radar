"""Shared test fixtures for FastAPI Radar tests."""

import tempfile
from contextlib import contextmanager
from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi_radar import Radar
from fastapi_radar.models import Base


@pytest.fixture(scope="function")
def temp_db():
    """Create a temporary SQLite database for tests."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    temp_file.close()
    yield temp_file.name


@pytest.fixture(scope="function")
def test_engine():
    """Create an in-memory SQLite engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def storage_engine():
    """Create a separate in-memory storage engine for Radar data."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_session(test_engine) -> Generator[Session, None, None]:
    """Create a test database session."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def storage_session(storage_engine) -> Generator[Session, None, None]:
    """Create a storage session for Radar data."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=storage_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def app():
    """Create a test FastAPI application."""
    return FastAPI(title="Test App")


@pytest.fixture(scope="function")
def radar_app(app, test_engine, storage_engine):
    """Create a FastAPI app with Radar configured."""
    radar = Radar(
        app,
        db_engine=test_engine,
        storage_engine=storage_engine,
        dashboard_path="/__radar",
        max_requests=100,
        retention_hours=24,
        slow_query_threshold=100,
    )
    radar.create_tables()
    return app, radar


@pytest.fixture(scope="function")
def client(radar_app):
    """Create a test client for the Radar-enabled app."""
    app, radar = radar_app
    return TestClient(app)


@pytest.fixture(scope="function")
def simple_app():
    """Create a simple FastAPI app without Radar for isolated testing."""
    return FastAPI(title="Simple Test App")


@pytest.fixture(scope="function")
def mock_session():
    """Create a mock database session."""
    session = MagicMock(spec=Session)
    session.add = MagicMock()
    session.commit = MagicMock()
    session.query = MagicMock()
    session.close = MagicMock()
    return session


@pytest.fixture(scope="function")
def mock_get_session(storage_session):
    """Create a mock get_session context manager."""

    @contextmanager
    def get_session():
        try:
            yield storage_session
        finally:
            pass

    return get_session


@pytest.fixture
def sample_request_data():
    """Sample request data for testing."""
    return {
        "request_id": "test-request-123",
        "method": "GET",
        "url": "http://testserver/api/users",
        "path": "/api/users",
        "query_params": {"page": "1", "limit": "10"},
        "headers": {
            "user-agent": "test-client",
            "content-type": "application/json",
        },
        "body": '{"test": "data"}',
        "status_code": 200,
        "duration_ms": 45.67,
        "client_ip": "127.0.0.1",
    }


@pytest.fixture
def sample_query_data():
    """Sample query data for testing."""
    return {
        "request_id": "test-request-123",
        "sql": "SELECT * FROM users WHERE id = ?",
        "parameters": ["1"],
        "duration_ms": 12.34,
        "rows_affected": 1,
        "connection_name": "sqlite",
    }


@pytest.fixture
def sample_exception_data():
    """Sample exception data for testing."""
    return {
        "request_id": "test-request-123",
        "exception_type": "ValueError",
        "exception_value": "Invalid input",
        "traceback": "Traceback (most recent call last)...",
    }
