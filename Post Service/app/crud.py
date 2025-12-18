from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from . import models, schemas
import logging

async def create_profile(db: AsyncSession, profile: schemas.ProfileCreate):
    db_profile = models.Profile(
        uuid=profile.uuid,
        username=profile.username
    )
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)
    return db_profile

async def update_profile(db: AsyncSession, profile_uuid: str, profile_update: schemas.ProfileUpdate):
    update_data = profile_update.model_dump()
    logging.error(f"Full update data: {update_data}")
    filtered_data = {k: v for k, v in update_data.items() if v is not None}
    logging.error(f"Filtered update data (without None): {filtered_data}")
    if filtered_data:
        if 'subscribes' in filtered_data:
            stmt = (
                update(models.Profile)
                .where(models.Profile.uuid == profile_uuid)
                .values(subscribes=filtered_data['subscribes'])
            )
            await db.execute(stmt)
            await db.commit()
        stmt = (
            update(models.Profile)
            .where(models.Profile.uuid == profile_uuid)
            .values(**filtered_data)
        )
        await db.execute(stmt)
        await db.commit()

    result = await db.execute(
        select(models.Profile).where(models.Profile.uuid == profile_uuid)
    )
    return result.scalars().first()

async def delete_profile(db: AsyncSession, profile_uuid: str):
    stmt = delete(models.Profile).where(models.Profile.uuid == profile_uuid)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Profile deleted successfully"}

async def get_profile(db: AsyncSession, profile_uuid: str):
    result = await db.execute(
        select(models.Profile).where(models.Profile.uuid == profile_uuid)
    )
    return result.scalars().first()

async def follow_profile(db: AsyncSession, follower_uuid: str, followed_uuid: str):
    return {"message": "???"}

async def unfollow_profile(db: AsyncSession, follower_uuid: str, followed_uuid: str):
    return {"message": "???"}

async def create_post(db: AsyncSession, post: schemas.PostCreate, profile_id: str):
    db_post = models.Post(
        text=post.text,
        profile_id=profile_id,
        likes_amount=0,
        edited=False,
        likers=[]
    )
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return db_post

async def get_post(db: AsyncSession, post_id: int):
    result = await db.execute(
        select(models.Post).where(models.Post.id == post_id)
    )
    return result.scalars().first()


async def get_posts_feed(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(models.Post, models.Profile.username, models.Profile.photo)
        .join(models.Profile, models.Post.profile_id == models.Profile.uuid)
        .order_by(models.Post.create_date.desc())
        .offset(skip)
        .limit(limit)
    )

    posts_with_username = result.all()
    posts_list = []
    for post, username, photo in posts_with_username:
        post_dict = {
            "id": post.id,
            "text": post.text,
            "profile_id": post.profile_id,
            "likes_amount": post.likes_amount,
            "comments_amount": post.comments_amount,
            "create_date": post.create_date,
            "edited": post.edited,
            "likers": post.likers or [],
            "username": username,
            "photo": photo
        }
        posts_list.append(post_dict)
    return posts_list


