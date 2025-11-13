from fastapi import FastAPI, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
import schemas
import uvicorn
import utils
import security
import crud

app = FastAPI(title="Auth Service", lifespan=utils.lifespan)

@app.get("/")
async def root():
    return {"message": "Auth Service is running"}

@app.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await crud.UserCRUD.get_user_by_login(db, user.login)
    if db_user:
        raise HTTPException(status_code=400, detail="Login already registered")

    db_user_email = await crud.UserCRUD.get_user_by_email(db, user.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = await crud.UserCRUD.create_user(db, user)
    return new_user


@app.post("/login", response_model=schemas.TokenResponse)
async def login(auth_data: schemas.TokenCreate, db: AsyncSession = Depends(get_db)):
    user = await crud.UserCRUD.authenticate_user(db, auth_data.login, auth_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
        )

    token_pair = await crud.TokenCRUD.create_token_pair(db, user, auth_data.ip)
    return token_pair


@app.post("/refresh", response_model=schemas.TokenResponse)
async def refresh_token(refresh_data: schemas.RefreshToken, db: AsyncSession = Depends(get_db)):
    db_token = await crud.TokenCRUD.get_token_by_jwt(db, refresh_data.refresh_token)
    if db_token is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    payload = security.verify_jwt_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        await crud.TokenCRUD.delete_token(db, db_token.id)
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await crud.UserCRUD.get_user_by_uuid(db, payload.get("userid"))
    if not user:
        await crud.TokenCRUD.delete_token(db, db_token.id)
        raise HTTPException(status_code=401, detail="User not found or inactive")

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
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Not an access token")

    user_uuid = payload.get("userid")
    user = await crud.UserCRUD.get_user_by_uuid(db, user_uuid)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)