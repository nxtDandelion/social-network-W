from fastapi import FastAPI, Depends, HTTPException, status
from rabbitmq import rabbitmq_service, connect_rabbitmq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from contextlib import asynccontextmanager
from typing import List
from database import get_db, engine
import models
import schemas
import crud
import uvicorn
import handlers
import logging
from pydantic import BaseModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_rabbitmq()
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    async def callback_with_db(event_type: str, event_data: dict):
        try:
            logging.info(f"Processing event: {event_type}")
            async for db in get_db():
                await handlers.handle_user_event(event_type, event_data, db)
                logging.info(f"Successfully processed event: {event_type}")
        except Exception as e:
            logging.error(f"Error in callback_with_db: {e}")
    await rabbitmq_service.start_consuming_events(callback_with_db)
    logging.info("RabbitMQ consumer started successfully")
    yield
    await engine.dispose()
    await rabbitmq_service.close()

app = FastAPI(title="Post Service", lifespan=lifespan)

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler()
    ]
)

class PostCreateWithProfile(schemas.PostCreate):
    profile_id: str

class LikeRequest(BaseModel):
    profile_id: str

class CommentCreateWithProfile(schemas.CommentCreate):
    profile_id: str

class CommentUpdateWithProfile(schemas.CommentUpdate):
    profile_id: str

class PostUpdateWithProfile(schemas.PostUpdate):
    profile_id: str

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


@app.post("/", response_model=schemas.Post)
async def create_post(post: PostCreateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.create_post(db, post, post.profile_id)
        post_data = {
            "id": post.id,
            "text": post.text,
            "profile_id": post.profile_id,
            "likes_amount": post.likes_amount,
            "create_date": post.create_date.isoformat(),
            "edited" : post.edited,
            "likers": post.likers or [],
        }
        await rabbitmq_service.send_post_created(post_data)
        return post
    except Exception as e:
        logging.error(f"Error in create_post: {e}")


@app.get("/feed", response_model=List[schemas.Post])
async def get_posts_feed(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_posts_feed(db, skip=skip, limit=limit)


@app.put("/{post_id}", response_model=schemas.Post)
async def update_post(post_id: int, post_update: PostUpdateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.update_post(db, post_id, post_update, post_update.profile_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found or not authorized")
        post_data = {
            "id": post.id,
            "text": post.text,
            "profile_id": post.profile_id,
            "likes_amount": post.likes_amount,
            "create_date": post.create_date.isoformat(),
            "edited": post.edited,
            "likers": post.likers or [],
        }
        await rabbitmq_service.send_post_updated(post_data)
        return post
    except Exception as e:
        logging.error(f"Error in update_post: {e}")


@app.delete("/{post_id}")
async def delete_post(post_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await crud.delete_post(db, post_id, profile_id)
        if "deleted" not in result.get("message", ""):
            if "not found" in result.get("message", ""):
                raise HTTPException(status_code=404, detail="Post not found")
            else:
                raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        to_delete = {
            "id": post_id,
        }
        await rabbitmq_service.send_post_deleted(to_delete)
        return result
    except Exception as e:
        logging.error(f"Error in delete_post: {e}")


@app.post("/{post_id}/like", response_model=schemas.Post)
async def like_post(post_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.like_post(db, post_id, like_request.profile_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        event_data = {
            "id": post.id,
            "user" : like_request.profile_id,
        }
        await rabbitmq_service.send_post_liked(event_data)
        return post
    except Exception as e:
        logging.error(f"Error in like_post: {e}")


@app.delete("/{post_id}/like", response_model=schemas.Post)
async def unlike_post(post_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.unlike_post(db, post_id, like_request.profile_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        event_data = {
            "id": post.id,
            "user": like_request.profile_id,
        }
        await rabbitmq_service.send_post_unliked(event_data)
        return post
    except Exception as e:
        logging.error(f"Error in unlike_post: {e}")


@app.post("/{post_id}/comments", response_model=schemas.Comment)
async def create_comment(post_id: int, comment: CommentCreateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        comment = await crud.create_comment(db, comment, post_id, comment.profile_id)
        comment_data = {
            "id": comment.id,
            "text": comment.text,
            "post_id": comment.post_id,
            "profile_id": comment.profile_id,
            "edited": comment.edited
        }
        await rabbitmq_service.send_comment_created(comment_data)
        return comment
    except Exception as e:
        logging.error(f"Error in create_comment: {e}")


@app.get("/{post_id}/comments", response_model=List[schemas.Comment])
async def get_comments(post_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_comments_by_post(db, post_id)


@app.put("/{post_id}/comments/{comment_id}", response_model=schemas.Comment)
async def update_comment(post_id: int, comment_id: int, comment_update: CommentUpdateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        comment = await crud.update_comment(db, comment_id, comment_update, comment_update.profile_id)
        if comment is None:
            raise HTTPException(status_code=404, detail="Comment not found or not authorized")
        comment_data = {
            "comment_id": comment_id,
            "text": comment.text,
            "post_id": comment.post_id,
            "profile_id": comment.profile_id,
            "edited": comment.edited
        }
        await rabbitmq_service.send_comment_updated(comment_data)
        return comment
    except Exception as e:
        logging.error(f"Error in update_comment: {e}")


@app.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: int, comment_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        result = await crud.delete_comment(db, comment_id, profile_id)
        if "deleted" not in result.get("message", ""):
            if "not found" in result.get("message", ""):
                raise HTTPException(status_code=404, detail="Comment not found")
            else:
                raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        event_data = {
            "comment_id": comment_id
        }
        await rabbitmq_service.send_comment_deleted(event_data)
        return result
    except Exception as e:
        logging.error(f"Error in delete_comment: {e}")


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
