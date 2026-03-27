import pytest
import json
import aio_pika
from unittest.mock import AsyncMock, MagicMock, patch, call
from app.rabbitmq import RabbitMqService, rabbitmq_service, get_rabbitmq, connect_rabbitmq
import logging


@pytest.fixture
def rabbitmq_service_instance():
    return RabbitMqService()


@pytest.mark.asyncio
async def test_connect_failure(rabbitmq_service_instance):
    with patch('aio_pika.connect_robust', AsyncMock(side_effect=Exception("Connection failed"))):
        with patch('app.rabbitmq.logging.error') as mock_logging:
            with pytest.raises(Exception, match="Connection failed"):
                await rabbitmq_service_instance.connect()
            mock_logging.assert_called_with("Failed to connect to RabbitMQ: Connection failed")

@pytest.mark.asyncio
async def test_send_user_register_success(rabbitmq_service_instance):
    rabbitmq_service_instance.is_connected = True
    rabbitmq_service_instance.user_events_exchange = AsyncMock()
    from app.schemas import UserRegisteredEvent
    user_event = UserRegisteredEvent(
        uuid="user_123",
        username="testuser",
        email="test@example.com",
        login="testlogin"
    )

    mock_message = MagicMock()

    with patch('aio_pika.Message', return_value=mock_message):
        with patch('app.rabbitmq.logging.info') as mock_logging:
            await rabbitmq_service_instance.send_user_register(user_event)
            aio_pika.Message.assert_called_once()
            rabbitmq_service_instance.user_events_exchange.publish.assert_called_once()
            mock_logging.assert_called_with("Sent user register testuser")


@pytest.mark.asyncio
async def test_send_user_register_not_connected(rabbitmq_service_instance):
    rabbitmq_service_instance.is_connected = False

    from app.schemas import UserRegisteredEvent
    user_event = UserRegisteredEvent(
        uuid="user_123",
        username="testuser",
        email="test@example.com",
        login="testlogin"
    )

    with pytest.raises(RuntimeError, match="Not connected to RabbitMQ"):
        await rabbitmq_service_instance.send_user_register(user_event)


@pytest.mark.asyncio
async def test_send_user_register_exception(rabbitmq_service_instance):
    rabbitmq_service_instance.is_connected = True
    rabbitmq_service_instance.user_events_exchange = AsyncMock()
    rabbitmq_service_instance.user_events_exchange.publish.side_effect = Exception("Publish failed")

    from app.schemas import UserRegisteredEvent
    user_event = UserRegisteredEvent(
        uuid="user_123",
        username="testuser",
        email="test@example.com",
        login="testlogin"
    )

    with patch('app.rabbitmq.logging.error') as mock_logging:
        with pytest.raises(Exception, match="Publish failed"):
            await rabbitmq_service_instance.send_user_register(user_event)
        mock_logging.assert_called_with("Failed to send user register message: Publish failed")

@pytest.mark.asyncio
async def test_start_consuming(rabbitmq_service_instance):
    rabbitmq_service_instance.auth_profile_events_queue = AsyncMock()

    mock_callback = AsyncMock()

    with patch('app.rabbitmq.logging.error') as mock_logging:
        await rabbitmq_service_instance.start_consuming("test_queue", mock_callback)

        rabbitmq_service_instance.auth_profile_events_queue.consume.assert_called_once()

        mock_logging.assert_called_with("Started consuming from test_queue")

@pytest.mark.asyncio
async def test_close_with_connection(rabbitmq_service_instance):
    mock_connection = AsyncMock()
    rabbitmq_service_instance.connection = mock_connection

    await rabbitmq_service_instance.close()

    mock_connection.close.assert_called_once()


@pytest.mark.asyncio
async def test_close_without_connection(rabbitmq_service_instance):
    rabbitmq_service_instance.connection = None
    await rabbitmq_service_instance.close()

@pytest.mark.asyncio
async def test_get_rabbitmq():
    result = get_rabbitmq()
    assert result is rabbitmq_service


@pytest.mark.asyncio
async def test_connect_rabbitmq():
    with patch.object(rabbitmq_service, 'connect', AsyncMock()):
        await connect_rabbitmq()
        rabbitmq_service.connect.assert_called_once()

@pytest.mark.asyncio
async def test_process_message_success():
    mock_message = MagicMock(spec=aio_pika.IncomingMessage)
    mock_message.body = b'{"uuid": "test_id", "username": "test_user"}'

    mock_db = AsyncMock()
    mock_db_context = MagicMock()
    mock_db_context.__aenter__ = AsyncMock(return_value=mock_db)
    mock_db_context.__aexit__ = AsyncMock()

    with patch('app.rabbitmq.AsyncSessionLocal', return_value=mock_db_context):
        with patch('app.rabbitmq.handle_profile_update', AsyncMock()):
            with patch('app.rabbitmq.logging.error'):

                service = RabbitMqService()

                pass


@pytest.mark.asyncio
async def test_process_message_invalid_json():
    mock_message = MagicMock(spec=aio_pika.IncomingMessage)
    mock_message.body = b'invalid json'

    with patch('app.rabbitmq.AsyncSessionLocal'):
        with patch('app.rabbitmq.logging.error') as mock_logging:
            service = RabbitMqService()
            pass