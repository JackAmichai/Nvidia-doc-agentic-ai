from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NVIDIA Doc Navigator"
    API_V1_STR: str = "/api/v1"
    OPENAI_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"

settings = Settings()
