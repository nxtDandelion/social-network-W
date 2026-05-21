import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app import crud, schemas, models

@pytest.fixture
def mock_db():
    mock = AsyncMock(spec=AsyncSession)
    mock.add = MagicMock()
    mock.commit = AsyncMock()
    mock.refresh = AsyncMock()
    mock.execute = AsyncMock()
    mock.delete = AsyncMock()
    return mock


def setup_mock_scalar_result(mock_db, return_value):
    mock_scalars = MagicMock()
    mock_scalars.first.return_value = return_value
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_scalars_result(mock_db, return_value):
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = return_value
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_feed_result(mock_db, posts_with_data):
    mock_rows = []
    for post, username, photo in posts_with_data:
        mock_row = MagicMock()
        mock_row.__iter__.return_value = (post, username, photo)
        mock_rows.append(mock_row)
    
    mock_result = MagicMock()
    mock_result.all.return_value = mock_rows
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_comment_result(mock_db, comment, username="testuser", photo=None):
    mock_row = MagicMock()
    mock_row.__iter__.return_value = (comment, username, photo)
    
    mock_result = MagicMock()
    mock_result.first.return_value = mock_row
    
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_comment_list_result(mock_db, comments_with_data):
    mock_rows = []
    for comment, username, photo in comments_with_data:
        mock_row = MagicMock()
        mock_row.__iter__.return_value = (comment, username, photo)
        mock_rows.append(mock_row)
    
    mock_result = MagicMock()
    mock_result.all.return_value = mock_rows
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_comment_delete_result(mock_db, comment, post_id=1):
    mock_row = MagicMock()
    mock_row.__iter__.return_value = (comment, post_id)
    
    mock_result = MagicMock()
    mock_result.first.return_value = mock_row
    
    mock_db.execute.return_value = mock_result
    return mock_result

def setup_mock_update_comment_flow(mock_db, comment, username="testuser"):
    call_count = 0
    
    async def execute_side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        
        if call_count == 1:
            mock_row = MagicMock()
            mock_row.__iter__.return_value = (comment, username, None)
            mock_result = MagicMock()
            mock_result.first.return_value = mock_row
            return mock_result
        elif call_count == 2:
            mock_result = MagicMock()
            return mock_result
        else:
            mock_scalars = MagicMock()
            mock_scalars.first.return_value = comment
            mock_result = MagicMock()
            mock_result.scalars.return_value = mock_scalars
            return mock_result
    
    mock_db.execute.side_effect = execute_side_effect

def setup_mock_complete_comment_flow(mock_db, comment, username="testuser", post_id=1):
    call_count = 0
    
    async def execute_side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        
        if call_count == 1:
            mock_row = MagicMock()
            mock_row.__iter__.return_value = (comment, username, None)
            mock_result = MagicMock()
            mock_result.first.return_value = mock_row
            return mock_result
        elif call_count == 2:
            mock_row = MagicMock()
            mock_row.__iter__.return_value = (comment, username, None)
            mock_result = MagicMock()
            mock_result.first.return_value = mock_row
            return mock_result
        elif call_count == 3:
            mock_result = MagicMock()
            return mock_result
        elif call_count == 4:
            mock_scalars = MagicMock()
            mock_scalars.first.return_value = comment
            mock_result = MagicMock()
            mock_result.scalars.return_value = mock_scalars
            return mock_result
        else:
            mock_row = MagicMock()
            mock_row.__iter__.return_value = (comment, post_id)
            mock_result = MagicMock()
            mock_result.first.return_value = mock_row
            return mock_result
    
    mock_db.execute.side_effect = execute_side_effect

def setup_mock_empty_result(mock_db):
    mock_result = MagicMock()
    mock_result.first.return_value = None
    mock_result.all.return_value = []
    mock_db.execute.return_value = mock_result
    return mock_result


