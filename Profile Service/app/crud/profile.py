import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
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

    async def get_profile_by_id(self, id: str) -> models.Profile:
        result = await self.db.execute(
            select(models.Profile).where(models.Profile.uuid == id)
        )
        return result.scalar_one_or_none()

    async def get_profile_by_username(self, username: str) -> models.Profile:
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

    async def update_profile_by_id(
        self,
        id: str,
        profile_update: schemas.ProfileUpdate
    ):
        db_profile = await self.get_profile_by_id(id)
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

    async def add_post_to_profile(self, profile_uuid: str, post_id: int):
        db_profile = await self.db.get(models.Profile, profile_uuid)

        if db_profile:
            current_posts = db_profile.user_posts

            if current_posts is None:
                current_posts = []

            if post_id not in current_posts:
                current_posts.append(post_id)

            stmt = (
                update(models.Profile)
                .where(models.Profile.uuid == profile_uuid)
                .values(user_posts=current_posts)
            )
            await self.db.execute(stmt)
            await self.db.commit()
            await self.db.refresh(db_profile)

        return db_profile
