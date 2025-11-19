from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any


class FollowResponse(BaseModel):
    follower_id: str
    following_id: str
    model_config = ConfigDict(from_attributes=True)


class FollowersListResponse(BaseModel):
    profile_id: str
    followers: List[Dict[str, Any]]
    followers_count: int


class FollowingListResponse(BaseModel):
    profile_id: str
    following: List[Dict[str, Any]]
    following_count: int


class UserShortInfo(BaseModel):
    uuid: str
    username: str
    photo: str = None
    tag: str = None
    followed_at: str = None
