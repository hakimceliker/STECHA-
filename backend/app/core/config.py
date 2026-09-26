"""Application Configuration"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Environment
    ENV: str = "development"
    DEBUG: bool = False
    AUTO_CREATE_SCHEMA: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./test.db"

    # JWT
    JWT_SECRET: str = "development-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # API Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8081"]

    # AI Provider
    AI_PROVIDER: str = "demo"  # "demo" or "anthropic"
    AI_PROVIDER_API_KEY: str = ""
    AI_PROVIDER_BASE_URL: str = "https://api.anthropic.com"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Validate production settings
if settings.ENV == "production":
    if settings.AUTO_CREATE_SCHEMA:
        raise ValueError("AUTO_CREATE_SCHEMA must be False in production")
    if settings.JWT_SECRET == "development-secret-key-change-in-production":
        raise ValueError("JWT_SECRET must be changed in production")
    if len(settings.JWT_SECRET) < 32:
        raise ValueError("JWT_SECRET must be at least 32 characters in production")
