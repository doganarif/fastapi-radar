"""Tests for authentication functionality."""

import secrets

import pytest
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBasic,
    HTTPBasicCredentials,
    HTTPBearer,
)
from fastapi.testclient import TestClient

from fastapi_radar import Radar


@pytest.mark.security
class TestAuthenticationIntegration:
    """Test authentication integration with Radar."""

    def test_no_authentication_by_default(self, test_engine, storage_engine):
        """Test that Radar endpoints are accessible without auth by default."""
        app = FastAPI()
        radar = Radar(app, db_engine=test_engine, storage_engine=storage_engine)
        radar.create_tables()

        client = TestClient(app)

        # Dashboard and API should be accessible
        response = client.get("/__radar")
        assert response.status_code in [200, 307]

        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code == 200

    def test_basic_auth_protection(self, test_engine, storage_engine):
        """Test HTTP Basic authentication protection."""
        app = FastAPI()
        security = HTTPBasic()

        def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
            correct_username = secrets.compare_digest(credentials.username, "admin")
            correct_password = secrets.compare_digest(credentials.password, "secret")
            if not (correct_username and correct_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials",
                    headers={"WWW-Authenticate": "Basic"},
                )
            return credentials

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=verify_credentials,
        )
        radar.create_tables()

        client = TestClient(app)

        # Without auth - should fail
        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code == 401

        # With wrong credentials - should fail
        response = client.get("/__radar/api/stats?hours=1", auth=("admin", "wrong"))
        assert response.status_code == 401

        # With correct credentials - should succeed
        response = client.get("/__radar/api/stats?hours=1", auth=("admin", "secret"))
        assert response.status_code == 200

    def test_bearer_token_protection(self, test_engine, storage_engine):
        """Test Bearer token authentication protection."""
        app = FastAPI()
        security = HTTPBearer()

        def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
            if credentials.credentials != "valid-token-123":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )
            return credentials

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=verify_token,
        )
        radar.create_tables()

        client = TestClient(app)

        # Without token - should fail
        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code == 403

        # With wrong token - should fail
        response = client.get(
            "/__radar/api/stats?hours=1",
            headers={"Authorization": "Bearer wrong-token"},
        )
        assert response.status_code == 401

        # With correct token - should succeed
        response = client.get(
            "/__radar/api/stats?hours=1",
            headers={"Authorization": "Bearer valid-token-123"},
        )
        assert response.status_code == 200

    def test_custom_auth_function(self, test_engine, storage_engine):
        """Test custom authentication function."""
        app = FastAPI()

        async def custom_auth(api_key: str = Depends(lambda: None)):
            # Custom auth logic
            return True

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=custom_auth,
        )
        radar.create_tables()

        client = TestClient(app)
        response = client.get("/__radar/api/stats?hours=1")
        # Should work as custom auth returns True
        assert response.status_code == 200

    def test_auth_protects_dashboard(self, test_engine, storage_engine):
        """Test that authentication protects the dashboard."""
        app = FastAPI()
        security = HTTPBasic()

        def verify_credentials(credentials: HTTPBasicCredentials = Depends(security)):
            correct_username = secrets.compare_digest(credentials.username, "admin")
            correct_password = secrets.compare_digest(credentials.password, "secret")
            if not (correct_username and correct_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials",
                    headers={"WWW-Authenticate": "Basic"},
                )
            return credentials

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=verify_credentials,
        )
        radar.create_tables()

        client = TestClient(app)

        # Dashboard without auth should fail
        response = client.get("/__radar/")
        assert response.status_code == 401

        # Dashboard with auth should succeed
        response = client.get("/__radar/", auth=("admin", "secret"))
        assert response.status_code in [200, 307]

    def test_auth_protects_all_api_endpoints(self, test_engine, storage_engine):
        """Test that authentication protects all API endpoints."""
        app = FastAPI()
        security = HTTPBearer()

        def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
            if credentials.credentials != "secret":
                raise HTTPException(status_code=401)
            return credentials

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=verify_token,
        )
        radar.create_tables()

        client = TestClient(app)
        headers = {"Authorization": "Bearer secret"}

        # Test various endpoints
        endpoints = [
            "/__radar/api/requests",
            "/__radar/api/queries",
            "/__radar/api/exceptions",
            "/__radar/api/stats?hours=1",
            "/__radar/api/traces",
            "/__radar/api/background-tasks",
        ]

        for endpoint in endpoints:
            # Without auth
            response = client.get(endpoint)
            assert response.status_code in [401, 403], f"Endpoint {endpoint} not protected"

            # With auth
            response = client.get(endpoint, headers=headers)
            assert response.status_code == 200, f"Endpoint {endpoint} failed with auth"

    def test_app_endpoints_not_protected(self, test_engine, storage_engine):
        """Test that application endpoints are not affected by Radar auth."""
        app = FastAPI()
        security = HTTPBearer()

        def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
            if credentials.credentials != "radar-token":
                raise HTTPException(status_code=401)
            return credentials

        radar = Radar(
            app,
            db_engine=test_engine,
            storage_engine=storage_engine,
            auth_dependency=verify_token,
        )
        radar.create_tables()

        @app.get("/public")
        async def public_endpoint():
            return {"status": "public"}

        @app.get("/api/data")
        async def data_endpoint():
            return {"data": [1, 2, 3]}

        client = TestClient(app)

        # Application endpoints should work without Radar auth
        response = client.get("/public")
        assert response.status_code == 200

        response = client.get("/api/data")
        assert response.status_code == 200

        # But Radar endpoints should require auth
        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code in [401, 403]


@pytest.mark.security
class TestSecurityBestPractices:
    """Test security best practices."""

    def test_sensitive_headers_redacted(self, client, storage_session):
        """Test that sensitive headers are redacted in captured requests."""
        from fastapi_radar.models import CapturedRequest

        app = client.app

        @app.get("/secure")
        async def secure_endpoint():
            return {"status": "ok"}

        # Make request with sensitive headers
        response = client.get(
            "/secure",
            headers={
                "Authorization": "Bearer secret-token",
                "Cookie": "session=abc123",
                "X-API-Key": "my-api-key",
            },
        )
        assert response.status_code == 200

        # Verify headers were redacted
        requests = storage_session.query(CapturedRequest).all()
        captured = [r for r in requests if "/secure" in r.path][-1]

        assert captured.headers["authorization"] == "***REDACTED***"
        assert captured.headers["cookie"] == "***REDACTED***"
        assert captured.headers["x-api-key"] == "***REDACTED***"

    def test_sensitive_body_redacted(self, client, storage_session):
        """Test that sensitive body content is redacted."""
        from fastapi_radar.models import CapturedRequest

        app = client.app

        @app.post("/login")
        async def login(data: dict):
            return {"status": "ok"}

        # Send request with sensitive data
        response = client.post(
            "/login",
            json={
                "username": "john",
                "password": "super-secret",
                "api_key": "key-123",
            },
        )
        assert response.status_code == 200

        # Verify body was redacted
        requests = storage_session.query(CapturedRequest).all()
        captured = [r for r in requests if "/login" in r.path][-1]

        assert "super-secret" not in captured.body
        assert "key-123" not in captured.body
        assert "***REDACTED***" in captured.body
        assert "john" in captured.body  # username should remain
