"""Tests for utility functions."""

from unittest.mock import Mock

import pytest
from starlette.datastructures import Headers

from fastapi_radar.utils import (
    format_sql,
    get_client_ip,
    redact_sensitive_data,
    serialize_headers,
    truncate_body,
)


@pytest.mark.unit
class TestSerializeHeaders:
    """Test serialize_headers function."""

    def test_serialize_normal_headers(self):
        """Test serializing normal headers."""
        headers = Headers(
            {
                "content-type": "application/json",
                "user-agent": "test-client",
                "accept": "*/*",
            }
        )
        result = serialize_headers(headers)

        assert result["content-type"] == "application/json"
        assert result["user-agent"] == "test-client"
        assert result["accept"] == "*/*"

    def test_redact_sensitive_headers(self):
        """Test that sensitive headers are redacted."""
        headers = Headers(
            {
                "authorization": "Bearer secret-token",
                "cookie": "session=abc123",
                "x-api-key": "my-secret-key",
                "x-auth-token": "auth-token",
                "content-type": "application/json",
            }
        )
        result = serialize_headers(headers)

        assert result["authorization"] == "***REDACTED***"
        assert result["cookie"] == "***REDACTED***"
        assert result["x-api-key"] == "***REDACTED***"
        assert result["x-auth-token"] == "***REDACTED***"
        assert result["content-type"] == "application/json"

    def test_case_insensitive_redaction(self):
        """Test that redaction is case-insensitive."""
        headers = Headers(
            {
                "Authorization": "Bearer token",
                "COOKIE": "session=123",
                "X-API-Key": "key",
            }
        )
        result = serialize_headers(headers)

        assert result["authorization"] == "***REDACTED***"
        assert result["cookie"] == "***REDACTED***"
        assert result["x-api-key"] == "***REDACTED***"


@pytest.mark.unit
class TestGetClientIP:
    """Test get_client_ip function."""

    def test_get_ip_from_x_forwarded_for(self):
        """Test extracting IP from X-Forwarded-For header."""
        request = Mock()
        request.headers = {"x-forwarded-for": "203.0.113.1, 198.51.100.1"}
        request.client = None

        ip = get_client_ip(request)
        assert ip == "203.0.113.1"

    def test_get_ip_from_x_real_ip(self):
        """Test extracting IP from X-Real-IP header."""
        request = Mock()
        request.headers = {"x-real-ip": "198.51.100.1"}
        request.client = None

        ip = get_client_ip(request)
        assert ip == "198.51.100.1"

    def test_get_ip_from_client(self):
        """Test extracting IP from request.client."""
        request = Mock()
        request.headers = {}
        request.client = Mock(host="192.168.1.1")

        ip = get_client_ip(request)
        assert ip == "192.168.1.1"

    def test_get_ip_unknown(self):
        """Test when no IP is available."""
        request = Mock()
        request.headers = {}
        request.client = None

        ip = get_client_ip(request)
        assert ip == "unknown"

    def test_x_forwarded_for_priority(self):
        """Test that X-Forwarded-For takes priority."""
        request = Mock()
        request.headers = {
            "x-forwarded-for": "203.0.113.1",
            "x-real-ip": "198.51.100.1",
        }
        request.client = Mock(host="192.168.1.1")

        ip = get_client_ip(request)
        assert ip == "203.0.113.1"


@pytest.mark.unit
class TestTruncateBody:
    """Test truncate_body function."""

    def test_no_truncation_needed(self):
        """Test that small bodies are not truncated."""
        body = "Hello, World!"
        result = truncate_body(body, 100)
        assert result == "Hello, World!"

    def test_truncate_large_body(self):
        """Test that large bodies are truncated."""
        body = "A" * 1000
        result = truncate_body(body, 100)
        assert len(result) > 100  # Includes truncation message
        assert result.startswith("A" * 100)
        assert "[truncated 900 characters]" in result

    def test_none_body(self):
        """Test handling of None body."""
        result = truncate_body(None, 100)
        assert result is None

    def test_empty_body(self):
        """Test handling of empty body."""
        result = truncate_body("", 100)
        assert result is None or result == ""

    def test_exact_size(self):
        """Test body exactly at max size."""
        body = "A" * 100
        result = truncate_body(body, 100)
        assert result == body


@pytest.mark.unit
class TestFormatSQL:
    """Test format_sql function."""

    def test_format_simple_sql(self):
        """Test formatting simple SQL."""
        sql = "  SELECT * FROM users  "
        result = format_sql(sql)
        assert result == "SELECT * FROM users"

    def test_truncate_long_sql(self):
        """Test truncating very long SQL."""
        sql = "SELECT * FROM users WHERE " + "id = 1 OR " * 1000
        result = format_sql(sql, max_length=100)
        assert len(result) <= 120  # 100 + "... [truncated]"
        assert result.endswith("... [truncated]")

    def test_empty_sql(self):
        """Test handling empty SQL."""
        result = format_sql("")
        assert result == ""

    def test_none_sql(self):
        """Test handling None SQL."""
        result = format_sql(None)
        assert result == ""


@pytest.mark.unit
class TestRedactSensitiveData:
    """Test redact_sensitive_data function."""

    def test_redact_password_fields(self):
        """Test redacting password fields."""
        text = '{"password": "secret123", "username": "john"}'
        result = redact_sensitive_data(text)
        assert "secret123" not in result
        assert '"password": "***REDACTED***"' in result
        assert "john" in result

    def test_redact_various_password_keys(self):
        """Test redacting different password key names."""
        test_cases = [
            '{"password": "secret"}',
            '{"passwd": "secret"}',
            '{"pwd": "secret"}',
        ]
        for text in test_cases:
            result = redact_sensitive_data(text)
            assert "secret" not in result
            assert "***REDACTED***" in result

    def test_redact_token_fields(self):
        """Test redacting token fields."""
        text = '{"token": "abc123", "api_key": "xyz789", "apikey": "key123"}'
        result = redact_sensitive_data(text)
        assert "abc123" not in result
        assert "xyz789" not in result
        assert "key123" not in result
        assert result.count("***REDACTED***") == 3

    def test_redact_credit_card_fields(self):
        """Test redacting credit card fields."""
        text = '{"credit_card": "4111111111111111", "cvv": "123"}'
        result = redact_sensitive_data(text)
        assert "4111111111111111" not in result
        assert "***REDACTED***" in result

    def test_redact_bearer_tokens(self):
        """Test redacting Bearer tokens."""
        text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        result = redact_sensitive_data(text)
        assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in result
        assert "Bearer ***REDACTED***" in result

    def test_case_insensitive_redaction(self):
        """Test that redaction is case-insensitive."""
        text = '{"Password": "secret", "TOKEN": "abc123"}'
        result = redact_sensitive_data(text)
        assert "secret" not in result
        assert "abc123" not in result

    def test_preserve_non_sensitive_data(self):
        """Test that non-sensitive data is preserved."""
        text = '{"username": "john", "email": "john@example.com", "age": 30}'
        result = redact_sensitive_data(text)
        assert "john" in result
        assert "john@example.com" in result
        assert "30" in result

    def test_none_input(self):
        """Test handling None input."""
        result = redact_sensitive_data(None)
        assert result is None

    def test_empty_input(self):
        """Test handling empty input."""
        result = redact_sensitive_data("")
        assert result == ""
