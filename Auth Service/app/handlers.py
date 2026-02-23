from sqlalchemy.ext.asyncio import AsyncSession
from .crud import UserCRUD
from . import schemas
import logging


async def handle_profile_update(data: dict, db: AsyncSession):
    user_id = data.get("uuid")
    logging.error(data)
    if not data:
        return None
    try:
        user_update = schemas.UserUpdate(**data)
        updated_user = await UserCRUD.update_profile(db, user_id, user_update)
        return updated_user
    except Exception as e:
        logging.error(f"Error during update: {e}")
        return None