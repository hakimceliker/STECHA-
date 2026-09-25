from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Uygulama ayarları. Değerler .env dosyasından veya ortam değişkenlerinden okunur."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Stech AI"
    ENV: str = "development"

    # Veritabanı: geliştirmede SQLite, üretimde PostgreSQL kullanılır.
    # Üretim: postgresql+psycopg2://user:pass@host:5432/stech
    DATABASE_URL: str = "sqlite:///./stech.db"

    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # AI sağlayıcı ayarları (Bölüm 5 — AI geçidi bu değerleri kullanır)
    AI_PROVIDER_API_KEY: str = ""
    AI_MODEL_FAST: str = "fast-model"
    AI_MODEL_ADVANCED: str = "advanced-model"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
