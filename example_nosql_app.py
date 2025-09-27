"""Example FastAPI application with Radar integration - No SQL Database.

This example demonstrates using FastAPI Radar without a SQL database.
Perfect for applications using NoSQL databases, external APIs, or no database at all.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Body
from pydantic import BaseModel
import json
from pathlib import Path

from fastapi_radar import Radar

# In-memory storage (simulating a NoSQL database or cache)
# In a real application, this could be Redis, MongoDB, DynamoDB, etc.
STORAGE: Dict[str, Any] = {"products": {}, "users": {}, "orders": {}}

# Counter for generating IDs
ID_COUNTER = {"products": 0, "users": 0, "orders": 0}

# Pydantic models


class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True
    created_at: Optional[datetime] = None


class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None


class Order(BaseModel):
    id: Optional[int] = None
    user_id: int
    product_ids: List[int]
    total_amount: float
    status: str = "pending"
    created_at: Optional[datetime] = None


# FastAPI app
app = FastAPI(
    title="NoSQL Example App with Radar",
    description="Demonstration of FastAPI Radar without SQL database",
    version="1.0.0",
)

# Initialize Radar WITHOUT db_engine - it will still capture:
# - HTTP requests and responses
# - Response times and status codes
# - Exceptions and errors
# - Request/response bodies
# Just no SQL queries since we're not using a SQL database
radar = Radar(
    app,
    # Note: No db_engine parameter!
    dashboard_path="/__radar",
    max_requests=1000,
    retention_hours=24,
    theme="auto",
    exclude_paths=["/health", "/metrics"],  # Exclude monitoring endpoints
)
radar.create_tables()  # Creates tables for Radar's own storage

# Utility functions for in-memory storage


def generate_id(collection: str) -> int:
    """Generate a new ID for a collection."""
    ID_COUNTER[collection] += 1
    return ID_COUNTER[collection]


def save_to_storage(collection: str, item: dict) -> dict:
    """Save an item to storage."""
    item_id = item.get("id") or generate_id(collection)
    item["id"] = item_id
    item["created_at"] = datetime.utcnow()
    STORAGE[collection][item_id] = item
    return item


def get_from_storage(collection: str, item_id: int) -> Optional[dict]:
    """Get an item from storage."""
    return STORAGE[collection].get(item_id)


def list_from_storage(collection: str, skip: int = 0, limit: int = 10) -> List[dict]:
    """List items from storage with pagination."""
    items = list(STORAGE[collection].values())
    return items[skip : skip + limit]


def delete_from_storage(collection: str, item_id: int) -> bool:
    """Delete an item from storage."""
    if item_id in STORAGE[collection]:
        del STORAGE[collection][item_id]
        return True
    return False


# Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the NoSQL Example API",
        "description": "This API demonstrates Radar without SQL database monitoring",
        "dashboard": "Visit /__radar to see the debugging dashboard",
        "note": "SQL queries tab will be empty as we're not using a SQL database",
    }


@app.get("/products", response_model=List[Product])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all products with pagination."""
    products = list_from_storage("products", skip, limit)
    return products


