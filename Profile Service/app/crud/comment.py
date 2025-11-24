from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import models


class CommentCRUD:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_comment(self, profile_id: str, comment_data: dict):
        comment = models.Comment(
            text=comment_data["text"],
            post_id=comment_data["post_id"],
            profile_id=profile_id,
            edited=False
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def get_comment(self, comment_id: int) -> models.Comment:
        result = await self.db.execute(
            select(models.Comment).where(models.Comment.id == comment_id)
        )
        return result.scalar_one_or_none()

    async def update_comment(self, comment_id: int, comment_data: dict):
        comment = await self.get_comment(comment_id)
        if not comment:
            return None

        if "text" in comment_data:
            comment.text = comment_data["text"]
            comment.edited = True

        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def delete_comment(self, comment_id: int) -> bool:
        comment = await self.get_comment(comment_id)
        if not comment:
            return False

        await self.db.delete(comment)
        await self.db.commit()
        return True

    async def get_post_comments(
        self,
        post_id: int,
        skip: int = 0,
        limit: int = 100
    ):
        result = await self.db.execute(
            select(models.Comment)
            .where(models.Comment.post_id == post_id)
            .offset(skip)
            .limit(limit)
            .order_by(models.Comment.create_date.asc())
        )
        return result.scalars().all()

    async def get_user_comments(
        self,
        profile_id: str,
        skip: int = 0,
        limit: int = 100
    ):
        result = await self.db.execute(
            select(models.Comment)
            .where(models.Comment.profile_id == profile_id)
            .offset(skip)
            .limit(limit)
            .order_by(models.Comment.create_date.desc())
        )
        return result.scalars().all()
