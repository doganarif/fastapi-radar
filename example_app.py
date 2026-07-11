"""Example FastAPI application with Radar integration."""

from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, create_engine

try:
    from sqlalchemy.orm import declarative_base
except ImportError:
    from sqlalchemy.ext.declarative import declarative_base

import logging

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session, sessionmaker

from fastapi_radar import Radar, track_background_task

# Database setup
engine = create_engine("sqlite:///./example.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models

logger = logging.getLogger(__name__)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500))
    price = Column(Float, nullable=False)
    in_stock = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    in_stock: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# FastAPI app
app = FastAPI(
    title="Example App with Radar",
    description="Demonstration of FastAPI Radar debugging dashboard",
    version="1.0.0",
)

# Optional: Setup authentication for Radar dashboard
# Uncomment the following lines to secure the dashboard with HTTP Basic Auth
# from fastapi.security import HTTPBasic, HTTPBasicCredentials
# import secrets
#
# security = HTTPBasic()
#
# def verify_radar_credentials(credentials: HTTPBasicCredentials = Depends(security)):
#     correct_username = secrets.compare_digest(credentials.username, "admin")
#     correct_password = secrets.compare_digest(credentials.password, "secret")
#     if not (correct_username and correct_password):
#         raise HTTPException(
#             status_code=401,
#             detail="Invalid credentials",
#             headers={"WWW-Authenticate": "Basic"},
#         )
#     return credentials

# Initialize Radar - automatically adds middleware and mounts dashboard
radar = Radar(
    app,
    db_engine=engine,
    dashboard_path="/__radar",
    slow_query_threshold=50,
    theme="auto",
    # auth_dependency=verify_radar_credentials,  # Uncomment to enable authentication
)
radar.attach_logger(logger, level=logging.INFO)  # Capture INFO and above logs
radar.create_tables()

# Dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Routes


@app.get("/")
async def root():
    """Root endpoint."""
    logger.info("Root endpoint called")
    return {
        "message": "Welcome to the Example API",
        "dashboard": "Visit /__radar to see the debugging dashboard",
    }


@app.get("/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    in_stock_only: bool = False,
    db: Session = Depends(get_db),
):
    """List all products with pagination."""
    logger.info("Listing products: skip=%d, limit=%d, in_stock_only=%s", skip, limit, in_stock_only)
    query = db.query(Product)

    if in_stock_only:
        query = query.filter(Product.in_stock is True)

    products = query.offset(skip).limit(limit).all()
    return products


