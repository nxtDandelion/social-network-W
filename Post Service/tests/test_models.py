import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Profile, Post, Comment

TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

class TestModels:
    def test_profile_creation(self, db_session):
        profile = Profile(
            uuid="test-uuid-123",
            username="testuser"
        )
        db_session.add(profile)
        db_session.commit()
        
        assert profile.uuid == "test-uuid-123"
        assert profile.username == "testuser"
        assert profile.tag is None
        assert profile.photo is None

    def test_post_creation(self, db_session):
        profile = Profile(uuid="test-uuid-123", username="testuser")
        db_session.add(profile)
        
        post = Post(
            text="Test post content",
            profile_id="test-uuid-123",
            likes_amount=0,
            edited=False,
            likers=[]
        )
        db_session.add(post)
        db_session.commit()
        
        assert post.text == "Test post content"
        assert post.profile_id == "test-uuid-123"
        assert post.likes_amount == 0
        assert post.edited is False
        assert post.likers == []

    def test_comment_creation(self, db_session):
        profile = Profile(uuid="test-uuid-123", username="testuser")
        post = Post(text="Test post", profile_id="test-uuid-123")
        db_session.add(profile)
        db_session.add(post)
        db_session.commit()
        
        comment = Comment(
            text="Test comment",
            post_id=post.id,
            profile_id="test-uuid-123"
        )
        db_session.add(comment)
        db_session.commit()
        
        assert comment.text == "Test comment"
        assert comment.post_id == post.id
        assert comment.profile_id == "test-uuid-123"
        assert comment.edited is False
