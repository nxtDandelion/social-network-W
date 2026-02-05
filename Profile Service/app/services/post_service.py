from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas import posts as schemas
from app.crud.post import PostCRUD
from app.crud.profile import ProfileCRUD


class PostService:
    def __init__(self, db: AsyncSession):
        self.crud = PostCRUD(db)
        self.profile_crud = ProfileCRUD(db)

    async def create_post(
        self,
        profile_id: str,
        post_data: schemas.PostCreate
    ):
        if not await self.profile_crud.get_profile(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.create_post(profile_id, post_data.dict())
        return schemas.PostResponse.model_validate(post)

    async def update_post(
        self,
        post_id: int,
        profile_id: str,
        post_data: schemas.PostUpdate
    ):
        post = await self.crud.get_post(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if post.profile_id != profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this post"
            )

        updated_post = await self.crud.update_post(
            post_id,
            post_data.dict(exclude_unset=True)
        )
        return schemas.PostResponse.model_validate(updated_post)

    async def delete_post(self, post_id: int, profile_id: str):
        post = await self.crud.get_post(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if post.profile_id != profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this post"
            )

        success = await self.crud.delete_post(post_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete post"
            )

        return {"message": "Post deleted successfully"}

    async def like_post(self, post_id: int, profile_id: str):
        if not await self.profile_crud.get_profile(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.like_post(post_id, profile_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        return schemas.LikeResponse(
            post_id=post_id,
            profile_id=profile_id,
            liked=True
        )

    async def unlike_post(self, post_id: int, profile_id: str):
        if not await self.profile_crud.get_profile(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.unlike_post(post_id, profile_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        return schemas.LikeResponse(
            post_id=post_id,
            profile_id=profile_id,
            liked=False
        )

    async def get_user_posts(
        self,
        profile_id: str,
        skip: int = 0,
        limit: int = 100
    ):
        if not await self.profile_crud.get_profile(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        posts = await self.crud.get_user_posts(profile_id, skip, limit)
        return schemas.PostsListResponse(
            posts=[
                schemas.PostResponse.model_validate(post) for post in posts
            ],
            total=len(posts)
        )
