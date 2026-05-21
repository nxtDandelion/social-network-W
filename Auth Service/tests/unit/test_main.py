import pytest
from fastapi import status, HTTPException
from unittest.mock import AsyncMock, MagicMock, patch
from app import schemas

@pytest.mark.asyncio
async def test_root_handler():
    from app.main import root
    result = await root()
    assert result == {"message": "Auth Service is running"}

@pytest.mark.asyncio
async def test_health_handler():
    from app.main import health
    result = await health()
    assert result == {"message": "healthy"}

@pytest.mark.asyncio
async def test_db_health_handler():
    from app.main import db_health
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_db.execute.return_value = mock_result
    result = await db_health(mock_db)
    assert result["status"] == "healthy"
    assert result["database"] == "connected"

@pytest.mark.asyncio
async def test_db_health_failure():
    from app.main import db_health
    mock_db = AsyncMock()
    mock_db.execute.side_effect = Exception("Connection failed")
    with pytest.raises(HTTPException) as exc_info:
        await db_health(mock_db)
    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert "Database connection failed" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_register_success():
    from app.main import register
    mock_db = AsyncMock()
    mock_rabbit = AsyncMock()
    mock_rabbit.send_user_register = AsyncMock()
    with patch('app.main.crud.UserCRUD.get_user_by_username', AsyncMock(return_value=None)):
        with patch('app.main.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=None)):
            with patch('app.main.crud.UserCRUD.get_user_by_email', AsyncMock(return_value=None)):
                with patch('app.main.crud.UserCRUD.create_user', AsyncMock()) as mock_create:
                    mock_user = MagicMock()
                    mock_user.uuid = "new_uuid"
                    mock_user.username = "newuser"
                    mock_user.login = "new_login"
                    mock_user.email = "new@example.com"
                    mock_user.role = "user"
                    mock_create.return_value = mock_user
                    user_data = schemas.UserCreate(
                        username="newuser",
                        login="new_login",
                        email="new@example.com",
                        password="Password123!",
                        role="user"
                    )
                    result = await register(user_data, mock_db, mock_rabbit)
                    assert result.username == "newuser"
                    mock_rabbit.send_user_register.assert_called_once()

@pytest.mark.asyncio
async def test_register_username_exists():
    from app.main import register
    mock_db = AsyncMock()
    mock_rabbit = AsyncMock()
    mock_existing_user = MagicMock()
    with patch('app.main.crud.UserCRUD.get_user_by_username', AsyncMock(return_value=mock_existing_user)):
        user_data = schemas.UserCreate(
            username="existing_user",
            login="new_login",
            email="new@example.com",
            password="Password123!",
            role="user"
        )
        with pytest.raises(HTTPException) as exc_info:
            await register(user_data, mock_db, mock_rabbit)
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail["code"] == "USERNAME_EXISTS"

@pytest.mark.asyncio
async def test_register_login_exists():
    from app.main import register
    mock_db = AsyncMock()
    mock_rabbit = AsyncMock()
    with patch('app.main.crud.UserCRUD.get_user_by_username', AsyncMock(return_value=None)):
        with patch('app.main.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=MagicMock())):
            user_data = schemas.UserCreate(
                username="newuser",
                login="existing_login",
                email="new@example.com",
                password="Password123!",
                role="user"
            )
            with pytest.raises(HTTPException) as exc_info:
                await register(user_data, mock_db, mock_rabbit)
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert exc_info.value.detail["code"] == "LOGIN_EXISTS"

@pytest.mark.asyncio
async def test_register_email_exists():
    from app.main import register
    mock_db = AsyncMock()
    mock_rabbit = AsyncMock()
    with patch('app.main.crud.UserCRUD.get_user_by_username', AsyncMock(return_value=None)):
        with patch('app.main.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=None)):
            with patch('app.main.crud.UserCRUD.get_user_by_email', AsyncMock(return_value=MagicMock())):
                user_data = schemas.UserCreate(
                    username="newuser",
                    login="new_login",
                    email="existing@example.com",
                    password="Password123!",
                    role="user"
                )
                with pytest.raises(HTTPException) as exc_info:
                    await register(user_data, mock_db, mock_rabbit)
                assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
                assert exc_info.value.detail["code"] == "EMAIL_EXISTS"

@pytest.mark.asyncio
async def test_login_success():
    from app.main import login
    mock_db = AsyncMock()
    mock_user = MagicMock()
    mock_user.username = "testuser"
    mock_user.uuid = "user_uuid"
    mock_user.role = "user"
    with patch('app.main.crud.UserCRUD.authenticate_user', AsyncMock(return_value=mock_user)):
        with patch('app.main.crud.TokenCRUD.create_token_pair', AsyncMock(return_value=schemas.TokenResponse(
                access_token="access.token.here",
                refresh_token="refresh.token.here",
                token_type="bearer"
        ))):
            auth_data = schemas.TokenCreate(
                login="test_login",
                password="Password123!",
                ip="127.0.0.1"
            )
            result = await login(auth_data, mock_db)
            assert "access_token" in result
            assert result["username"] == "testuser"
            assert result["id"] == "user_uuid"

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    from app.main import login
    mock_db = AsyncMock()
    with patch('app.main.crud.UserCRUD.authenticate_user', AsyncMock(return_value=None)):
        auth_data = schemas.TokenCreate(
            login="wrong_login",
            password="wrong_password",
            ip="127.0.0.1"
        )
        with pytest.raises(HTTPException) as exc_info:
            await login(auth_data, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail["code"] == "DOES_NOT_EXIST"

@pytest.mark.asyncio
async def test_refresh_token_success():
    from app.main import refresh_token
    mock_db = AsyncMock()
    mock_token = MagicMock()
    mock_token.id = 1
    mock_token.uuid = "user_uuid"
    mock_user = MagicMock()
    mock_user.uuid = "user_uuid"
    mock_user.login = "test_login"
    mock_user.role = "user"
    with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=mock_token)):
        with patch('app.main.security.verify_jwt_token', return_value={
            "userid": "user_uuid",
            "login": "test_login",
            "role": "user",
            "type": "refresh"
        }):
            with patch('app.main.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=mock_user)):
                with patch('app.main.crud.TokenCRUD.delete_token', AsyncMock()):
                    with patch('app.main.crud.TokenCRUD.create_token_pair',
                               AsyncMock(return_value=schemas.TokenResponse(
                                       access_token="new.access.token",
                                       refresh_token="new.refresh.token",
                                       token_type="bearer"
                               ))):
                        refresh_data = schemas.RefreshToken(
                            refresh_token="valid.refresh.token",
                            ip="127.0.0.1"
                        )
                        result = await refresh_token(refresh_data, mock_db)
                        assert result.access_token == "new.access.token"
                        assert result.refresh_token == "new.refresh.token"

@pytest.mark.asyncio
async def test_refresh_token_invalid():
    from app.main import refresh_token
    mock_db = AsyncMock()
    with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=None)):
        refresh_data = schemas.RefreshToken(
            refresh_token="invalid.token",
            ip="127.0.0.1"
        )
        with pytest.raises(HTTPException) as exc_info:
            await refresh_token(refresh_data, mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail["code"] == "INVALID_TOKEN"

@pytest.mark.asyncio
async def test_refresh_token_wrong_type():
    from app.main import refresh_token
    mock_db = AsyncMock()
    mock_token = MagicMock()
    mock_token.id = 1
    with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=mock_token)):
        with patch('app.main.security.verify_jwt_token', return_value={"type": "access"}):
            with patch('app.main.crud.TokenCRUD.delete_token', AsyncMock()):
                refresh_data = schemas.RefreshToken(
                    refresh_token="access.token.not.refresh",
                    ip="127.0.0.1"
                )
                with pytest.raises(HTTPException) as exc_info:
                    await refresh_token(refresh_data, mock_db)
                assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
                assert exc_info.value.detail["code"] == "INVALID_REFRESH"

