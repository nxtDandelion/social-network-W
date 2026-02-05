from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.api.profile import router as profile_router
from app.api.follow import router as follow_router
from app.database.database import engine, Base, get_db
from app.rabbitmq.rabbitmq import rabbitmq_service, connect_rabbitmq
from app.rabbitmq.handlers import handle_user_events, handle_post_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully")
    await connect_rabbitmq()

    async def user_events_callback(event_type: str, event_data: dict):
        async for db in get_db():
            await handle_user_events(event_type, event_data, db)

    async def post_events_callback(event_type: str, event_data: dict):
        async for db in get_db():
            await handle_post_events(event_type, event_data, db)

    await rabbitmq_service.start_consuming_user_events(user_events_callback)
    await rabbitmq_service.start_consuming_post_events(post_events_callback)
    yield
    await engine.dispose()
    await rabbitmq_service.close()
    print("Database connection closed")


app = FastAPI(title="Profile Service", lifespan=lifespan)

app.include_router(profile_router)
app.include_router(follow_router)


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
