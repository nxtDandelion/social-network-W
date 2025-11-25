import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.crud.comment import CommentCRUD


class TestCommentCRUD:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def comment_crud(self, mock_db):
        return CommentCRUD(mock_db)

    @pytest.fixture
    def sample_comment_data(self):
        return {"text": "Test comment", "post_id": 1}

    @pytest.fixture
    def sample_db_comment(self):
        mock = MagicMock()
        mock.id = 1
        mock.text = "Test comment"
        mock.post_id = 1
        mock.profile_id = "user123"
        mock.edited = False
        return mock

    @pytest.mark.asyncio
    async def test_create_comment_success(
        self,
        comment_crud,
        mock_db,
        sample_comment_data
    ):

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await comment_crud.create_comment(
            "user123",
            sample_comment_data
        )

        assert result.text == "Test comment"
        assert result.post_id == 1
        assert result.profile_id == "user123"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_comment_found(
        self,
        comment_crud,
        mock_db,
        sample_db_comment
    ):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_db_comment
        mock_db.execute.return_value = mock_result

        result = await comment_crud.get_comment(1)

        assert result == sample_db_comment

    @pytest.mark.asyncio
    async def test_get_comment_not_found(self, comment_crud, mock_db):

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await comment_crud.get_comment(999)

        assert result is None

    @pytest.mark.asyncio
    async def test_update_comment_success(
        self,
        comment_crud,
        mock_db,
        sample_db_comment
    ):

        update_data = {"text": "Updated comment"}
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(
            comment_crud,
            'get_comment',
            return_value=sample_db_comment
        ):

            result = await comment_crud.update_comment(1, update_data)

            assert result == sample_db_comment
            assert sample_db_comment.text == "Updated comment"
            assert sample_db_comment.edited is True
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_comment_not_found(self, comment_crud, mock_db):

        update_data = {"text": "Updated comment"}

        with patch.object(comment_crud, 'get_comment', return_value=None):

            result = await comment_crud.update_comment(999, update_data)

            assert result is None

    @pytest.mark.asyncio
    async def test_delete_comment_success(
        self,
        comment_crud,
        mock_db,
        sample_db_comment
    ):

        mock_db.commit = AsyncMock()

        with patch.object(
            comment_crud,
            'get_comment',
            return_value=sample_db_comment
        ):

            result = await comment_crud.delete_comment(1)

            assert result is True
            mock_db.delete.assert_called_once_with(sample_db_comment)
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_comment_not_found(self, comment_crud, mock_db):

        with patch.object(comment_crud, 'get_comment', return_value=None):

            result = await comment_crud.delete_comment(999)

            assert result is False

    @pytest.mark.asyncio
    async def test_get_post_comments_success(
        self,
        comment_crud,
        mock_db,
        sample_db_comment
    ):

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_db_comment]
        mock_db.execute.return_value = mock_result

        result = await comment_crud.get_post_comments(1, skip=0, limit=10)

        assert len(result) == 1
        assert result[0] == sample_db_comment

    @pytest.mark.asyncio
    async def test_get_user_comments_success(
        self,
        comment_crud,
        mock_db,
        sample_db_comment
    ):

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_db_comment]
        mock_db.execute.return_value = mock_result

        result = await comment_crud.get_user_comments(
            "user123",
            skip=0,
            limit=10
        )

        assert len(result) == 1
        assert result[0] == sample_db_comment
