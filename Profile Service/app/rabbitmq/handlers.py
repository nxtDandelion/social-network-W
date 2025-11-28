import logging
from typing import Dict, Any
# from app.schemas.posts import PostCreate
from app.schemas.profile import ProfileCreate
from app.crud.post import PostCRUD
from app.crud.profile import ProfileCRUD
from app.crud.comment import CommentCRUD


async def handle_user_registered(event_data: Dict[str, Any], db):
    try:
        uuid = event_data.get('uuid')
        username = event_data.get('username')
        email = event_data.get('email')
        profile_create = ProfileCreate(
            uuid=uuid,
            username=username,
            email=email
        )
        profile_crud = ProfileCRUD(db)
        await profile_crud.create_profile(profile_create)
        logging.info(f"User {username} initialized in Post Service")
    except Exception as e:
        logging.error(f"Error handling user registration: {e}")


async def handle_post_created(event_data: Dict[str, Any], db):
    try:
        id = event_data.get('id')
        text = event_data['text']
        profile_id = event_data['profile_id']
        post_create = {
            "id": id,
            "text": text,
            "profile_id": profile_id
        }
        post_crud = PostCRUD(db)
        profile_crud = ProfileCRUD(db)
        await post_crud.create_post(post_create)
        await profile_crud.add_post_to_profile(profile_id, id)
    except Exception as e:
        logging.error(f"Error handling post creation: {e}")


async def handle_post_updated(event_data: Dict[str, Any], db):
    try:
        post_update = {
            "id": event_data.get('id'),
            "text": event_data['text']
        }
        post_crud = PostCRUD(db)
        await post_crud.update_post(post_update)
    except Exception as e:
        logging.error(f"Error handling post update: {e}")


async def handle_post_deleted(event_data: Dict[str, Any], db):
    try:
        id = event_data.get("id")
        post_crud = PostCRUD(db)
        await post_crud.delete_post(id)
    except Exception as e:
        logging.error(f"Error handling post deletion: {e}")


async def handle_post_liked(event_data: Dict[str, Any], db):
    try:
        id = event_data.get("id")
        user = event_data.get("user")
        post_crud = PostCRUD(db)
        await post_crud.like_post(id, user)
    except Exception as e:
        logging.error(f"Error handling post like: {e}")


async def handle_post_unliked(event_data: Dict[str, Any], db):
    try:
        id = event_data.get("id")
        user = event_data.get("user")
        post_crud = PostCRUD(db)
        await post_crud.unlike_post(id, user)
    except Exception as e:
        logging.error(f"Error handling post unlike: {e}")


async def handle_comment_created(event_data: Dict[str, Any], db):
    try:
        comment_id = event_data.get('id')
        text = event_data.get('text')
        post_id = event_data.get('post_id')
        profile_id = event_data.get('profile_id')
        create_data = {
            "id": comment_id,
            "text": text,
            "post_id": post_id
        }
        comment_crud = CommentCRUD(db)
        await comment_crud.create_comment(profile_id, create_data)
    except Exception as e:
        logging.error(f"Error handling comment creation: {e}")


async def handle_comment_updated(event_data: Dict[str, Any], db):
    try:
        comment_id = event_data.get('comment_id')
        text = event_data.get('text')
        updated_data = {
            "text": text,
        }
        comment_crud = CommentCRUD(db)
        await comment_crud.update_comment(comment_id, updated_data)
    except Exception as e:
        logging.error(f"Error handling comment updating: {e}")


async def handle_comment_deleted(event_data: Dict[str, Any], db):
    try:
        comment_id = event_data.get('comment_id')
        comment_crud = CommentCRUD(db)
        await comment_crud.delete_comment(comment_id)
    except Exception as e:
        logging.error(f"Error handling comment deleting: {e}")


async def handle_user_events(event_type: str, event_data: Dict[str, Any], db):
    handlers = {
        'user_registered': handle_user_registered
    }
    handler = handlers.get(event_type)
    if handler:
        await handler(event_data, db)
    else:
        logging.warning(f"Unknown event type: {event_type}")


async def handle_post_events(event_type: str, event_data: Dict[str, Any], db):
    handlers = {
        'post_created': handle_post_created,
        'post_updated': handle_post_updated,
        'post_deleted': handle_post_deleted,
        'post_liked': handle_post_liked,
        'post_unliked': handle_post_unliked,
        'comment_created': handle_comment_created,
        'comment_updated': handle_comment_updated,
        'comment_deleted': handle_comment_deleted
    }
    handler = handlers.get(event_type)
    if handler:
        await handler(event_data, db)
    else:
        logging.warning(f"Unknown event type: {event_type}")
