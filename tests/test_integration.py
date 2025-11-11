"""Comprehensive integration tests."""

import time

import pytest
from fastapi import BackgroundTasks, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi_radar import Radar
from fastapi_radar.background import track_background_task
from fastapi_radar.models import (
    BackgroundTask,
    CapturedException,
    CapturedQuery,
    CapturedRequest,
)

Base = declarative_base()


class User(Base):
    """Test model for integration tests."""

    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    email = Column(String(100))


@pytest.mark.integration
class TestEndToEndScenarios:
    """End-to-end integration tests."""

    def test_complete_crud_flow_with_monitoring(self):
        """Test complete CRUD flow with all monitoring features."""
        # Setup application with database
        app = FastAPI()

        # Create test database
        test_db_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=test_db_engine)
        TestSession = sessionmaker(bind=test_db_engine)

        # Create storage engine
        storage_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Setup Radar
        radar = Radar(app, db_engine=test_db_engine, storage_engine=storage_engine)
        radar.create_tables()

        # Create endpoints
        @app.post("/users")
        async def create_user(name: str, email: str):
            with TestSession() as session:
                user = User(name=name, email=email)
                session.add(user)
                session.commit()
                session.refresh(user)
                return {"id": user.id, "name": user.name, "email": user.email}

        @app.get("/users/{user_id}")
        async def get_user(user_id: int):
            with TestSession() as session:
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    return {"error": "User not found"}, 404
                return {"id": user.id, "name": user.name, "email": user.email}

        @app.put("/users/{user_id}")
        async def update_user(user_id: int, name: str = None, email: str = None):
            with TestSession() as session:
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    return {"error": "User not found"}, 404
                if name:
                    user.name = name
                if email:
                    user.email = email
                session.commit()
                return {"id": user.id, "name": user.name, "email": user.email}

        @app.delete("/users/{user_id}")
        async def delete_user(user_id: int):
            with TestSession() as session:
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    return {"error": "User not found"}, 404
                session.delete(user)
                session.commit()
                return {"message": "User deleted"}

        client = TestClient(app)

        # 1. CREATE
        response = client.post("/users?name=Alice&email=alice@example.com")
        assert response.status_code == 200
        user_id = response.json()["id"]

        # 2. READ
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Alice"

        # 3. UPDATE
        response = client.put(f"/users/{user_id}?name=Alice Updated")
        assert response.status_code == 200
        assert response.json()["name"] == "Alice Updated"

        # 4. DELETE
        response = client.delete(f"/users/{user_id}")
        assert response.status_code == 200

        # Verify monitoring data
        with radar.get_session() as session:
            # Should have 4 requests
            requests = session.query(CapturedRequest).all()
            assert len(requests) >= 4

            # Should have captured queries
            queries = session.query(CapturedQuery).all()
            assert len(queries) > 0

            # Verify query types
            query_sqls = [q.sql for q in queries]
            assert any("INSERT" in sql for sql in query_sqls)
            assert any("SELECT" in sql for sql in query_sqls)
            assert any("UPDATE" in sql for sql in query_sqls)
            assert any("DELETE" in sql for sql in query_sqls)

    def test_error_handling_and_exception_tracking(self):
        """Test error handling with exception tracking."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/error/value")
        async def value_error():
            raise ValueError("Test value error")

        @app.get("/error/type")
        async def type_error():
            raise TypeError("Test type error")

        @app.get("/error/key")
        async def key_error():
            data = {}
            return data["missing_key"]

        client = TestClient(app)

        # Trigger errors
        with pytest.raises(Exception):
            client.get("/error/value")

        with pytest.raises(Exception):
            client.get("/error/type")

        with pytest.raises(Exception):
            client.get("/error/key")

        # Verify exceptions were captured
        with radar.get_session() as session:
            exceptions = session.query(CapturedException).all()
            assert len(exceptions) >= 3

            exception_types = [e.exception_type for e in exceptions]
            assert "ValueError" in exception_types
            assert "TypeError" in exception_types
            assert "KeyError" in exception_types

    def test_background_tasks_integration(self):
        """Test background tasks with monitoring."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        # Create tracked background task
        @track_background_task(radar.get_session)
        def send_email(to: str, subject: str):
            time.sleep(0.05)  # Simulate work
            return f"Email sent to {to}"

        @app.post("/send-notification")
        async def send_notification(background_tasks: BackgroundTasks, email: str):
            background_tasks.add_task(send_email, email, "Test Subject")
            return {"status": "notification queued"}

        client = TestClient(app)

        # Send notification
        response = client.post("/send-notification?email=test@example.com")
        assert response.status_code == 200

        # Background tasks run synchronously in TestClient
        # Verify task was tracked
        with radar.get_session() as session:
            tasks = session.query(BackgroundTask).all()
            assert len(tasks) >= 1

            task = tasks[-1]
            assert task.name == "send_email"
            assert task.status == "completed"
            assert task.duration_ms is not None

    def test_concurrent_requests(self):
        """Test handling concurrent requests."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/endpoint/{id}")
        async def get_data(id: int):
            time.sleep(0.01)  # Simulate some work
            return {"id": id, "data": f"data-{id}"}

        client = TestClient(app)

        # Make multiple concurrent-like requests
        responses = []
        for i in range(10):
            response = client.get(f"/endpoint/{i}")
            responses.append(response)

        # All should succeed
        assert all(r.status_code == 200 for r in responses)

        # All should be tracked
        with radar.get_session() as session:
            requests = session.query(CapturedRequest).all()
            endpoint_requests = [r for r in requests if "/endpoint/" in r.path]
            assert len(endpoint_requests) >= 10

            # All should have unique request IDs
            request_ids = [r.request_id for r in endpoint_requests]
            assert len(set(request_ids)) == len(endpoint_requests)

    def test_large_payloads(self):
        """Test handling large request/response payloads."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine, max_body_size=1000)
        radar.create_tables()

        @app.post("/upload")
        async def upload(data: dict):
            return {"status": "received", "size": len(str(data))}

        client = TestClient(app)

        # Send large payload
        large_data = {"content": "A" * 10000}
        response = client.post("/upload", json=large_data)
        assert response.status_code == 200

        # Verify body was truncated
        with radar.get_session() as session:
            requests = session.query(CapturedRequest).all()
            captured = [r for r in requests if "/upload" in r.path][-1]

            assert captured.body is not None
            assert len(captured.body) < len(str(large_data))
            assert "[truncated" in captured.body

    def test_performance_with_many_requests(self):
        """Test performance with many requests."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/fast")
        async def fast_endpoint():
            return {"status": "ok"}

        client = TestClient(app)

        # Make many requests
        start_time = time.time()
        num_requests = 50

        for _ in range(num_requests):
            response = client.get("/fast")
            assert response.status_code == 200

        elapsed = time.time() - start_time

        # Should complete in reasonable time (< 5 seconds for 50 requests)
        assert elapsed < 5.0

        # Verify all were captured
        with radar.get_session() as session:
            requests = session.query(CapturedRequest).all()
            fast_requests = [r for r in requests if "/fast" in r.path]
            assert len(fast_requests) == num_requests


@pytest.mark.integration
class TestDashboardIntegration:
    """Test dashboard integration."""

    def test_dashboard_serves_stats(self):
        """Test that dashboard can retrieve and display stats."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        @app.get("/api/data")
        async def get_data():
            return {"data": [1, 2, 3]}

        client = TestClient(app)

        # Generate some activity
        for _ in range(5):
            client.get("/api/data")

        # Dashboard stats should be available
        response = client.get("/__radar/api/stats?hours=1")
        assert response.status_code == 200

        stats = response.json()
        assert stats["total_requests"] >= 5

    def test_dashboard_displays_request_details(self):
        """Test that dashboard can display request details."""
        app = FastAPI()
        storage_engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)

        radar = Radar(app, storage_engine=storage_engine)
        radar.create_tables()

        @app.post("/api/users")
        async def create_user(data: dict):
            return {"id": 1, "name": data.get("name")}

        client = TestClient(app)

        # Create a request
        response = client.post("/api/users", json={"name": "John", "age": 30})
        assert response.status_code == 200

        # Get request list
        response = client.get("/__radar/api/requests")
        assert response.status_code == 200

        requests = response.json()
        assert len(requests) > 0

        # Get request detail
        request_id = requests[0]["request_id"]
        response = client.get(f"/__radar/api/requests/{request_id}")
        assert response.status_code == 200

        detail = response.json()
        assert detail["request_id"] == request_id
        assert detail["method"] in ["POST", "GET"]
