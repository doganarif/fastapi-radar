# FastAPI Radar

**The debugging dashboard that makes FastAPI development as smooth as Laravel**

FastAPI Radar is a development tool that automatically captures and visualizes HTTP requests, database queries, and exceptions in your FastAPI applications. Think Laravel Telescope, but built specifically for FastAPI with a beautiful, modern React dashboard.

## What is FastAPI Radar?

FastAPI Radar is a debugging dashboard that gives you complete visibility into your FastAPI application during development. It captures every HTTP request, database query, and exception that occurs in your app and presents them in a clean, elegant React interface built with shadcn/ui and Tailwind CSS.

### Key Features

- **🚀 Zero Configuration** - Works with any FastAPI + SQLAlchemy app
- **📊 Request Monitoring** - Complete HTTP request/response capture with timing
- **🗃️ Database Monitoring** - SQL query logging with execution times and parameters
- **🐛 Exception Tracking** - Automatic exception capture with stack traces
- **⚡ Real-time Updates** - Live dashboard updates as requests happen
- **🎯 Smart Filtering** - Search and filter across all captured data
- **🎨 Beautiful UI** - Modern React dashboard with shadcn/ui components

## Why Use FastAPI Radar?

### Development Pain Points It Solves

- **Blind Debugging** - No more guessing what SQL queries are running
- **Performance Issues** - Instantly spot slow queries and requests
- **Exception Hunting** - See exactly which request caused an error
- **Request Inspection** - Debug API requests without external tools
- **Database Optimization** - Identify N+1 queries and inefficient database calls

### Before Radar vs After Radar

**Before:**

```python
# Debugging the old way
print(f"User query: {user}")  # Print debugging
logging.info(f"Request took: {time}")  # Manual timing
try:
    result = db.query(User).all()
except Exception as e:
    print(f"Error: {e}")  # Basic error handling
```

**After:**

```python
# Just write your code - Radar captures everything
@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()  # Automatically logged in Radar
    return {"users": users}

# Visit /__radar to see:
# - Beautiful HTTP request details
# - SQL query with syntax highlighting and timing
# - Any exceptions with full context and stack traces
```

## How It Works

FastAPI Radar integrates seamlessly with your existing FastAPI application:

1. **Middleware Integration** - Captures all HTTP requests and responses
2. **SQLAlchemy Hooks** - Monitors database queries through SQLAlchemy events
3. **Exception Handling** - Automatically catches and correlates exceptions
4. **React Dashboard** - Serves a pre-built React SPA with real-time updates
5. **Smart Storage** - Stores data efficiently with automatic cleanup

### Architecture Overview

```
Your FastAPI App
       ↓
Radar Middleware (captures HTTP)
       ↓
SQLAlchemy Events (captures SQL)
       ↓
Radar Storage (SQLite/PostgreSQL)
       ↓
React Dashboard (/__radar) - Pre-built shadcn/ui + Tailwind
```

## Dashboard Design

FastAPI Radar includes a **pre-built React dashboard** - no frontend setup required! The dashboard features:

### Modern Design System

- **shadcn/ui Components** - Beautiful, accessible UI components
- **Tailwind CSS** - Clean, consistent styling
- **Dark/Light Mode** - Automatic theme switching
- **Responsive Design** - Works on desktop and mobile

### Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│ FastAPI Radar                    🌙 Settings    │
├─────────────────────────────────────────────────────┤
│ 📡 Requests  🗄️ Queries  ⚡ Exceptions  📊 Stats │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Real-time Request Feed                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ GET /users                          200  45ms│   │
│  │ POST /users                         201 120ms│   │
│  │ GET /users/123                      404  12ms│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  📊 Quick Stats                                     │
│  Avg Response: 58ms  Queries: 12  Errors: 1        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Key Dashboard Features

- **Clean Typography** - Easy to read request/query details
- **Syntax Highlighting** - SQL queries with proper formatting
- **Real-time Indicators** - Live request feed with smooth animations
- **Smart Filtering** - Instant search across all data
- **Performance Metrics** - Beautiful charts and timing indicators
- **Zero Build Required** - Dashboard is pre-compiled and served by FastAPI

## Who Should Use FastAPI Radar?

### Perfect For

- **FastAPI Developers** building APIs and web applications
- **Backend Engineers** debugging database performance issues
- **Full-stack Developers** who need request/response inspection
- **Teams** wanting better visibility during development
- **Anyone** tired of print-statement debugging

### Use Cases

- **API Development** - Debug request/response cycles
- **Database Optimization** - Find slow queries and N+1 problems
- **Error Investigation** - Trace exceptions back to specific requests
- **Performance Tuning** - Identify bottlenecks in your application
- **Learning** - Understand how your FastAPI app works under the hood

## Quick Start

### Installation

```bash
pip install fastapi-radar
```

### Basic Setup