@pytest.mark.asyncio
class TestCRUDProfile:
    async def test_create_profile(self, mock_db):
        profile_data = schemas.ProfileCreate(
            uuid="test-uuid-123",
            username="testuser"
        )
        
        result = await crud.create_profile(mock_db, profile_data)
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    async def test_get_profile(self, mock_db):
        mock_profile = models.Profile(uuid="test-uuid-123", username="testuser")
        setup_mock_scalar_result(mock_db, mock_profile)
        
        result = await crud.get_profile(mock_db, "test-uuid-123")
        
        assert result.uuid == "test-uuid-123"
        assert result.username == "testuser"

    async def test_get_profile_not_found(self, mock_db):
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.get_profile(mock_db, "non-existent-uuid")
        
        assert result is None

    async def test_update_profile(self, mock_db):
        update_data = schemas.ProfileUpdate(username="updateduser")
        mock_profile = models.Profile(uuid="test-uuid-123", username="updateduser")
        
        setup_mock_scalar_result(mock_db, mock_profile)
        
        result = await crud.update_profile(mock_db, "test-uuid-123", update_data)
        
        mock_db.execute.assert_called()
        mock_db.commit.assert_called_once()
        assert result.username == "updateduser"

    async def test_delete_profile(self, mock_db):
        result = await crud.delete_profile(mock_db, "test-uuid-123")
        
        mock_db.execute.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result["message"] == "Profile deleted successfully"


@pytest.mark.asyncio
class TestCRUDPost:
    async def test_create_post(self, mock_db):
        post_data = schemas.PostCreate(text="Test post content")
        
        result = await crud.create_post(mock_db, post_data, "test-uuid-123")
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    async def test_get_post(self, mock_db):
        mock_post = models.Post(id=1, text="Test post", profile_id="test-uuid-123")
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.get_post(mock_db, 1)
        
        assert result.id == 1
        assert result.text == "Test post"

    async def test_get_posts_feed(self, mock_db):
        mock_posts_with_data = [
            (models.Post(id=1, text="Post 1", profile_id="test-uuid-123"), "user1", "photo1.jpg"),
            (models.Post(id=2, text="Post 2", profile_id="test-uuid-123"), "user2", "photo2.jpg")
        ]
        setup_mock_feed_result(mock_db, mock_posts_with_data)
        
        result = await crud.get_posts_feed(mock_db, skip=0, limit=10)
        
        assert len(result) == 2
        assert result[0]["id"] == 1
        assert result[0]["text"] == "Post 1"
        assert result[0]["username"] == "user1"
        assert result[1]["id"] == 2
        assert result[1]["text"] == "Post 2"

    async def test_get_profile_posts(self, mock_db):
        mock_posts = [models.Post(id=1, text="Post 1", profile_id="test-uuid-123")]
        setup_mock_scalars_result(mock_db, mock_posts)
        
        result = await crud.get_profile_posts(mock_db, "test-uuid-123")
        
        assert len(result) == 1
        assert result[0].profile_id == "test-uuid-123"

    async def test_update_post_success(self, mock_db):
        post_update = schemas.PostUpdate(text="Updated text")
        mock_post = models.Post(id=1, text="Original text", profile_id="test-uuid-123")

        call_count = 0
        async def execute_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            mock_scalars = MagicMock()
            mock_scalars.first.return_value = mock_post
            mock_result = MagicMock()
            mock_result.scalars.return_value = mock_scalars
            return mock_result

        mock_db.execute.side_effect = execute_side_effect

        result = await crud.update_post(mock_db, 1, post_update, "test-uuid-123")

        assert mock_db.execute.call_count == 3
        mock_db.commit.assert_called_once()

    async def test_update_post_not_found(self, mock_db):
        post_update = schemas.PostUpdate(text="Updated text")
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.update_post(mock_db, 999, post_update, "test-uuid-123")
        
        assert result is None

    async def test_update_post_unauthorized(self, mock_db):
        post_update = schemas.PostUpdate(text="Updated text")
        mock_post = models.Post(id=1, text="Original text", profile_id="owner-uuid")
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.update_post(mock_db, 1, post_update, "different-uuid")
        
        assert result is None

    async def test_delete_post_success(self, mock_db):
        mock_post = models.Post(id=1, text="Test post", profile_id="test-uuid-123")
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.delete_post(mock_db, 1, "test-uuid-123")
        
        mock_db.execute.assert_called()
        mock_db.commit.assert_called_once()
        assert result["message"] == "Post deleted successfully"

    async def test_delete_post_not_found(self, mock_db):
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.delete_post(mock_db, 999, "test-uuid-123")
        
        assert result["message"] == "Post not found"

    async def test_delete_post_unauthorized(self, mock_db):
        mock_post = models.Post(id=1, text="Test post", profile_id="owner-uuid")
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.delete_post(mock_db, 1, "different-uuid")
        
        assert result["message"] == "Not authorized to delete this post"

    async def test_like_post(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-uuid-123",
            likers=[],
            likes_amount=0
        )
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.like_post(mock_db, 1, "liker-uuid")
        
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    async def test_unlike_post(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-uuid-123",
            likers=["liker-uuid"],
            likes_amount=1
        )
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.unlike_post(mock_db, 1, "liker-uuid")
        
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()


