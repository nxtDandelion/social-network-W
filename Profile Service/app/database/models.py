from sqlalchemy.sql import func
from sqlalchemy import Column, Integer, JSON, VARCHAR, \
    LargeBinary, DateTime, Boolean, ForeignKey
from app.database.database import Base


class Profile(Base):
    __tablename__ = "profile"

    uuid = Column(
        VARCHAR(32),
        primary_key=True,
        index=True,
        nullable=False
    )
    username = Column(VARCHAR(24), nullable=False, unique=True)
    email = Column(VARCHAR(100), unique=True)
    photo = Column(LargeBinary, nullable=True)
    subscribers = Column(JSON, default=dict)
    subscribers_amount = Column(Integer, default=0)
    user_posts = Column(JSON, default=dict)
    tag = Column(VARCHAR, nullable=True)


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
    likes_amount = Column(Integer)
    create_date = Column(DateTime, server_default=func.now())
    edited = Column(Boolean, default=False)
    likers = Column(JSON, default=dict)
