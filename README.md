# FastAPI Radar 🛰️

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0%2B-green.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A debugging dashboard for FastAPI applications providing real-time request, database query, and exception monitoring.**

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

Access your dashboard at: **http://localhost:8000/\_\_radar**

## Features

- 🚀 **Zero Configuration** - Works with any FastAPI + SQLAlchemy app
- 📊 **Request Monitoring** - Complete HTTP request/response capture with timing
- 🗃️ **Database Monitoring** - SQL query logging with execution times
- 🐛 **Exception Tracking** - Automatic exception capture with stack traces
- ⚡ **Real-time Updates** - Live dashboard updates as requests happen
- 🎨 **Beautiful UI** - Modern React dashboard with shadcn/ui components

## Screenshots

<!-- Add screenshots here -->

## Configuration

```python
radar = Radar(
    app,
    db_engine=engine,
    dashboard_path="/__radar",  # Custom dashboard path
    enable_in_production=False,  # Disable in production
    capture_body=True,           # Capture request/response bodies
    capture_headers=True,        # Capture headers
    max_body_size=10000,        # Max body size to capture
)
```

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

4. Run the example app:

```bash
python example_app.py
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Dashboard powered by [React](https://react.dev/) and [shadcn/ui](https://ui.shadcn.com/)
