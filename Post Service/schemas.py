from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProfileBase(BaseModel):
    uuid: str
    username: str
    tag: str

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    tag: Optional[str] = None

class Profile(ProfileBase):
    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: str

class Comment(CommentBase):
    id: int
    post_id: int
    profile_id: str
    create_date: datetime
    edited: bool
    
    class Config:
        from_attributes = True

class PostBase(BaseModel):
    text: str

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    text: str

class Post(PostBase):
    id: int
    profile_id: str
    likes_amount: int
    create_date: datetime
    edited: bool
    likers: List[str]
    
    class Config:
        from_attributes = True

class PostWithComments(Post):
    comments: List[Comment] = []
