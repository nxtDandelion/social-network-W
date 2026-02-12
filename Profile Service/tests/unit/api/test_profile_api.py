import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.api.profile import (
    create_profile,
    get_profile,
    update_profile,
    delete_profile
)
from app.schemas.profile import ProfileCreate, ProfileUpdate


class TestProfileAPI:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def mock_profile_service(self):
        return AsyncMock()

    @pytest.fixture
    def sample_profile_create(self):
        return ProfileCreate(
            uuid="test-uuid-123",
            username="testuser",
            login="testlogin",
            email="test@example.com",
            tag="testtag",
            photo="http://example.com/avatar.jpg"
        )

    @pytest.fixture
    def sample_profile_update(self):
        return ProfileUpdate(
            username="updateduser",
            photo="http://example.com/new_avatar.jpg"
        )

    @pytest.fixture
    def sample_profile_response(self):
        return {
            "uuid": "test-uuid-123",
            "username": "testuser",
            "login": "testlogin",
            "email": "test@example.com",
            "tag": "testtag",
            "photo": "http://example.com/avatar.jpg",
            "subscribers": {},
            "subscribes": {},
            "subscribers_amount": 0,
            "user_posts": []
        }

    @pytest.mark.asyncio
    async def test_create_profile_success(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_response,
        sample_profile_create
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.create_profile = AsyncMock(
                return_value=sample_profile_response
            )

            result = await create_profile(
                profile=sample_profile_create,
                db=mock_db
            )

            assert result == sample_profile_response
            mock_profile_service.create_profile.assert_called_once_with(
                sample_profile_create
            )

    @pytest.mark.asyncio
    async def test_create_profile_duplicate_username(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_create
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.create_profile = AsyncMock(
                side_effect=HTTPException(
                    status_code=400,
                    detail="Username already exists"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await create_profile(
                    profile=sample_profile_create,
                    db=mock_db
                )

            assert exc_info.value.status_code == 400
            assert "already exists" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_profile_success(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_response
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.get_profile = AsyncMock(
                return_value=sample_profile_response
            )

            result = await get_profile(
                username="testuser",
                db=mock_db
            )

            assert result == sample_profile_response
            mock_profile_service.get_profile.assert_called_once_with(
                "testuser"
            )

    @pytest.mark.asyncio
    async def test_get_profile_not_found(
        self,
        mock_db,
        mock_profile_service
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.get_profile = AsyncMock(
                side_effect=HTTPException(
                    status_code=404,
                    detail="Profile not found"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await get_profile(
                    username="nonexistent",
                    db=mock_db
                )

            assert exc_info.value.status_code == 404
            assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_profile_success(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_response,
        sample_profile_update
    ):
        updated_response = sample_profile_response.copy()
        updated_response["username"] = "updateduser"
        updated_response["photo"] = "http://example.com/new_avatar.jpg"

        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.update_profile = AsyncMock(
                return_value=updated_response
            )

            result = await update_profile(
                username="testuser",
                profile_update=sample_profile_update,
                db=mock_db
            )

            assert result["username"] == "updateduser"
            mock_profile_service.update_profile.assert_called_once_with(
                "testuser", sample_profile_update
            )

    @pytest.mark.asyncio
    async def test_update_profile_not_found(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_update
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.update_profile = AsyncMock(
                side_effect=HTTPException(
                    status_code=404,
                    detail="Profile not found"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await update_profile(
                    username="nonexistent",
                    profile_update=sample_profile_update,
                    db=mock_db
                )

            assert exc_info.value.status_code == 404
            assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_profile_unauthorized(
        self,
        mock_db,
        mock_profile_service,
        sample_profile_update
    ):
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.update_profile = AsyncMock(
                side_effect=HTTPException(
                    status_code=403,
                    detail="Not authorized to update this profile"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await update_profile(
                    username="otheruser",
                    profile_update=sample_profile_update,
                    db=mock_db
                )

            assert exc_info.value.status_code == 403
            assert "Not authorized" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_profile_success(
        self,
        mock_db,
        mock_profile_service
    ):
        """Тест успешного удаления профиля"""
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.delete_profile = AsyncMock()

            result = await delete_profile( # noqa
                username="testuser",
                db=mock_db
            )

            mock_profile_service.delete_profile.assert_called_once_with(
                "testuser"
            )

    @pytest.mark.asyncio
    async def test_delete_profile_not_found(
        self,
        mock_db,
        mock_profile_service
    ):
        """Тест удаления несуществующего профиля"""
        with patch(
            'app.api.profile.ProfileService',
            return_value=mock_profile_service
        ):
            mock_profile_service.delete_profile = AsyncMock(
                side_effect=HTTPException(
                    status_code=404,
                    detail="Profile not found"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await delete_profile(
                    username="nonexistent",
                    db=mock_db
                )

            assert exc_info.value.status_code == 404
            assert "Profile not found" in str(exc_info.value.detail)