@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID."""
    logger.info("Fetching product id=%d", product_id)
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        logger.warning("Product id=%d not found", product_id)
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@app.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    logger.info("Creating product: name=%s", product.name)
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    logger.info("Created product id=%d", db_product.id)
    return db_product


@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    """Update an existing product."""
    logger.info("Updating product id=%d", product_id)
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        logger.warning("Product id=%d not found for update", product_id)
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    logger.info("Updated product id=%d", product_id)
    return db_product


@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    logger.info("Deleting product id=%d", product_id)
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        logger.warning("Product id=%d not found for deletion", product_id)
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    db.commit()
    logger.info("Deleted product id=%d", product_id)
    return {"message": "Product deleted successfully"}


@app.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all users with pagination."""
    logger.info("Listing users: skip=%d, limit=%d", skip, limit)
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID."""
    logger.info("Fetching user id=%d", user_id)
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        logger.warning("User id=%d not found", user_id)
        raise HTTPException(status_code=404, detail="User not found")

    return user


@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    logger.info("Creating user: username=%s", user.username)
    # Check for existing user
    existing_user = (
        db.query(User).filter((User.username == user.username) | (User.email == user.email)).first()
    )

    if existing_user:
        logger.warning("User creation failed: username=%s or email=%s already exists",
                       user.username, user.email)
        raise HTTPException(
            status_code=400, detail="User with this username or email already exists"
        )

    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info("Created user id=%d", db_user.id)
    return db_user


@app.get("/slow-query")
async def slow_query_example(db: Session = Depends(get_db)):
    """Example endpoint that performs a slow query."""
    logger.info("Slow query endpoint called")
    # This query will be highlighted as slow in Radar
    import time

    # Simulate a slow query
    products = db.query(Product).all()
    time.sleep(0.2)  # Simulate slow processing

    # Multiple queries to show query count
    for product in products[:3]:
        _ = db.query(User).filter(User.id == 1).first()

    return {
        "message": "This endpoint performs slow queries",
        "product_count": len(products),
    }


@app.get("/error")
async def trigger_error():
    """Example endpoint that raises an exception."""
    logger.error("Error endpoint called")
    # This will be captured in the Exceptions tab
    raise ValueError("This is an example error for demonstration purposes")


@track_background_task(radar.get_session)
async def send_email_task(email: str, subject: str):
    """Simulated background task for sending emails."""
    import asyncio

    await asyncio.sleep(2)  # Simulate email sending
    return f"Email sent to {email}"


@track_background_task(radar.get_session)
async def process_report(user_id: int):
    """Simulated background task for processing reports."""
    import asyncio

    await asyncio.sleep(3)  # Simulate report processing
    return f"Report processed for user {user_id}"


@track_background_task(radar.get_session)
async def generate_analytics(days: int = 7):
    """Simulated background task for generating analytics."""
    import asyncio

    await asyncio.sleep(1.5)
    return f"Analytics generated for last {days} days"


@track_background_task(radar.get_session)
def sync_inventory_task():
    """Simulated synchronous background task."""
    import time

    time.sleep(1)
    return "Inventory synchronized"


@track_background_task(radar.get_session)
async def failing_task():
    """Example task that fails."""
    import asyncio

    await asyncio.sleep(0.5)
    raise Exception("Simulated task failure for testing")


@app.post("/send-email")
async def send_email(email: str, subject: str, background_tasks: BackgroundTasks):
    """Example endpoint that triggers a background task."""
    logger.info("Scheduling send_email_task for email=%s", email)
    background_tasks.add_task(send_email_task, email, subject)
    return {"message": "Email will be sent in the background"}


@app.post("/process-report/{user_id}")
async def process_user_report(user_id: int, background_tasks: BackgroundTasks):
    """Example endpoint that triggers a long-running background task."""
    logger.info("Scheduling process_report for user_id=%d", user_id)
    background_tasks.add_task(process_report, user_id)
    return {"message": "Report processing started"}


@app.post("/generate-analytics")
async def generate_analytics_endpoint(
    background_tasks: BackgroundTasks, days: int = Query(7, ge=1, le=365)
):
    """Generate analytics for the specified number of days."""
    logger.info("Scheduling generate_analytics for days=%d", days)
    background_tasks.add_task(generate_analytics, days)
    return {"message": f"Analytics generation started for last {days} days"}


@app.post("/sync-inventory")
async def sync_inventory(background_tasks: BackgroundTasks):
    """Synchronize inventory (sync task example)."""
    logger.info("Scheduling sync_inventory_task")
    background_tasks.add_task(sync_inventory_task)
    return {"message": "Inventory sync started"}


@app.post("/test-failure")
async def test_task_failure(background_tasks: BackgroundTasks):
    """Test a failing background task."""
    logger.info("Scheduling failing_task")
    background_tasks.add_task(failing_task)
    return {"message": "Failing task started (check background tasks page)"}


@app.get("/health")
async def health_check():
    """Health check endpoint (excluded from Radar by default)."""
    logger.debug("Health check called")
    return {"status": "healthy"}


if __name__ == "__main__":
    from pathlib import Path

    import uvicorn

    # Check if dashboard is built
    dashboard_dist = Path(__file__).parent / "fastapi_radar" / "dashboard" / "dist"
    if not dashboard_dist.exists():
        print("\n" + "=" * 60)
        print("⚠️  Dashboard not built yet!")
        print("=" * 60)
        print("\nPlease build the dashboard first:")
        print("  cd fastapi_radar/dashboard")
        print("  npm install")
        print("  npm run build")
        print("=" * 60 + "\n")

    # Add some sample data
    with SessionLocal() as db:
        if db.query(Product).count() == 0:
            sample_products = [
                Product(
                    name="Laptop",
                    description="High-performance laptop",
                    price=999.99,
                    in_stock=True,
                ),
                Product(
                    name="Mouse",
                    description="Wireless mouse",
                    price=29.99,
                    in_stock=True,
                ),
                Product(
                    name="Keyboard",
                    description="Mechanical keyboard",
                    price=149.99,
                    in_stock=False,
                ),
                Product(
                    name="Monitor",
                    description="4K display",
                    price=499.99,
                    in_stock=True,
                ),
                Product(
                    name="Headphones",
                    description="Noise-cancelling",
                    price=199.99,
                    in_stock=True,
                ),
            ]
            db.bulk_save_objects(sample_products)

            sample_users = [
                User(username="johndoe", email="john@example.com", full_name="John Doe"),
                User(username="janedoe", email="jane@example.com", full_name="Jane Doe"),
                User(username="admin", email="admin@example.com", full_name="Admin User"),
            ]
            db.bulk_save_objects(sample_users)
            db.commit()
            print("Sample data added to database")

    print("\n" + "=" * 60)
    print("🚀 FastAPI Radar Example App")
    print("=" * 60)
    print("\nEndpoints:")
    print("  API:       http://localhost:8000")
    print("  Docs:      http://localhost:8000/docs")
    print("  Dashboard: http://localhost:8000/__radar")
    print("\nTry these actions to see data in Radar:")
    print("  1. Visit http://localhost:8000/products")
    print("  2. Visit http://localhost:8000/slow-query")
    print("  3. Visit http://localhost:8000/error")
    print("\n  Background Tasks (POST requests):")
    print("  4. curl -X POST http://localhost:8000/send-email?email=test@example.com&subject=Hello")
    print("  5. curl -X POST http://localhost:8000/process-report/1")
    print("  6. curl -X POST http://localhost:8000/generate-analytics?days=30")
    print("  7. curl -X POST http://localhost:8000/sync-inventory")
    print("  8. curl -X POST http://localhost:8000/test-failure")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
