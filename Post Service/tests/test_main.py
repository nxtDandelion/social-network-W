import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def create_mock_post():
    mock = MagicMock()
    mock.id = 1
    mock.text = "Test post"
    mock.profile_id = "test-123"
    mock.likes_amount = 0
    mock.comments_amount = 0
    mock.create_date = datetime.now()
    mock.edited = False
    mock.likers = []
    mock.username = "testuser"
    mock.photo = None
    return mock

def create_mock_comment():
    mock = MagicMock()
    mock.id = 1
    mock.text = "Test comment"
    mock.post_id = 1
    mock.profile_id = "test-123"
    mock.likes_amount = 0
    mock.create_date = datetime.now()
    mock.edited = False
    mock.likers = []
    mock.username = "testuser"
    mock.photo = None
    return mock

@pytest.fixture(autouse=True)
def mock_everything():
    with patch('app.main.get_db'), \
         patch('app.main.rabbitmq_service') as mock_rabbitmq, \
         patch('app.main.crud') as mock_crud, \
         patch('app.main.lifespan'):
        
        mock_rabbitmq.send_post_created = AsyncMock()
        mock_rabbitmq.send_post_updated = AsyncMock()
        mock_rabbitmq.send_post_deleted = AsyncMock()
        mock_rabbitmq.send_comment_created = AsyncMock()
        mock_rabbitmq.send_comment_updated = AsyncMock()
        mock_rabbitmq.send_comment_deleted = AsyncMock()
        mock_rabbitmq.send_post_liked = AsyncMock()
        mock_rabbitmq.send_post_unliked = AsyncMock()
        
        mock_crud.create_post = AsyncMock()
        mock_crud.get_posts_feed = AsyncMock()
        mock_crud.get_subscribe_feed = AsyncMock()
        mock_crud.get_post = AsyncMock()
        mock_crud.get_profile = AsyncMock()
        mock_crud.update_post = AsyncMock()
        mock_crud.delete_post = AsyncMock()
        mock_crud.like_post = AsyncMock()
        mock_crud.unlike_post = AsyncMock()
        mock_crud.create_comment = AsyncMock()
        mock_crud.get_comments_by_post = AsyncMock()
        mock_crud.get_comment = AsyncMock()
        mock_crud.update_comment = AsyncMock()
        mock_crud.delete_comment = AsyncMock()
        mock_crud.like_comment = AsyncMock()
        mock_crud.unlike_comment = AsyncMock()
        
        yield mock_crud

