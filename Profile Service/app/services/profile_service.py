from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas import profile as schemas
from app.crud.profile import ProfileCRUD


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.crud = ProfileCRUD(db)

    async def create_profile(self, profile: schemas.ProfileCreate):
        existing_username = await self.crud.get_profile_by_username(
            profile.username
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        if profile.email:
            existing_email = await self.crud.get_profile_by_email(
                profile.email
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )

        db_profile = await self.crud.create_profile(profile)
        return schemas.ProfileResponse.model_validate(db_profile)
