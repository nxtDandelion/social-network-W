import logging
from typing import Dict, Any
from . import schemas, crud


async def handle_user_registered(event_data: Dict[str, Any], db):
    try:
        logging.info(f"Register event: {event_data}")
        uuid = event_data['uuid']
        username = event_data.get('username')
        profile_create = schemas.ProfileCreate(
            uuid=uuid,
            username=username
        )
        await crud.create_profile(db, profile_create)
        logging.info(f"User {username} initialized in Post Service")
    except Exception as e:
        logging.error(f"Error handling user registration: {e}")


async def handle_profile_updated(event_data: Dict[Any, Any], db):
    try:
        logging.info(event_data)
        user_id = event_data['uuid']
        profile_update = schemas.ProfileUpdate(
            username = event_data.get('username'),
            tag = event_data.get('tag'),
            photo = event_data.get('photo'),
            subscribes = event_data.get('subscribes'),
        )
        await crud.update_profile(db, user_id, profile_update)
        logging.info(f"Profile updated for user {user_id}")
    except Exception as e:
        logging.error(f"Error handling profile update: {e}")


async def handle_user_event(event_type: str, event_data: Dict[str, Any], db):
    handlers = {
        'user_registered': handle_user_registered,
        'profile_updated': handle_profile_updated
    }
    handler = handlers.get(event_type)
    if handler:
        await handler(event_data, db)
    else:
        logging.warning(f"Unknown user event type: {event_type}")