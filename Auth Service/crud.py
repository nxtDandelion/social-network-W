from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from datetime import timedelta
import models
import schemas
import security
import uuid
from datetime import datetime
import logging

class UserCRUD:
    @staticmethod
    async def create_user(db: AsyncSession, user: schemas.UserCreate) -> models.User:
        user_uuid = str(uuid.uuid4().hex)[:32]
        hashed_password = security.get_password_hash(user.password)
        db_user = models.User(
            uuid=user_uuid,
            username = user.username,
            login = user.login,
            email = user.email,
            password = hashed_password,
            role = user.role,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def get_user_by_login(db: AsyncSession, login: str) -> models.User:
        result = await db.execute(
            select(models.User).where(models.User.login == login)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> models.User:
        result = await db.execute(
            select(models.User).where(models.User.username == username)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_uuid(db: AsyncSession, user_uuid: str) -> models.User:
        result = await db.execute(
            select(models.User).where(models.User.uuid == user_uuid)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> models.User:
        result = await db.execute(
            select(models.User).where(models.User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_profile(db: AsyncSession, user_uuid: str, user_update: schemas.UserUpdate) -> models.User:
        update_data = user_update.model_dump(exclude_unset=True)
        if 'password' in update_data:
            update_data['password'] = security.get_password_hash(update_data['password'])
        if update_data:
            query = update(models.User).where(
                models.User.uuid == user_uuid
            ).values(**update_data)
            await db.execute(query)
            await db.commit()
            return await UserCRUD.get_user_by_uuid(db, user_uuid)
        logging.error("No update")
        return None


    @staticmethod
    async def authenticate_user(db: AsyncSession, login: str, password: str) -> models.User:
        user = await UserCRUD.get_user_by_login(db, login)
        if not user:
            return None
        if not security.verify_password(password, user.password):
            return None
        return user


class TokenCRUD:
    @staticmethod
    async def create_token(db: AsyncSession, token_data: dict) -> models.Token:
        db_token = models.Token(**token_data)
        db.add(db_token)
        await db.commit()
        await db.refresh(db_token)
        return db_token

    @staticmethod
    async def get_token_by_jwt(db: AsyncSession, jwt_token: str) -> models.Token:
        result = await db.execute(
            select(models.Token).where(models.Token.jwt == jwt_token)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_token(db: AsyncSession, token_id: int):
        await db.execute(
            delete(models.Token).where(models.Token.id == token_id)
        )
        await db.commit()

    @staticmethod
    async def delete_expired_tokens(db: AsyncSession):
        await db.execute(
            delete(models.Token).where(models.Token.expires_at < datetime.utcnow())
        )
        await db.commit()

    @staticmethod
    async def delete_token_by_jwt(db: AsyncSession, jwt_token: str):
        result = await db.execute(
            delete(models.Token).where(models.Token.jwt == jwt_token)
        )
        await db.commit()

    @staticmethod
    async def create_token_pair(db: AsyncSession, user: models.User, ip: str) -> schemas.TokenResponse:
        access_token_data = {
            "userid": user.uuid,
            "login": user.login,
            "role": user.role,
            "type": "access"
        }
        access_token = security.create_access_token(access_token_data)

        refresh_token_data = {
            "userid": user.uuid,
            "login": user.login,
            "role": user.role,
            "type": "refresh"
        }
        refresh_token = security.create_refresh_token(refresh_token_data)

        refresh_token_expires = datetime.utcnow() + timedelta(days=7)
        await TokenCRUD.create_token(db, {
            "uuid": user.uuid,
            "jwt": refresh_token,
            "token_type": "refresh",
            "ip": ip,
            "expires_at": refresh_token_expires
        })

        return schemas.TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )