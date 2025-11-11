"""Minimal example showing custom authentication for FastAPI Radar."""

from fastapi import FastAPI, HTTPException, Request

from fastapi_radar import Radar

app = FastAPI(title="FastAPI Radar with Custom Auth")


async def verify_api_key(request: Request):
    """Custom authentication using API key from header."""
    api_key = request.headers.get("X-API-Key")

    if api_key != "radar-secret-key":
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    return True


# Initialize Radar with custom authentication
radar = Radar(app, auth_dependency=verify_api_key)
radar.create_tables()


@app.get("/")
async def root():
    return {
        "message": "Use X-API-Key header to access dashboard",
        "header": "X-API-Key: radar-secret-key",
    }


if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("🔐 FastAPI Radar with Custom API Key")
    print("=" * 60)
    print("\nAPI Key: radar-secret-key")
    print("\nAccess dashboard:")
    print('  curl -H "X-API-Key: radar-secret-key" \\')
    print("       http://localhost:8000/__radar/api/stats")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
