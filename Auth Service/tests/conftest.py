# tests/conftest.py
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession


# ========== Только базовые фикстуры БЕЗ импорта app ==========

@pytest.fixture
def mock_db_session():
    """Фикстура для мок-сессии базы данных"""
    session = AsyncMock(spec=AsyncSession)

    session.execute = AsyncMock()
    session.add = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.scalar = AsyncMock()

    return session


@pytest.fixture
def mock_rabbitmq():
    """Фикстура для мок RabbitMQ сервиса"""
    rabbit_mock = AsyncMock()
    rabbit_mock.send_user_register = AsyncMock()
    rabbit_mock.connect = AsyncMock()
    rabbit_mock.close = AsyncMock()
    return rabbit_mock


@pytest.fixture
def sample_user_data():
    """Фикстура с тестовыми данными пользователя"""
    return {
        "uuid": "test_uuid_1234567890abcdef12345678",
        "username": "testuser",
        "login": "test_login",
        "email": "test@example.com",
        "password": "hashed_password_123",
        "role": "user"
    }


@pytest.fixture
def sample_user_model(sample_user_data):
    """Фикстура с мок-моделью пользователя"""
    # Импортируем здесь, а не в начале файла
    with patch('app.rabbitmq.rabbitmq_service', MagicMock()):
        with patch('app.database.engine', MagicMock()):
            from app import models

            user_mock = MagicMock(spec=models.User)
            user_mock.uuid = sample_user_data["uuid"]
            user_mock.username = sample_user_data["username"]
            user_mock.login = sample_user_data["login"]
            user_mock.email = sample_user_data["email"]
            user_mock.password = sample_user_data["password"]
            user_mock.role = sample_user_data["role"]

            return user_mock


@pytest.fixture
def sample_token_model():
    """Фикстура с мок-моделью токена"""
    with patch('app.rabbitmq.rabbitmq_service', MagicMock()):
        with patch('app.database.engine', MagicMock()):
            from app import models

            token_mock = MagicMock(spec=models.Token)
            token_mock.id = 1
            token_mock.uuid = "test_uuid_1234567890abcdef12345678"
            token_mock.jwt = "test.refresh.token.here"
            token_mock.token_type = "refresh"
            token_mock.ip = "127.0.0.1"
            token_mock.expires_at = None

            return token_mock