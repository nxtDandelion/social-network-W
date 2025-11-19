from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.api.profile import router as profile_router
from app.database.database import engine, Base, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully")
    yield
    await engine.dispose()
    print("Database connection closed")


app = FastAPI(title="Profile Service", lifespan=lifespan)

app.include_router(profile_router)


@app.get("/")
async def main():
    return {"message": "profile service works"}


@app.get("/health")
async def get_health():
    return {"message": "healthy"}


@app.get("/db_health")
async def db_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )
