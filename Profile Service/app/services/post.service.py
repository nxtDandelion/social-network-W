import logging
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
        logging.info(f"Creating post by profile {profile_id}")

        if not await self.profile_crud.get_profile(profile_id):
            logging.warning(f"Profile not found: {profile_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.create_post(profile_id, post_data.dict())
        logging.info(f"Post created: id={post.id}")
        return schemas.PostResponse.model_validate(post)

    async def update_post(
        self,
        post_id: int,
        profile_id: str,
        post_data: schemas.PostUpdate
    ):
        logging.info(f"Updating post {post_id} by profile {profile_id}")

        post = await self.crud.get_post(post_id)
        if not post:
            logging.warning(f"Post not found: {post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if post.profile_id != profile_id:
            logging.warning(f"Unauthorized update attempt by profile {profile_id} on post {post_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this post"
            )

        updated_post = await self.crud.update_post(
            post_id,
            post_data.dict(exclude_unset=True)
        )
        logging.info(f"Post updated: id={post_id}")
        return schemas.PostResponse.model_validate(updated_post)

    async def delete_post(self, post_id: int, profile_id: str):
        logging.info(f"Deleting post {post_id} by profile {profile_id}")
        post = await self.crud.get_post(post_id)
        if not post:
            logging.warning(f"Post not found: {post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if post.profile_id != profile_id:
            logging.warning(f"Unauthorized delete attempt by profile {profile_id} on post {post_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this post"
            )

        success = await self.crud.delete_post(post_id)
        if not success:
            logging.error(f"Failed to delete post {post_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete post"
            )
        logging.info(f"Post deleted: id={post_id}")

        return {"message": "Post deleted successfully"}

    async def like_post(self, post_id: int, profile_id: str):
        logging.info(f"Like attempt: profile {profile_id} -> post {post_id}")
        if not await self.profile_crud.get_profile(profile_id):
            logging.warning(f"Profile not found: {profile_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.like_post(post_id, profile_id)
        if not post:
            logging.warning(f"Post not found: {post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        logging.info(f"Post liked: post {post_id} by profile {profile_id}")
        return schemas.LikeResponse(
            post_id=post_id,
            profile_id=profile_id,
            liked=True
        )

    async def unlike_post(self, post_id: int, profile_id: str):
        logging.info(f"Unlike attempt: profile {profile_id} -> post {post_id}")
        if not await self.profile_crud.get_profile(profile_id):
            logging.warning(f"Profile not found: {profile_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        post = await self.crud.unlike_post(post_id, profile_id)
        if not post:
            logging.warning(f"Post not found: {post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        logging.info(f"Post unliked: post {post_id} by profile {profile_id}")
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
        logging.info(f"Getting posts for profile {profile_id}, skip={skip}, limit={limit}")
        if not await self.profile_crud.get_profile(profile_id):
            logging.warning(f"Profile not found: {profile_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        posts = await self.crud.get_user_posts(profile_id, skip, limit)
        logging.info(f"Found {len(posts)} posts for profile {profile_id}")
        return schemas.PostsListResponse(
            posts=[
                schemas.PostResponse.model_validate(post) for post in posts
            ],
            total=len(posts)
        )
