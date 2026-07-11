# FastAPI Radar

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PyPI](https://img.shields.io/pypi/v/fastapi-radar)](https://pypi.org/project/fastapi-radar/)

**A debugging dashboard for FastAPI applications providing real-time request, database query, and exception monitoring.**

**Just one line to add powerful monitoring to your FastAPI app!**

### Featured In

- [**Python Weekly**](https://www.pythonweekly.com/p/python-weekly-issue-715-september-25-2025) — Issue 715, Sep 2025
- [**PythonHub**](https://x.com/PythonHub/status/1973527222435680356) — Featured project
- [**PythonHub Weekly Digest**](https://pythonhub.dev/digest/2025-10-05/) — Oct 2025

## See it in Action

![FastAPI Radar Dashboard Demo](./assets/demo.gif)

## Installation

```bash
pip install fastapi-radar
```

Or with your favorite package manager:

```bash
# Using poetry
poetry add fastapi-radar

# Using pipenv
pipenv install fastapi-radar
```

**Note:** The dashboard comes pre-built! No need to build anything - just install and use.

## Quick Start

### With SQL Database (Full Monitoring)

```python
from fastapi import FastAPI
from fastapi_radar import Radar
from sqlalchemy import create_engine

app = FastAPI()
engine = create_engine("sqlite:///./app.db")

# Full monitoring with SQL query tracking
radar = Radar(app, db_engine=engine)
radar.create_tables()

# Your routes work unchanged
@app.get("/users")
async def get_users():
    return {"users": []}
```

### Without SQL Database (HTTP & Exception Monitoring)

```python
from fastapi import FastAPI
from fastapi_radar import Radar

app = FastAPI()

# Monitor HTTP requests and exceptions only
# Perfect for NoSQL databases, external APIs, or database-less apps
radar = Radar(app)  # No db_engine parameter needed!
radar.create_tables()

@app.get("/api/data")
async def get_data():
    # Your MongoDB, Redis, or external API calls here
    return {"data": []}
```

Access your dashboard at: **http://localhost:8000/\_\_radar/**

## Features

- **Zero Configuration** - Works with any FastAPI app (SQL database optional)
- **Request Monitoring** - Complete HTTP request/response capture with timing
- **Database Monitoring** - SQL query logging with execution times (when using SQLAlchemy)
- **Exception Tracking** - Automatic exception capture with stack traces
- **Real-time Updates** - Live dashboard updates as requests happen
- **Flexible Integration** - Use with SQL, NoSQL, or no database at all

## Configuration

```python
radar = Radar(
    app,
    db_engine=engine,            # Optional: SQLAlchemy engine for SQL query monitoring
    storage_engine=None,         # Optional: custom SQLAlchemy engine for Radar's own storage
    dashboard_path="/__radar",   # Custom dashboard path (default: "/__radar")
    max_requests=1000,           # Max requests to store (default: 1000)
    retention_hours=24,          # Data retention period (default: 24)
    slow_query_threshold=100,    # Mark queries slower than this as slow (ms)
    capture_sql_bindings=True,   # Capture SQL query parameters
    exclude_paths=["/health"],   # Paths to exclude from monitoring
    theme="auto",                # Dashboard theme: "light", "dark", or "auto"
    db_path="/path/to/db",       # Custom path for radar.duckdb file (default: current directory)
    auth_dependency=None,        # Optional: Authentication dependency for dashboard and API access
)
```

## Securing the Dashboard

By default, FastAPI Radar is accessible without authentication. For production environments, you should add authentication to protect your monitoring dashboard:

### HTTP Basic Authentication

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi_radar import Radar
import secrets

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

radar = Radar(app, auth_dependency=verify_credentials)
radar.create_tables()
```

### Bearer Token Authentication

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi_radar import Radar

app = FastAPI()
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != "your-secret-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    return credentials

radar = Radar(app, auth_dependency=verify_token)
radar.create_tables()
```

### Custom Authentication

You can use any FastAPI dependency for authentication:

```python
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi_radar import Radar

app = FastAPI()

async def custom_auth(request: Request):
    # Your custom authentication logic
    api_key = request.headers.get("X-API-Key")
    if api_key != "your-api-key":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

radar = Radar(app, auth_dependency=custom_auth)
radar.create_tables()
```

The `auth_dependency` parameter accepts any FastAPI dependency function, giving you full flexibility to implement OAuth2, JWT, API keys, or any other authentication mechanism.

### Custom Database Location

By default, FastAPI Radar stores its monitoring data in a `radar.duckdb` file in your current working directory. You can customize this location using the `db_path` parameter:

```python
# Store in a specific directory
radar = Radar(app, db_path="/var/data/monitoring")
# Creates: /var/data/monitoring/radar.duckdb

# Store with a specific filename
radar = Radar(app, db_path="/var/data/my_app_monitoring.duckdb")
# Creates: /var/data/my_app_monitoring.duckdb

# Use a relative path
radar = Radar(app, db_path="./data")
# Creates: ./data/radar.duckdb
```

If the specified path cannot be created, FastAPI Radar will fallback to using the current directory with a warning.

### Custom Storage Engine

For full control over where Radar's monitoring data is stored, pass any SQLAlchemy-compatible engine via the `storage_engine` parameter. This lets you store Radar data in PostgreSQL, MySQL, SQLite, or any other supported database instead of the default DuckDB file.

```python
from fastapi import FastAPI
from fastapi_radar import Radar
from sqlalchemy import create_engine

app = FastAPI()

# Store Radar data in PostgreSQL
radar_storage = create_engine("postgresql+psycopg2://user:password@localhost/radar_db")
radar = Radar(app, storage_engine=radar_storage)
radar.create_tables()
```

```python
# Store Radar data in MySQL
radar_storage = create_engine("mysql+pymysql://user:password@localhost/radar_db")
radar = Radar(app, storage_engine=radar_storage)
radar.create_tables()
```

```python
# Async engine (e.g. asyncpg) is supported too
from sqlalchemy.ext.asyncio import create_async_engine

radar_storage = create_async_engine("postgresql+asyncpg://user:password@localhost/radar_db")
radar = Radar(app, storage_engine=radar_storage)
radar.create_tables()
```

You can also set the `RADAR_STORAGE_URL` environment variable to any SQLAlchemy URL and Radar will use it automatically without any code changes:

```bash
export RADAR_STORAGE_URL="postgresql+psycopg2://user:password@localhost/radar_db"
```

The `storage_engine` parameter takes precedence over `RADAR_STORAGE_URL`, which in turn takes precedence over `db_path`.

### Development Mode with Auto-Reload

When running your FastAPI application with `fastapi dev` (which uses auto-reload), FastAPI Radar automatically switches to an in-memory database to avoid file locking issues. This means:

- **No file locking errors** - The dashboard will work seamlessly in development
- **Data doesn't persist between reloads** - Each reload starts with a fresh database
- **Production behavior unchanged** - When using `fastapi run` or deploying, the normal file-based database is used

```python
# With fastapi dev (auto-reload enabled):
# Automatically uses in-memory database - no configuration needed!
radar = Radar(app)
radar.create_tables()  # Safe to call - handles multiple processes gracefully
```

This behavior only applies when using the development server with auto-reload (`fastapi dev`). In production or when using `fastapi run`, the standard file-based DuckDB storage is used.

## Capturing Logs

FastAPI Radar can capture Python log records and display them in the dashboard. Call `attach_logger()` after creating the `Radar` instance to register a logging handler.

### Attach to the root logger (captures everything)

```python
import logging
from fastapi import FastAPI
from fastapi_radar import Radar

app = FastAPI()
radar = Radar(app)
radar.create_tables()

# Capture all log records at DEBUG level and above
radar.attach_logger()
```

### Attach to a specific logger

```python
import logging
from fastapi import FastAPI
from fastapi_radar import Radar

app = FastAPI()
radar = Radar(app)
radar.create_tables()

# Only capture records from your application's logger
app_logger = logging.getLogger("myapp")
radar.attach_logger(logger=app_logger, level=logging.WARNING)
```

`attach_logger()` returns the `logging.Handler` instance in case you need to remove it later. The `level` parameter filters which records are stored (default: `logging.DEBUG`).

## What Gets Captured?

- ✅ HTTP requests and responses
- ✅ Response times and performance metrics
- ✅ SQL queries with execution times
- ✅ Query parameters and bindings
- ✅ Slow query detection
- ✅ Exceptions with stack traces
- ✅ Request/response bodies and headers
- ✅ Python log records (via `attach_logger()`)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

For contributors who want to modify the codebase:

1. Clone the repository:

```bash
git clone https://github.com/doganarif/fastapi-radar.git
cd fastapi-radar
```

2. Install development dependencies:

```bash
pip install -e ".[dev]"
```

3. (Optional) If modifying the dashboard UI:

```bash
cd fastapi_radar/dashboard
npm install
npm run dev  # For development with hot reload
# or
npm run build  # To rebuild the production bundle
```

4. Run the example apps:

```bash
# Example with SQL database
python example_app.py

# Example without SQL database (NoSQL/in-memory)
python example_nosql_app.py
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Dashboard powered by [React](https://react.dev/) and [shadcn/ui](https://ui.shadcn.com/)

<!-- arif-signature:start -->

---

Built by [Arif Dogan](https://arif.sh) - production AI and backend engineer.

I help SaaS teams ship production AI features, fast backends, and reliable developer tools.

[Work with me](https://arif.sh/work) | [Book a 30-min intro](https://calendar.superhuman.com/book/11SzDRA4zo8tuYoehO/A3kIl)

<!-- arif-signature:end -->
