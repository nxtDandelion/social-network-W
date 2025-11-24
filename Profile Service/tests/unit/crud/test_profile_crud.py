import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.crud.profile import ProfileCRUD
from app.schemas.profile import ProfileCreate, ProfileUpdate


class TestProfileCRUD:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def profile_crud(self, mock_db):
        return ProfileCRUD(mock_db)

    @pytest.fixture
    def sample_profile_data(self):
        return ProfileCreate(
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
        return mock

    @pytest.mark.asyncio
    async def test_create_profile_success(
        self,
        profile_crud,
        mock_db,
        sample_profile_data
    ):

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await profile_crud.create_profile(sample_profile_data)

        assert result.username == "testuser"
        assert result.email == "test@example.com"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

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
