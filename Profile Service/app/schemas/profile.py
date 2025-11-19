from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class ProfileBase(BaseModel):
    username: str = Field(description="Username")
    email: Optional[EmailStr] = Field(default=None, description="Почта")
    tag: Optional[str] = Field(default=None, description="Тэг")
    photo: Optional[str] = Field(
        default=None,
        description="Ссылка на аватарку"
    )


class ProfileCreate(ProfileBase):
    pass


class ProfileResponse(BaseModel):
    uuid: str = Field(..., description="Идентификатор профиля")
    username: str = Field(..., description="Username")
    email: Optional[str] = Field(default=None, description="Почта")
    photo: Optional[str] = Field(
        default=None,
        description="Ссылка на аватарку"
    )
    subscribers: Dict[str, Any] = Field(
        default_factory=dict,
        description="Подписчики"
    )
    subscribers_amount: int = Field(
        default=0,
        description="Количество подписчиков"
    )
    user_posts: Dict[str, Any] = Field(
        default_factory=dict,
        description="Посты пользователя"
    )
    tag: Optional[str] = Field(default=None, description="Тег")

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    username: Optional[str] = Field(default=None, description="Username")
    email: Optional[EmailStr] = Field(default=None, description="Почта")
    tag: Optional[str] = Field(default=None, description="Тег")
    photo: Optional[str] = Field(
        default=None,
        description="Ссылка на аватарку"
    )
