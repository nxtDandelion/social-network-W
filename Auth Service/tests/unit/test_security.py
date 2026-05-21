# tests/unit/test_security.py
import pytest
import jwt
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from app import security

def test_verify_password_success():
    with patch('app.security.pwd_context.verify', return_value=True):
        result = security.verify_password("plain_password", "hashed_password")
        assert result is True


def test_verify_password_failure():
    with patch('app.security.pwd_context.verify', return_value=False):
        result = security.verify_password("wrong_password", "hashed_password")
        assert result is False


def test_get_password_hash():
    with patch('app.security.pwd_context.hash', return_value="hashed_password_123"):
        result = security.get_password_hash("plain_password")
        assert result == "hashed_password_123"

def test_create_access_token():
    test_data = {"userid": "123", "login": "test_user"}

    with patch('app.security.jwt.encode') as mock_encode:
        mock_encode.return_value = "test.jwt.token"

        result = security.create_access_token(test_data)

        assert result == "test.jwt.token"
        mock_encode.assert_called_once()
        call_args = mock_encode.call_args[0][0]
        assert "userid" in call_args
        assert "login" in call_args
        assert "exp" in call_args


def test_create_access_token_with_custom_expiry():

    test_data = {"userid": "123"}
    custom_delta = timedelta(minutes=60)

    with patch('app.security.jwt.encode') as mock_encode:
        mock_encode.return_value = "token"

        result = security.create_access_token(test_data, expires_delta=custom_delta)

        mock_encode.assert_called_once()


def test_create_refresh_token():
    test_data = {"userid": "123", "login": "test_user"}

    with patch('app.security.jwt.encode') as mock_encode:
        mock_encode.return_value = "test.refresh.token"

        result = security.create_refresh_token(test_data)

        assert result == "test.refresh.token"
        mock_encode.assert_called_once()
        call_args = mock_encode.call_args[0][0]
        assert "exp" in call_args


def test_verify_jwt_token_valid():
    test_payload = {"userid": "123", "exp": datetime.utcnow() + timedelta(hours=1)}

    with patch('app.security.jwt.decode', return_value=test_payload):
        result = security.verify_jwt_token("valid.token")
        assert result == test_payload


def test_verify_jwt_token_expired():
    with patch('app.security.jwt.decode', side_effect=jwt.ExpiredSignatureError):
        result = security.verify_jwt_token("expired.token")
        assert result is None


def test_verify_jwt_token_invalid():
    with patch('app.security.jwt.decode', side_effect=jwt.InvalidTokenError):
        result = security.verify_jwt_token("invalid.token")
        assert result is None

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    mock_db = AsyncMock()
    mock_credentials = MagicMock()
    mock_credentials.credentials = "invalid.token"

    with patch('app.security.verify_jwt_token', return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            await security.get_current_user(mock_credentials, mock_db)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_get_current_user_wrong_token_type():
    mock_db = AsyncMock()
    mock_credentials = MagicMock()
    mock_credentials.credentials = "refresh.token"

    with patch('app.security.verify_jwt_token', return_value={
        "userid": "user_123",
        "type": "refresh"  # Не access!
    }):
        with pytest.raises(HTTPException) as exc_info:
            await security.get_current_user(mock_credentials, mock_db)

        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_missing_userid():
    mock_db = AsyncMock()
    mock_credentials = MagicMock()
    mock_credentials.credentials = "token.without.userid"

    with patch('app.security.verify_jwt_token', return_value={
        "type": "access"
    }):
        with pytest.raises(HTTPException) as exc_info:
            await security.get_current_user(mock_credentials, mock_db)

        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_user_not_found():
    mock_db = AsyncMock()
    mock_credentials = MagicMock()
    mock_credentials.credentials = "valid.token"

    with patch('app.security.verify_jwt_token', return_value={
        "userid": "non_existent_uuid",
        "type": "access"
    }):
        with patch('app.security.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as exc_info:
                await security.get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == 401