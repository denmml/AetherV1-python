"""api init.py"""

from app.api.v1.endpoints import auth, folders

__all__ = ["auth", "folders"]  # Явный экспорт роутеров для пакета endpoints
