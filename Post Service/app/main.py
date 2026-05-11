# ======================== Импорты базовые ========================
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from contextlib import asynccontextmanager
from typing import List
from .database import get_db, engine
from . import models, schemas, crud, handlers
from .rabbitmq import rabbitmq_service, connect_rabbitmq
from .outbox_processor import start_outbox_processor
import uvicorn
import logging
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator

# ======================== OpenTelemetry ========================
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

resource = Resource.create({ResourceAttributes.SERVICE_NAME: "post-service"})
provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(endpoint="http://jaeger:4318/v1/traces")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
# Для отладки можно добавить консольный экспортёр:
# from opentelemetry.sdk.trace.export import ConsoleSpanExporter
# provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

trace.set_tracer_provider(provider)

# ======================== Lifespan ========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Starting Post Service...")
    await connect_rabbitmq()
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    logging.info("Database tables created/verified")

    await start_outbox_processor()
    logging.info("Outbox processor started")

    async def callback_with_db(event_type: str, event_data: dict):
        try:
            logging.info(f"Processing event: {event_type}")
            async for db in get_db():
                await handlers.handle_user_event(event_type, event_data, db)
                logging.info(f"Successfully processed event: {event_type}")
        except Exception as e:
            logging.error(f"Error in callback_with_db: {e}")

    await rabbitmq_service.start_consuming_events(callback_with_db)
    await rabbitmq_service.start_consuming_profile_events(callback_with_db)
    logging.info("RabbitMQ consumer started successfully")

    yield

    await engine.dispose()
    await rabbitmq_service.close()
    logging.info("Post Service shutdown complete")

# ======================== Создание приложения ========================
app = FastAPI(title="Post Service", lifespan=lifespan)

# Инструментируем FastAPI (автоматические спаны на все запросы)
FastAPIInstrumentor().instrument_app(app)

# Prometheus метрики
Instrumentator().instrument(app).expose(app)

logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler()])

# ======================== Вспомогательные модели ========================
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

# ... все эндпоинты (create_profile, update_profile, delete_profile, ...) без изменений
async def create_profile(profile: schemas.ProfileCreate, db: AsyncSession = Depends(get_db)):
    logging.info(f"Creating profile")
    return await crud.create_profile(db, profile)

async def update_profile(profile_uuid: str, profile_update: schemas.ProfileUpdate, db: AsyncSession = Depends(get_db)):
    logging.info(f"Updating profile {profile_uuid}")
    db_profile = await crud.update_profile(db, profile_uuid, profile_update)
    if db_profile is None:
        logging.error(f"Profile not found: {profile_uuid}")
        raise HTTPException(status_code=404, detail="Profile not found")
    logging.info(f"Profile updated successfully: {profile_uuid}")
    return db_profile

async def delete_profile(profile_uuid: str, db: AsyncSession = Depends(get_db)):
    logging.info(f"Profile deleted: {profile_uuid}")
    return await crud.delete_profile(db, profile_uuid)

async def get_profile_posts(profile_uuid: str, db: AsyncSession = Depends(get_db)):
    logging.info(f"Getting posts for profile: {profile_uuid}")
    return await crud.get_profile_posts(db, profile_uuid)

async def follow_profile(follower_uuid: str, followed_uuid: str, db: AsyncSession = Depends(get_db)):
    logging.info(f"Profile {follower_uuid} following {followed_uuid}")
    return await crud.follow_profile(db, follower_uuid, followed_uuid)

async def unfollow_profile(follower_uuid: str, followed_uuid: str, db: AsyncSession = Depends(get_db)):
    logging.info(f"Profile {follower_uuid} unfollowing {followed_uuid}")
    return await crud.unfollow_profile(db, follower_uuid, followed_uuid)


