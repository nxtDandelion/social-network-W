from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas import follow as schemas
from app.crud.follow import FollowCRUD


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

        return schemas.FollowResponse(
            follower_id=follower_id,
            following_id=following_id
        )
