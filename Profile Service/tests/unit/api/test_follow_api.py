import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

from app.api.follow import follow_user, unfollow_user
from app.api.follow import get_followers, get_following


class TestFollowAPI:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def mock_follow_service(self):
        return AsyncMock()

    @pytest.fixture
    def sample_follow_response(self):
        return {
            "follower_username": "user1",
            "following_username": "user2",
            "message": "Successfully followed"
        }

    @pytest.fixture
    def sample_followers_list(self):
        return {
            "username": "user1",
            "followers": ["user2", "user3", "user4"],
            "total": 3
        }

    @pytest.fixture
    def sample_following_list(self):
        return {
            "username": "user1",
            "following": ["user2", "user3"],
            "total": 2
        }

    @pytest.mark.asyncio
    async def test_follow_user_success(
        self,
        mock_db,
        mock_follow_service,
        sample_follow_response
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.follow_user = AsyncMock(
                return_value=sample_follow_response
            )

            result = await follow_user(
                current_user="user1",
                username="user2",
                db=mock_db
            )

            assert result == sample_follow_response
            mock_follow_service.follow_user.assert_called_once_with(
                "user1", "user2"
            )

    @pytest.mark.asyncio
    async def test_follow_user_self_follow(
        self,
        mock_db,
        mock_follow_service
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.follow_user = AsyncMock(
                side_effect=HTTPException(
                    status_code=400,
                    detail="Cannot follow yourself"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await follow_user(
                    current_user="user1",
                    username="user1",
                    db=mock_db
                )

            assert exc_info.value.status_code == 400
            assert "Cannot follow yourself" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_unfollow_user_success(
        self,
        mock_db,
        mock_follow_service,
        sample_follow_response
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.unfollow_user = AsyncMock(
                return_value=sample_follow_response
            )

            result = await unfollow_user(
                current_user="user1",
                username="user2",
                db=mock_db
            )

            assert result == sample_follow_response
            mock_follow_service.unfollow_user.assert_called_once_with(
                "user1", "user2"
            )

    @pytest.mark.asyncio
    async def test_unfollow_user_not_following(
        self,
        mock_db,
        mock_follow_service
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.unfollow_user = AsyncMock(
                side_effect=HTTPException(
                    status_code=404,
                    detail="You are not following this user"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await unfollow_user(
                    current_user="user1",
                    username="user2",
                    db=mock_db
                )

            assert exc_info.value.status_code == 404
            assert "not following" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_followers_success(
        self,
        mock_db,
        mock_follow_service,
        sample_followers_list
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.get_followers = AsyncMock(
                return_value=sample_followers_list
            )

            result = await get_followers(
                username="user1",
                db=mock_db
            )

            assert result == sample_followers_list
            mock_follow_service.get_followers.assert_called_once_with("user1")

    @pytest.mark.asyncio
    async def test_get_followers_user_not_found(
        self,
        mock_db,
        mock_follow_service
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.get_followers = AsyncMock(
                side_effect=HTTPException(
                    status_code=404,
                    detail="User not found"
                )
            )

            with pytest.raises(HTTPException) as exc_info:
                await get_followers(
                    username="nonexistent",
                    db=mock_db
                )

            assert exc_info.value.status_code == 404
            assert "User not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_following_success(
        self,
        mock_db,
        mock_follow_service,
        sample_following_list
    ):
        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.get_following = AsyncMock(
                return_value=sample_following_list
            )

            result = await get_following(
                username="user1",
                db=mock_db
            )

            assert result == sample_following_list
            mock_follow_service.get_following.assert_called_once_with("user1")

    @pytest.mark.asyncio
    async def test_get_following_empty_list(
        self,
        mock_db,
        mock_follow_service
    ):
        empty_following = {
            "username": "user1",
            "following": [],
            "total": 0
        }

        with patch(
            'app.api.follow.FollowService',
            return_value=mock_follow_service
        ):
            mock_follow_service.get_following = AsyncMock(
                return_value=empty_following
            )

            result = await get_following(
                username="user1",
                db=mock_db
            )

            assert result["total"] == 0
            assert result["following"] == []
