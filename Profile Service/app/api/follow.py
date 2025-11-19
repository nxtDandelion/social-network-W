from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas import follow as schemas
from app.services.follow_service import FollowService


router = APIRouter(tags=['follow'])


@router.post("/{profile_id}/follow", response_model=schemas.FollowResponse)
async def follow_user(
    current_user: str,
    profile_id: str,
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    return await service.follow_user(current_user, profile_id)
