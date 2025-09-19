"""Middleware for capturing HTTP requests and responses."""

import json
import time
import traceback
import uuid
from typing import Optional, Callable
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from .models import CapturedRequest, CapturedException
from .utils import serialize_headers, get_client_ip, truncate_body

request_context: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RadarMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        get_session: Callable,
        exclude_paths: list[str] = None,
        max_body_size: int = 10000,
        capture_response_body: bool = True,
    ):
        super().__init__(app)
        self.get_session = get_session
        self.exclude_paths = exclude_paths or []
        self.max_body_size = max_body_size
        self.capture_response_body = capture_response_body

    async def dispatch(self, request: Request, call_next) -> Response:
        if self._should_skip(request):
            return await call_next(request)

        request_id = str(uuid.uuid4())
        request_context.set(request_id)
        start_time = time.time()

        request_body = await self._get_request_body(request)

        captured_request = CapturedRequest(
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            query_params=dict(request.query_params) if request.query_params else None,
            headers=serialize_headers(request.headers),
            body=(
                truncate_body(request_body, self.max_body_size)
                if request_body
                else None
            ),
            client_ip=get_client_ip(request),
        )

        response = None
        exception_occurred = False

        try:
            response = await call_next(request)

            captured_request.status_code = response.status_code
            captured_request.response_headers = serialize_headers(response.headers)

            if self.capture_response_body and not isinstance(
                response, StreamingResponse
            ):
                response_body = b""
                async for chunk in response.body_iterator:
                    response_body += chunk

                captured_request.response_body = truncate_body(
                    response_body.decode("utf-8", errors="ignore"), self.max_body_size
                )

                response = Response(
                    content=response_body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type,
                )

        except Exception as e:
            exception_occurred = True
            self._capture_exception(request_id, e)
            raise

        finally:
            duration = (time.time() - start_time) * 1000
            captured_request.duration_ms = duration

            with self.get_session() as session:
                session.add(captured_request)
                if exception_occurred:
                    exception_data = self._get_exception_data(request_id)
                    if exception_data:
                        session.add(exception_data)
                session.commit()

            request_context.set(None)

        return response

    def _should_skip(self, request: Request) -> bool:
        path = request.url.path
        for exclude_path in self.exclude_paths:
            if path.startswith(exclude_path):
                return True
        return False

    async def _get_request_body(self, request: Request) -> Optional[str]:
        try:
            body = await request.body()
            if body:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        return json.dumps(json.loads(body), indent=2)
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        pass
                return body.decode("utf-8", errors="ignore")
        except Exception:
            pass
        return None

    def _capture_exception(self, request_id: str, exception: Exception) -> None:
        self._exception_cache = {
            "request_id": request_id,
            "exception_type": type(exception).__name__,
            "exception_value": str(exception),
            "traceback": traceback.format_exc(),
        }

    def _get_exception_data(self, request_id: str) -> Optional[CapturedException]:
        if (
            hasattr(self, "_exception_cache")
            and self._exception_cache.get("request_id") == request_id
        ):
            return CapturedException(**self._exception_cache)
        return None