```python
from fastapi import FastAPI
from fastapi_radar import Radar
from sqlalchemy import create_engine

app = FastAPI()
engine = create_engine("sqlite:///./app.db")

# Initialize radar (auto-adds middleware and mounts dashboard)
radar = Radar(app, db_engine=engine)
radar.create_tables()

# Your existing routes work unchanged
@app.get("/users")
async def get_users():
    # This request and any database queries will appear in Radar
    return {"users": []}
```

### Access Dashboard

Visit `http://localhost:8000/__radar` to see your beautiful React debugging dashboard.

## What You'll See in the Dashboard

### 📡 Requests Tab

Beautiful request monitoring with shadcn/ui components:

- **Request Cards** - Clean cards showing method, URL, status, timing
- **Request Details** - Expandable panels with headers, body, query params
- **Status Indicators** - Color-coded status codes (green=2xx, red=5xx, etc.)
- **Timing Charts** - Visual response time indicators
- **Real-time Feed** - Smooth animations for new requests

### 🗄️ Queries Tab

Elegant SQL query visualization:

- **Syntax Highlighting** - Beautiful SQL formatting with proper colors
- **Execution Timing** - Performance bars showing query duration
- **Parameter Display** - Clean presentation of query bindings
- **Slow Query Alerts** - Red highlights for queries >100ms
- **Connection Badges** - Database source indicators

### ⚡ Exceptions Tab

Clean exception tracking:

- **Stack Trace Display** - Formatted, readable stack traces
- **Error Context** - Request correlation with expandable details
- **Exception Grouping** - Similar errors grouped together
- **Error Timeline** - Visual timeline of when exceptions occur

### 📊 Stats Dashboard

Performance overview:

- **Metrics Cards** - Average response time, query count, error rate
- **Performance Charts** - Request volume and timing trends
- **Database Stats** - Query performance breakdown
- **Health Indicators** - Overall application health metrics

## Setup

### Simple Setup

```python
from fastapi_radar import Radar

# Everything happens automatically
radar = Radar(app, db_engine=your_engine)

# Run migrations (once)
radar.create_tables()
```

### Custom Configuration

```python
# Customize settings during initialization
radar = Radar(
    app,
    db_engine=engine,
    dashboard_path="/debug",           # Custom dashboard path
    max_requests=1000,                 # Max requests to store
    retention_hours=24,                # Auto-cleanup after 24h
    slow_query_threshold=100,          # Highlight queries >100ms
    exclude_paths=["/health"],         # Ignore certain routes
    theme="dark"                       # Default theme (dark/light/auto)
)
```

## Configuration

### Basic Configuration

```python
from fastapi_radar import Radar

radar = Radar(
    app,                                 # FastAPI app (required)
    db_engine=engine,                    # Your SQLAlchemy engine (required)
    dashboard_path="/__radar",           # Dashboard route (default)
    storage_engine=None,                 # Engine for radar data (optional)
    max_requests=1000,                   # Max requests to store
    retention_hours=24,                  # Auto-cleanup after 24h
    slow_query_threshold=100,            # Highlight queries >100ms
    capture_sql_bindings=True,           # Include SQL parameters
    exclude_paths=["/health", "/metrics"], # Ignore certain routes
    theme="auto"                         # Dashboard theme (dark/light/auto)
)
```

### Multiple Databases

```python
from fastapi_radar import Radar

# Main app database
app_engine = create_engine("postgresql://localhost/myapp")

# Radar storage (separate database recommended)
radar_engine = create_engine("sqlite:///./radar.db")

radar = Radar(
    app,
    db_engine=app_engine,        # Monitor this database
    storage_engine=radar_engine, # Store radar data here
    dashboard_path="/debug",     # Custom dashboard path
    theme="dark"                 # Use dark theme
)
```

## Database Setup

### SQLite Example

```python
from sqlalchemy import create_engine
from fastapi_radar import Radar

app = FastAPI()
app_engine = create_engine("sqlite:///./app.db")

# Radar setup (dashboard auto-mounted at /__radar)
radar = Radar(app, db_engine=app_engine)
radar.create_tables()  # Creates radar tables
```

### PostgreSQL Example

```python
from sqlalchemy.ext.asyncio import create_async_engine
from fastapi_radar import Radar

app = FastAPI()

# Your app database
app_engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/myapp")

# Radar storage (separate database recommended)
radar_engine = create_engine("sqlite:///./radar.db")

radar = Radar(
    app,
    db_engine=app_engine,
    storage_engine=radar_engine,
    dashboard_path="/monitoring",  # Custom path
    theme="light"                  # Light theme
)
radar.create_tables()

# Beautiful dashboard available at: http://localhost:8000/monitoring
```

## API Reference

### `Radar(app, db_engine, **kwargs)`

**Parameters:**

