import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Force reload environment variables from .env
load_dotenv(override=True)

# Use environment variable for database URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
logger.info(f"Connecting to database: {SQLALCHEMY_DATABASE_URL}")

# Handle different database types
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Default to PostgreSQL if URL is provided, or fallback to SQLite if nothing is defined
    if not SQLALCHEMY_DATABASE_URL:
        SQLALCHEMY_DATABASE_URL = "sqlite:///./resource_booking.db"
        logger.info(f"Fallback to default SQLite: {SQLALCHEMY_DATABASE_URL}")
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
