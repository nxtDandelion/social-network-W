from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CommentBase(BaseModel):
    id: int
    text: str


class CommentCreate(CommentBase):
    post_id: int


class CommentUpdate(BaseModel):
    text: Optional[str] = None


class CommentResponse(CommentBase):
    id: int
    post_id: int
    profile_id: str
    create_date: datetime
    edited: bool
    model_config = ConfigDict(from_attributes=True)
