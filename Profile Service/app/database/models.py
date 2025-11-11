from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, JSON, VARCHAR, \
    LargeBinary, DateTime, Boolean
from app.database.database import Base


class Profile(Base):
    __tablename__ = "profile"

    uuid = Column(
        VARCHAR,
        primary_key=True,
        index=True,
        autoincrement=True
    )
    username = Column(VARCHAR)
    email = Column(VARCHAR)
    photo = Column(LargeBinary)
    subscribers = Column(JSON)
    subscribers_amount = Column(Integer)
    user_posts = Column(JSON)
    tag = Column(VARCHAR)


class Comment(Base):
    __tablename__ = "comment"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )
    text = Column(VARCHAR)
    post_id = relationship("Post", back_populates="id")
    profile_id = relationship("profile", back_populates="uuid")
    create_date = Column(DateTime)
    edited = Column(Boolean)


class Post(Base):
    __tablename__ = "post"

    id = Column(Integer, primary_key=True,
                index=True,
                autoincrement=True)
    text = Column(VARCHAR)
    profile_id = relationship("profile", back_populates="uuid")
    likes_amount = Column(Integer)
    create_date = Column(DateTime)
    edited = Column(Boolean)
    likers = Column(JSON)
