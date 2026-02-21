import pytest
from app.schemas import ProfileCreate, ProfileUpdate, PostCreate, PostUpdate, CommentCreate, CommentUpdate

class TestSchemas:
    def test_profile_create(self):
        profile = ProfileCreate(
            uuid="test-uuid-123",
            username="testuser",
            tag="testtag"
        )
        assert profile.uuid == "test-uuid-123"
        assert profile.username == "testuser"
        assert profile.tag == "testtag"

    def test_profile_update(self):
        profile = ProfileUpdate(username="updateduser", tag="updatedtag")
        assert profile.username == "updateduser"
        assert profile.tag == "updatedtag"

    def test_post_create(self):
        post = PostCreate(text="Test post content")
        assert post.text == "Test post content"

    def test_post_update(self):
        post = PostUpdate(text="Updated post content")
        assert post.text == "Updated post content"

    def test_comment_create(self):
        comment = CommentCreate(text="Test comment")
        assert comment.text == "Test comment"

    def test_comment_update(self):
        comment = CommentUpdate(text="Updated comment")
        assert comment.text == "Updated comment"