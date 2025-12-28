import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

client = TestClient(app)

class TestMainEndpoints:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Post Service is running"}

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"message": "healthy"}

    def test_db_health(self):
        response = client.get("/db_health")
        assert response.status_code in [200, 503]

    def test_create_post_success(self):
        with patch('app.main.crud.create_post') as mock_create, \
             patch('app.main.rabbitmq_service.send_post_created') as mock_send:
            
            mock_post = MagicMock()
            mock_post.id = 1
            mock_post.text = "Test post"
            mock_post.profile_id = "test-123"
            mock_post.likes_amount = 0
            mock_post.create_date.isoformat.return_value = "2023-01-01T00:00:00"
            mock_post.edited = False
            mock_post.likers = []
            
            mock_create.return_value = mock_post
            
            post_data = {
                "text": "Test post",
                "profile_id": "test-123"
            }
            
            response = client.post("/", json=post_data)
            
            assert response.status_code == 200
            mock_create.assert_called_once()
            mock_send.assert_called_once()

    def test_get_posts_feed(self):
        with patch('app.main.crud.get_posts_feed') as mock_get:
            mock_post1 = MagicMock()
            mock_post1.id = 1
            mock_post1.text = "Post 1"
            mock_post1.profile_id = "test-123"
            mock_post1.likes_amount = 0
            mock_post1.create_date.isoformat.return_value = "2023-01-01T00:00:00"
            mock_post1.edited = False
            mock_post1.likers = []
            
            mock_post2 = MagicMock()
            mock_post2.id = 2
            mock_post2.text = "Post 2"
            mock_post2.profile_id = "test-123"
            mock_post2.likes_amount = 0
            mock_post2.create_date.isoformat.return_value = "2023-01-01T00:00:00"
            mock_post2.edited = False
            mock_post2.likers = []
            
            mock_get.return_value = [mock_post1, mock_post2]
            
            response = client.get("/feed?skip=0&limit=10")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]['text'] == 'Post 1'

    def test_like_post_success(self):
        with patch('app.main.crud.like_post') as mock_like, \
             patch('app.main.rabbitmq_service.send_post_liked') as mock_send:
            
            mock_post = MagicMock()
            mock_post.id = 1
            mock_post.text = "Test post"
            mock_post.profile_id = "test-123"
            mock_post.likes_amount = 1
            mock_post.create_date.isoformat.return_value = "2023-01-01T00:00:00"
            mock_post.edited = False
            mock_post.likers = ['liker-123']
            
            mock_like.return_value = mock_post
            
            like_data = {
                "profile_id": "liker-123"
            }
            
            response = client.post("/1/like", json=like_data)
            
            assert response.status_code == 200
            mock_like.assert_called_once()
            mock_send.assert_called_once()

    def test_create_comment_success(self):
        with patch('app.main.crud.get_post') as mock_get_post, \
             patch('app.main.crud.create_comment') as mock_create, \
             patch('app.main.rabbitmq_service.send_comment_created') as mock_send:
            
            mock_get_post.return_value = MagicMock()
            
            mock_comment = MagicMock()
            mock_comment.id = 1
            mock_comment.text = "Test comment"
            mock_comment.post_id = 1
            mock_comment.profile_id = "test-123"
            mock_comment.edited = False
            
            mock_create.return_value = mock_comment
            
            comment_data = {
                "text": "Test comment",
                "profile_id": "test-123"
            }
            
            response = client.post("/1/comments", json=comment_data)
            
            assert response.status_code == 200
            mock_get_post.assert_called_once()
            mock_create.assert_called_once()
            mock_send.assert_called_once()