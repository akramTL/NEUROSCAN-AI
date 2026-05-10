from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl, field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour shift for doctors

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS – stored as a comma-separated string in .env, parsed into a list here
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # AI model backend
    MODEL_BACKEND: str = "stub"           # 'stub' | 'local'
    MODEL_PATH: str = "./model/model.pkl"  # path to model.pkl when MODEL_BACKEND=local
    MODEL_API_URL: str | None = None       # reserved for future remote model API

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


# Single shared instance – import this everywhere
settings = Settings()
