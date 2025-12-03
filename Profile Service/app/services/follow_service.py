from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas import follow as schemas
from app.database import models
from app.crud.follow import FollowCRUD
from app.schemas import profile as profile_schema
from app.rabbitmq import rabbitmq
import logging


class FollowService:
    def __init__(self, db: AsyncSession):
        self.crud = FollowCRUD(db)

    async def follow_user(self, follower_id: str, following_id: str):
        if follower_id == following_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trying to follow yourself"
            )

        if not await self.crud.get_profile_exists(follower_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Follower profile not found"
            )

        if not await self.crud.get_profile_exists(following_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Following profile not found"
            )

        if await self.crud.get_follow_exists(follower_id, following_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Follow already exists"
            )
        await self.crud.follow_user(follower_id, following_id)
        profile = await self.crud.get_profile(follower_id)
        profile = profile_schema.ProfileResponse.model_validate(profile)
        event_data = {
            "user_id": follower_id,
            "update_data": profile.model_dump(exclude_unset=True)
        }
        try:
            await rabbitmq.rabbitmq_service.send_profile_updated(event_data)
            logging.error("Profile follow event sent successfully")
        except Exception as e:
            logging.error(f"Failed to send profile follow event: {e}")
        return schemas.FollowResponse(
            follower_id=follower_id,
            following_id=following_id
        )

    async def unfollow_user(self, follower_id: str, following_id: str):
        if not await self.crud.get_profile_exists(follower_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Follower profile not found"
            )

        if not await self.crud.get_profile_exists(following_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Following profile not found"
            )

        if not await self.crud.get_follow_exists(follower_id, following_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Follow does not exist"
            )

        await self.crud.unfollow_user(follower_id, following_id)
        profile = await self.crud.get_profile(follower_id)
        profile = profile_schema.ProfileResponse.model_validate(profile)
        event_data = {
            "user_id": follower_id,
            "update_data": profile.model_dump(exclude_unset=True)
        }
        try:
            await rabbitmq.rabbitmq_service.send_profile_updated(event_data)
            logging.error("Profile unfollow event sent successfully")
        except Exception as e:
            logging.error(f"Failed to send profile unfollow event: {e}")
        return schemas.FollowResponse(
            follower_id=follower_id,
            following_id=following_id
        )

    async def get_followers(self, profile_id: str):
        if not await self.crud.get_profile_exists(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        followers = await self.crud.get_followers_list(profile_id)
        followers_count = await self.crud.get_followers_count(profile_id)

        return schemas.FollowersListResponse(
            profile_id=profile_id,
            followers=followers,
            followers_count=followers_count
        )

    async def get_following(self, profile_id: str):
        if not await self.crud.get_profile_exists(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        followings = await self.crud.get_following_list(profile_id)
        followings_count = await self.crud.get_following_count(profile_id)

        return schemas.FollowingListResponse(
            profile_id=profile_id,
            followings=followings,
            followings_count=followings_count
        )