@pytest.mark.asyncio
async def test_verify_token_success():
    from app.main import verify_token
    mock_db = AsyncMock()
    mock_user = MagicMock()
    mock_user.uuid = "user_uuid"
    mock_user.login = "test_login"
    mock_user.role = "user"
    with patch('app.main.security.verify_jwt_token', return_value={
        "userid": "user_uuid",
        "login": "test_login",
        "role": "user",
        "type": "access",
        "exp": 9999999999
    }):
        with patch('app.main.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=mock_user)):
            result = await verify_token("valid.access.token", mock_db)
            assert result["valid"] is True
            assert result["user_uuid"] == "user_uuid"
            assert result["login"] == "test_login"

@pytest.mark.asyncio
async def test_verify_token_invalid():
    from app.main import verify_token
    mock_db = AsyncMock()
    with patch('app.main.security.verify_jwt_token', return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            await verify_token("invalid.token", mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail["code"] == "INVALID_TOKEN"

@pytest.mark.asyncio
async def test_verify_not_access_token():
    from app.main import verify_token
    mock_db = AsyncMock()
    with patch('app.main.security.verify_jwt_token', return_value={"type": "refresh"}):
        with pytest.raises(HTTPException) as exc_info:
            await verify_token("refresh.token", mock_db)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail["code"] == "NOT_ACCESS_TOKEN"

@pytest.mark.asyncio
async def test_verify_token_user_not_found():
    from app.main import verify_token
    mock_db = AsyncMock()
    with patch('app.main.security.verify_jwt_token', return_value={
        "userid": "non_existent_uuid",
        "type": "access"
    }):
        with patch('app.main.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await verify_token("valid.token.but.user.not.found", mock_db)
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert exc_info.value.detail["code"] == "USER_DOESNT_EXIST"

@pytest.mark.asyncio
async def test_logout_success():
    from app.main import logout
    mock_db = AsyncMock()
    mock_token = MagicMock()
    mock_token.id = 1
    mock_token.uuid = "user_uuid"
    mock_user = MagicMock()
    mock_user.uuid = "user_uuid"
    with patch('app.main.security.get_current_user', AsyncMock(return_value=mock_user)):
        with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=mock_token)):
            with patch('app.main.crud.TokenCRUD.delete_token', AsyncMock()):
                result = await logout("refresh.token.to.delete", mock_db, mock_user)
                assert result["message"] == "Successfully logged out"

@pytest.mark.asyncio
async def test_logout_token_not_found():
    from app.main import logout
    mock_db = AsyncMock()
    mock_user = MagicMock()
    mock_user.uuid = "user_uuid"
    with patch('app.main.security.get_current_user', AsyncMock(return_value=mock_user)):
        with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=None)):
            result = await logout("non.existent.token", mock_db, mock_user)
            assert result["message"] == "Successfully logged out"

@pytest.mark.asyncio
async def test_logout_token_wrong_user():
    from app.main import logout
    mock_db = AsyncMock()
    mock_token = MagicMock()
    mock_token.id = 1
    mock_token.uuid = "other_user_uuid"
    mock_user = MagicMock()
    mock_user.uuid = "current_user_uuid"
    with patch('app.main.security.get_current_user', AsyncMock(return_value=mock_user)):
        with patch('app.main.crud.TokenCRUD.get_token_by_jwt', AsyncMock(return_value=mock_token)):
            result = await logout("other.user.token", mock_db, mock_user)
            assert result["message"] == "Successfully logged out"