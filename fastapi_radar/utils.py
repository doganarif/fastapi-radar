"""Utility functions for FastAPI Radar."""

from typing import Dict, Optional

from starlette.datastructures import Headers
from starlette.requests import Request


def serialize_headers(headers: Headers) -> Dict[str, str]:
    """Serialize headers to a dictionary, excluding sensitive data."""
    sensitive_headers = {"authorization", "cookie", "x-api-key", "x-auth-token"}
    result = {}

    for key, value in headers.items():
        if key.lower() in sensitive_headers:
            result[key] = "***REDACTED***"
        else:
            result[key] = value

    return result


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    if request.client:
        return request.client.host

    return "unknown"


def truncate_body(body: Optional[str], max_size: int) -> Optional[str]:
    """Truncate body content if it exceeds max size."""
    if not body:
        return None

    if len(body) <= max_size:
        return body

    return body[:max_size] + f"... [truncated {len(body) - max_size} characters]"


def format_sql(sql: str, max_length: int = 5000) -> str:
    """Format SQL query for display."""
    if not sql:
        return ""

    sql = sql.strip()

    if len(sql) > max_length:
        sql = sql[:max_length] + "... [truncated]"

    return sql
