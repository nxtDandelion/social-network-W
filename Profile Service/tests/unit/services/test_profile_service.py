import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from app.services.profile_service import ProfileService
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse


class TestProfileService:

    @pytest.fixture
    def mock_crud(self):
        mock = AsyncMock()
        mock.get_profile = AsyncMock()
        mock.get_profile_by_email = AsyncMock()
        mock.create_profile = AsyncMock()
        mock.update_profile = AsyncMock()
        mock.delete_profile = AsyncMock()
        return mock

    @pytest.fixture
    def profile_service(self, mock_crud):

        with patch(
            'app.services.profile_service.ProfileCRUD',
            return_value=mock_crud
        ):
            service = ProfileService(db=MagicMock())
            return service

    @pytest.fixture
    def sample_profile_data(self):
        return ProfileCreate(
            uuid="test-uuid-123",
            username="testuser",
            email="test@example.com",
            tag="testtag",
            photo="photo.jpg"
        )

    @pytest.fixture
    def sample_db_profile(self):

        mock = MagicMock()
        mock.uuid = "123"
        mock.username = "testuser"
        mock.email = "test@example.com"
        mock.tag = "testtag"
        mock.photo = "photo.jpg"
        mock.subscribers = {}
        mock.subscribes = {}
        mock.subscribers_amount = 0
        mock.user_posts = {}
        return mock

    @pytest.mark.asyncio
    async def test_create_profile_success(
        self,
        profile_service,
        mock_crud,
        sample_profile_data,
        sample_db_profile
    ):

        mock_crud.get_profile.return_value = None
        mock_crud.get_profile_by_email.return_value = None
        mock_crud.create_profile.return_value = sample_db_profile

        result = await profile_service.create_profile(sample_profile_data)

        assert isinstance(result, ProfileResponse)
        mock_crud.get_profile.assert_called_once_with("testuser")
        mock_crud.get_profile_by_email.assert_called_once_with(
            "test@example.com"
        )
        mock_crud.create_profile.assert_called_once_with(sample_profile_data)

    @pytest.mark.asyncio
    async def test_create_profile_username_exists(
        self,
        profile_service,
        mock_crud,
        sample_profile_data
    ):

        mock_crud.get_profile.return_value = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.create_profile(sample_profile_data)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Username already exists" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_create_profile_email_exists(
        self,
        profile_service,
        mock_crud,
        sample_profile_data
    ):

        mock_crud.get_profile.return_value = None
        mock_crud.get_profile_by_email.return_value = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.create_profile(sample_profile_data)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already exists" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_profile_success(
        self,
        profile_service,
        mock_crud,
        sample_db_profile
    ):

        mock_crud.get_profile.return_value = sample_db_profile

        result = await profile_service.get_profile("testuser")

        assert isinstance(result, ProfileResponse)
        mock_crud.get_profile.assert_called_once_with("testuser")

    @pytest.mark.asyncio
    async def test_get_profile_not_found(self, profile_service, mock_crud):

        mock_crud.get_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.get_profile("nonexistent")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_profile_success(
        self,
        profile_service,
        mock_crud,
        sample_db_profile
    ):

        update_data = ProfileUpdate(tag="updated_tag")
        mock_crud.get_profile.return_value = None
        mock_crud.get_profile_by_email.return_value = None
        mock_crud.update_profile.return_value = sample_db_profile

        result = await profile_service.update_profile("testuser", update_data)

        assert isinstance(result, ProfileResponse)
        mock_crud.update_profile.assert_called_once_with(
            "testuser",
            update_data
        )

    @pytest.mark.asyncio
    async def test_update_profile_username_conflict(
        self,
        profile_service,
        mock_crud
    ):
        update_data = ProfileUpdate(username="existinguser")
        existing_profile = MagicMock()
        existing_profile.uuid = "456"
        mock_crud.get_profile.return_value = existing_profile

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.update_profile("originaluser", update_data)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Username already exists" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, profile_service, mock_crud):

        update_data = ProfileUpdate(tag="updated_tag")
        mock_crud.get_profile.return_value = None
        mock_crud.get_profile_by_email.return_value = None
        mock_crud.update_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.update_profile("nonexistent", update_data)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_profile_success(self, profile_service, mock_crud):

        mock_crud.delete_profile.return_value = MagicMock()

        result = await profile_service.delete_profile("testuser")

        assert result == {"message": "Profile deleted successfully"}
        mock_crud.delete_profile.assert_called_once_with("testuser")

    @pytest.mark.asyncio
    async def test_delete_profile_not_found(self, profile_service, mock_crud):

        mock_crud.delete_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await profile_service.delete_profile("nonexistent")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
