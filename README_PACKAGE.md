# FastAPI Radar

A powerful debugging dashboard for FastAPI applications, inspired by Laravel Telescope. FastAPI Radar automatically captures HTTP requests, database queries, and exceptions, presenting them in a beautiful React dashboard.

## Features

- 🚀 **Zero Configuration** - Works with any FastAPI + SQLAlchemy app
- 📊 **Request Monitoring** - Complete HTTP request/response capture with timing
- 🗃️ **Database Monitoring** - SQL query logging with execution times and parameters
- 🐛 **Exception Tracking** - Automatic exception capture with stack traces
- ⚡ **Real-time Updates** - Live dashboard updates as requests happen
- 🎯 **Smart Filtering** - Search and filter across all captured data
- 🎨 **Beautiful UI** - Modern React dashboard with shadcn/ui and Tailwind CSS

## Installation

```bash
pip install fastapi-radar
```

Or install from source:

```bash
git clone https://github.com/yourusername/fastapi-radar.git
cd fastapi-radar
pip install -e .
```

## Quick Start

```python
from fastapi import FastAPI
from fastapi_radar import Radar
from sqlalchemy import create_engine

app = FastAPI()
engine = create_engine("sqlite:///./app.db")

# Initialize Radar - automatically adds middleware and mounts dashboard
radar = Radar(app, db_engine=engine)
radar.create_tables()

# Your routes work unchanged
@app.get("/users")
async def get_users():
    return {"users": []}
```

Visit `http://localhost:8000/__radar` to see your debugging dashboard.

## Configuration

```python
radar = Radar(
    app,
    db_engine=engine,
    dashboard_path="/__radar",     # Dashboard URL path
    max_requests=1000,              # Max requests to store
    retention_hours=24,             # Auto-cleanup after 24h
    slow_query_threshold=100,       # Highlight queries >100ms
    capture_sql_bindings=True,      # Include SQL parameters
    exclude_paths=["/health"],      # Ignore certain routes
    theme="auto"                    # Dashboard theme (dark/light/auto)
)
```

## Dashboard Features

### 📡 Requests Tab

- View all HTTP requests with method, path, status code, and duration
- Expandable details showing headers, body, and response
- Filter by status code, method, or search by path
- Real-time updates as new requests come in

### 🗄️ Queries Tab

- Monitor all SQL queries with syntax highlighting
- Execution time and affected rows
- Query parameters (when enabled)
- Slow query detection and highlighting

### ⚡ Exceptions Tab

- Captured exceptions with full stack traces
- Grouped by exception type
- Associated with the request that caused them
- Expandable traceback details

### 📊 Statistics

- Request count and average response time
- Query count and average execution time
- Slow query detection
- Requests per minute metric

## Development Dashboard

The dashboard is built with:

- React 18 with TypeScript
- shadcn/ui components (Radix UI)
- Tailwind CSS for styling
- Real-time updates via polling

To build the dashboard from source:

```bash
cd fastapi_radar/dashboard
npm install
npm run build
```

## Example Application

Run the included example to see FastAPI Radar in action:

```bash
python example_app.py
```

Then visit:

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- **Dashboard: http://localhost:8000/\_\_radar**

## API Endpoints

FastAPI Radar exposes these endpoints for the dashboard:

- `GET /api/radar/requests` - List captured requests
- `GET /api/radar/requests/{id}` - Request details
- `GET /api/radar/queries` - List SQL queries
- `GET /api/radar/exceptions` - List exceptions
- `GET /api/radar/stats` - Dashboard statistics
- `DELETE /api/radar/clear` - Clear captured data

## Requirements

- Python 3.8+
- FastAPI 0.68.0+
- SQLAlchemy 1.4.0+
- Pydantic 1.8.0+

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Inspired by [Laravel Telescope](https://laravel.com/docs/telescope)
- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [shadcn/ui](https://ui.shadcn.com/)

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourusername/fastapi-radar/issues) page.
