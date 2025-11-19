from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas import profile as schemas
from app.services.profile_service import ProfileService


router = APIRouter(prefix='/profiles', tags=['profiles'])


@router.post("/", response_model=schemas.ProfileResponse)
async def create_profile(
    profile: schemas.ProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    return await service.create_profile(profile)
