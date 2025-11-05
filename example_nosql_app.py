"""Example FastAPI application with Radar integration (No SQL/ORM)."""

from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

from fastapi_radar import Radar

# In-memory data store (simulates NoSQL/MongoDB/Redis)
products_db = {}
users_db = {}
next_product_id = 1
next_user_id = 1

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


# FastAPI app
app = FastAPI(
    title="Example NoSQL App with Radar",
    description="Demonstration of FastAPI Radar without SQLAlchemy/ORM",
    version="1.0.0",
)

# Initialize Radar WITHOUT db_engine - monitors HTTP only
radar = Radar(
    app,
    dashboard_path="/__radar",
    theme="auto",
)
radar.create_tables()

# Routes


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the NoSQL Example API",
        "dashboard": "Visit /__radar to see the debugging dashboard",
        "note": "This example uses in-memory storage (no SQL database)",
    }


@app.get("/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    in_stock_only: bool = False,
):
    """List all products with pagination."""
    products = list(products_db.values())

    if in_stock_only:
        products = [p for p in products if p["in_stock"]]

    return products[skip : skip + limit]


@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int):
    """Get a specific product by ID."""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")

    return products_db[product_id]


@app.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate):
    """Create a new product."""
    global next_product_id

    product_data = {
        "id": next_product_id,
        **product.dict(),
        "created_at": datetime.utcnow(),
    }
    products_db[next_product_id] = product_data
    next_product_id += 1

    return product_data


@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductCreate):
    """Update an existing product."""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")

    products_db[product_id].update(product.dict())
    return products_db[product_id]


@app.delete("/products/{product_id}")
async def delete_product(product_id: int):
    """Delete a product."""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")

    del products_db[product_id]
    return {"message": "Product deleted successfully"}


@app.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """List all users with pagination."""
    users = list(users_db.values())
    return users[skip : skip + limit]


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get a specific user by ID."""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    return users_db[user_id]


@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    """Create a new user."""
    global next_user_id

    # Check for existing user
    for existing_user in users_db.values():
        if (
            existing_user["username"] == user.username
            or existing_user["email"] == user.email
        ):
            raise HTTPException(
                status_code=400, detail="User with this username or email already exists"
            )

    user_data = {
        "id": next_user_id,
        **user.dict(),
        "created_at": datetime.utcnow(),
    }
    users_db[next_user_id] = user_data
    next_user_id += 1

    return user_data


@app.get("/slow-endpoint")
async def slow_endpoint():
    """Example slow endpoint."""
    import time

    time.sleep(0.3)
    return {
        "message": "This endpoint is intentionally slow",
        "duration": "300ms",
    }


@app.get("/error")
async def trigger_error():
    """Example endpoint that raises an exception."""
    raise ValueError("This is an example error for demonstration purposes")


if __name__ == "__main__":
    import uvicorn

    # Add sample data
    products_db.update(
        {
            1: {
                "id": 1,
                "name": "Laptop",
                "description": "High-performance laptop",
                "price": 999.99,
                "in_stock": True,
                "created_at": datetime.utcnow(),
            },
            2: {
                "id": 2,
                "name": "Mouse",
                "description": "Wireless mouse",
                "price": 29.99,
                "in_stock": True,
                "created_at": datetime.utcnow(),
            },
            3: {
                "id": 3,
                "name": "Keyboard",
                "description": "Mechanical keyboard",
                "price": 149.99,
                "in_stock": False,
                "created_at": datetime.utcnow(),
            },
        }
    )
    next_product_id = 4

    users_db.update(
        {
            1: {
                "id": 1,
                "username": "johndoe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "created_at": datetime.utcnow(),
            },
            2: {
                "id": 2,
                "username": "janedoe",
                "email": "jane@example.com",
                "full_name": "Jane Doe",
                "created_at": datetime.utcnow(),
            },
        }
    )
    next_user_id = 3

    print("\n" + "=" * 60)
    print("🚀 FastAPI Radar NoSQL Example App")
    print("=" * 60)
    print("\nEndpoints:")
    print("  API:       http://localhost:8001")
    print("  Docs:      http://localhost:8001/docs")
    print("  Dashboard: http://localhost:8001/__radar")
    print("\nNote: No SQL database - using in-memory storage")
    print("\nTry these actions to see data in Radar:")
    print("  1. Visit http://localhost:8001/products")
    print("  2. Visit http://localhost:8001/slow-endpoint")
    print("  3. Visit http://localhost:8001/error")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8001)
