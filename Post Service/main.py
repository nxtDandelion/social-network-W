from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from contextlib import asynccontextmanager
from typing import List
from database import get_db, engine
import models
import schemas
import crud
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    print("Database tables created successfully")
    yield
    await engine.dispose()
    print("Database connection closed")

app = FastAPI(title="Post Service", lifespan=lifespan)

async def create_profile(profile: schemas.ProfileCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_profile(db, profile)

async def update_profile(profile_uuid: str, profile_update: schemas.ProfileUpdate, db: AsyncSession = Depends(get_db)):
    db_profile = await crud.update_profile(db, profile_uuid, profile_update)
    if db_profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profile

async def delete_profile(profile_uuid: str, db: AsyncSession = Depends(get_db)):
    return await crud.delete_profile(db, profile_uuid)

async def get_profile_posts(profile_uuid: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_profile_posts(db, profile_uuid)

async def follow_profile(follower_uuid: str, followed_uuid: str, db: AsyncSession = Depends(get_db)):
    return await crud.follow_profile(db, follower_uuid, followed_uuid)

async def unfollow_profile(follower_uuid: str, followed_uuid: str, db: AsyncSession = Depends(get_db)):
    return await crud.unfollow_profile(db, follower_uuid, followed_uuid)


@app.post("/posts", response_model=schemas.Post)
async def create_post(post: schemas.PostCreate, profile_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.create_post(db, post, profile_id)


@app.get("/posts/feed", response_model=List[schemas.Post])
async def get_posts_feed(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_posts_feed(db, skip=skip, limit=limit)


@app.put("/posts/{post_id}", response_model=schemas.Post)
async def update_post(post_id: int, post_update: schemas.PostUpdate, db: AsyncSession = Depends(get_db)):
    db_post = await crud.update_post(db, post_id, post_update)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post


@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await crud.delete_post(db, post_id)
    if "deleted" not in result.get("message", ""):
        raise HTTPException(status_code=404, detail="Post not found")
    return result


@app.post("/posts/{post_id}/like", response_model=schemas.Post)
async def like_post(post_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    db_post = await crud.like_post(db, post_id, profile_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post


@app.delete("/posts/{post_id}/like", response_model=schemas.Post)
async def unlike_post(post_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    db_post = await crud.unlike_post(db, post_id, profile_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post


@app.post("/posts/{post_id}/comments", response_model=schemas.Comment)
async def create_comment(post_id: int, comment: schemas.CommentCreate, profile_id: str, db: AsyncSession = Depends(get_db)):
    db_post = await crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return await crud.create_comment(db, comment, post_id, profile_id)


@app.get("/posts/{post_id}/comments", response_model=List[schemas.Comment])
async def get_comments(post_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_comments_by_post(db, post_id)


@app.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: int, comment_id: int, db: AsyncSession = Depends(get_db)):
    db_post = await crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_comment = await crud.get_comment(db, comment_id)
    if db_comment is None or db_comment.post_id != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return await crud.delete_comment(db, comment_id)


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

@app.get("/health")
async def health():
    return {"message": "healthy"}

@app.get("/")
async def root():
    return {"message": "Post Service is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
