from fastapi import FastAPI
from sqlalchemy import text
from contextlib import asynccontextmanager
from database import engine
import models

async def wait_for_db():
    max_retries = 10
    retry_delay = 2
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            print("Database connection successful")
            return True
        except Exception as e:
            print(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
    raise Exception("Could not connect to database after multiple attempts")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Waiting for database connection...")
    await wait_for_db()
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("Database tables created successfully")
    yield
    await engine.dispose()
    print("Database connection closed")

