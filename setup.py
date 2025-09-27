"""Setup configuration for FastAPI Radar."""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

setup(
    name="fastapi-radar",
    version="0.1.7",
    author="Arif Dogan",
    author_email="me@arif.sh",
    description=(
        "A debugging dashboard for FastAPI applications with real-time "
        "request, database query, and exception monitoring"
    ),
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/doganarif/fastapi-radar",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Framework :: FastAPI",
    ],
    python_requires=">=3.8",
    install_requires=[
        "fastapi>=0.68.0",
        "sqlalchemy>=1.4.0",
        "pydantic>=1.8.0",
        "starlette>=0.14.2",
        "duckdb-engine>=0.9.0",
        "duckdb>=1.3.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "uvicorn[standard]>=0.15.0",
            "black>=22.0.0",
            "isort>=5.10.0",
            "flake8>=4.0.0",
            "mypy>=0.950",
        ],
    },
    package_data={
        "fastapi_radar": [
            "dashboard/dist/**/*",
            "dashboard/dist/*",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
