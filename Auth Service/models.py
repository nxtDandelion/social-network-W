from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    uuid = Column(String(32), primary_key=True, index=True)
    username = Column(String(24), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(16), nullable=False)
    login = Column(String(24), unique=True, index=True, nullable=False)
    password = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), onupdate=func.now())

    tokens = relationship("Token", back_populates="user")

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    uuid = Column(String(32), ForeignKey("users.uuid"), nullable=False)
    jwt = Column(Text, nullable=False)
    token_type = Column(String(10), nullable=False, default="refresh")
    ip = Column(String(16), nullable=False)
    expires_at = Column(DateTime(timezone=False), nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), onupdate=func.now())

    user = relationship("User", back_populates="tokens")