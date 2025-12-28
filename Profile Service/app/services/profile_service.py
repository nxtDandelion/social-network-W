import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, Depends
from app.schemas import profile as schemas
from app.crud.profile import ProfileCRUD
from app.rabbitmq import rabbitmq
from datetime import datetime


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.crud = ProfileCRUD(db)

    async def create_profile(self, profile: schemas.ProfileCreate):
        logging.info(f"Creating profile for username: {profile.username}")
        existing_username = await self.crud.get_profile(
            profile.username
        )
        if existing_username:
            logging.warning(f"Username already exists: {profile.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        if profile.email:
            existing_email = await self.crud.get_profile_by_email(
                profile.email
            )
            if existing_email:
                logging.warning(f"Email already exists: {profile.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        db_profile = await self.crud.create_profile(profile)
        logging.info(f"Profile created: username={db_profile.username}, uuid={db_profile.uuid}")
        event_data = {
            "uuid": db_profile.uuid,
            "username": db_profile.username,
            "photo": True,
        }
        logging.info(f"event_data: {event_data}")
        try:
            await rabbitmq.rabbitmq_service.send_profile_created(event_data)
            logging.info("Profile creation event sent successfully")
        except Exception as e:
            logging.error(f"Failed to send profile creation event: {e}")
        return schemas.ProfileResponse.model_validate(db_profile)

    async def get_profile(self, profile_uuid: str) -> schemas.ProfileResponse:
        logging.info(f"Getting profile: {profile_uuid}")
        db_profile = await self.crud.get_profile(profile_uuid)
        if not db_profile:
            logging.warning(f"Profile not found: {profile_uuid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        logging.info(f"Profile found: {profile_uuid}")
        return schemas.ProfileResponse.model_validate(db_profile)

    async def update_profile(
        self,
        profile_username: str,
        profile_update: schemas.ProfileUpdate
    ):
        logging.info(f"Updating profile: {profile_username}")
        profile = await self.crud.get_profile_by_username(profile_username)
        profile_uuid = profile.uuid
        if profile_update.username:
            existing_profile = await self.crud.get_profile_by_username(
                profile_update.username
            )
            if existing_profile and existing_profile.uuid != profile_uuid:
                logging.warning(f"Username already exists: {profile_update.username}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )
        if profile_update.email:
            existing_profile = await self.crud.get_profile_by_email(
                profile_update.email
            )
            if existing_profile and existing_profile.uuid != profile_uuid:
                logging.warning(f"Email already exists: {profile_update.email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
        if profile_update.login:
            existing_profile = await self.crud.get_profile_by_login(
                profile_update.login
            )
            if existing_profile and existing_profile.uuid != profile_uuid:
                logging.warning(f"Login already exists: {profile_update.login}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Login already exists"
                )
        db_profile = await self.crud.update_profile(
            profile_username,
            profile_update
        )
        if not db_profile:
            logging.warning(f"Profile not found during update: {profile_username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        logging.info(f"Profile updated: {profile_username}")

        event_data = {
            "uuid": profile_uuid,
            **profile_update.dict(exclude_unset=True)
        }

        if profile_update.username is None:
            event_data["username"] = db_profile.username
        if profile_update.email is None:
            event_data["email"] = db_profile.email

        logging.info(f"Profile update data: {event_data}")

        try:
            await rabbitmq.rabbitmq_service.send_profile_updated(event_data)
            logging.info("Profile update event sent successfully")
        except Exception as e:
            logging.error(f"Failed to send profile update event: {e}")
        return schemas.ProfileResponse.model_validate(db_profile)

    async def delete_profile(self, profile_uuid: str):
        logging.info(f"Deleting profile: {profile_uuid}")
        db_profile = await self.crud.delete_profile(profile_uuid)
        if not db_profile:
            logging.warning(f"Profile not found during delete: {profile_uuid}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        logging.info(f"Profile deleted: {profile_uuid}")
        return {"message": "Profile deleted successfully"}
