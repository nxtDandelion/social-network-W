import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from app.services.post_service import PostService
from app.schemas.posts import (
    PostCreate,
    PostUpdate,
    PostResponse,
    LikeResponse,
    PostsListResponse
)


class TestPostService:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def mock_post_crud(self):
        mock = AsyncMock()
        mock.create_post = AsyncMock()
        mock.get_post = AsyncMock()
        mock.update_post = AsyncMock()
        mock.delete_post = AsyncMock()
        mock.like_post = AsyncMock()
        mock.unlike_post = AsyncMock()
        mock.get_user_posts = AsyncMock()
        return mock

    @pytest.fixture
    def mock_profile_crud(self):
        mock = AsyncMock()
        mock.get_profile = AsyncMock()
        return mock

    @pytest.fixture
    def post_service(self, mock_post_crud, mock_profile_crud):
        with patch(
            'app.services.post_service.PostCRUD',
            return_value=mock_post_crud
        ), patch(
            'app.services.post_service.ProfileCRUD',
            return_value=mock_profile_crud
        ):
            service = PostService(db=MagicMock())
            return service

    @pytest.fixture
    def sample_post_data(self):
        return PostCreate(
            id=1,
            text="Test post content"
        )

    @pytest.fixture
    def sample_post_update(self):
        return PostUpdate(
            text="Updated post content"
        )

    @pytest.fixture
    def sample_post_model(self):
        mock = MagicMock()
        mock.id = 1
        mock.text = "Test post content"
        mock.profile_id = "user123"
        mock.likes_amount = 5
        mock.create_date = "2023-01-01T00:00:00"
        mock.edited = False
        mock.likers = {"user456": True}
        return mock

    @pytest.mark.asyncio
    async def test_create_post_success(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud,
        sample_post_data,
        sample_post_model
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.create_post.return_value = sample_post_model

        result = await post_service.create_post(
            profile_id="user123",
            post_data=sample_post_data
        )

        assert isinstance(result, PostResponse)
        assert result.id == 1
        assert result.text == "Test post content"
        mock_profile_crud.get_profile.assert_called_once_with("user123")
        mock_post_crud.create_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_post_profile_not_found(
        self,
        post_service,
        mock_profile_crud,
        sample_post_data
    ):
        mock_profile_crud.get_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.create_post(
                profile_id="nonexistent",
                post_data=sample_post_data
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_post_success(
        self,
        post_service,
        mock_post_crud,
        sample_post_model,
        sample_post_update
    ):
        sample_post_model.profile_id = "user123"
        mock_post_crud.get_post.return_value = sample_post_model

        updated_post = MagicMock()
        updated_post.id = 1
        updated_post.text = "Updated post content"
        updated_post.profile_id = "user123"
        updated_post.likes_amount = 5
        updated_post.create_date = "2023-01-01T00:00:00"
        updated_post.edited = True
        updated_post.likers = {"user456": True}
        mock_post_crud.update_post.return_value = updated_post

        result = await post_service.update_post(
            post_id=1,
            profile_id="user123",
            post_data=sample_post_update
        )

        assert isinstance(result, PostResponse)
        mock_post_crud.get_post.assert_called_once_with(1)
        mock_post_crud.update_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_post_not_found(
        self,
        post_service,
        mock_post_crud,
        sample_post_update
    ):
        mock_post_crud.get_post.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.update_post(
                post_id=999,
                profile_id="user123",
                post_data=sample_post_update
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Post not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_post_unauthorized(
        self,
        post_service,
        mock_post_crud,
        sample_post_model,
        sample_post_update
    ):
        sample_post_model.profile_id = "user456"
        mock_post_crud.get_post.return_value = sample_post_model

        with pytest.raises(HTTPException) as exc_info:
            await post_service.update_post(
                post_id=1,
                profile_id="user123",
                post_data=sample_post_update
            )

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorized to update" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self,
        post_service,
        mock_post_crud,
        sample_post_model
    ):
        sample_post_model.profile_id = "user123"
        mock_post_crud.get_post.return_value = sample_post_model
        mock_post_crud.delete_post.return_value = True

        result = await post_service.delete_post(
            post_id=1,
            profile_id="user123"
        )

        assert result == {"message": "Post deleted successfully"}
        mock_post_crud.delete_post.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_delete_post_not_found(
        self,
        post_service,
        mock_post_crud
    ):
        mock_post_crud.get_post.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.delete_post(
                post_id=999,
                profile_id="user123"
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Post not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_post_unauthorized(
        self,
        post_service,
        mock_post_crud,
        sample_post_model
    ):
        sample_post_model.profile_id = "user456"
        mock_post_crud.get_post.return_value = sample_post_model

        with pytest.raises(HTTPException) as exc_info:
            await post_service.delete_post(
                post_id=1,
                profile_id="user123"
            )

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Not authorized to delete" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_post_failure(
        self,
        post_service,
        mock_post_crud,
        sample_post_model
    ):
        sample_post_model.profile_id = "user123"
        mock_post_crud.get_post.return_value = sample_post_model
        mock_post_crud.delete_post.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await post_service.delete_post(
                post_id=1,
                profile_id="user123"
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR # noqa
        assert "Failed to delete post" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_like_post_success(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud,
        sample_post_model
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.like_post.return_value = sample_post_model

        result = await post_service.like_post(
            post_id=1,
            profile_id="user123"
        )

        assert isinstance(result, LikeResponse)
        assert result.post_id == 1
        assert result.profile_id == "user123"
        assert result.liked is True
        mock_profile_crud.get_profile.assert_called_once_with("user123")
        mock_post_crud.like_post.assert_called_once_with(1, "user123")

    @pytest.mark.asyncio
    async def test_like_post_profile_not_found(
        self,
        post_service,
        mock_profile_crud
    ):
        mock_profile_crud.get_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.like_post(
                post_id=1,
                profile_id="nonexistent"
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_like_post_not_found(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.like_post.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.like_post(
                post_id=999,
                profile_id="user123"
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Post not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_unlike_post_success(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud,
        sample_post_model
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.unlike_post.return_value = sample_post_model

        result = await post_service.unlike_post(
            post_id=1,
            profile_id="user123"
        )

        assert isinstance(result, LikeResponse)
        assert result.post_id == 1
        assert result.profile_id == "user123"
        assert result.liked is False
        mock_post_crud.unlike_post.assert_called_once_with(1, "user123")

    @pytest.mark.asyncio
    async def test_get_user_posts_success(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud,
        sample_post_model
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.get_user_posts.return_value = [sample_post_model]

        result = await post_service.get_user_posts(
            profile_id="user123",
            skip=0,
            limit=10
        )

        assert isinstance(result, PostsListResponse)
        assert len(result.posts) == 1
        assert result.total == 1
        assert isinstance(result.posts[0], PostResponse)
        mock_profile_crud.get_profile.assert_called_once_with("user123")
        mock_post_crud.get_user_posts.assert_called_once_with(
            "user123", 0, 10
        )

    @pytest.mark.asyncio
    async def test_get_user_posts_profile_not_found(
        self,
        post_service,
        mock_profile_crud
    ):
        mock_profile_crud.get_profile.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await post_service.get_user_posts(
                profile_id="nonexistent",
                skip=0,
                limit=10
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_user_posts_empty_list(
        self,
        post_service,
        mock_post_crud,
        mock_profile_crud
    ):
        mock_profile_crud.get_profile.return_value = MagicMock()
        mock_post_crud.get_user_posts.return_value = []

        result = await post_service.get_user_posts(
            profile_id="user123",
            skip=0,
            limit=10
        )

        assert isinstance(result, PostsListResponse)
        assert len(result.posts) == 0
        assert result.total == 0
