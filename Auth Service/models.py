from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    uuid = Column(String(32), primary_key=True, index=True)
    role = Column(String(16), nullable=False)
    login = Column(String(24), unique=True, index=True, nullable=False)
    password = Column(String(24), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tokens = relationship("Token", back_populates="user")

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    uuid = Column(String(32), ForeignKey("users.uuid"), nullable=False)
    jwt = Column(Text, nullable=False)
    ip = Column(String(16), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="tokens")