import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
# from sqlalchemy import select, update, delete
from app.schemas import profile as schemas
from app.database import models


class ProfileCRUD:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_profile(self, profile: schemas.ProfileCreate):
        db_profile = models.Profile(
            uuid=profile.uuid,
            username=profile.username,
            email=profile.email
        )
        self.db.add(db_profile)
        await self.db.commit()
        await self.db.refresh(db_profile)
        return db_profile

    async def get_profile(self, username: str) -> models.Profile:
        result = await self.db.execute(
            select(models.Profile).where(models.Profile.username == username)
        )
        return result.scalar_one_or_none()

    async def get_profile_by_email(self, email: str) -> models.Profile:
        result = await self.db.execute(
            select(models.Profile).where(models.Profile.email == email)
        )
        return result.scalar_one_or_none()

    async def update_profile(
        self,
        username: str,
        profile_update: schemas.ProfileUpdate
    ):
        db_profile = await self.get_profile(username)
        if not db_profile:
            return None
        update_data = profile_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_profile, field, value)
        await self.db.commit()
        await self.db.refresh(db_profile)
        return db_profile

    async def delete_profile(self, username: str) -> models.Profile:
        db_profile = await self.get_profile(username)
        if db_profile:
            await self.db.delete(db_profile)
            await self.db.commit()
        return db_profile
