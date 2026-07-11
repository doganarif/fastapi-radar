"""FastAPI Radar - Debugging dashboard for FastAPI applications."""

from .background import track_background_task
from .log_handler import RadarLoggingHandler
from .radar import Radar

__version__ = "0.4.0"
__all__ = ["Radar", "RadarLoggingHandler", "track_background_task"]
