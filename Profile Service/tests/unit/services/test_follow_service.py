import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from app.services.follow_service import FollowService
from app.schemas.follow import FollowResponse, FollowersListResponse
from app.schemas.follow import FollowingListResponse, UserShortInfo
from app.schemas.profile import ProfileResponse


class TestFollowService:

    @pytest.fixture
    def mock_crud(self):
        mock = AsyncMock()
        mock.get_profile_exists = AsyncMock()
        mock.get_follow_exists = AsyncMock()
        mock.follow_user = AsyncMock()
        mock.unfollow_user = AsyncMock()
        mock.get_followers_list = AsyncMock()
        mock.get_followers_count = AsyncMock()
        mock.get_following_list = AsyncMock()
        mock.get_following_count = AsyncMock()
        mock.get_profile = AsyncMock()
        return mock

    @pytest.fixture
    def follow_service(self, mock_crud):
        with patch(
            'app.services.follow_service.FollowCRUD',
            return_value=mock_crud
        ):
            service = FollowService(db=MagicMock())
            return service

    @pytest.fixture
    def sample_profile_response(self):
        """Создаём ProfileResponse через model_construct (без валидации)"""
        return ProfileResponse.model_construct(
            uuid="test-uuid-123",
            username="testuser",
            login="testlogin",
            email="test@example.com",
            photo="photo.jpg",
            tag="tag123",
            subscribers={},
            subscribes={},
            subscribers_amount=0,
            user_posts=[]
        )

    @pytest.fixture
    def sample_user_short_info(self):
        return UserShortInfo(
            uuid="user123",
            username="testuser",
            photo="photo.jpg",
            tag="tag123",
            followed_at="2023-01-01T00:00:00"
        )

    @pytest.mark.asyncio
    async def test_follow_user_success(
        self,
        follow_service,
        mock_crud,
        sample_profile_response
    ):

        mock_crud.get_profile_exists.return_value = True
        mock_crud.get_follow_exists.return_value = False

        mock_crud.follow_user.return_value = None
        mock_crud.get_profile.return_value = sample_profile_response

        result = await follow_service.follow_user(
            "follower123",
            "following123"
        )

        assert isinstance(result, FollowResponse)
        assert result.follower_id == "follower123"
        assert result.following_id == "following123"
        mock_crud.follow_user.assert_called_once_with(
            "follower123",
            "following123"
        )

    @pytest.mark.asyncio
    async def test_follow_user_self_follow(self, follow_service, mock_crud):

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.follow_user("sameuser", "sameuser")

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Trying to follow yourself" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_follow_user_follower_not_found(
        self,
        follow_service,
        mock_crud
    ):

        mock_crud.get_profile_exists.side_effect = [False, True]

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.follow_user("nonexistent", "following123")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Follower profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_follow_user_following_not_found(
        self,
        follow_service,
        mock_crud
    ):

        mock_crud.get_profile_exists.side_effect = [True, False]

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.follow_user("follower123", "nonexistent")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Following profile not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_follow_user_already_following(
        self,
        follow_service,
        mock_crud
    ):

        mock_crud.get_profile_exists.return_value = True
        mock_crud.get_follow_exists.return_value = True

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.follow_user("follower123", "following123")

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Follow already exists" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_unfollow_user_success(
        self,
        follow_service,
        mock_crud,
        sample_profile_response
    ):

        mock_crud.get_profile_exists.return_value = True
        mock_crud.get_follow_exists.return_value = True
        mock_crud.unfollow_user.return_value = None

        mock_crud.get_profile.return_value = sample_profile_response

        result = await follow_service.unfollow_user(
            "follower123",
            "following123"
        )

        assert isinstance(result, FollowResponse)
        assert result.follower_id == "follower123"
        assert result.following_id == "following123"
        mock_crud.unfollow_user.assert_called_once_with(
            "follower123",
            "following123"
        )

        mock_crud.get_profile.assert_called_once_with("follower123")

    @pytest.mark.asyncio
    async def test_unfollow_user_follow_not_exists(
        self,
        follow_service,
        mock_crud
    ):

        mock_crud.get_profile_exists.return_value = True
        mock_crud.get_follow_exists.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.unfollow_user("follower123", "following123")

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Follow does not exist" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_followers_success(self, follow_service, mock_crud):

        mock_crud.get_profile_exists.return_value = True

        sample_followers = [
            {"uuid": "follower1", "username": "user1", "photo": "photo1.jpg"},
            {"uuid": "follower2", "username": "user2", "photo": "photo2.jpg"}
        ]
        mock_crud.get_followers_list.return_value = sample_followers
        mock_crud.get_followers_count.return_value = 2

        result = await follow_service.get_followers("profile123")

        assert isinstance(result, FollowersListResponse)
        assert result.profile_id == "profile123"
        assert result.followers == sample_followers
        assert result.followers_count == 2

    @pytest.mark.asyncio
    async def test_get_followers_profile_not_found(
        self,
        follow_service,
        mock_crud
    ):

        mock_crud.get_profile_exists.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await follow_service.get_followers("nonexistent")

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_following_success(self, follow_service, mock_crud):

        mock_crud.get_profile_exists.return_value = True
        sample_following = [
            {"uuid": "following1", "username": "user1", "photo": "photo1.jpg"},
            {"uuid": "following2", "username": "user2", "photo": "photo2.jpg"}
        ]
        mock_crud.get_following_list.return_value = sample_following
        mock_crud.get_following_count.return_value = 2

        result = await follow_service.get_following("profile123")

        assert isinstance(result, FollowingListResponse)
        assert result.profile_id == "profile123"
        assert result.followings == sample_following
        assert result.followings_count == 2
