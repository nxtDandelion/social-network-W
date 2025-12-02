from database import get_db
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from crud import UserCRUD
import schemas
import logging


async def handle_profile_update(data: dict, db: AsyncSession):
    user_id = data.get("user_id")
    update_data = data.get("update_data", {})
    update_data = update_data.get("update_data", {})
    logging.error(update_data)
    if not update_data:
        return None
    try:
        user_update = schemas.UserUpdate(**update_data)
        updated_user = await UserCRUD.update_profile(db, user_id, user_update)
        return updated_user
    except Exception as e:
        logging.error(f"Error during update: {e}")
        return None