- `app` (FastAPI) - Your FastAPI application (required)
- `db_engine` (Engine) - SQLAlchemy engine to monitor (required)
- `storage_engine` (Engine) - Engine for radar data storage (optional, defaults to SQLite)
- `dashboard_path` (str) - Dashboard mount path (default: "/\_\_radar")
- `max_requests` (int) - Maximum requests to store (default: 1000)
- `retention_hours` (int) - Auto-cleanup time (default: 24)
- `slow_query_threshold` (int) - Slow query ms threshold (default: 100)
- `capture_sql_bindings` (bool) - Capture SQL parameters (default: True)
- `exclude_paths` (List[str]) - Paths to ignore (default: [])
- `theme` (str) - Dashboard theme: "dark", "light", or "auto" (default: "auto")

**Methods:**

- `create_tables()` - Create radar storage tables
- `drop_tables()` - Drop radar storage tables
- `cleanup()` - Manual cleanup of old data

## Complete Example

```python
from fastapi import FastAPI, Depends
from fastapi_radar import Radar
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Your app setup
app = FastAPI()
engine = create_engine("sqlite:///./app.db")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Your model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)

# Create your app tables
Base.metadata.create_all(bind=engine)

# Radar setup (auto-adds middleware and mounts beautiful React dashboard)
radar = Radar(app, db_engine=engine, theme="dark")
radar.create_tables()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Your routes (will be monitored automatically)
@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()  # This query appears in radar
    return {"users": [{"id": u.id, "name": u.name} for u in users]}

@app.post("/users")
async def create_user(name: str, db: Session = Depends(get_db)):
    user = User(name=name)
    db.add(user)
    db.commit()  # This query appears in radar
    return {"user": {"id": user.id, "name": user.name}}

# Beautiful React dashboard automatically available at: http://localhost:8000/__radar
```

## Dashboard Technology

### Pre-built React Dashboard

- **No Build Required** - Dashboard is pre-compiled and included in the package
- **shadcn/ui Components** - Modern, accessible React components
- **Tailwind CSS** - Utility-first CSS framework for consistent styling
- **Real-time Updates** - WebSocket connections for live data
- **Responsive Design** - Works perfectly on desktop and mobile

### Frontend Stack

```
React 18 + TypeScript
    ↓
shadcn/ui Components (Radix UI primitives)
    ↓
Tailwind CSS (Utility classes)
    ↓
Vite Build (Pre-compiled bundle)
    ↓
FastAPI Static Files (Served automatically)
```

## Environment Configuration

```python
import os
from fastapi_radar import Radar

app = FastAPI()
engine = create_engine("sqlite:///./app.db")

# Only enable in development
if os.getenv("ENVIRONMENT") == "development":
    radar = Radar(app, db_engine=engine, theme="auto")
    radar.create_tables()
```

## Multiple Radar Instances

```python
# Monitor multiple databases with separate dashboards
user_engine = create_engine("postgresql://localhost/users")
analytics_engine = create_engine("postgresql://localhost/analytics")

# Create separate radar instances with different themes
user_radar = Radar(app, db_engine=user_engine, dashboard_path="/radar-users", theme="light")
analytics_radar = Radar(app, db_engine=analytics_engine, dashboard_path="/radar-analytics", theme="dark")

user_radar.create_tables()
analytics_radar.create_tables()

# Beautiful dashboards available at:
# http://localhost:8000/radar-users (Light theme)
# http://localhost:8000/radar-analytics (Dark theme)
```

## FAQ

**Q: Is FastAPI Radar like Laravel Telescope?**
A: Yes! FastAPI Radar is heavily inspired by Laravel Telescope and brings the same debugging experience to FastAPI with a modern React interface.

**Q: Do I need to build the frontend?**
A: No! The React dashboard is pre-built and included in the package. Just install and use.

**Q: What frontend technologies are used?**
A: React 18, shadcn/ui components, Tailwind CSS, and TypeScript - all pre-compiled for you.

**Q: Can I customize the dashboard appearance?**
A: You can choose between dark, light, and auto themes. Full customization is planned for future versions.

**Q: Do I need to add middleware or mount anything manually?**
A: No. `Radar(app, db_engine=engine)` automatically adds middleware and mounts the beautiful dashboard.

**Q: Can I use this in production?**
A: FastAPI Radar is designed for development. For production monitoring, use APM tools like DataDog or New Relic.

**Q: Does it slow down my application?**
A: Radar adds minimal overhead (<5%) and uses async data capture to avoid blocking requests.

**Q: Do I need to modify my existing database?**
A: No. Radar creates its own tables for storage (separate from your app tables).

**Q: What databases does it support?**
A: Currently PostgreSQL and SQLite. More databases coming soon.

**Q: How do I run migrations?**
A: Call `radar.create_tables()` once to create the necessary tables.

**Q: Can I monitor multiple databases?**
A: Yes! Create multiple Radar instances, each with its own beautiful dashboard.

---

**FastAPI Radar** - Turn your FastAPI debugging from guesswork into precision with a beautiful, modern React dashboard. Experience the Laravel Telescope workflow in your FastAPI applications.

**Ultra-minimal setup: `Radar(app, db_engine=engine)`. Start debugging with style.**
