from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import update # noqa
# from app.database import models
from app.crud.profile import ProfileCRUD


class FollowCRUD:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_crud = ProfileCRUD(db)

    async def follow_user(self, follower_id: str, following_id: str):
        follower = await self.profile_crud.get_profile(follower_id)
        following = await self.profile_crud.get_profile(following_id)

        follower.subscribes.update({
            following_id: {
                "uuid": following.uuid,
                "username": following.username,
                "photo": following.photo
            }
        })

        following.subscribers.update({
            follower_id: {
                "uuid": follower.uuid,
                "username": follower.username,
                "photo": follower.photo
            }
        })

        following.subscribers_amount = len(following.subscribers)
        flag_modified(follower, "subscribes")
        flag_modified(following, "subscribers")

        await self.db.commit()
        await self.db.refresh(following)
        await self.db.refresh(follower)
        return following

    async def get_profile_exists(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        return profile is not None

    async def get_profile(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        return profile

    async def get_follow_exists(self, follower_id: str, following_id: str):
        follower = await self.profile_crud.get_profile(follower_id)
        if not follower or not follower.subscribes:
            return False
        return following_id in follower.subscribes

    async def unfollow_user(self, follower_id: str, following_id: str):
        follower = await self.profile_crud.get_profile(follower_id)
        following = await self.profile_crud.get_profile(following_id)

        if following_id in follower.subscribes:
            del follower.subscribes[following_id]
        if follower_id in following.subscribers:
            del following.subscribers[follower_id]

        following.subscribers_amount = len(following.subscribers)

        flag_modified(follower, "subscribes")
        flag_modified(following, "subscribers")

        await self.db.commit()
        await self.db.refresh(following)
        await self.db.refresh(follower)
        return following

    async def get_followers_list(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        if not profile or not profile.subscribers:
            return []

        followers = []
        for follower_id, follower_data in profile.subscribers.items():
            followers.append({
                "uuid": follower_id,
                **follower_data
            })

        return followers

    async def get_following_list(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        if not profile or not profile.subscribes:
            return []

        followings = []
        for following_id, following_data in profile.subscribes.items():
            followings.append({
                "uuid": following_id,
                **following_data
            })

        return followings

    async def get_followers_count(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        if profile and profile.subscribers:
            return len(profile.subscribers)
        else:
            return 0

    async def get_following_count(self, profile_id: str):
        profile = await self.profile_crud.get_profile(profile_id)
        if profile and profile.subscribes:
            return len(profile.subscribes)
        else:
            return 0
