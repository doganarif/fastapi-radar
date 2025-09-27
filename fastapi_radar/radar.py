"""Main Radar class for FastAPI Radar."""

from contextlib import contextmanager
import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .api import create_api_router
from .capture import QueryCapture
from .middleware import RadarMiddleware
from .models import Base


class Radar:
    query_capture: Optional[QueryCapture]

    def __init__(
        self,
        app: FastAPI,
        db_engine: Optional[Engine] = None,
        storage_engine: Optional[Engine] = None,
        dashboard_path: str = "/__radar",
        max_requests: int = 1000,
        retention_hours: int = 24,
        slow_query_threshold: int = 100,
        capture_sql_bindings: bool = True,
        exclude_paths: Optional[List[str]] = None,
        theme: str = "auto",
        enable_tracing: bool = True,
        service_name: str = "fastapi-app",
        include_in_schema: bool = True,
    ):
        self.app = app
        self.db_engine = db_engine
        self.dashboard_path = dashboard_path
        self.max_requests = max_requests
        self.retention_hours = retention_hours
        self.slow_query_threshold = slow_query_threshold
        self.capture_sql_bindings = capture_sql_bindings
        self.exclude_paths = exclude_paths or []
        self.theme = theme
        self.enable_tracing = enable_tracing
        self.service_name = service_name
        self.query_capture = None

        # Exclude radar dashboard paths
        if dashboard_path not in self.exclude_paths:
            self.exclude_paths.append(dashboard_path)
        self.exclude_paths.append("/favicon.ico")

        # Setup storage engine
        if storage_engine:
            self.storage_engine = storage_engine
        else:
            storage_url = os.environ.get("RADAR_STORAGE_URL")
            if storage_url:
                self.storage_engine = create_engine(storage_url)
            else:
                # Use DuckDB for analytics-optimized storage
                # Import duckdb_engine to register the dialect
                import duckdb_engine  # noqa: F401

                radar_db_path = Path.cwd() / "radar.duckdb"
                self.storage_engine = create_engine(
                    f"duckdb:///{radar_db_path}",
                    connect_args={
                        "read_only": False,
                        "config": {"memory_limit": "500mb"},
                    },
                )

        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.storage_engine
        )

        self._setup_middleware()

        if self.db_engine:
            self._setup_query_capture()

        self._setup_api(include_in_schema=include_in_schema)
        self._setup_dashboard(include_in_schema=include_in_schema)

    @contextmanager
    def get_session(self) -> Session:
        """Get a database session for radar storage."""
        session = self.SessionLocal()
        try:
            yield session
        finally:
            session.close()

    def _setup_middleware(self) -> None:
        """Add request capture middleware."""
        self.app.add_middleware(
            RadarMiddleware,
            get_session=self.get_session,
            exclude_paths=self.exclude_paths,
            max_body_size=10000,
            capture_response_body=True,
            enable_tracing=self.enable_tracing,
            service_name=self.service_name,
        )

    def _setup_query_capture(self) -> None:
        """Setup SQLAlchemy query capture."""
        assert (
            self.db_engine is not None
        ), "db_engine must be set before calling _setup_query_capture"

        self.query_capture = QueryCapture(
            get_session=self.get_session,
            capture_bindings=self.capture_sql_bindings,
            slow_query_threshold=self.slow_query_threshold,
        )
        self.query_capture.register(self.db_engine)

    def _setup_api(self, include_in_schema: bool) -> None:
        """Mount API endpoints."""
        api_router = create_api_router(self.get_session)
        self.app.include_router(api_router, include_in_schema=include_in_schema)

    def _setup_dashboard(self, include_in_schema: bool) -> None:
        """Mount dashboard static files."""
        from fastapi import Request
        from fastapi.responses import FileResponse

        dashboard_dir = Path(__file__).parent / "dashboard" / "dist"

        if not dashboard_dir.exists():
            # Create placeholder dashboard for development
            dashboard_dir.mkdir(parents=True, exist_ok=True)
            self._create_placeholder_dashboard(dashboard_dir)
            print("\n" + "=" * 60)
            print("⚠️  FastAPI Radar: Dashboard not built")
            print("=" * 60)
            print("To use the full dashboard, build it with:")
            print("  cd fastapi_radar/dashboard")
            print("  npm install")
            print("  npm run build")
            print("=" * 60 + "\n")

        # Add a catch-all route for the dashboard SPA
        # This ensures all sub-routes under /__radar serve the index.html
        @self.app.get(
            f"{self.dashboard_path}/{{full_path:path}}",
            include_in_schema=include_in_schema,
        )
        async def serve_dashboard(request: Request, full_path: str = ""):
            # Check if it's a request for a static asset
            if full_path and any(
                full_path.endswith(ext)
                for ext in [
                    ".js",
                    ".css",
                    ".ico",
                    ".png",
                    ".jpg",
                    ".svg",
                    ".woff",
                    ".woff2",
                    ".ttf",
                ]
            ):
                file_path = dashboard_dir / full_path
                if file_path.exists():
                    return FileResponse(file_path)

            # For all other routes, serve index.html (SPA behavior)
            index_path = dashboard_dir / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
            else:
                return {"error": "Dashboard not found. Please build the dashboard."}

    def _create_placeholder_dashboard(self, dashboard_dir: Path) -> None:
        index_html = dashboard_dir / "index.html"
        index_html.write_text(
            """
<!DOCTYPE html>
<html lang="en" data-theme="{theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FastAPI Radar</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .container {{
            text-align: center;
            max-width: 600px;
        }}
        h1 {{
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}
        p {{
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.95;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 3rem;
        }}
        .stat {{
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }}
        .stat-value {{
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .stat-label {{
            font-size: 0.9rem;
            opacity: 0.8;
        }}
        .loading {{ animation: pulse 2s infinite; }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.5; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>FastAPI Radar</h1>
        <p>Real-time debugging dashboard loading...</p>
        <div class="stats">
            <div class="stat">
                <div class="stat-value loading">--</div>
                <div class="stat-label">Requests</div>
            </div>
            <div class="stat">
                <div class="stat-value loading">--</div>
                <div class="stat-label">Queries</div>
            </div>
            <div class="stat">
                <div class="stat-value loading">--</div>
                <div class="stat-label">Avg Response</div>
            </div>
            <div class="stat">
                <div class="stat-value loading">--</div>
                <div class="stat-label">Exceptions</div>
            </div>
        </div>
    </div>
    <script>
        // Fetch stats from API
        async function loadStats() {{
            try {{
                const response = await fetch('/__radar/api/stats?hours=1');
                const data = await response.json();

                document.querySelectorAll('.stat-value')[0].textContent =
                    data.total_requests;
                document.querySelectorAll('.stat-value')[1].textContent =
                    data.total_queries;
                document.querySelectorAll('.stat-value')[2].textContent =
                    data.avg_response_time ?
                        `${{data.avg_response_time.toFixed(1)}}ms` : '--';
                document.querySelectorAll('.stat-value')[3].textContent =
                    data.total_exceptions;

                document.querySelectorAll('.stat-value').forEach(el => {{
                    el.classList.remove('loading');
                }});
            }} catch (error) {{
                console.error('Failed to load stats:', error);
            }}
        }}

        // Load stats on page load
        loadStats();
        // Refresh stats every 5 seconds
        setInterval(loadStats, 5000);
    </script>
</body>
</html>
        """.replace(
                "{theme}", self.theme
            )
        )

    def create_tables(self) -> None:
        Base.metadata.create_all(bind=self.storage_engine)

    def drop_tables(self) -> None:
        Base.metadata.drop_all(bind=self.storage_engine)

    def cleanup(self, older_than_hours: Optional[int] = None) -> None:
        from datetime import datetime, timedelta

        from .models import CapturedRequest

        with self.get_session() as session:
            hours = older_than_hours or self.retention_hours
            cutoff = datetime.utcnow() - timedelta(hours=hours)

            deleted = (
                session.query(CapturedRequest)
                .filter(CapturedRequest.created_at < cutoff)
                .delete()
            )

            session.commit()
            return deleted
