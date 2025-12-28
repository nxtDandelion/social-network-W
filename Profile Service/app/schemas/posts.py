from dataclasses import Field

from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class PostBase(BaseModel):
    id: int
    text: str


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    text: Optional[str] = None


class PostResponse(PostBase):
    id: int
    profile_id: str
    likes_amount: int
    create_date: datetime
    edited: bool
    likers: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)


class PostsListResponse(BaseModel):
    posts: List[PostResponse]
    total: int


# ??????
class LikeResponse(BaseModel):
    post_id: int
    profile_id: str
    liked: bool
# ??????
