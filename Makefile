.PHONY: install test coverage lint format type-check security clean help

help:
	@echo "FastAPI Radar - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install       Install dependencies"
	@echo "  make install-dev   Install with dev dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make format        Format code with black and isort"
	@echo "  make lint          Run flake8"
	@echo "  make type-check    Run mypy"
	@echo "  make security      Run security checks"
	@echo "  make check         Run all checks (format, lint, type, security)"
	@echo ""
	@echo "Testing:"
	@echo "  make test          Run tests"
	@echo "  make test-fast     Run tests in parallel"
	@echo "  make coverage      Run tests with coverage report"
	@echo "  make test-unit     Run unit tests only"
	@echo "  make test-integration  Run integration tests only"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         Remove cache and build files"
	@echo "  make pre-commit    Install pre-commit hooks"

install:
	pip install -e .

install-dev:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

test-fast:
	pytest tests/ -v -n auto

coverage:
	pytest tests/ --cov=fastapi_radar --cov-report=html --cov-report=term-missing --cov-fail-under=90

test-unit:
	pytest tests/ -v -m unit

test-integration:
	pytest tests/ -v -m integration

format:
	black fastapi_radar/ tests/
	isort fastapi_radar/ tests/

lint:
	flake8 fastapi_radar/ tests/ --max-line-length=100 --extend-ignore=E203,W503

type-check:
	mypy fastapi_radar/

security:
	bandit -r fastapi_radar/ -c pyproject.toml
	safety check || true

check: format lint type-check security
	@echo "All checks passed!"

pre-commit:
	pre-commit install

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf coverage.xml
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
