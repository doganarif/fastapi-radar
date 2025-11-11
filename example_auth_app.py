"""Minimal example showing how to secure FastAPI Radar with authentication."""

import secrets
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import create_engine

from fastapi_radar import Radar

# Create FastAPI app
app = FastAPI(title="FastAPI Radar with Authentication")

# Setup HTTP Basic Authentication
security = HTTPBasic()


def verify_radar_access(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify credentials for Radar dashboard access."""
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "secret")

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials


# Setup database (optional)
engine = create_engine("sqlite:///./app.db")

# Initialize Radar with authentication
radar = Radar(
    app,
    db_engine=engine,
    auth_dependency=verify_radar_access,  # Secure the dashboard
)
radar.create_tables()


# Your regular API endpoints (not protected by Radar auth)
@app.get("/")
async def root():
    return {
        "message": "Public API endpoint",
        "dashboard": "Visit /__radar (requires auth: admin/secret)",
    }


@app.get("/public")
async def public_endpoint():
    return {"message": "This endpoint is public"}


if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("🔒 FastAPI Radar with Authentication")
    print("=" * 60)
    print("\nCredentials:")
    print("  Username: admin")
    print("  Password: secret")
    print("\nEndpoints:")
    print("  API (public):  http://localhost:8000")
    print("  Dashboard:     http://localhost:8000/__radar (protected)")
    print("\nTry accessing the dashboard:")
    print("  Browser: http://localhost:8000/__radar")
    print("  CLI:     curl -u admin:secret http://localhost:8000/__radar/api/stats")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
