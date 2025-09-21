# FastAPI Radar

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A debugging dashboard for FastAPI applications providing real-time request, database query, and exception monitoring.**

**Just one line to add powerful monitoring to your FastAPI app!**

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
    dashboard_path="/__radar",   # Custom dashboard path (default: "/__radar")
    max_requests=1000,           # Max requests to store (default: 1000)
    retention_hours=24,          # Data retention period (default: 24)
    slow_query_threshold=100,    # Mark queries slower than this as slow (ms)
    capture_sql_bindings=True,   # Capture SQL query parameters
    exclude_paths=["/health"],   # Paths to exclude from monitoring
    theme="auto",                # Dashboard theme: "light", "dark", or "auto"
)
```

## What Gets Captured?

- ✅ HTTP requests and responses
- ✅ Response times and performance metrics
- ✅ SQL queries with execution times
- ✅ Query parameters and bindings
- ✅ Slow query detection
- ✅ Exceptions with stack traces
- ✅ Request/response bodies and headers

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
