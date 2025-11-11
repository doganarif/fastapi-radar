"""Minimal example showing Bearer token authentication for FastAPI Radar."""

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi_radar import Radar

app = FastAPI(title="FastAPI Radar with Bearer Token")
security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify bearer token for Radar access."""
    if credentials.credentials != "my-secret-token-123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    return credentials


# Initialize Radar with token authentication
radar = Radar(app, auth_dependency=verify_token)
radar.create_tables()


@app.get("/")
async def root():
    return {
        "message": "Use Bearer token to access dashboard",
        "token": "my-secret-token-123",
        "dashboard": "/__radar",
    }


if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("🔑 FastAPI Radar with Bearer Token")
    print("=" * 60)
    print("\nToken: my-secret-token-123")
    print("\nAccess dashboard:")
    print('  curl -H "Authorization: Bearer my-secret-token-123" \\')
    print("       http://localhost:8000/__radar/api/stats")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
