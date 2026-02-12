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
    def sample_db_profile(self):
        mock = MagicMock()
        mock.uuid = "test-uuid-123"
        mock.username = "testuser"
        mock.login = "testlogin"
        mock.email = "test@example.com"
        mock.tag = "testtag"
        mock.photo = "photo.jpg"
        mock.subscribers = {}
        mock.subscribes = {}
        mock.subscribers_amount = 0
        mock.user_posts = []
        return mock

    @pytest.mark.asyncio
    async def test_get_profile_by_id_found(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_profile
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_id("test-uuid-123")

        assert result == sample_db_profile

    @pytest.mark.asyncio
    async def test_get_profile_by_id_not_found(self, profile_crud, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_id("nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_profile_by_username_found(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_profile
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_username("testuser")

        assert result == sample_db_profile

    @pytest.mark.asyncio
    async def test_get_profile_by_username_not_found(
        self,
        profile_crud,
        mock_db
    ):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await profile_crud.get_profile_by_username("nonexistent")

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
    async def test_update_profile_by_id_success(
        self, profile_crud, mock_db, sample_db_profile
    ):
        update_data = ProfileUpdate(
            username="updateduser",
            photo="new_photo.jpg"
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(
            profile_crud,
            'get_profile_by_id',
            return_value=sample_db_profile
        ):
            result = await profile_crud.update_profile_by_id(
                "test-uuid-123",
                update_data
            )

            assert result == sample_db_profile
            assert sample_db_profile.username == "updateduser"
            assert sample_db_profile.photo == "new_photo.jpg"
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_by_id_not_found(self, profile_crud, mock_db):
        update_data = ProfileUpdate(username="updateduser")

        with patch.object(
            profile_crud,
            'get_profile_by_id',
            return_value=None
        ):
            result = await profile_crud.update_profile_by_id(
                "nonexistent",
                update_data
            )

            assert result is None

    @pytest.mark.asyncio
    async def test_add_post_to_profile_success(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        sample_db_profile.user_posts = [1, 2]
        mock_db.get.return_value = sample_db_profile
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await profile_crud.add_post_to_profile("test-uuid-123", 3)

        assert result == sample_db_profile
        assert sample_db_profile.user_posts == [1, 2, 3]
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_post_to_profile_duplicate(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        sample_db_profile.user_posts = [1, 2, 3]
        mock_db.get.return_value = sample_db_profile
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await profile_crud.add_post_to_profile("test-uuid-123", 3)

        assert result == sample_db_profile
        assert sample_db_profile.user_posts == [1, 2, 3]
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_post_to_profile_profile_not_found(
        self,
        profile_crud,
        mock_db
    ):
        mock_db.get.return_value = None

        result = await profile_crud.add_post_to_profile("nonexistent", 1)

        assert result is None

    @pytest.mark.asyncio
    async def test_delete_post_from_profile_post_not_found(
        self,
        profile_crud,
        mock_db
    ):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await profile_crud.delete_post_from_profile(999)

        assert result is None

    @pytest.mark.asyncio
    async def test_delete_post_from_profile_no_posts_list(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        sample_db_profile.user_posts = None
        sample_db_profile.uuid = "profile123"

        mock_post = MagicMock()
        mock_post.id = 1
        mock_post.profile_id = "profile123"

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_post
        mock_db.execute.return_value = mock_result

        mock_db.get.return_value = sample_db_profile

        result = await profile_crud.delete_post_from_profile(1)

        assert result == sample_db_profile
        assert sample_db_profile.user_posts is None

    @pytest.mark.asyncio
    async def test_create_profile_success(self, profile_crud, mock_db):
        sample_profile_create = ProfileCreate(
            uuid="test-uuid-123",
            username="testuser",
            login="testlogin",
            email="test@example.com"
        )

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch('app.crud.profile.models') as mock_models:
            mock_profile = MagicMock()
            mock_models.Profile.return_value = mock_profile

            result = await profile_crud.create_profile(sample_profile_create)

            assert result == mock_profile
            mock_db.add.assert_called_once_with(mock_profile)
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once_with(mock_profile)

    @pytest.mark.asyncio
    async def test_update_profile_success(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        update_data = ProfileUpdate(
            username="updateduser",
            photo="new_photo.jpg"
        )
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(
            profile_crud,
            'get_profile',
            return_value=sample_db_profile
        ):
            result = await profile_crud.update_profile("testuser", update_data)

            assert result == sample_db_profile
            assert sample_db_profile.username == "updateduser"
            assert sample_db_profile.photo == "new_photo.jpg"
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_no_fields_to_update(
        self,
        profile_crud,
        mock_db,
        sample_db_profile
    ):
        update_data = ProfileUpdate()
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
