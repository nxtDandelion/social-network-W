import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.handlers import handle_profile_update
from app import schemas


@pytest.mark.asyncio
async def test_handle_profile_update_success():
    mock_db = AsyncMock()
    test_data = {
        "uuid": "user_123",
        "username": "new_username",
        "email": "new@example.com"
    }

    mock_user = MagicMock()
    mock_user.uuid = "user_123"
    mock_user.username = "new_username"
    mock_user.email = "new@example.com"
    with patch('app.handlers.UserCRUD.update_profile', AsyncMock(return_value=mock_user)):
        result = await handle_profile_update(test_data, mock_db)
        assert result is mock_user
        assert result.uuid == "user_123"
        assert result.username == "new_username"
        from app.handlers import UserCRUD
        UserCRUD.update_profile.assert_called_once()

        call_args = UserCRUD.update_profile.call_args
        assert call_args[0][0] is mock_db
        assert call_args[0][1] == "user_123"
        assert isinstance(call_args[0][2], schemas.UserUpdate)


@pytest.mark.asyncio
async def test_handle_profile_update_invalid_data():
    mock_db = AsyncMock()
    invalid_data = {
        "uuid": "user_123",
        "email": "not-an-email"
    }

    with patch('app.handlers.logging.error') as mock_logging:
        with patch('app.handlers.UserCRUD.update_profile', AsyncMock(return_value=None)):
            result = await handle_profile_update(invalid_data, mock_db)

            mock_logging.assert_called()
            assert result is None


@pytest.mark.asyncio
async def test_handle_profile_update_exception():
    mock_db = AsyncMock()
    test_data = {
        "uuid": "user_123",
        "username": "new_username"
    }

    with patch('app.handlers.UserCRUD.update_profile', AsyncMock(side_effect=Exception("DB Error"))):
        with patch('app.handlers.logging.error') as mock_logging:
            result = await handle_profile_update(test_data, mock_db)
            mock_logging.assert_called_with("Error during update: DB Error")
            assert result is None


@pytest.mark.asyncio
async def test_handle_profile_update_partial_data():
    mock_db = AsyncMock()
    test_data = {
        "uuid": "user_123",
        "username": "updated_name"
    }

    mock_user = MagicMock()
    mock_user.uuid = "user_123"
    mock_user.username = "updated_name"
    mock_user.email = "old@example.com"

    with patch('app.handlers.UserCRUD.update_profile', AsyncMock(return_value=mock_user)):
        result = await handle_profile_update(test_data, mock_db)

        assert result is mock_user
        assert result.username == "updated_name"


@pytest.mark.asyncio
async def test_handle_profile_update_logging():
    mock_db = AsyncMock()
    test_data = {
        "uuid": "user_123",
        "username": "test_user"
    }

    mock_user = MagicMock()
    with patch('app.handlers.logging.error') as mock_logging:
        with patch('app.handlers.UserCRUD.update_profile', AsyncMock(return_value=mock_user)):
            await handle_profile_update(test_data, mock_db)
            mock_logging.assert_called_with(test_data)