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


@router.get("/{profile_uuid}", response_model=schemas.ProfileResponse)
async def get_profile(
    profile_uuid: str,
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    return await service.get_profile(profile_uuid)


@router.put("/{profile_uuid}", response_model=schemas.ProfileResponse)
async def update_profile(
    profile_uuid: str,
    profile_update: schemas.ProfileUpdate,
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    return await service.update_profile(profile_uuid, profile_update)


@router.delete("/{profile_uuid}")
async def delete_profile(
    profile_uuid: str,
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    await service.delete_profile(profile_uuid)
