from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    # Application
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool
    
    # CORS
    ALLOWED_ORIGINS: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()