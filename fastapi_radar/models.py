"""Storage models for FastAPI Radar."""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON, Boolean
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


class Trace(Base):
    """链路跟踪的Trace模型"""
    __tablename__ = "radar_traces"

    trace_id = Column(String(32), primary_key=True, index=True)
    service_name = Column(String(100), index=True)
    operation_name = Column(String(200))
    start_time = Column(DateTime, default=datetime.utcnow, index=True)
    end_time = Column(DateTime)
    duration_ms = Column(Float)
    span_count = Column(Integer, default=0)
    status = Column(String(20), default='ok')  # ok, error, timeout
    tags = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    spans = relationship("Span", back_populates="trace", cascade="all, delete-orphan")


class Span(Base):
    """链路跟踪的Span模型"""
    __tablename__ = "radar_spans"

    span_id = Column(String(16), primary_key=True, index=True)
    trace_id = Column(String(32), ForeignKey("radar_traces.trace_id", ondelete="CASCADE"), index=True)
    parent_span_id = Column(String(16), index=True, nullable=True)
    operation_name = Column(String(200), nullable=False)
    service_name = Column(String(100), index=True)
    span_kind = Column(String(20), default='server')  # server, client, internal, producer, consumer
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime)
    duration_ms = Column(Float)
    status = Column(String(20), default='ok')  # ok, error, timeout
    tags = Column(JSON)  # 存储span标签和元数据
    logs = Column(JSON)  # 存储span事件日志
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    trace = relationship("Trace", back_populates="spans")


class SpanRelation(Base):
    """Span之间的关系表（用于复杂的父子关系查询优化）"""
    __tablename__ = "radar_span_relations"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String(32), index=True)
    parent_span_id = Column(String(16), index=True)
    child_span_id = Column(String(16), index=True)
    depth = Column(Integer, default=0)  # 在调用树中的深度
    created_at = Column(DateTime, default=datetime.utcnow)
