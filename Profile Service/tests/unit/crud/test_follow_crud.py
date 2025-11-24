import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.crud.follow import FollowCRUD


class TestFollowCRUD:

    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def follow_crud(self, mock_db):
        return FollowCRUD(mock_db)

    @pytest.fixture
    def mock_follower(self):
        mock = MagicMock()
        mock.uuid = "follower123"
        mock.username = "follower"
        mock.photo = "follower.jpg"
        mock.subscribes = {}
        return mock

    @pytest.fixture
    def mock_following(self):
        mock = MagicMock()
        mock.uuid = "following123"
        mock.username = "following"
        mock.photo = "following.jpg"
        mock.subscribers = {}
        mock.subscribers_amount = 0
        return mock

    @pytest.mark.asyncio
    async def test_follow_user_success(
        self,
        follow_crud,
        mock_db,
        mock_follower,
        mock_following
    ):

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(follow_crud.profile_crud, 'get_profile') as mock_get:
            mock_get.side_effect = [mock_follower, mock_following]

            result = await follow_crud.follow_user(
                "follower123",
                "following123"
            )

            assert result == mock_following
            assert "following123" in mock_follower.subscribes
            assert "follower123" in mock_following.subscribers
            mock_db.commit.assert_called_once()
            assert mock_db.refresh.call_count == 2

    @pytest.mark.asyncio
    async def test_get_profile_exists_true(self, follow_crud, mock_follower):

        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_follower
        ):

            result = await follow_crud.get_profile_exists("follower123")

            assert result is True

    @pytest.mark.asyncio
    async def test_get_profile_exists_false(self, follow_crud):

        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=None
        ):

            result = await follow_crud.get_profile_exists("nonexistent")

            assert result is False

    @pytest.mark.asyncio
    async def test_get_follow_exists_true(self, follow_crud, mock_follower):

        mock_follower.subscribes = {"following123": {}}
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_follower
        ):

            result = await follow_crud.get_follow_exists(
                "follower123",
                "following123"
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_get_follow_exists_false_no_follower(self, follow_crud):

        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=None
        ):

            result = await follow_crud.get_follow_exists(
                "nonexistent",
                "following123"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_get_follow_exists_false_no_subscribes(
        self,
        follow_crud,
        mock_follower
    ):

        mock_follower.subscribes = None
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_follower
        ):

            result = await follow_crud.get_follow_exists(
                "follower123",
                "following123"
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_unfollow_user_success(
        self,
        follow_crud,
        mock_db,
        mock_follower,
        mock_following
    ):

        mock_follower.subscribes = {"following123": {}}
        mock_following.subscribers = {"follower123": {}}
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(follow_crud.profile_crud, 'get_profile') as mock_get:
            mock_get.side_effect = [mock_follower, mock_following]

            result = await follow_crud.unfollow_user(
                "follower123",
                "following123"
            )

            assert result == mock_following
            assert "following123" not in mock_follower.subscribes
            assert "follower123" not in mock_following.subscribers
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_followers_list_success(
        self,
        follow_crud,
        mock_following
    ):

        mock_following.subscribers = {
            "follower1": {"username": "user1", "photo": "photo1.jpg"},
            "follower2": {"username": "user2", "photo": "photo2.jpg"}
        }
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_following
        ):

            result = await follow_crud.get_followers_list("following123")

            assert len(result) == 2
            assert result[0]["uuid"] == "follower1"
            assert result[1]["uuid"] == "follower2"

    @pytest.mark.asyncio
    async def test_get_followers_list_no_profile(self, follow_crud):

        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=None
        ):

            result = await follow_crud.get_followers_list("nonexistent")

            assert result == []

    @pytest.mark.asyncio
    async def test_get_followers_list_no_subscribers(
        self,
        follow_crud,
        mock_following
    ):

        mock_following.subscribers = None
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_following
        ):

            result = await follow_crud.get_followers_list("following123")

            assert result == []

    @pytest.mark.asyncio
    async def test_get_following_list_success(
        self,
        follow_crud,
        mock_follower
    ):

        mock_follower.subscribes = {
            "following1": {"username": "user1", "photo": "photo1.jpg"},
            "following2": {"username": "user2", "photo": "photo2.jpg"}
        }
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_follower
        ):

            result = await follow_crud.get_following_list("follower123")

            assert len(result) == 2
            assert result[0]["uuid"] == "following1"
            assert result[1]["uuid"] == "following2"

    @pytest.mark.asyncio
    async def test_get_followers_count_with_subscribers(
        self,
        follow_crud,
        mock_following
    ):

        mock_following.subscribers = {"follower1": {}, "follower2": {}}
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_following
        ):

            result = await follow_crud.get_followers_count("following123")

            assert result == 2

    @pytest.mark.asyncio
    async def test_get_followers_count_no_profile(self, follow_crud):

        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=None
        ):

            result = await follow_crud.get_followers_count("nonexistent")

            assert result == 0

    @pytest.mark.asyncio
    async def test_get_followers_count_no_subscribers(
        self,
        follow_crud,
        mock_following
    ):

        mock_following.subscribers = None
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_following
        ):

            result = await follow_crud.get_followers_count("following123")

            assert result == 0

    @pytest.mark.asyncio
    async def test_get_following_count_with_subscribes(
        self,
        follow_crud,
        mock_follower
    ):

        mock_follower.subscribes = {
            "following1": {},
            "following2": {},
            "following3": {}
        }
        with patch.object(
            follow_crud.profile_crud,
            'get_profile',
            return_value=mock_follower
        ):

            result = await follow_crud.get_following_count("follower123")

            assert result == 3
