import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from app.services.comment_service import CommentService
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse


class TestCommentService:

    @pytest.fixture
    def mock_cruds(self):
        return {
            'comment_crud': AsyncMock(),
            'profile_crud': AsyncMock(),
            'post_crud': AsyncMock()
        }

    @pytest.fixture
    def comment_service(self, mock_cruds):
        with patch(
            'app.services.comment_service.CommentCRUD',
            return_value=mock_cruds['comment_crud']
        ), \
             patch(
            'app.services.comment_service.ProfileCRUD',
            return_value=mock_cruds['profile_crud']
        ), \
             patch(
            'app.services.comment_service.PostCRUD',
            return_value=mock_cruds['post_crud']
        ):
            service = CommentService(db=MagicMock())
            return service

    @pytest.fixture
    def sample_comment_data(self):
        return CommentCreate(text="Test comment", post_id=1)

    @pytest.fixture
    def sample_db_comment(self):
        mock = MagicMock()
        mock.id = 1
        mock.text = "Test comment"
        mock.post_id = 1
        mock.profile_id = "user123"
        mock.edited = False
        return mock

    @pytest.fixture
    def sample_profile(self):
        mock = MagicMock()
        mock.username = "testuser"
        return mock

    @pytest.fixture
    def sample_post(self):
        mock = MagicMock()
        mock.id = 1
        mock.text = "Test post"
        return mock

    @pytest.mark.asyncio
    async def test_create_comment_success(
        self,
        comment_service,
        mock_cruds,
        sample_comment_data,
        sample_db_comment,
        sample_profile,
        sample_post
    ):

        mock_cruds['profile_crud'].get_profile.return_value = sample_profile
        mock_cruds['post_crud'].get_post.return_value = sample_post
        mock_cruds['comment_crud'].create_comment.return_value = sample_db_comment

        result = await comment_service.create_comment(
            "user123",
            sample_comment_data
        )

        assert isinstance(result, CommentResponse)
        mock_cruds['profile_crud'].get_profile.assert_called_once_with(
            "user123"
        )
        mock_cruds['post_crud'].get_post.assert_called_once_with(1)
        mock_cruds['comment_crud'].create_comment.assert_called_once_with(
            "user123",
            sample_comment_data.model_dump()
        )

    @pytest.mark.asyncio
    async def test_create_comment_profile_not_found(
        self,
        comment_service,
        mock_cruds,
        sample_comment_data
    ):

        mock_cruds['profile_crud'].get_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.create_comment(
                "nonexistent",
                sample_comment_data
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_create_comment_post_not_found(
        self,
        comment_service,
        mock_cruds,
        sample_comment_data,
        sample_profile
    ):

        mock_cruds['profile_crud'].get_profile.return_value = sample_profile
        mock_cruds['post_crud'].get_post.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.create_comment(
                "user123",
                sample_comment_data
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Post not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_comment_success(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment
    ):

        update_data = CommentUpdate(text="Updated comment")
        sample_db_comment.profile_id = "user123"
        mock_cruds['comment_crud'].get_comment.return_value = sample_db_comment
        mock_cruds['comment_crud'].update_comment.return_value = sample_db_comment

        result = await comment_service.update_comment(
            1,
            "user123",
            update_data
        )

        assert isinstance(result, CommentResponse)
        mock_cruds['comment_crud'].get_comment.assert_called_once_with(1)
        mock_cruds['comment_crud'].update_comment.assert_called_once_with(
            1,
            update_data.model_dump(exclude_unset=True)
        )

    @pytest.mark.asyncio
    async def test_update_comment_not_found(self, comment_service, mock_cruds):

        update_data = CommentUpdate(text="Updated comment")
        mock_cruds['comment_crud'].get_comment.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.update_comment(999, "user123", update_data)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Comment not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_comment_unauthorized(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment
    ):

        update_data = CommentUpdate(text="Updated comment")
        sample_db_comment.profile_id = "other_user"
        mock_cruds['comment_crud'].get_comment.return_value = sample_db_comment

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.update_comment(1, "user123", update_data)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorized to update this comment" in str(
            exc_info.value.detail
        )

    @pytest.mark.asyncio
    async def test_delete_comment_success(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment
    ):

        sample_db_comment.profile_id = "user123"
        mock_cruds['comment_crud'].get_comment.return_value = sample_db_comment
        mock_cruds['comment_crud'].delete_comment.return_value = True

        result = await comment_service.delete_comment(1, "user123")

        assert result == {"message": "Comment deleted successfully"}
        mock_cruds['comment_crud'].get_comment.assert_called_once_with(1)
        mock_cruds['comment_crud'].delete_comment.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_delete_comment_not_found(self, comment_service, mock_cruds):

        mock_cruds['comment_crud'].get_comment.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.delete_comment(999, "user123")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Comment not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_comment_unauthorized(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment
    ):

        sample_db_comment.profile_id = "other_user"
        mock_cruds['comment_crud'].get_comment.return_value = sample_db_comment

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.delete_comment(1, "user123")

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorized to delete this comment" in str(
            exc_info.value.detail
        )

    @pytest.mark.asyncio
    async def test_delete_comment_failed(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment
    ):

        sample_db_comment.profile_id = "user123"
        mock_cruds['comment_crud'].get_comment.return_value = sample_db_comment
        mock_cruds['comment_crud'].delete_comment.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.delete_comment(1, "user123")

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to delete comment" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_post_comments_success(
        self,
        comment_service,
        mock_cruds,
        sample_db_comment,
        sample_post
    ):

        mock_cruds['post_crud'].get_post.return_value = sample_post
        mock_cruds['comment_crud'].get_post_comments.return_value = [sample_db_comment]

        result = await comment_service.get_post_comments(1, skip=0, limit=10)

        assert len(result) == 1
        assert isinstance(result[0], CommentResponse)
        mock_cruds['post_crud'].get_post.assert_called_once_with(1)
        mock_cruds['comment_crud'].get_post_comments.assert_called_once_with(
            1,
            0,
            10
        )

    @pytest.mark.asyncio
    async def test_get_post_comments_post_not_found(
        self,
        comment_service,
        mock_cruds
    ):

        mock_cruds['post_crud'].get_post.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await comment_service.get_post_comments(999)

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Post not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_post_comments_empty_list(
        self,
        comment_service,
        mock_cruds,
        sample_post
    ):

        mock_cruds['post_crud'].get_post.return_value = sample_post
        mock_cruds['comment_crud'].get_post_comments.return_value = []

        result = await comment_service.get_post_comments(1)

        assert result == []
        assert len(result) == 0
