"""链路跟踪核心功能模块"""

import uuid
import time
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextvars import ContextVar
from sqlalchemy.orm import Session

from .models import Trace, Span, SpanRelation

# 存储当前请求的跟踪上下文
trace_context: ContextVar[Optional['TraceContext']] = ContextVar('trace_context', default=None)


class TraceContext:
    """跟踪上下文，用于管理当前请求的trace和span信息"""

    def __init__(self, trace_id: str, service_name: str = "fastapi-app"):
        self.trace_id = trace_id
        self.service_name = service_name
        self.root_span_id: Optional[str] = None
        self.current_span_id: Optional[str] = None
        self.spans: Dict[str, Dict[str, Any]] = {}
        self.start_time = datetime.utcnow()

    def create_span(
        self,
        operation_name: str,
        parent_span_id: Optional[str] = None,
        span_kind: str = "server",
        tags: Optional[Dict[str, Any]] = None
    ) -> str:
        """创建一个新的span"""
        span_id = self._generate_span_id()

        span_data = {
            'span_id': span_id,
            'trace_id': self.trace_id,
            'parent_span_id': parent_span_id or self.current_span_id,
            'operation_name': operation_name,
            'service_name': self.service_name,
            'span_kind': span_kind,
            'start_time': datetime.utcnow(),
            'tags': tags or {},
            'logs': [],
            'status': 'ok'
        }

        self.spans[span_id] = span_data

        # 设置根span
        if self.root_span_id is None:
            self.root_span_id = span_id

        return span_id

    def finish_span(self, span_id: str, status: str = 'ok', tags: Optional[Dict[str, Any]] = None):
        """结束一个span"""
        if span_id not in self.spans:
            return

        span_data = self.spans[span_id]
        span_data['end_time'] = datetime.utcnow()
        span_data['duration_ms'] = (
            span_data['end_time'] - span_data['start_time']
        ).total_seconds() * 1000
        span_data['status'] = status

        if tags:
            span_data['tags'].update(tags)

    def add_span_log(self, span_id: str, message: str, level: str = 'info', **fields):
        """向span添加日志事件"""
        if span_id not in self.spans:
            return

        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'message': message,
            **fields
        }

        self.spans[span_id]['logs'].append(log_entry)

    def set_current_span(self, span_id: str):
        """设置当前活跃的span"""
        self.current_span_id = span_id

    def get_trace_summary(self) -> Dict[str, Any]:
        """获取trace的摘要信息"""
        if not self.spans:
            return {}

        all_times = []
        error_count = 0

        for span in self.spans.values():
            if span.get('start_time'):
                all_times.append(span['start_time'])
            if span.get('end_time'):
                all_times.append(span['end_time'])
            if span.get('status') == 'error':
                error_count += 1

        start_time = min(all_times) if all_times else self.start_time
        end_time = max(all_times) if all_times else datetime.utcnow()

        return {
            'trace_id': self.trace_id,
            'service_name': self.service_name,
            'operation_name': self.spans.get(self.root_span_id, {}).get('operation_name', 'unknown'),
            'start_time': start_time,
            'end_time': end_time,
            'duration_ms': (end_time - start_time).total_seconds() * 1000,
            'span_count': len(self.spans),
            'status': 'error' if error_count > 0 else 'ok',
            'tags': {}
        }

    @staticmethod
    def _generate_span_id() -> str:
        """生成16位十六进制span ID"""
        return uuid.uuid4().hex[:16]


class TracingManager:
    """跟踪管理器，负责persistence和查询"""

    def __init__(self, get_session):
        self.get_session = get_session

    def save_trace_context(self, trace_ctx: TraceContext):
        """将trace上下文保存到数据库"""
        with self.get_session() as session:
            # 保存trace
            trace_summary = trace_ctx.get_trace_summary()
            trace = Trace(**trace_summary)
            session.add(trace)

            # 保存所有spans
            for span_data in trace_ctx.spans.values():
                span = Span(**span_data)
                session.add(span)

            # 保存span关系（用于快速查询）
            self._save_span_relations(session, trace_ctx)

            session.commit()

    def _save_span_relations(self, session: Session, trace_ctx: TraceContext):
        """保存span之间的父子关系，用于优化查询"""
        def calculate_depth(span_id: str, spans: Dict[str, Dict], depth: int = 0) -> List[tuple]:
            """递归计算span的深度"""
            relations = []
            span = spans.get(span_id)
            if not span:
                return relations

            # 查找所有子span
            for sid, s in spans.items():
                if s.get('parent_span_id') == span_id:
                    relations.append((span_id, sid, depth + 1))
                    relations.extend(calculate_depth(sid, spans, depth + 1))

            return relations

        # 从根span开始计算关系
        if trace_ctx.root_span_id:
            relations = calculate_depth(trace_ctx.root_span_id, trace_ctx.spans)

            for parent_id, child_id, depth in relations:
                relation = SpanRelation(
                    trace_id=trace_ctx.trace_id,
                    parent_span_id=parent_id,
                    child_span_id=child_id,
                    depth=depth
                )
                session.add(relation)

    def get_waterfall_data(self, trace_id: str) -> List[Dict[str, Any]]:
        """获取瀑布流视图数据"""
        with self.get_session() as session:
            # 使用DuckDB优化的查询
            from sqlalchemy import text

            waterfall_query = text("""
                WITH span_timeline AS (
                    SELECT
                        s.span_id,
                        s.parent_span_id,
                        s.operation_name,
                        s.service_name,
                        s.start_time,
                        s.end_time,
                        s.duration_ms,
                        s.status,
                        s.tags,
                        COALESCE(r.depth, 0) as depth,
                        -- 计算相对于trace开始的偏移时间
                        EXTRACT(EPOCH FROM (s.start_time - MIN(s.start_time) OVER (PARTITION BY s.trace_id))) * 1000 as offset_ms
                    FROM radar_spans s
                    LEFT JOIN radar_span_relations r ON s.span_id = r.child_span_id
                    WHERE s.trace_id = :trace_id
                )
                SELECT * FROM span_timeline
                ORDER BY offset_ms, depth
            """)

            result = session.execute(waterfall_query, {"trace_id": trace_id})

            return [
                {
                    "span_id": row.span_id,
                    "parent_span_id": row.parent_span_id,
                    "operation_name": row.operation_name,
                    "service_name": row.service_name,
                    "start_time": row.start_time.isoformat() if row.start_time else None,
                    "end_time": row.end_time.isoformat() if row.end_time else None,
                    "duration_ms": row.duration_ms,
                    "status": row.status,
                    "tags": row.tags,
                    "depth": row.depth,
                    "offset_ms": float(row.offset_ms) if row.offset_ms else 0.0
                }
                for row in result
            ]


def get_current_trace_context() -> Optional[TraceContext]:
    """获取当前的trace上下文"""
    return trace_context.get()


def set_trace_context(ctx: TraceContext):
    """设置当前的trace上下文"""
    trace_context.set(ctx)


def create_trace_context(service_name: str = "fastapi-app") -> TraceContext:
    """创建新的trace上下文"""
    trace_id = uuid.uuid4().hex
    return TraceContext(trace_id, service_name)
