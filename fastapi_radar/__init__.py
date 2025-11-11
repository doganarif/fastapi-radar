"""FastAPI Radar - Debugging dashboard for FastAPI applications."""

from .background import track_background_task
from .radar import Radar

__version__ = "0.3.4"
__all__ = ["Radar", "track_background_task"]