@pytest.mark.asyncio
class TestCRUDComment:
    async def test_create_comment(self, mock_db):
        comment_data = schemas.CommentCreate(text="Test comment")
        
        result = await crud.create_comment(mock_db, comment_data, 1, "test-uuid-123")
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    async def test_get_comment(self, mock_db):
        mock_comment = models.Comment(
            id=1, 
            text="Test comment", 
            post_id=1, 
            profile_id="test-uuid-123"
        )
        setup_mock_comment_result(mock_db, mock_comment, "testuser", "photo.jpg")
        
        result = await crud.get_comment(mock_db, 1)
        
        assert result.id == 1
        assert result.text == "Test comment"
        assert result.username == "testuser"
        assert result.photo == "photo.jpg"

    async def test_get_comments_by_post(self, mock_db):
        mock_comments_with_data = [
            (models.Comment(id=1, text="Comment 1", post_id=1, profile_id="test-uuid-123"), "user1", None),
            (models.Comment(id=2, text="Comment 2", post_id=1, profile_id="test-uuid-123"), "user2", None)
        ]
        setup_mock_comment_list_result(mock_db, mock_comments_with_data)
        
        result = await crud.get_comments_by_post(mock_db, 1)
        
        assert len(result) == 2
        assert result[0]["id"] == 1
        assert result[0]["text"] == "Comment 1"
        assert result[0]["username"] == "user1"
        assert result[1]["id"] == 2
        assert result[1]["text"] == "Comment 2"

    async def test_update_comment_success(self, mock_db):
        comment_update = schemas.CommentUpdate(text="Updated comment")
        mock_comment = models.Comment(
            id=1, 
            text="Original comment", 
            post_id=1, 
            profile_id="test-uuid-123"
        )

        setup_mock_update_comment_flow(mock_db, mock_comment, "testuser")

        result = await crud.update_comment(mock_db, 1, comment_update, "test-uuid-123")

        assert result is not None
        mock_db.commit.assert_called_once()

    async def test_delete_comment_success(self, mock_db):
        mock_comment = models.Comment(
            id=1, 
            text="Test comment", 
            post_id=1, 
            profile_id="test-uuid-123"
        )
        setup_mock_comment_delete_result(mock_db, mock_comment, 1)
        
        result = await crud.delete_comment(mock_db, 1, "test-uuid-123")
        
        assert result["message"] == "Comment deleted successfully"
        mock_db.commit.assert_called_once()

    async def test_update_comment_not_found(self, mock_db):
        comment_update = schemas.CommentUpdate(text="Updated comment")
        setup_mock_empty_result(mock_db)
        
        result = await crud.update_comment(mock_db, 999, comment_update, "test-123")
        
        assert result is None

    async def test_update_comment_unauthorized(self, mock_db):
        comment_update = schemas.CommentUpdate(text="Updated comment")
        mock_comment = models.Comment(id=1, text="Original", post_id=1, profile_id="owner-123")
        setup_mock_comment_result(mock_db, mock_comment, "owner")
        
        result = await crud.update_comment(mock_db, 1, comment_update, "different-123")
        
        assert result is None

    async def test_delete_comment_not_found(self, mock_db):
        setup_mock_empty_result(mock_db)
        
        result = await crud.delete_comment(mock_db, 999, "test-123")
        
        assert result["message"] == "Comment not found"

    async def test_delete_comment_unauthorized(self, mock_db):
        mock_comment = models.Comment(id=1, text="Test", post_id=1, profile_id="owner-123")
        setup_mock_comment_delete_result(mock_db, mock_comment, 1)
        
        result = await crud.delete_comment(mock_db, 1, "different-123")
        
        assert result["message"] == "Not authorized to delete this comment"


