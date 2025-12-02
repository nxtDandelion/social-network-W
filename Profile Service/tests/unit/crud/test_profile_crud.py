import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.crud.profile import ProfileCRUD
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.services.profile_service import ProfileService


class TestProfileCRUD:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

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
    def profile_crud(self, mock_db):
        return ProfileCRUD(mock_db)

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
        mock.uuid = "test-uuid-123"
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

        assert result.username == "testuser"
        mock_crud.get_profile.assert_called_once_with("testuser")
        mock_crud.get_profile_by_email.assert_called_once_with(
            "test@example.com"
        )
        mock_crud.create_profile.assert_called_once_with(sample_profile_data)

    @pytest.mark.asyncio
    async def test_get_profile_found(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_profile
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile("testuser")

        assert result == sample_db_profile
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_profile_not_found(self, profile_crud, mock_db):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile("nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_profile_by_email_found(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_profile
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_email("test@example.com")

        assert result == sample_db_profile

    @pytest.mark.asyncio
    async def test_get_profile_by_email_not_found(self, profile_crud, mock_db):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_email(
            "nonexistent@example.com"
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_update_profile_success(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):

        update_data = ProfileUpdate(username="newuser", tag="newtag")
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(
            profile_crud,
            'get_profile',
            return_value=sample_db_profile
        ):

            result = await profile_crud.update_profile("testuser", update_data)

            assert result == sample_db_profile
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, profile_crud, mock_db):

        update_data = ProfileUpdate(username="newuser")

        with patch.object(profile_crud, 'get_profile', return_value=None):

            result = await profile_crud.update_profile(
                "nonexistent",
                update_data
            )

            assert result is None

    @pytest.mark.asyncio
    async def test_delete_profile_success(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):

        mock_db.commit = AsyncMock()

        with patch.object(
            profile_crud,
            'get_profile',
            return_value=sample_db_profile
        ):

            result = await profile_crud.delete_profile("testuser")

            assert result == sample_db_profile
            mock_db.delete.assert_called_once_with(sample_db_profile)
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_profile_not_found(self, profile_crud, mock_db):

        with patch.object(profile_crud, 'get_profile', return_value=None):

            result = await profile_crud.delete_profile("nonexistent")

            assert result is None
