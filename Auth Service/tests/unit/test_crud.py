from app.crud import UserCRUD, TokenCRUD
from app import schemas
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app import crud, schemas


class TestUserCRUD:
    @pytest.mark.asyncio
    async def test_get_user_by_login_found(self, mock_db_session, sample_user_model):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user_model
        mock_db_session.execute.return_value = mock_result
        result = await UserCRUD.get_user_by_login(
            db=mock_db_session,
            login="test_login"
        )
        assert result is sample_user_model
        assert result.login == "test_login"
        assert result.username == "testuser"
        mock_db_session.execute.assert_called_once()
        called_query = mock_db_session.execute.call_args[0][0]
        assert "SELECT" in str(called_query)
        mock_result.scalar_one_or_none.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_by_login_not_found(self, mock_db_session):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_db_session.execute.return_value = mock_result
        result = await UserCRUD.get_user_by_login(
            db=mock_db_session,
            login="non_existent_login"
        )
        assert result is None
        mock_db_session.execute.assert_called_once()
        mock_result.scalar_one_or_none.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user(self, mock_db_session, sample_user_data):
        from app import security
        original_hash = security.get_password_hash

        try:
            security.get_password_hash = MagicMock(return_value="mocked_hashed_password")
            user_create_data = schemas.UserCreate(
                username="newuser",
                login="new_login",
                email="new@example.com",
                password="plain_password",
                role="user"
            )
            import uuid
            original_uuid4 = uuid.uuid4
            uuid.uuid4 = MagicMock()
            uuid.uuid4.return_value.hex = "test_uuid_1234567890abcdef1234567890abcdef"
            result = await UserCRUD.create_user(
                db=mock_db_session,
                user=user_create_data
            )
            mock_db_session.add.assert_called_once()
            await mock_db_session.commit.__aenter__()
            await mock_db_session.refresh.__aenter__()
            added_user = mock_db_session.add.call_args[0][0]
            assert added_user.uuid == "test_uuid_1234567890abcdef123456"
            assert added_user.login == "new_login"
            assert added_user.password == "mocked_hashed_password"
            assert result is not None

        finally:
            security.get_password_hash = original_hash
            uuid.uuid4 = original_uuid4


class TestTokenCRUD:
    @pytest.mark.asyncio
    async def test_get_token_by_jwt_found(self, mock_db_session):
        mock_token = MagicMock()
        mock_token.jwt = "test.jwt.token.here"
        mock_token.token_type = "refresh"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_token

        mock_db_session.execute.return_value = mock_result
        result = await TokenCRUD.get_token_by_jwt(
            db=mock_db_session,
            jwt_token="test.jwt.token.here"
        )
        assert result is mock_token
        assert result.jwt == "test.jwt.token.here"
        mock_db_session.execute.assert_called_once()



class TestUserCRUDExtended:

    @pytest.mark.asyncio
    async def test_get_user_by_uuid_found(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.uuid = "test_uuid"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        result = await crud.UserCRUD.get_user_by_uuid(mock_db, "test_uuid")

        assert result is mock_user
        assert result.uuid == "test_uuid"

    @pytest.mark.asyncio
    async def test_get_user_by_uuid_not_found(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await crud.UserCRUD.get_user_by_uuid(mock_db, "non_existent_uuid")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_by_email_found(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.email = "test@example.com"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        result = await crud.UserCRUD.get_user_by_email(mock_db, "test@example.com")

        assert result is mock_user
        assert result.email == "test@example.com"

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.password = "hashed_password"

        with patch('app.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=mock_user)):
            with patch('app.crud.security.verify_password', return_value=True):
                result = await crud.UserCRUD.authenticate_user(mock_db, "test_login", "correct_password")

                assert result is mock_user

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.password = "hashed_password"

        with patch('app.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=mock_user)):
            with patch('app.crud.security.verify_password', return_value=False):
                result = await crud.UserCRUD.authenticate_user(mock_db, "test_login", "wrong_password")

                assert result is None

    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self):
        mock_db = AsyncMock()
        with patch('app.crud.UserCRUD.get_user_by_login', AsyncMock(return_value=None)):
            result = await crud.UserCRUD.authenticate_user(mock_db, "non_existent", "password")
            assert result is None

    @pytest.mark.asyncio
    async def test_update_profile_success(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.uuid = "user_uuid"

        with patch('app.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=mock_user)):
            update_data = schemas.UserUpdate(
                username="new_username",
                email="new@example.com"
            )

            result = await crud.UserCRUD.update_profile(mock_db, "user_uuid", update_data)

            assert result is mock_user
            mock_db.execute.assert_called_once()
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_with_password(self):
        mock_db = AsyncMock()
        mock_user = MagicMock()
        mock_user.uuid = "user_uuid"

        with patch('app.crud.UserCRUD.get_user_by_uuid', AsyncMock(return_value=mock_user)):
            with patch('app.crud.security.get_password_hash', return_value="new_hashed_password"):
                update_data = schemas.UserUpdate(
                    password="new_password_123"
                )

                result = await crud.UserCRUD.update_profile(mock_db, "user_uuid", update_data)

                assert result is mock_user
                mock_db.execute.assert_called_once()


class TestTokenCRUDExtended:

    @pytest.mark.asyncio
    async def test_create_token(self):
        mock_db = AsyncMock()
        token_data = {
            "uuid": "user_uuid",
            "jwt": "jwt_token",
            "token_type": "refresh",
            "ip": "127.0.0.1",
            "expires_at": None
        }

        result = await crud.TokenCRUD.create_token(mock_db, token_data)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_token(self):
        mock_db = AsyncMock()

        await crud.TokenCRUD.delete_token(mock_db, 1)

        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_token_by_jwt(self):
        mock_db = AsyncMock()

        await crud.TokenCRUD.delete_token_by_jwt(mock_db, "jwt_token")

        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_expired_tokens(self):
        mock_db = AsyncMock()

        await crud.TokenCRUD.delete_expired_tokens(mock_db)

        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()