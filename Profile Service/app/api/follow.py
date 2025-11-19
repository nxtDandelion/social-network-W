from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas import follow as schemas
from app.services.follow_service import FollowService


router = APIRouter(tags=['follow'])


@router.post("/{username}/follow", response_model=schemas.FollowResponse)
async def follow_user(
    current_user: str,
    username: str,
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    return await service.follow_user(current_user, username)


@router.delete("/{username}/follow", response_model=schemas.FollowResponse)
async def unfollow_user(
    current_user: str,
    username: str,
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    return await service.unfollow_user(current_user, username)


@router.get(
        "/{username}/followers",
        response_model=schemas.FollowersListResponse
    )
async def get_followers(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    return await service.get_followers(username)


@router.get(
        "/{username}/following",
        response_model=schemas.FollowingListResponse
    )
async def get_following(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    return await service.get_following(username)
