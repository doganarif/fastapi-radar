# FastAPI Radar

**The debugging dashboard that makes FastAPI development as smooth as Laravel**

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Build the Dashboard (Required)

```bash
cd fastapi_radar/dashboard
npm install
npm run build
cd ../..
```

### 3. Run the Example App

```bash
python example_app.py
```

### 4. Access the Dashboard

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- **Dashboard: http://localhost:8000/\_\_radar**

## Features

- 🚀 **Zero Configuration** - Works with any FastAPI + SQLAlchemy app
- 📊 **Request Monitoring** - Complete HTTP request/response capture with timing
- 🗃️ **Database Monitoring** - SQL query logging with execution times
- 🐛 **Exception Tracking** - Automatic exception capture with stack traces
- ⚡ **Real-time Updates** - Live dashboard updates as requests happen
- 🎨 **Beautiful UI** - Modern React dashboard with shadcn/ui components

## Usage

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

## Development

See [PROJECT.md](PROJECT.md) for the full project specification and architecture.
