from sqlalchemy import Column, Integer, JSON, VARCHAR, \
    LargeBinary, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

Base = declarative_base()

class Profile(Base):
    __tablename__ = "profile"

    uuid = Column(
        VARCHAR(32),
        primary_key=True,
        index=True,
        nullable=False
    )
    username = Column(VARCHAR(24), nullable=False)
    photo = Column(LargeBinary)
    tag = Column(VARCHAR)
    
    posts = relationship("Post", back_populates="profile")
    comments = relationship("Comment", back_populates="profile")


class Comment(Base):
    __tablename__ = "comment"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )
    text = Column(VARCHAR(100), nullable=False)
    post_id = Column(Integer, ForeignKey("post.id"), nullable=False)
    profile_id = Column(
        VARCHAR(100),
        ForeignKey("profile.uuid"),
        nullable=False
    )
    create_date = Column(DateTime, server_default=func.now())
    edited = Column(Boolean, default=False)
    
    post = relationship("Post", back_populates="comments")
    profile = relationship("Profile", back_populates="comments")


class Post(Base):
    __tablename__ = "post"

    id = Column(Integer, primary_key=True,
                index=True,
                autoincrement=True)
    text = Column(VARCHAR(100))
    profile_id = Column(
        VARCHAR(100),
        ForeignKey("profile.uuid"),
        nullable=False
    )
    likes_amount = Column(Integer, default=0)
    create_date = Column(DateTime, server_default=func.now())
    edited = Column(Boolean, default=False)
    likers = Column(JSON, default=[])
    
    profile = relationship("Profile", back_populates="posts")
    comments = relationship("Comment", back_populates="post")