@pytest.mark.asyncio
class TestCRUDEdgeCases:
    async def test_create_profile_with_tag(self, mock_db):
        profile_data = schemas.ProfileCreate(
            uuid="test-uuid-123",
            username="testuser",
            tag="developer"
        )
        
        result = await crud.create_profile(mock_db, profile_data)
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    async def test_update_profile_partial_data(self, mock_db):
        update_data = schemas.ProfileUpdate(username="updateduser")
        
        mock_profile = models.Profile(uuid="test-uuid-123", username="updateduser", tag="original")
        setup_mock_scalar_result(mock_db, mock_profile)
        
        result = await crud.update_profile(mock_db, "test-uuid-123", update_data)
        
        assert mock_db.execute.call_count >= 2
        mock_db.commit.assert_called_once()
        assert result.username == "updateduser"

    async def test_update_profile_empty_data(self, mock_db):
        update_data = schemas.ProfileUpdate()
        
        mock_profile = models.Profile(uuid="test-uuid-123", username="original")
        setup_mock_scalar_result(mock_db, mock_profile)
        
        result = await crud.update_profile(mock_db, "test-uuid-123", update_data)
        
        mock_db.execute.assert_called_once()
        mock_db.commit.assert_not_called()

    async def test_get_profile_posts_empty(self, mock_db):
        setup_mock_scalars_result(mock_db, [])
        
        result = await crud.get_profile_posts(mock_db, "test-uuid-123")
        
        assert result == []
        assert len(result) == 0

    async def test_get_posts_feed_with_pagination(self, mock_db):
        mock_posts_with_data = [
            (models.Post(id=1, text="Post 1", profile_id="test-123"), "user1", None),
            (models.Post(id=2, text="Post 2", profile_id="test-123"), "user2", None)
        ]
        setup_mock_feed_result(mock_db, mock_posts_with_data)
        
        result = await crud.get_posts_feed(mock_db, skip=5, limit=10)
        
        assert len(result) == 2
        mock_db.execute.assert_called_once()

    async def test_like_post_already_liked(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-123"
        )
        mock_post.likers = ["liker-123"]
        mock_post.likes_amount = 1
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.like_post(mock_db, 1, "liker-123")
        
        mock_db.commit.assert_not_called()
        mock_db.refresh.assert_not_called()

    async def test_unlike_post_not_liked(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-123"
        )
        mock_post.likers = []
        mock_post.likes_amount = 0
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.unlike_post(mock_db, 1, "liker-123")
        
        mock_db.commit.assert_not_called()
        mock_db.refresh.assert_not_called()

    async def test_get_comments_by_post_empty(self, mock_db):
        setup_mock_comment_list_result(mock_db, [])
        
        result = await crud.get_comments_by_post(mock_db, 1)
        
        assert result == []
        assert len(result) == 0

    async def test_follow_profile_function(self, mock_db):
        result = await crud.follow_profile(mock_db, "follower-123", "followed-123")
        
        assert result["message"] == "???"

    async def test_unfollow_profile_function(self, mock_db):
        result = await crud.unfollow_profile(mock_db, "follower-123", "followed-123")
        
        assert result["message"] == "???"


@pytest.mark.asyncio
class TestCRUDErrorCases:
    async def test_update_post_none_post(self, mock_db):
        post_update = schemas.PostUpdate(text="Updated text")
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.update_post(mock_db, 999, post_update, "test-123")
        
        assert result is None

    async def test_delete_post_none_post(self, mock_db):
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.delete_post(mock_db, 999, "test-123")
        
        assert result["message"] == "Post not found"

    async def test_like_post_none_post(self, mock_db):
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.like_post(mock_db, 999, "liker-123")
        
        assert result is None

    async def test_unlike_post_none_post(self, mock_db):
        setup_mock_scalar_result(mock_db, None)
        
        result = await crud.unlike_post(mock_db, 999, "liker-123")
        
        assert result is None

    async def test_create_comment_with_edited_flag(self, mock_db):
        comment_data = schemas.CommentCreate(text="Test comment")
        
        result = await crud.create_comment(mock_db, comment_data, 1, "test-123")
        
        mock_db.add.assert_called_once()
        call_args = mock_db.add.call_args[0]
        db_comment = call_args[0]
        assert db_comment.edited is False

    async def test_update_post_with_flag_modified(self, mock_db):
        post_update = schemas.PostUpdate(text="Updated text")
        mock_post = models.Post(id=1, text="Original text", profile_id="test-123")
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            result = await crud.update_post(mock_db, 1, post_update, "test-123")
            
            mock_db.execute.assert_called()
            mock_db.commit.assert_called_once()

    async def test_update_comment_with_flag_modified(self, mock_db):
        comment_update = schemas.CommentUpdate(text="Updated comment")
        mock_comment = models.Comment(id=1, text="Original", post_id=1, profile_id="test-123")

        setup_mock_update_comment_flow(mock_db, mock_comment, "testuser")

        with patch('app.crud.flag_modified') as mock_flag:
            result = await crud.update_comment(mock_db, 1, comment_update, "test-123")
            
            mock_db.commit.assert_called_once()


