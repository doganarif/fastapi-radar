"""FastAPI Radar - Debugging dashboard for FastAPI applications."""

from .radar import Radar
from .background import track_background_task

__version__ = "0.3.4"
__all__ = ["Radar", "track_background_task"]
