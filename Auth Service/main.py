from fastapi import FastAPI, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, wait_for_db, engine
from contextlib import asynccontextmanager
import schemas
import uvicorn
import models
import handlers
import security
import crud
import rabbitmq
import logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    await wait_for_db()
    await rabbitmq.rabbitmq_service.connect()

    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    await rabbitmq.rabbitmq_service.start_consuming(
        'auth_commands',
        handlers.handle_profile_update
    )
    yield
    await engine.dispose()
    await rabbitmq.rabbitmq_service.close()

app = FastAPI(title="Auth Service", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Auth Service is running"}

@app.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate,
                   db: AsyncSession = Depends(get_db),
                   rabbit_mq: rabbitmq.RabbitMqService = Depends(rabbitmq.get_rabbitmq)):
    db_user = await crud.UserCRUD.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail={
            "code": "USERNAME_EXISTS",
            "message": "Username already registered",})

    db_user = await crud.UserCRUD.get_user_by_login(db, user.login)
    if db_user:
        raise HTTPException(status_code=400, detail={
            "code": "LOGIN_EXISTS",
            "message": "Login already registered",})

    db_user_email = await crud.UserCRUD.get_user_by_email(db, user.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail={
            "code": "EMAIL_EXISTS",
            "message": "Email already registered",})

    new_user = await crud.UserCRUD.create_user(db, user)

    user_event = schemas.UserRegisteredEvent(
        uuid = new_user.uuid,
        username=new_user.username,
        email=new_user.email,)
    await rabbit_mq.send_user_register(user_event)
    return new_user


@app.post("/login")
async def login(auth_data: schemas.TokenCreate, db: AsyncSession = Depends(get_db)):
    user = await crud.UserCRUD.authenticate_user(db, auth_data.login, auth_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "DOES_NOT_EXIST",
                    "message": "Incorrect login or password",},
        )

    token_pair = await crud.TokenCRUD.create_token_pair(db, user, auth_data.ip)
    response = {
        "access_token": token_pair.access_token,
        "refresh_token": token_pair.refresh_token,
        "username": user.username
    }
    return response


@app.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_token(refresh_data: schemas.RefreshToken, db: AsyncSession = Depends(get_db)):
    db_token = await crud.TokenCRUD.get_token_by_jwt(db, refresh_data.refresh_token)
    if db_token is None:
        raise HTTPException(status_code=401, detail={
            "code": "INVALID_TOKEN",
            "message": "Invalid refresh token"})

    payload = security.verify_jwt_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        await crud.TokenCRUD.delete_token(db, db_token.id)
        raise HTTPException(status_code=401, detail={
            "code": "INVALID_REFRESH",
            "message": "Invalid refresh token"})

    user = await crud.UserCRUD.get_user_by_uuid(db, payload.get("userid"))
    if not user:
        await crud.TokenCRUD.delete_token(db, db_token.id)
        raise HTTPException(status_code=401, detail={
            "code": "USER_DOESNT_EXIST",
            "message": "User not found"})

    await crud.TokenCRUD.delete_token(db, db_token.id)

    token_pair = await crud.TokenCRUD.create_token_pair(db, user, refresh_data.ip)
    return token_pair


@app.post("/logout")
async def logout(refresh_token: str,
        db: AsyncSession = Depends(get_db),
        current_user: schemas.UserResponse = Depends(security.get_current_user)
):
    db_token = await crud.TokenCRUD.get_token_by_jwt(db, refresh_token)
    if db_token and db_token.uuid == current_user.uuid:
        await crud.TokenCRUD.delete_token(db, db_token.id)

    return {"message": "Successfully logged out"}


@app.post("/verify-token")
async def verify_token(
        token: str = Body(..., embed=True),
        db: AsyncSession = Depends(get_db)
):

    payload = security.verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail={
            "code": "INVALID_TOKEN",
            "message": "Invalid token"})

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail={
            "code": "NOT_ACCESS_TOKEN",
            "message": "Not an access token"})

    user_uuid = payload.get("userid")
    user = await crud.UserCRUD.get_user_by_uuid(db, user_uuid)
    if not user:
        raise HTTPException(status_code=401, detail={
            "code": "USER_DOESNT_EXIST",
            "message": "User not found"})

    return {
        "valid": True,
        "user_uuid": user.uuid,
        "login": user.login,
        "role": user.role,
        "expires_at": payload.get("exp")
    }


@app.get("/db_health")
async def db_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"
        )

@app.get("/health")
async def health():
    return {"message": "healthy"}

@app.get("/")
async def root():
    return {"message": "Auth Service is running"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)