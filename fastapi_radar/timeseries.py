"""Request timeseries bucketing logic for the Radar dashboard."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from .models import CapturedRequest


def _normalize(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt


def _fetch_rows(session: Session, start: datetime, end: Optional[datetime] = None):
    q = (
        session.query(CapturedRequest.created_at, CapturedRequest.status_code)
        .filter(CapturedRequest.created_at >= start.replace(tzinfo=timezone.utc))
    )

    if end is not None:
        q = q.filter(CapturedRequest.created_at <= end.replace(tzinfo=timezone.utc))

    return q.all()


def _count_buckets(rows, bucket_fn) -> dict:
    counts: dict = defaultdict(lambda: {"requests": 0, "errors": 0})
    for created_at, status_code in rows:
        dt = _normalize(created_at)
        if dt is None:
            continue

        key = bucket_fn(dt)
        counts[key]["requests"] += 1
        if status_code and status_code >= 400:
            counts[key]["errors"] += 1

    return counts


def _granularity(span_secs: float):
    """Return (unit, truncate_kwargs, fmt_fn, step) for a given span in seconds."""
    if span_secs <= 2 * 3600:
        return ("minute", {"second": 0, "microsecond": 0}, lambda d: d.strftime("%H:%M"),
                timedelta(minutes=1))

    if span_secs > 2 * 86400:
        return "day", {"hour": 0, "minute": 0, "second": 0, "microsecond": 0}, \
               lambda d: f"{d.strftime('%a')} {d.month}/{d.day}", timedelta(days=1)

    return ("hour", {"minute": 0, "second": 0, "microsecond": 0}, lambda d: d.strftime("%H:%M"),
            timedelta(hours=1))


def _build_result(counts, bucket_start, n_buckets, step, fmt_fn) -> List[dict]:
    result = []
    for i in range(n_buckets):
        bucket_dt = bucket_start + step * i
        data = counts.get(bucket_dt, {"requests": 0, "errors": 0})
        result.append({
            "time": fmt_fn(bucket_dt),
            "iso_time": bucket_dt.replace(tzinfo=timezone.utc).isoformat(),
            "requests": data["requests"],
            "errors": data["errors"],
        })
    return result

# ── Public API ────────────────────────────────────────────────────────────────


def build_timeseries(
    session: Session,
    hours: int = 24,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
) -> List[dict]:
    """Return timeseries buckets as a list of dicts with time/iso_time/requests/errors."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if start_time is not None:
        range_start = _normalize(start_time) or now - timedelta(hours=24)
        range_end = _normalize(end_time) or now
        span_secs = (range_end - range_start).total_seconds()
    else:
        # Map hours → equivalent span for granularity selection
        span_secs = hours * 3600
        if hours == 1:
            range_start = now.replace(second=0, microsecond=0) - timedelta(minutes=59)
            range_end = range_start + timedelta(minutes=59)
        elif hours > 24:
            days = hours // 24
            range_start = now.replace(hour=0, minute=0, second=0,
                                      microsecond=0) - timedelta(days=days - 1)
            range_end = now
        else:
            range_start = now.replace(minute=0, second=0, microsecond=0) - \
                timedelta(hours=hours - 1)
            range_end = now

    _, trunc, fmt_fn, step = _granularity(span_secs)
    bucket_start = range_start.replace(**trunc)
    bucket_end = range_end.replace(**trunc)
    n_buckets = max(1, int((bucket_end - bucket_start) / step) + 1)

    rows = _fetch_rows(session, range_start, range_end if start_time else None)
    counts = _count_buckets(rows, lambda dt: dt.replace(**trunc))

    return _build_result(counts, bucket_start, n_buckets, step, fmt_fn)
