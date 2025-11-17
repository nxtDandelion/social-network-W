from database import get_db
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


async def handle_profile_update(data: dict, db: AsyncSession = Depends(get_db)):
    user_id = data.get('user_id')
    update_data = data.get('update_data', {})
    if 'login' in update_data:
        print("YAAAAA LOOOOH")
    if 'email' in update_data:
        print("YAAAAA PIDDOOOOR")
    print(f"✅ Profile updated for user {user_id}")