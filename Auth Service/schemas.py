from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
import json


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=24, description="Username")
    email: EmailStr = Field(..., description="Email address")
    login: str = Field(..., min_length=3, max_length=24, description="login")
    role: str = Field(default="user", description="User role")

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: Optional[datetime] = None

class UUIDMixin(BaseModel):
    uuid: str = Field(..., min_length=32, max_length=32, description="User UUID")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="Password")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=24)
    email: Optional[EmailStr] = None
    login: Optional[str] = Field(None, min_length=3, max_length=24)
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    role: Optional[str] = Field(None, description="User role")

class UserResponse(UserBase, UUIDMixin, TimestampMixin):
    class Config:
        from_attributes = True


class TokenCreate(BaseModel):
    login: str = Field(..., description="Username for login")
    password: str = Field(..., description="Password for login")
    ip: str = Field(..., description="Client IP address")

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")

class RefreshToken(BaseModel):
    refresh_token: str = Field(..., description="Refresh token")
    ip: str = Field(..., description="Client IP address")

class TokenPayload(BaseModel):
    sub: str
    login: str
    role: str
    exp: int

class UserRegisteredEvent(BaseModel):
    uuid: str
    username: str
    email: EmailStr

    def to_json(self) -> str:
        return json.dumps(self.dict())