@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    """Get a specific product by ID."""
    product = get_from_storage("products", product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/products", response_model=Product, status_code=201)
async def create_product(product: Product):
    """Create a new product."""
    product_dict = product.dict(exclude={"id", "created_at"})
    saved_product = save_to_storage("products", product_dict)
    return saved_product


@app.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: int, product: Product):
    """Update an existing product."""
    existing_product = get_from_storage("products", product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_dict = product.dict(exclude={"id", "created_at"})
    product_dict["id"] = product_id
    product_dict["created_at"] = existing_product["created_at"]
    STORAGE["products"][product_id] = product_dict
    return product_dict


@app.delete("/products/{product_id}")
async def delete_product(product_id: int):
    """Delete a product."""
    if not delete_from_storage("products", product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


@app.get("/users", response_model=List[User])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all users with pagination."""
    users = list_from_storage("users", skip, limit)
    return users


@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    """Get a specific user by ID."""
    user = get_from_storage("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users", response_model=User, status_code=201)
async def create_user(user: User):
    """Create a new user."""
    # Check for duplicate username/email
    for existing_user in STORAGE["users"].values():
        if existing_user["username"] == user.username:
            raise HTTPException(status_code=400, detail="Username already exists")
        if existing_user["email"] == user.email:
            raise HTTPException(status_code=400, detail="Email already exists")

    user_dict = user.dict(exclude={"id", "created_at"})
    saved_user = save_to_storage("users", user_dict)
    return saved_user


@app.post("/orders", response_model=Order, status_code=201)
async def create_order(order: Order):
    """Create a new order."""
    # Validate user exists
    if not get_from_storage("users", order.user_id):
        raise HTTPException(status_code=404, detail="User not found")

    # Validate products exist and calculate total
    total = 0
    for product_id in order.product_ids:
        product = get_from_storage("products", product_id)
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product {product_id} not found"
            )
        total += product["price"]

    order_dict = order.dict(exclude={"id", "created_at"})
    order_dict["total_amount"] = total
    saved_order = save_to_storage("orders", order_dict)
    return saved_order


@app.get("/orders", response_model=List[Order])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all orders with pagination."""
    orders = list_from_storage("orders", skip, limit)
    return orders


@app.get("/simulate-slow-endpoint")
async def simulate_slow_endpoint():
    """Simulate a slow endpoint (without SQL queries)."""
    import time
    import random

    # Simulate some processing time
    processing_time = random.uniform(0.1, 0.5)
    time.sleep(processing_time)

    # Simulate fetching data from multiple sources
    products = list_from_storage("products", 0, 100)
    users = list_from_storage("users", 0, 100)

    return {
        "message": "This endpoint simulates slow processing",
        "processing_time_ms": round(processing_time * 1000, 2),
        "products_count": len(products),
        "users_count": len(users),
        "note": "No SQL queries were harmed in the making of this response",
    }


@app.get("/trigger-error")
async def trigger_error():
    """Example endpoint that raises an exception."""
    # This will be captured in Radar's Exceptions tab
    raise ValueError("This is an example error for demonstration purposes")


@app.get("/external-api-simulation")
async def external_api_call():
    """Simulate calling an external API."""
    import time
    import random

    # Simulate API latency
    latency = random.uniform(0.05, 0.3)
    time.sleep(latency)

    # Simulate random success/failure
    if random.random() < 0.1:  # 10% chance of failure
        raise HTTPException(
            status_code=503, detail="External API temporarily unavailable"
        )

    return {
        "source": "external_api",
        "latency_ms": round(latency * 1000, 2),
        "data": {
            "timestamp": datetime.utcnow().isoformat(),
            "value": random.randint(1, 100),
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint (excluded from Radar by configuration)."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/metrics")
async def metrics():
    """Metrics endpoint (excluded from Radar by configuration)."""
    return {
        "products_count": len(STORAGE["products"]),
        "users_count": len(STORAGE["users"]),
        "orders_count": len(STORAGE["orders"]),
    }


# Initialize with sample data
def init_sample_data():
    """Initialize storage with sample data."""
    if not STORAGE["products"]:
        sample_products = [
            {
                "name": "Laptop",
                "description": "High-performance laptop",
                "price": 999.99,
                "in_stock": True,
            },
            {
                "name": "Mouse",
                "description": "Wireless mouse",
                "price": 29.99,
                "in_stock": True,
            },
            {
                "name": "Keyboard",
                "description": "Mechanical keyboard",
                "price": 149.99,
                "in_stock": False,
            },
            {
                "name": "Monitor",
                "description": "4K display",
                "price": 499.99,
                "in_stock": True,
            },
            {
                "name": "Headphones",
                "description": "Noise-cancelling",
                "price": 199.99,
                "in_stock": True,
            },
        ]
        for product in sample_products:
            save_to_storage("products", product)

    if not STORAGE["users"]:
        sample_users = [
            {
                "username": "johndoe",
                "email": "john@example.com",
                "full_name": "John Doe",
            },
            {
                "username": "janedoe",
                "email": "jane@example.com",
                "full_name": "Jane Doe",
            },
            {
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Admin User",
            },
        ]
        for user in sample_users:
            save_to_storage("users", user)


if __name__ == "__main__":
    import uvicorn

    # Initialize sample data
    init_sample_data()

    print("\n" + "=" * 60)
    print("🚀 FastAPI Radar NoSQL Example App")
    print("=" * 60)
    print("\n✨ This example demonstrates Radar WITHOUT SQL database monitoring")
    print("\nEndpoints:")
    print("  API:       http://localhost:8001")
    print("  Docs:      http://localhost:8001/docs")
    print("  Dashboard: http://localhost:8001/__radar")
    print("\n📊 What Radar will capture:")
    print("  ✅ HTTP requests and responses")
    print("  ✅ Response times and performance metrics")
    print("  ✅ Status codes and error rates")
    print("  ✅ Exceptions and stack traces")
    print("  ✅ Request/response bodies")
    print("  ❌ SQL queries (not using SQL database)")
    print("\n🔬 Try these actions to see data in Radar:")
    print("  1. Visit http://localhost:8001/products")
    print("  2. Create some products/users via the API")
    print("  3. Visit http://localhost:8001/simulate-slow-endpoint")
    print("  4. Visit http://localhost:8001/trigger-error")
    print("  5. Visit http://localhost:8001/external-api-simulation (multiple times)")
    print("=" * 60 + "\n")

    # Run on port 8001 to avoid conflict with example_app.py
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