@app.post("/", response_model=schemas.Post)
async def create_post(post: PostCreateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        created_post = await crud.create_post(db, post, post.profile_id)
        logging.info(f"Post created successfully, outbox event stored")
        return created_post
    except Exception as e:
        logging.error(f"Error in create_post: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/feed")
async def get_posts_feed(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    logging.info(f"Retrieved posts for feed")
    return await crud.get_posts_feed(db, skip=skip, limit=limit)

@app.get("/subscribe_feed")
async def get_subscribe_feed(username: str, db: AsyncSession = Depends(get_db)):
    logging.info(f"Retrieved subscribes for feed")
    return await crud.get_subscribe_feed(db, username)

@app.get("/{post_id}")
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await crud.get_post(db, post_id)
    if post is None:
        logging.error(f"Post not found: post_id={post_id}")
        raise HTTPException(status_code=404, detail="Post not found")
    profile = await crud.get_profile(db, post.profile_id)
    post = post.__dict__
    post["username"] = profile.username
    logging.info(f"Getting post: post_id={post_id}")
    return post

@app.put("/{post_id}")
async def update_post(post_id: int, post_update: PostUpdateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.update_post(db, post_id, post_update, post_update.profile_id)
        if post is None:
            logging.warning(f"Post not found or not authorized: post_id={post_id}, profile_id={post_update.profile_id}")
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
        logging.info(f"Post updated successfully: {post_data}")

        await rabbitmq_service.send_post_updated(post_data)
        profile = await crud.get_profile(db, post.profile_id)
        post_data["username"] = profile.username
        return post_data
    except Exception as e:
        logging.error(f"Error in update_post: {e}")


@app.delete("/{post_id}")
async def delete_post(post_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await crud.delete_post(db, post_id, profile_id)
        if "deleted" not in result.get("message", ""):
            if "not found" in result.get("message", ""):
                logging.error(f"Post not found: {post_id}")
                raise HTTPException(status_code=404, detail="Post not found")
            else:
                logging.error(f"Not authorized to delete post: post_id={post_id}, profile_id={profile_id}")
                raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        to_delete = {
            "id": post_id,
        }
        logging.info(f"Post deleted successfully: {post_id}")
        await rabbitmq_service.send_post_deleted(to_delete)
        return result
    except Exception as e:
        logging.error(f"Error in delete_post: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/{post_id}/like", response_model=schemas.Post)
async def like_post(post_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.like_post(db, post_id, like_request.profile_id)
        if post is None:
            logging.error(f"Post not found: {post_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        logging.info(f"Post liked successfully: post_id={post_id}, profile_id={like_request.profile_id}, likes_amount={post.likes_amount}")
        event_data = {
            "id": post.id,
            "profile_id" : like_request.profile_id,
        }
        await rabbitmq_service.send_post_liked(event_data)
        return post
    except Exception as e:
        logging.error(f"Error in like_post: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/{post_id}/like", response_model=schemas.Post)
async def unlike_post(post_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.unlike_post(db, post_id, like_request.profile_id)
        if post is None:
            logging.error(f"Post not found: {post_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        logging.info(f"Post unliked successfully: post_id={post_id}, profile_id={like_request.profile_id}, likes_amount={post.likes_amount}")
        event_data = {
            "id": post.id,
            "profile_id": like_request.profile_id,
        }
        await rabbitmq_service.send_post_unliked(event_data)
        return post
    except Exception as e:
        logging.error(f"Error in unlike_post: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/{post_id}/comments", response_model=schemas.Comment)
async def create_comment(post_id: int, comment: CommentCreateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            logging.warning(f"Post not found for comment creation: {post_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        comment = await crud.create_comment(db, comment, post_id, comment.profile_id)
        comment_data = {
            "id": comment.id,
            "text": comment.text,
            "post_id": comment.post_id,
            "profile_id": comment.profile_id,
            "edited": comment.edited
        }
        logging.info(f"Comment created successfully: {comment_data}")

        await rabbitmq_service.send_comment_created(comment_data)
        comment = await crud.get_comment(db, comment.id)
        return comment
    except Exception as e:
        logging.error(f"Error in create_comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/{post_id}/comments", response_model=List[schemas.Comment])
async def get_comments(post_id: int, db: AsyncSession = Depends(get_db)):
    logging.info(f"Getting comments for post: {post_id}")
    return await crud.get_comments_by_post(db, post_id)


@app.put("/{post_id}/comments/{comment_id}")
async def update_comment(post_id: int, comment_id: int, comment_update: CommentUpdateWithProfile, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            logging.error(f"Post not found for comment update: {post_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        comment = await crud.update_comment(db, comment_id, comment_update, comment_update.profile_id)
        if comment is None:
            logging.warning(f"Comment not found or not authorized: comment_id={comment_id}, profile_id={comment_update.profile_id}")
            raise HTTPException(status_code=404, detail="Comment not found or not authorized")
        comment_data = {
            "comment_id": comment_id,
            "text": comment.text,
            "post_id": comment.post_id,
            "profile_id": comment.profile_id,
            "edited": comment.edited
        }
        logging.info(f"Comment updated successfully: {comment_data}")
        await rabbitmq_service.send_comment_updated(comment_data)
        comment = await crud.get_comment(db, comment_id)
        return comment
    except Exception as e:
        logging.error(f"Error in update_comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: int, comment_id: int, profile_id: str, db: AsyncSession = Depends(get_db)):
    try:
        post = await crud.get_post(db, post_id)
        if post is None:
            logging.warning(f"Post not found for comment deletion: {post_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        result = await crud.delete_comment(db, comment_id, profile_id)
        if "deleted" not in result.get("message", ""):
            if "not found" in result.get("message", ""):
                logging.warning(f"Comment not found: {comment_id}")
                raise HTTPException(status_code=404, detail="Comment not found")
            else:
                logging.warning(f"Not authorized to delete comment: comment_id={comment_id}, profile_id={profile_id}")
                raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        event_data = {
            "comment_id": comment_id
        }
        logging.info(f"Comment deleted successfully: {comment_id}")
        await rabbitmq_service.send_comment_deleted(event_data)
        return result
    except Exception as e:
        logging.error(f"Error in delete_comment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/comments/{comment_id}/like", response_model=schemas.Comment)
async def like_comment(comment_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        comment = await crud.like_comment(db, comment_id, like_request.profile_id)
        if comment is None:
            logging.error(f"Comment not found: comment_id={comment_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        event_data = {
            "id": comment.id,
            "user": like_request.profile_id,
        }
        logging.info(f"Comment liked: comment_id={comment_id}")
        # await rabbitmq_service.send_comment_liked(event_data)
        return comment
    except Exception as e:
        logging.error(f"Error in like_post: {e}")


@app.delete("/comments/{comment_id}/like", response_model=schemas.Comment)
async def unlike_comment(comment_id: int, like_request: LikeRequest, db: AsyncSession = Depends(get_db)):
    try:
        comment = await crud.unlike_comment(db, comment_id, like_request.profile_id)
        if comment is None:
            logging.error(f"Comment not found: comment_id={comment_id}")
            raise HTTPException(status_code=404, detail="Post not found")
        event_data = {
            "id": comment.id,
            "user": like_request.profile_id,
        }
        logging.info(f"Comment unliked: comment_id={comment_id}")
        # await rabbitmq_service.send_comment_unliked(event_data)
        return comment
    except Exception as e:
        logging.error(f"Error in unlike_post: {e}")


@app.get("/db_health")
async def db_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logging.error(f"Database connection failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get("/health")
async def health():
    logging.info("Health check requested")
    return {"message": "healthy"}

@app.get("/")
async def root():
    logging.info("Root endpoint requested")
    return {"message": "Post Service is running"}

if __name__ == "__main__":
    logging.info("Starting Post Service application")
    uvicorn.run(app, host="0.0.0.0", port=8002)