async def get_subscribe_feed(db: AsyncSession, username: str, skip: int = 0, limit: int = 100):
    profile_result = await db.execute(
        select(models.Profile).where(models.Profile.username == username)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return []
    subscribes = profile.subscribes or {}
    if not subscribes:
        return []
    subscribed_uuids = []
    for user_info in subscribes.values():
        if isinstance(user_info, dict) and "uuid" in user_info:
            subscribed_uuids.append(user_info["uuid"])
    if not subscribed_uuids:
        return []
    result = await db.execute(
        select(models.Post, models.Profile.username, models.Profile.photo)
        .join(models.Profile, models.Post.profile_id == models.Profile.uuid)
        .where(models.Post.profile_id.in_(subscribed_uuids))
        .order_by(models.Post.create_date.desc())
        .offset(skip)
        .limit(limit)
    )
    posts_with_username = result.all()
    posts_list = []
    for post, username, photo in posts_with_username:
        post_dict = {
            "id": post.id,
            "text": post.text,
            "profile_id": post.profile_id,
            "likes_amount": post.likes_amount,
            "comments_amount": post.comments_amount,
            "create_date": post.create_date,
            "edited": post.edited,
            "likers": post.likers or [],
            "username": username,
            "photo": photo
        }
        posts_list.append(post_dict)
    return posts_list

async def get_profile_posts(db: AsyncSession, profile_id: str):
    result = await db.execute(
        select(models.Post)
        .where(models.Post.profile_id == profile_id)
        .order_by(models.Post.create_date.desc())
    )
    return result.scalars().all()

async def update_post(db: AsyncSession, post_id: int, post_update: schemas.PostUpdate, profile_id: str):
    post = await get_post(db, post_id)
    if not post:
        return None
    if post.profile_id != profile_id:
        return None
    
    stmt = (
        update(models.Post)
        .where(models.Post.id == post_id)
        .values(text=post_update.text, edited=True)
    )
    await db.execute(stmt)
    await db.commit()
    
    result = await db.execute(
        select(models.Post).where(models.Post.id == post_id)
    )
    return result.scalars().first()

async def delete_post(db: AsyncSession, post_id: int, profile_id: str):
    post = await get_post(db, post_id)
    if not post:
        return {"message": "Post not found"}
    if post.profile_id != profile_id:
        return {"message": "Not authorized to delete this post"}
    
    stmt = delete(models.Post).where(models.Post.id == post_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Post deleted successfully"}

async def like_post(db: AsyncSession, post_id: int, profile_id: str):
    post = await get_post(db, post_id)
    if post and profile_id not in post.likers:
        post.likers.append(profile_id)
        post.likes_amount = len(post.likers)
        flag_modified(post, "likers")
        await db.commit()
        await db.refresh(post)
    return post

async def unlike_post(db: AsyncSession, post_id: int, profile_id: str):
    post = await get_post(db, post_id)
    if post and profile_id in post.likers:
        post.likers.remove(profile_id)
        post.likes_amount = len(post.likers)
        flag_modified(post, "likers")
        await db.commit()
        await db.refresh(post)
    return post

async def create_comment(db: AsyncSession, comment: schemas.CommentCreate, post_id: int, profile_id: str):
    db_comment = models.Comment(
        text=comment.text,
        post_id=post_id,
        profile_id=profile_id,
        edited=False
    )
    db.add(db_comment)
    post = (
        update(models.Post)
        .where(models.Post.id == post_id)
        .values(comments_amount=models.Post.comments_amount + 1)
    )
    await db.execute(post)
    await db.commit()
    await db.refresh(db_comment)
    return db_comment

async def get_comments_by_post(db: AsyncSession, post_id: int):
    result = await db.execute(
        select(models.Comment, models.Profile.username, models.Profile.photo)
        .join(models.Profile, models.Comment.profile_id == models.Profile.uuid)
        .where(models.Comment.post_id == post_id)
        .order_by(models.Comment.create_date.asc())
    )
    comments_with_profile = result.all()
    comments_list = []
    for comment, username, photo in comments_with_profile:
        comment_dict = {
            "id": comment.id,
            "text": comment.text,
            "post_id": comment.post_id,
            "profile_id": comment.profile_id,
            "likes_amount": comment.likes_amount,
            "create_date": comment.create_date,
            "edited": comment.edited,
            "likers": comment.likers or [],
            "username": username,
            "photo": photo
        }
        comments_list.append(comment_dict)

    return comments_list

async def get_comment(db: AsyncSession, comment_id: int):
    result = await db.execute(
        select(models.Comment).where(models.Comment.id == comment_id)
    )
    return result.scalars().first()

async def update_comment(db: AsyncSession, comment_id: int, comment_update: schemas.CommentUpdate, profile_id: str):
    comment = await get_comment(db, comment_id)
    if not comment:
        return None
    if comment.profile_id != profile_id:
        return None
    
    stmt = (
        update(models.Comment)
        .where(models.Comment.id == comment_id)
        .values(text=comment_update.text, edited=True)
    )
    await db.execute(stmt)
    await db.commit()
    
    result = await db.execute(
        select(models.Comment).where(models.Comment.id == comment_id)
    )
    return result.scalars().first()

async def delete_comment(db: AsyncSession, comment_id: int, profile_id: str):
    result = await db.execute(
        select(models.Comment, models.Post.id.label("post_id"))
        .join(models.Post, models.Comment.post_id == models.Post.id)
        .where(models.Comment.id == comment_id)
    )
    row = result.first()
    if not row:
        return {"message": "Comment not found"}
    comment, post_id = row
    if comment.profile_id != profile_id:
        return {"message": "Not authorized to delete this comment"}

    await db.delete(comment)
    stmt = (
        update(models.Post)
        .where(models.Post.id == post_id)
        .where(models.Post.comments_amount > 0)
        .values(comments_amount=models.Post.comments_amount - 1)
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "Comment deleted successfully"}

async def like_comment(db: AsyncSession, comment_id: int, profile_id: str):
    comment = await get_comment(db, comment_id)
    if comment and profile_id not in comment.likers:
        comment.likers.append(profile_id)
        comment.likes_amount = len(comment.likers)
        flag_modified(comment, "likers")
        await db.commit()
        await db.refresh(comment)
    return comment

async def unlike_comment(db: AsyncSession, comment_id: int, profile_id: str):
    comment = await get_comment(db, comment_id)
    if comment and profile_id in comment.likers:
        comment.likers.remove(profile_id)
        comment.likes_amount = len(comment.likers)
        flag_modified(comment, "likers")
        await db.commit()
        await db.refresh(comment)
    return comment
