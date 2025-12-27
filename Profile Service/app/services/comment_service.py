from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import logging
from app.schemas import comment as schemas
from app.crud.comment import CommentCRUD
from app.crud.profile import ProfileCRUD
from app.crud.post import PostCRUD


class CommentService:
    def __init__(self, db: AsyncSession):
        self.crud = CommentCRUD(db)
        self.profile_crud = ProfileCRUD(db)
        self.post_crud = PostCRUD(db)

    async def create_comment(
        self,
        profile_id: str,
        comment_data: schemas.CommentCreate
    ):

        logging.info(f"Creating comment for post {comment_data.post_id} by profile {profile_id}")

        if not await self.profile_crud.get_profile(profile_id):
            logging.error(f"Profile not found: {profile_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        if not await self.post_crud.get_post(comment_data.post_id):
            logging.error(f"Post not found: {comment_data.post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        comment = await self.crud.create_comment(
            profile_id,
            comment_data.model_dump()
        )
        logging.info(f"Comment created: id={comment.id}")
        return schemas.CommentResponse.model_validate(comment)

    async def update_comment(
        self,
        comment_id: int,
        profile_id: str,
        comment_data: schemas.CommentUpdate
    ):
        logging.info(f"Updating comment {comment_id} by profile {profile_id}")
        comment = await self.crud.get_comment(comment_id)
        if not comment:
            logging.error(f"Comment not found: {comment_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )

        if comment.profile_id != profile_id:
            logging.error(f"Unauthorized update attempt by profile {profile_id} on comment {comment_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this comment"
            )

        updated_comment = await self.crud.update_comment(
            comment_id,
            comment_data.model_dump(exclude_unset=True)
        )
        logging.info(f"Comment updated: id={comment_id}")
        return schemas.CommentResponse.model_validate(updated_comment)

    async def delete_comment(self, comment_id: int, profile_id: str):
        logging.info(f"Deleting comment {comment_id} by profile {profile_id}")
        comment = await self.crud.get_comment(comment_id)
        if not comment:
            logging.error(f"Comment not found: {comment_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )

        if comment.profile_id != profile_id:
            logging.error(f"Unauthorized delete attempt by profile {profile_id} on comment {comment_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this comment"
            )

        success = await self.crud.delete_comment(comment_id)
        if not success:
            logging.error(f"Failed to delete comment {comment_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete comment"
            )

        logging.info(f"Comment deleted: id={comment_id}")
        return {"message": "Comment deleted successfully"}

    async def get_post_comments(
        self,
        post_id: int,
        skip: int = 0,
        limit: int = 100
    ):
        logging.info(f"Getting comments for post {post_id}, skip={skip}, limit={limit}")
        if not await self.post_crud.get_post(post_id):
            logging.warning(f"Post not found: {post_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        comments = await self.crud.get_post_comments(post_id, skip, limit)
        return [
            schemas.CommentResponse.model_validate(comment)
            for comment in comments
        ]
