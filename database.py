from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("db_url")

if not DATABASE_URL:
    raise ValueError("db_url is not set in the .env file")

engine = create_engine(DATABASE_URL)
sessionlocal = sessionmaker(bind=engine)
base = declarative_base()