@pytest.mark.asyncio
class TestCRUDJSONFields:
    async def test_post_likers_field(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-123"
        )
        mock_post.likers = ["user1", "user2"]
        mock_post.likes_amount = 2
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        result = await crud.get_post(mock_db, 1)
        
        assert result.likers == ["user1", "user2"]
        assert result.likes_amount == 2

    async def test_like_post_modifies_likers_json(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-123"
        )
        mock_post.likers = []
        mock_post.likes_amount = 0
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            result = await crud.like_post(mock_db, 1, "new-liker")
            
            mock_flag.assert_called_once_with(mock_post, "likers")
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    async def test_unlike_post_modifies_likers_json(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Test post", 
            profile_id="test-123"
        )
        mock_post.likers = ["existing-liker"]
        mock_post.likes_amount = 1
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            result = await crud.unlike_post(mock_db, 1, "existing-liker")
            
            mock_flag.assert_called_once_with(mock_post, "likers")
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()


@pytest.mark.asyncio
class TestCRUDComplexScenarios:
    async def test_complete_post_lifecycle(self, mock_db):
        post_data = schemas.PostCreate(text="Test post")
        await crud.create_post(mock_db, post_data, "test-123")
        
        mock_post = models.Post(id=1, text="Test post", profile_id="test-123")
        setup_mock_scalar_result(mock_db, mock_post)
        post = await crud.get_post(mock_db, 1)
        assert post is not None
        
        mock_post.likers = []
        mock_post.likes_amount = 0
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            liked_post = await crud.like_post(mock_db, 1, "liker-123")
            mock_flag.assert_called_once()
        
        post_update = schemas.PostUpdate(text="Updated post")
        
        call_count = 0
        async def execute_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            mock_scalars = MagicMock()
            mock_scalars.first.return_value = mock_post
            mock_result = MagicMock()
            mock_result.scalars.return_value = mock_scalars
            return mock_result
        
        mock_db.execute.side_effect = execute_side_effect
        updated_post = await crud.update_post(mock_db, 1, post_update, "test-123")
        
        setup_mock_scalar_result(mock_db, mock_post)
        deleted_result = await crud.delete_post(mock_db, 1, "test-123")
        assert deleted_result["message"] == "Post deleted successfully"

    async def test_complete_comment_lifecycle(self, mock_db):
        comment_data = schemas.CommentCreate(text="Test comment")
        await crud.create_comment(mock_db, comment_data, 1, "test-123")

        mock_comment = models.Comment(id=1, text="Test comment", post_id=1, profile_id="test-123")
        
        setup_mock_complete_comment_flow(mock_db, mock_comment, "testuser", 1)
        
        comment = await crud.get_comment(mock_db, 1)
        assert comment is not None

        comment_update = schemas.CommentUpdate(text="Updated comment")
        updated_comment = await crud.update_comment(mock_db, 1, comment_update, "test-123")

        deleted_result = await crud.delete_comment(mock_db, 1, "test-123")
        assert deleted_result["message"] == "Comment deleted successfully"

    async def test_post_with_multiple_likes(self, mock_db):
        mock_post = models.Post(
            id=1, 
            text="Popular post", 
            profile_id="test-123"
        )
        mock_post.likers = []
        mock_post.likes_amount = 0
        
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            await crud.like_post(mock_db, 1, "user1")
            assert mock_flag.call_count == 1

        mock_post.likers = ["user1"]
        mock_post.likes_amount = 1
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            await crud.like_post(mock_db, 1, "user2")
            assert mock_flag.call_count == 1
        
        mock_post.likers = ["user1", "user2"]
        mock_post.likes_amount = 2
        setup_mock_scalar_result(mock_db, mock_post)
        
        with patch('app.crud.flag_modified') as mock_flag:
            await crud.unlike_post(mock_db, 1, "user1")
            assert mock_flag.call_count == 1


@pytest.mark.asyncio
class TestCRUDSubscribeFeed:
    async def test_get_subscribe_feed_simple(self, mock_db):
        mock_profile = models.Profile(uuid="test-123", username="testuser")
        mock_profile.subscribes = {"user2": {"uuid": "user2"}}
        
        setup_mock_scalar_result(mock_db, mock_profile)
        
        result = await crud.get_subscribe_feed(mock_db, "testuser")
        
        assert result == []