from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from app.database import models
from app.crud.profile import ProfileCRUD
import logging


class PostCRUD:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_crud = ProfileCRUD(db)

    async def create_post(self, post_data: dict):
        post = models.Post(
            id=post_data["id"],
            text=post_data["text"],
            profile_id=post_data["profile_id"],
            likes_amount=0,
            likers={}
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        logging.error(f"Post created: {post}")
        return post

    async def get_post(self, post_id: int) -> models.Post:
        result = await self.db.execute(
            select(models.Post).where(models.Post.id == post_id)
        )
        return result.scalar_one_or_none()

    async def update_post(self, post_data: dict):
        post_id = post_data.get("id")
        post = await self.get_post(post_id)
        if not post:
            return None

        if "text" in post_data:
            post.text = post_data["text"]
            post.edited = True

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def delete_post(self, post_id: int) -> bool:
        post = await self.get_post(post_id)
        if not post:
            return False

        await self.db.delete(post)
        await self.db.commit()
        return True

    async def like_post(self, post_id: int, user_id):
        post = await self.get_post(post_id)
        if not post:
            return None
        if post.likers is None:
            post.likers = {}
        post.likers[user_id] = True
        post.likes_amount = len(post.likers)
        flag_modified(post, "likers")

        await self.db.commit()
        await self.db.refresh(post)
        return post

    async def unlike_post(self, post_id: int, profile_id: str):
        post = await self.get_post(post_id)
        if not post:
            return None

        if post.likers is None:
            post.likers = {}

        if profile_id in post.likers:
            del post.likers[profile_id]
            post.likes_amount = len(post.likers)
            flag_modified(post, "likers")
            await self.db.commit()
            await self.db.refresh(post)

        return post

    async def get_user_posts(
        self,
        profile_id: str,
        skip: int = 0, limit:
        int = 100
    ):
        result = await self.db.execute(
            select(models.Post)
            .where(models.Post.profile_id == profile_id)
            .offset(skip)
            .limit(limit)
            .order_by(models.Post.create_date.desc())
        )
        return result.scalars().all()

    async def is_post_liked(self, post_id: int, profile_id: str) -> bool:
        post = await self.get_post(post_id)
        if not post or post.likers is None:
            return False
        return profile_id in post.likers