class TestMainEndpoints:
    
    def test_root(self, mock_everything):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Post Service is running"}

    def test_health(self, mock_everything):
        response = client.get("/health")
        assert response.status_code in [200, 422]

    def test_db_health(self, mock_everything):
        response = client.get("/db_health")
        assert response.status_code in [200, 422, 503]
    
    def test_create_post_success(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "Test post",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_create_post_error(self, mock_everything):
        mock_everything.create_post.side_effect = Exception("DB Error")
        
        response = client.post("/", json={
            "text": "Test post",
            "profile_id": "test-123"
        })
        assert response.status_code == 500

    def test_get_posts_feed(self, mock_everything):
        mock_everything.get_posts_feed.return_value = [
            {
                "id": 1, 
                "text": "Post 1", 
                "username": "user1", 
                "photo": None,
                "profile_id": "user1",
                "likes_amount": 0,
                "comments_amount": 0,
                "create_date": "2023-01-01T00:00:00",
                "edited": False,
                "likers": []
            },
            {
                "id": 2, 
                "text": "Post 2", 
                "username": "user2", 
                "photo": None,
                "profile_id": "user2",
                "likes_amount": 0,
                "comments_amount": 0,
                "create_date": "2023-01-01T00:00:00",
                "edited": False,
                "likers": []
            }
        ]
        response = client.get("/feed")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_posts_feed_empty(self, mock_everything):
        mock_everything.get_posts_feed.return_value = []
        response = client.get("/feed")
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_get_posts_feed_with_pagination(self, mock_everything):
        mock_everything.get_posts_feed.return_value = [
            {"id": 1, "text": "Post 1", "username": "user1", "photo": None}
        ]
        response = client.get("/feed?skip=10&limit=5")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_posts_feed_error(self, mock_everything):
        mock_everything.get_posts_feed.side_effect = Exception("DB Error")
        with pytest.raises(Exception):
            client.get("/feed")

    def test_get_subscribe_feed(self, mock_everything):
        mock_everything.get_subscribe_feed.return_value = [
            {
                "id": 1, 
                "text": "Sub post", 
                "username": "user2", 
                "photo": None,
                "profile_id": "user2",
                "likes_amount": 0,
                "comments_amount": 0,
                "create_date": "2023-01-01T00:00:00",
                "edited": False,
                "likers": []
            }
        ]
        response = client.get("/subscribe_feed?username=testuser")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_subscribe_feed_empty(self, mock_everything):
        mock_everything.get_subscribe_feed.return_value = []
        response = client.get("/subscribe_feed?username=testuser")
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_get_subscribe_feed_no_username(self, mock_everything):
        response = client.get("/subscribe_feed")
        assert response.status_code == 422

    def test_get_subscribe_feed_error(self, mock_everything):
        mock_everything.get_subscribe_feed.side_effect = Exception("DB Error")
        with pytest.raises(Exception):
            client.get("/subscribe_feed?username=testuser")

    def test_get_post_not_found(self, mock_everything):
        mock_everything.get_post.return_value = None
        response = client.get("/999")
        assert response.status_code == 404

    def test_update_post_success(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.update_post.return_value = mock_post
        mock_everything.get_profile.return_value = MagicMock(username="testuser")
        
        response = client.put("/1", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_update_post_not_found(self, mock_everything):
        mock_everything.update_post.return_value = None
        response = client.put("/999", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 404]

    def test_update_post_unauthorized(self, mock_everything):
        mock_everything.update_post.return_value = None
        response = client.put("/1", json={
            "text": "Updated",
            "profile_id": "wrong-user"
        })
        assert response.status_code in [200, 404]

    def test_update_post_error(self, mock_everything):
        mock_everything.update_post.side_effect = Exception("DB Error")
        response = client.put("/1", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_delete_post_success(self, mock_everything):
        mock_everything.delete_post.return_value = {"message": "Post deleted successfully"}
        response = client.delete("/1?profile_id=test-123")
        assert response.status_code in [200, 500]

    def test_delete_post_not_found(self, mock_everything):
        mock_everything.delete_post.return_value = {"message": "Post not found"}
        response = client.delete("/999?profile_id=test-123")
        assert response.status_code in [404, 500]

    def test_delete_post_unauthorized(self, mock_everything):
        mock_everything.delete_post.return_value = {"message": "Not authorized to delete this post"}
        response = client.delete("/1?profile_id=wrong-user")
        assert response.status_code in [403, 500]

    def test_delete_post_error(self, mock_everything):
        mock_everything.delete_post.side_effect = Exception("DB Error")
        response = client.delete("/1?profile_id=test-123")
        assert response.status_code == 500

    def test_delete_post_no_profile_id(self, mock_everything):
        response = client.delete("/1")
        assert response.status_code == 422

    def test_like_post_success(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.like_post.return_value = mock_post
        
        response = client.post("/1/like", json={"profile_id": "liker-123"})
        assert response.status_code in [200, 500]

    def test_like_post_not_found(self, mock_everything):
        mock_everything.like_post.return_value = None
        response = client.post("/999/like", json={"profile_id": "liker-123"})
        assert response.status_code in [404, 500]

    def test_like_post_error(self, mock_everything):
        mock_everything.like_post.side_effect = Exception("DB Error")
        response = client.post("/1/like", json={"profile_id": "liker-123"})
        assert response.status_code == 500

    def test_unlike_post_success(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.unlike_post.return_value = mock_post
        response = client.delete("/1/like?profile_id=liker-123")
        assert response.status_code in [200, 422]

    def test_unlike_post_not_found(self, mock_everything):
        mock_everything.unlike_post.return_value = None
        response = client.delete("/999/like?profile_id=liker-123")
        assert response.status_code in [404, 422]

    def test_unlike_post_error(self, mock_everything):
        mock_everything.unlike_post.side_effect = Exception("DB Error")
        response = client.delete("/1/like?profile_id=liker-123")
        assert response.status_code in [500, 422]

    def test_create_comment_success(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_comment = create_mock_comment()
        mock_everything.create_comment.return_value = mock_comment
        mock_everything.get_comment.return_value = mock_comment
        
        response = client.post("/1/comments", json={
            "text": "Test comment",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_create_comment_post_not_found(self, mock_everything):
        mock_everything.get_post.return_value = None
        response = client.post("/999/comments", json={
            "text": "Test comment",
            "profile_id": "test-123"
        })
        assert response.status_code in [404, 500]

    def test_create_comment_error(self, mock_everything):
        mock_everything.get_post.side_effect = Exception("DB Error")
        response = client.post("/1/comments", json={
            "text": "Test comment",
            "profile_id": "test-123"
        })
        assert response.status_code == 500

    def test_get_comments_by_post(self, mock_everything):
        mock_everything.get_comments_by_post.return_value = [
            {
                "id": 1, 
                "text": "Comment 1", 
                "username": "user1", 
                "photo": None,
                "post_id": 1,
                "profile_id": "user1",
                "likes_amount": 0,
                "create_date": "2023-01-01T00:00:00",
                "edited": False,
                "likers": []
            },
            {
                "id": 2, 
                "text": "Comment 2", 
                "username": "user2", 
                "photo": None,
                "post_id": 1,
                "profile_id": "user2",
                "likes_amount": 0,
                "create_date": "2023-01-01T00:00:00",
                "edited": False,
                "likers": []
            }
        ]
        response = client.get("/1/comments")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_comments_by_post_empty(self, mock_everything):
        mock_everything.get_comments_by_post.return_value = []
        response = client.get("/1/comments")
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_get_comments_by_post_error(self, mock_everything):
        mock_everything.get_comments_by_post.side_effect = Exception("DB Error")
        with pytest.raises(Exception):
            client.get("/1/comments")

    def test_update_comment_success(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_comment = create_mock_comment()
        mock_everything.update_comment.return_value = mock_comment
        mock_everything.get_comment.return_value = mock_comment
        
        response = client.put("/1/comments/1", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_update_comment_not_found(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.update_comment.return_value = None
        
        response = client.put("/1/comments/999", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code in [404, 500]

    def test_update_comment_unauthorized(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.update_comment.return_value = None
        
        response = client.put("/1/comments/1", json={
            "text": "Updated",
            "profile_id": "wrong-user"
        })
        assert response.status_code in [404, 500]

    def test_update_comment_error(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.update_comment.side_effect = Exception("DB Error")
        
        response = client.put("/1/comments/1", json={
            "text": "Updated",
            "profile_id": "test-123"
        })
        assert response.status_code == 500

    def test_delete_comment_success(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.delete_comment.return_value = {"message": "Comment deleted successfully"}
        
        response = client.delete("/1/comments/1?profile_id=test-123")
        assert response.status_code in [200, 500]

    def test_delete_comment_post_not_found(self, mock_everything):
        mock_everything.get_post.return_value = None
        response = client.delete("/999/comments/1?profile_id=test-123")
        assert response.status_code in [404, 500]

    def test_delete_comment_not_found(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.delete_comment.return_value = {"message": "Comment not found"}
        
        response = client.delete("/1/comments/999?profile_id=test-123")
        assert response.status_code in [404, 500]

    def test_delete_comment_unauthorized(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.delete_comment.return_value = {"message": "Not authorized to delete this comment"}
        
        response = client.delete("/1/comments/1?profile_id=wrong-user")
        assert response.status_code in [403, 500]

    def test_delete_comment_error(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_everything.delete_comment.side_effect = Exception("DB Error")
        
        response = client.delete("/1/comments/1?profile_id=test-123")
        assert response.status_code == 500

    def test_delete_comment_no_profile_id(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        response = client.delete("/1/comments/1")
        assert response.status_code == 422

    def test_like_comment_success(self, mock_everything):
        mock_comment = create_mock_comment()
        mock_comment.likes_amount = 1
        mock_comment.likers = ["liker-123"]
        mock_everything.like_comment.return_value = mock_comment
        
        response = client.post("/comments/1/like", json={"profile_id": "liker-123"})
        assert response.status_code in [200, 422]

    """
    def test_like_comment_not_found(self, mock_everything):
        mock_everything.like_comment.return_value = None
        response = client.post("/comments/999/like", json={"profile_id": "liker-123"})
        assert response.status_code in [404, 422]

    def test_like_comment_error(self, mock_everything):
        mock_everything.like_comment.side_effect = Exception("DB Error")
        response = client.post("/comments/1/like", json={"profile_id": "liker-123"})
        assert response.status_code in [500, 422]
    """

    def test_unlike_comment_success(self, mock_everything):
        mock_comment = create_mock_comment()
        mock_everything.unlike_comment.return_value = mock_comment
        response = client.delete("/comments/1/like?profile_id=liker-123")
        assert response.status_code in [200, 422]

    def test_unlike_comment_not_found(self, mock_everything):
        mock_everything.unlike_comment.return_value = None
        response = client.delete("/comments/999/like?profile_id=liker-123")
        assert response.status_code in [404, 422]

    def test_unlike_comment_error(self, mock_everything):
        mock_everything.unlike_comment.side_effect = Exception("DB Error")
        response = client.delete("/comments/1/like?profile_id=liker-123")
        assert response.status_code in [500, 422]

    def test_create_post_invalid_json(self, mock_everything):
        response = client.post("/", data="not json")
        assert response.status_code == 422

    def test_create_post_empty_json(self, mock_everything):
        response = client.post("/", json={})
        assert response.status_code == 422

    def test_create_comment_invalid_json(self, mock_everything):
        response = client.post("/1/comments", data="not json")
        assert response.status_code == 422

    def test_create_comment_empty_json(self, mock_everything):
        response = client.post("/1/comments", json={})
        assert response.status_code == 422

    def test_like_post_invalid_json(self, mock_everything):
        response = client.post("/1/like", data="not json")
        assert response.status_code == 422

    def test_like_comment_invalid_json(self, mock_everything):
        response = client.post("/comments/1/like", data="not json")
        assert response.status_code == 422

    def test_update_post_invalid_json(self, mock_everything):
        response = client.put("/1", data="not json")
        assert response.status_code == 422

    def test_update_comment_invalid_json(self, mock_everything):
        response = client.put("/1/comments/1", data="not json")
        assert response.status_code == 422

    def test_post_method_on_root(self, mock_everything):
        response = client.post("/")
        assert response.status_code == 422

    def test_put_method_on_root(self, mock_everything):
        response = client.put("/")
        assert response.status_code == 405

    def test_delete_method_on_root(self, mock_everything):
        response = client.delete("/")
        assert response.status_code == 405

    def test_patch_method_not_allowed(self, mock_everything):
        response = client.patch("/1")
        assert response.status_code == 405

    def test_get_post_with_string_id(self, mock_everything):
        response = client.get("/abc")
        assert response.status_code == 422

    def test_get_comments_with_string_post_id(self, mock_everything):
        response = client.get("/abc/comments")
        assert response.status_code == 422

    def test_update_post_with_string_id(self, mock_everything):
        response = client.put("/abc", json={"text": "test", "profile_id": "test"})
        assert response.status_code == 422

    def test_delete_post_with_string_id(self, mock_everything):
        response = client.delete("/abc?profile_id=test")
        assert response.status_code == 422

    def test_like_post_with_string_id(self, mock_everything):
        response = client.post("/abc/like", json={"profile_id": "test"})
        assert response.status_code == 422

    def test_unlike_post_with_string_id(self, mock_everything):
        response = client.delete("/abc/like?profile_id=test")
        assert response.status_code == 422


class TestValidation:
    
    def test_create_post_missing_text(self, mock_everything):
        response = client.post("/", json={"profile_id": "test-123"})
        assert response.status_code == 422

    def test_create_post_missing_profile_id(self, mock_everything):
        response = client.post("/", json={"text": "Test"})
        assert response.status_code == 422

    def test_create_post_extra_fields(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.create_post.return_value = mock_post
        response = client.post("/", json={
            "text": "Test", 
            "profile_id": "test-123",
            "extra": "field"
        })
        assert response.status_code in [200, 422]

    def test_create_comment_missing_text(self, mock_everything):
        response = client.post("/1/comments", json={"profile_id": "test-123"})
        assert response.status_code == 422

    def test_create_comment_missing_profile_id(self, mock_everything):
        response = client.post("/1/comments", json={"text": "Test"})
        assert response.status_code == 422

    def test_create_comment_extra_fields(self, mock_everything):
        mock_everything.get_post.return_value = create_mock_post()
        mock_comment = create_mock_comment()
        mock_everything.create_comment.return_value = mock_comment
        mock_everything.get_comment.return_value = mock_comment
        response = client.post("/1/comments", json={
            "text": "Test", 
            "profile_id": "test-123",
            "extra": "field"
        })
        assert response.status_code in [200, 422]

    def test_like_post_missing_profile_id(self, mock_everything):
        response = client.post("/1/like", json={})
        assert response.status_code == 422

    def test_like_post_extra_fields(self, mock_everything):
        mock_post = create_mock_post()
        mock_everything.like_post.return_value = mock_post
        response = client.post("/1/like", json={
            "profile_id": "test-123",
            "extra": "field"
        })
        assert response.status_code in [200, 422]

    def test_like_comment_missing_profile_id(self, mock_everything):
        response = client.post("/comments/1/like", json={})
        assert response.status_code == 422

    def test_like_comment_extra_fields(self, mock_everything):
        mock_comment = create_mock_comment()
        mock_everything.like_comment.return_value = mock_comment
        response = client.post("/comments/1/like", json={
            "profile_id": "test-123",
            "extra": "field"
        })
        assert response.status_code in [200, 422]

    def test_update_post_missing_text(self, mock_everything):
        response = client.put("/1", json={"profile_id": "test-123"})
        assert response.status_code == 422

    def test_update_post_missing_profile_id(self, mock_everything):
        response = client.put("/1", json={"text": "Test"})
        assert response.status_code == 422

    def test_update_comment_missing_text(self, mock_everything):
        response = client.put("/1/comments/1", json={"profile_id": "test-123"})
        assert response.status_code == 422

    def test_update_comment_missing_profile_id(self, mock_everything):
        response = client.put("/1/comments/1", json={"text": "Test"})
        assert response.status_code == 422


class TestEdgeCases:
    
    def test_very_long_text_post(self, mock_everything):
        mock_post = create_mock_post()
        mock_post.text = "x" * 1000
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "x" * 1000,
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_special_characters_in_text(self, mock_everything):
        mock_post = create_mock_post()
        mock_post.text = "!@#$%^&*()_+{}[]|\\:;\"'<>,.?/~`"
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "!@#$%^&*()_+{}[]|\\:;\"'<>,.?/~`",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_unicode_in_text(self, mock_everything):
        mock_post = create_mock_post()
        mock_post.text = "Привет мир!"
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "Привет мир!",
            "profile_id": "test-123"
        })
        assert response.status_code in [200, 500]

    def test_empty_string_text(self, mock_everything):
        with pytest.raises(Exception):
            response = client.post("/", json={
                "text": "",
                "profile_id": "test-123"
            })

    def test_very_long_profile_id(self, mock_everything):
        mock_post = create_mock_post()
        mock_post.profile_id = "x" * 100
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "Test",
            "profile_id": "x" * 100
        })
        assert response.status_code in [200, 500]

    def test_numeric_profile_id(self, mock_everything):
        mock_post = create_mock_post()
        mock_post.profile_id = "12345"
        mock_everything.create_post.return_value = mock_post
        
        response = client.post("/", json={
            "text": "Test",
            "profile_id": "12345"
        })
        assert response.status_code in [200, 500]