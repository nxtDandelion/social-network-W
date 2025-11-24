import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.crud.post import PostCRUD


class TestPostCRUD:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def post_crud(self, mock_db):
        return PostCRUD(mock_db)

    @pytest.fixture
    def sample_post_data(self):
        return {"text": "Test post content"}

    @pytest.fixture
    def sample_db_post(self):
        mock = MagicMock()
        mock.id = 1
        mock.text = "Test post content"
        mock.profile_id = "user123"
        mock.likes_amount = 0
        mock.likers = {}
        return mock

    @pytest.mark.asyncio
    async def test_create_post_success(
        self,
        post_crud,
        mock_db,
        sample_post_data
    ):

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await post_crud.create_post("user123", sample_post_data)

        assert result.text == "Test post content"
        assert result.profile_id == "user123"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_post_found(self, post_crud, mock_db, sample_db_post):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_post
        mock_db.execute.return_value = mock_result

        result = await post_crud.get_post(1)

        assert result == sample_db_post

    @pytest.mark.asyncio
    async def test_get_post_not_found(self, post_crud, mock_db):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await post_crud.get_post(999)

        assert result is None

    @pytest.mark.asyncio
    async def test_update_post_success(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        update_data = {"text": "Updated post content"}
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.update_post(1, update_data)

            assert result == sample_db_post
            assert sample_db_post.text == "Updated post content"
            assert sample_db_post.edited is True
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_post_not_found(self, post_crud, mock_db):

        update_data = {"text": "Updated content"}

        with patch.object(post_crud, 'get_post', return_value=None):

            result = await post_crud.update_post(999, update_data)

            assert result is None

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        mock_db.commit = AsyncMock()

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.delete_post(1)

            assert result is True
            mock_db.delete.assert_called_once_with(sample_db_post)
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_post_not_found(self, post_crud, mock_db):

        with patch.object(post_crud, 'get_post', return_value=None):

            result = await post_crud.delete_post(999)

            assert result is False

    @pytest.mark.asyncio
    async def test_like_post_success(self, post_crud, mock_db, sample_db_post):

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.like_post(1, "user456")

            assert result == sample_db_post
            assert "user456" in sample_db_post.likers
            assert sample_db_post.likes_amount == 1
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_like_post_already_liked(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = {"user456": True}
        sample_db_post.likes_amount = 1

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.like_post(1, "user456")

            assert result == sample_db_post
            mock_db.commit.assert_not_called()
            mock_db.refresh.assert_not_called()

    @pytest.mark.asyncio
    async def test_like_post_not_found(self, post_crud, mock_db):

        with patch.object(post_crud, 'get_post', return_value=None):

            result = await post_crud.like_post(999, "user456")

            assert result is None

    @pytest.mark.asyncio
    async def test_unlike_post_success(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = {"user456": True}
        sample_db_post.likes_amount = 1
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.unlike_post(1, "user456")

            assert result == sample_db_post
            assert "user456" not in sample_db_post.likers
            assert sample_db_post.likes_amount == 0
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_unlike_post_not_liked(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = {}
        sample_db_post.likes_amount = 0

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.unlike_post(1, "user456")

            assert result == sample_db_post
            mock_db.commit.assert_not_called()
            mock_db.refresh.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_user_posts_success(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_db_post]
        mock_db.execute.return_value = mock_result

        result = await post_crud.get_user_posts("user123", skip=0, limit=10)

        assert len(result) == 1
        assert result[0] == sample_db_post

    @pytest.mark.asyncio
    async def test_is_post_liked_true(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = {"user456": True}

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.is_post_liked(1, "user456")

            assert result is True

    @pytest.mark.asyncio
    async def test_is_post_liked_false(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = {"other_user": True}

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.is_post_liked(1, "user456")

            assert result is False

    @pytest.mark.asyncio
    async def test_is_post_liked_no_likers(
        self,
        post_crud,
        mock_db,
        sample_db_post
    ):

        sample_db_post.likers = None

        with patch.object(post_crud, 'get_post', return_value=sample_db_post):

            result = await post_crud.is_post_liked(1, "user456")

            assert result is False

    @pytest.mark.asyncio
    async def test_is_post_liked_post_not_found(self, post_crud, mock_db):

        with patch.object(post_crud, 'get_post', return_value=None):

            result = await post_crud.is_post_liked(999, "user456")

            assert result is False
