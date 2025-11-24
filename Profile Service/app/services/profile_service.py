from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas import profile as schemas
from app.crud.profile import ProfileCRUD


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.crud = ProfileCRUD(db)

    async def create_profile(self, profile: schemas.ProfileCreate):
        existing_username = await self.crud.get_profile(
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

    async def get_profile(self, profile_uuid: str) -> schemas.ProfileResponse:
        db_profile = await self.crud.get_profile(profile_uuid)
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        return schemas.ProfileResponse.model_validate(db_profile)

    async def update_profile(
        self,
        profile_uuid: str,
        profile_update: schemas.ProfileUpdate
    ):
        if profile_update.username:
            existing_profile = await self.crud.get_profile_by_username(
                profile_update.username
            )
            if existing_profile and existing_profile.uuid != profile_uuid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )
        if profile_update.email:
            existing_profile = await self.crud.get_profile_by_email(
                profile_update.email
            )
            if existing_profile and existing_profile.uuid != profile_uuid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        db_profile = await self.crud.update_profile(
            profile_uuid,
            profile_update
        )
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        return schemas.ProfileResponse.model_validate(db_profile)

    async def delete_profile(self, profile_uuid: str):
        db_profile = await self.crud.delete_profile(profile_uuid)
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        return {"message": "Profile deleted successfully"}
