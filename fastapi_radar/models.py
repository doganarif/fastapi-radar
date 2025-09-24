"""Storage models for FastAPI Radar."""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class CapturedRequest(Base):
    __tablename__ = "radar_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(36), unique=True, index=True, nullable=False)
    method = Column(String(10), nullable=False)
    url = Column(String(500), nullable=False)
    path = Column(String(500), nullable=False)
    query_params = Column(JSON)
    headers = Column(JSON)
    body = Column(Text)
    status_code = Column(Integer)
    response_body = Column(Text)
    response_headers = Column(JSON)
    duration_ms = Column(Float)
    client_ip = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    queries = relationship(
        "CapturedQuery", back_populates="request", cascade="all, delete-orphan"
    )
    exceptions = relationship(
        "CapturedException", back_populates="request", cascade="all, delete-orphan"
    )


class CapturedQuery(Base):
    __tablename__ = "radar_queries"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(
        String(36), ForeignKey("radar_requests.request_id", ondelete="CASCADE")
    )
    sql = Column(Text, nullable=False)
    parameters = Column(JSON)
    duration_ms = Column(Float)
    rows_affected = Column(Integer)
    connection_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    request = relationship("CapturedRequest", back_populates="queries")


class CapturedException(Base):
    __tablename__ = "radar_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(
        String(36), ForeignKey("radar_requests.request_id", ondelete="CASCADE")
    )
    exception_type = Column(String(100), nullable=False)
    exception_value = Column(Text)
    traceback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    request = relationship("CapturedRequest", back_populates="exceptions")
