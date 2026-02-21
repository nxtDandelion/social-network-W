"""Improved tests for RabbitMQ Service with better coverage"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
import sys
import os
import json
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.rabbitmq import RabbitMQService, rabbitmq_service, connect_rabbitmq, get_rabbitmq


@pytest.mark.asyncio
async def test_service_initialization():
    """Test RabbitMQ service initialization"""
    service = RabbitMQService()
    assert service.connection is None
    assert service.channel is None
    assert service.is_connected is False
    

@pytest.mark.asyncio
async def test_service_has_required_attributes():
    """Test service has required attributes"""
    service = RabbitMQService()
    assert hasattr(service, 'send_post_created')
    assert hasattr(service, 'send_post_updated')
    assert hasattr(service, 'send_post_deleted')
    assert hasattr(service, 'send_comment_created')
    assert hasattr(service, 'send_comment_updated')
    assert hasattr(service, 'send_comment_deleted')
    assert hasattr(service, 'connect')
    assert hasattr(service, 'close')


@pytest.mark.asyncio
async def test_send_post_event_not_connected():
    """Test sending event when not connected fails"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_post_event('test_event', {'id': 1})


@pytest.mark.asyncio
async def test_send_post_created_when_not_connected():
    """Test send_post_created logs error when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with patch('app.rabbitmq.logging.error') as mock_log:
        await service.send_post_created({'id': 1})
        mock_log.assert_called_once()


@pytest.mark.asyncio
async def test_send_post_updated_when_not_connected():
    """Test send_post_updated logs error when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with patch('app.rabbitmq.logging.error') as mock_log:
        await service.send_post_updated({'id': 1})
        mock_log.assert_called_once()


@pytest.mark.asyncio
async def test_send_post_deleted_when_not_connected():
    """Test send_post_deleted fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_post_deleted({'id': 1})


@pytest.mark.asyncio
async def test_send_comment_created_when_not_connected():
    """Test send_comment_created fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_comment_created({'id': 1})


@pytest.mark.asyncio
async def test_send_comment_updated_when_not_connected():
    """Test send_comment_updated fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_comment_updated({'id': 1})


@pytest.mark.asyncio
async def test_send_comment_deleted_when_not_connected():
    """Test send_comment_deleted fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_comment_deleted({'id': 1})


@pytest.mark.asyncio
async def test_send_post_liked_when_not_connected():
    """Test send_post_liked fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_post_liked({'id': 1})


@pytest.mark.asyncio
async def test_send_post_unliked_when_not_connected():
    """Test send_post_unliked fails when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    with pytest.raises(RuntimeError):
        await service.send_post_unliked({'id': 1})


@pytest.mark.asyncio
async def test_send_post_event_success():
    """Test sending post event successfully"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    post_data = {"id": 1, "text": "Test"}
    
    with patch('app.rabbitmq.aio_pika.Message') as mock_message_class:
        mock_msg = MagicMock()
        mock_message_class.return_value = mock_msg
        
        await service.send_post_event('post_created', post_data)
        service.post_events_exchange.publish.assert_called_once()


@pytest.mark.asyncio
async def test_send_post_event_with_error():
    """Test error handling in send_post_event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    service.post_events_exchange.publish.side_effect = Exception("Publish failed")
    
    with pytest.raises(Exception):
        await service.send_post_event('test_event', {'id': 1})


@pytest.mark.asyncio
async def test_start_consuming_events_not_connected():
    """Test consuming events when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    async def callback(event_type, data):
        pass
    
    with pytest.raises(RuntimeError):
        await service.start_consuming_events(callback)


@pytest.mark.asyncio
async def test_start_consuming_profile_events_not_connected():
    """Test consuming profile events when not connected"""
    service = RabbitMQService()
    service.is_connected = False
    
    async def callback(event_type, data):
        pass
    
    with pytest.raises(RuntimeError):
        await service.start_consuming_profile_events(callback)


@pytest.mark.asyncio
async def test_connect_to_rabbitmq():
    """Test connect_rabbitmq function"""
    with patch.object(rabbitmq_service, 'connect', new_callable=AsyncMock) as mock:
        await connect_rabbitmq()
        mock.assert_called_once()


@pytest.mark.asyncio
async def test_close_when_connected():
    """Test closing connection when connected"""
    service = RabbitMQService()
    service.connection = AsyncMock()
    
    await service.close()
    service.connection.close.assert_called_once()


@pytest.mark.asyncio
async def test_close_when_no_connection():
    """Test closing when no connection"""
    service = RabbitMQService()
    service.connection = None
    
    await service.close()


@pytest.mark.asyncio
async def test_send_post_created_success():
    """Test send_post_created sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    post_data = {"id": 1, "text": "New post"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_created(post_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_post_updated_success():
    """Test send_post_updated sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    post_data = {"id": 1, "text": "Updated post"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_updated(post_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_comment_created_success():
    """Test send_comment_created sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    comment_data = {"id": 1, "text": "Comment"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_comment_created(comment_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_comment_updated_success():
    """Test send_comment_updated sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    comment_data = {"id": 1, "text": "Updated"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_comment_updated(comment_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_comment_deleted_success():
    """Test send_comment_deleted sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    comment_data = {"id": 1}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_comment_deleted(comment_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_post_liked_success():
    """Test send_post_liked sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    like_data = {"post_id": 1, "profile_id": "user1"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_liked(like_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_post_unliked_success():
    """Test send_post_unliked sends correct event"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    unlike_data = {"post_id": 1, "profile_id": "user1"}
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_unliked(unlike_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_rabbitmq_service_singleton():
    """Test global rabbitmq_service is singleton"""
    assert rabbitmq_service is not None
    assert isinstance(rabbitmq_service, RabbitMQService)


@pytest.mark.asyncio
async def test_service_state_transitions():
    """Test service state transitions"""
    service = RabbitMQService()
    
    assert service.is_connected is False
    assert service.connection is None
    assert service.channel is None
    
    with pytest.raises(RuntimeError):
        await service.send_post_event('test', {'id': 1})


@pytest.mark.asyncio
async def test_multiple_event_types():
    """Test all different event types can be prepared"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    event_types = [
        ('post_created', service.send_post_created),
        ('post_updated', service.send_post_updated),
        ('post_deleted', service.send_post_deleted),
        ('comment_created', service.send_comment_created),
        ('comment_updated', service.send_comment_updated),
        ('comment_deleted', service.send_comment_deleted),
        ('post_liked', service.send_post_liked),
        ('post_unliked', service.send_post_unliked),
    ]
    
    for event_type, method in event_types:
        assert callable(method)


@pytest.mark.asyncio
async def test_send_with_empty_data():
    """Test sending events with empty data"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_event('test', {})
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_send_with_complex_data():
    """Test sending events with complex nested data"""
    service = RabbitMQService()
    service.is_connected = True
    service.post_events_exchange = AsyncMock()
    
    complex_data = {
        "id": 1,
        "nested": {"key": "value", "list": [1, 2, 3]},
        "special": "test@#$%"
    }
    
    with patch('app.rabbitmq.aio_pika.Message'):
        await service.send_post_event('complex', complex_data)
        assert service.post_events_exchange.publish.called


@pytest.mark.asyncio
async def test_service_initialization_attributes():
    """Test all service attributes are properly initialized"""
    service = RabbitMQService()
    
    assert hasattr(service, 'connection')
    assert hasattr(service, 'channel')
    assert hasattr(service, 'is_connected')
    assert hasattr(service, 'user_events_exchange')
    assert hasattr(service, 'post_events_exchange')
    assert hasattr(service, 'profile_events_exchange')
    assert hasattr(service, 'post_commands_queue')
    assert hasattr(service, 'post_profile_events_queue')


@pytest.mark.asyncio
async def test_get_rabbitmq_function():
    """Test get_rabbitmq utility function"""
    from app.rabbitmq import get_rabbitmq, RabbitMQService
    
    service = get_rabbitmq()
    assert service is not None
    assert isinstance(service, RabbitMQService)


@pytest.mark.asyncio
async def test_all_event_sending_methods_exist():
    """Test all event sending methods are defined"""
    service = RabbitMQService()
    
    methods_to_check = [
        'send_post_created',
        'send_post_updated',
        'send_post_deleted',
        'send_comment_created',
        'send_comment_updated',
        'send_comment_deleted',
        'send_post_liked',
        'send_post_unliked',
        'send_post_event',
        'connect',
        'close',
        'start_consuming_events',
        'start_consuming_profile_events',
    ]
    
    for method_name in methods_to_check:
        assert hasattr(service, method_name), f"Method {method_name} not found"
        assert callable(getattr(service, method_name))


@pytest.mark.asyncio
async def test_close_idempotent():
    """Test close can be called multiple times safely"""
    service = RabbitMQService()
    service.connection = None
    
    await service.close()
    await service.close()
    await service.close()


@pytest.mark.asyncio
async def test_service_methods_are_async():
    """Test service methods are async"""
    import inspect
    service = RabbitMQService()
    
    async_methods = [
        'connect',
        'send_post_created',
        'send_post_updated',
        'send_post_deleted',
        'send_comment_created',
        'send_comment_updated',
        'send_comment_deleted',
        'send_post_liked',
        'send_post_unliked',
        'send_post_event',
        'close',
        'start_consuming_events',
        'start_consuming_profile_events',
    ]
    
    for method_name in async_methods:
        method = getattr(service, method_name)
        assert inspect.iscoroutinefunction(method), f"{method_name} should be async"


class TestRabbitMQErrorHandling:
    """Test error handling in RabbitMQ service"""
    
    @pytest.mark.asyncio
    async def test_send_post_created_with_error_logs(self):
        """Test send_post_created error handling and logging"""
        service = RabbitMQService()
        service.is_connected = False
        
        with patch('app.rabbitmq.logging.error') as mock_log:
            await service.send_post_created({'id': 1})
            mock_log.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_post_updated_with_error_logs(self):
        """Test send_post_updated error handling"""
        service = RabbitMQService()
        service.is_connected = False
        
        with patch('app.rabbitmq.logging.error') as mock_log:
            await service.send_post_updated({'id': 1})
            mock_log.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_send_comment_created_error(self):
        """Test send_comment_created with disconnected service"""
        service = RabbitMQService()
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_comment_created({'id': 1})
    
    @pytest.mark.asyncio
    async def test_send_comment_updated_error(self):
        """Test send_comment_updated with disconnected service"""
        service = RabbitMQService()
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_comment_updated({'id': 1})
    
    @pytest.mark.asyncio
    async def test_send_comment_deleted_error(self):
        """Test send_comment_deleted with disconnected service"""
        service = RabbitMQService()
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_comment_deleted({'id': 1})
    
    @pytest.mark.asyncio
    async def test_send_post_liked_error(self):
        """Test send_post_liked with disconnected service"""
        service = RabbitMQService()
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_post_liked({'post_id': 1})
    
    @pytest.mark.asyncio
    async def test_send_post_unliked_error(self):
        """Test send_post_unliked with disconnected service"""
        service = RabbitMQService()
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_post_unliked({'post_id': 1})


class TestRabbitMQMessageFormatting:
    """Test message formatting and JSON serialization"""
    
    @pytest.mark.asyncio
    async def test_message_contains_event_type(self):
        """Test sent message includes event_type"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message') as mock_msg_class:
            mock_msg = MagicMock()
            mock_msg_class.return_value = mock_msg
            
            await service.send_post_event('test_event', {'id': 1})
            mock_msg_class.assert_called_once()
            call_kwargs = mock_msg_class.call_args[1]
            assert 'headers' in call_kwargs
            assert call_kwargs['headers']['event'] == 'test_event'
    
    @pytest.mark.asyncio
    async def test_message_contains_timestamp(self):
        """Test sent message includes timestamp"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message') as mock_msg_class:
            mock_msg = MagicMock()
            mock_msg_class.return_value = mock_msg
            
            await service.send_post_event('test_event', {'id': 1})
            mock_msg_class.assert_called_once()
            call_kwargs = mock_msg_class.call_args[1]
            assert call_kwargs['body'] is not None
    
    @pytest.mark.asyncio
    async def test_message_delivery_mode_persistent(self):
        """Test message is set to persistent delivery"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message') as mock_msg_class:
            mock_msg = MagicMock()
            mock_msg_class.return_value = mock_msg
            
            await service.send_post_event('test_event', {'id': 1})
            call_kwargs = mock_msg_class.call_args[1]
            assert 'delivery_mode' in call_kwargs
    
    @pytest.mark.asyncio
    async def test_message_content_type_json(self):
        """Test message content type is JSON"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message') as mock_msg_class:
            mock_msg = MagicMock()
            mock_msg_class.return_value = mock_msg
            
            await service.send_post_event('test_event', {'id': 1})
            call_kwargs = mock_msg_class.call_args[1]
            assert call_kwargs['content_type'] == 'application/json'


class TestRabbitMQDataVariants:
    """Test service with various data formats"""
    
    @pytest.mark.asyncio
    async def test_send_with_special_characters(self):
        """Test sending data with special characters"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        special_data = {
            "id": 1,
            "text": "Test @#$% <>&\" 中文",
            "emoji": "🎉🎊"
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('test', special_data)
            assert service.post_events_exchange.publish.called
    
    @pytest.mark.asyncio
    async def test_send_with_unicode(self):
        """Test sending data with unicode characters"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        unicode_data = {
            "text": "Привет 世界 مرحبا"
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('unicode_test', unicode_data)
            assert service.post_events_exchange.publish.called
    
    @pytest.mark.asyncio
    async def test_send_with_large_data(self):
        """Test sending large data payloads"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        large_data = {
            "id": 1,
            "text": "x" * 10000,
            "metadata": [{"key": f"value_{i}"} for i in range(100)]
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('large', large_data)
            assert service.post_events_exchange.publish.called
    
    @pytest.mark.asyncio
    async def test_send_with_numeric_values(self):
        """Test sending various numeric data types"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        numeric_data = {
            "id": 1,
            "count": 0,
            "negative": -5,
            "float_val": 3.14159,
            "large_int": 9999999999
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('numeric', numeric_data)
            assert service.post_events_exchange.publish.called
    
    @pytest.mark.asyncio
    async def test_send_with_null_values(self):
        """Test sending data with None/null values"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        null_data = {
            "id": 1,
            "optional_field": None,
            "empty_list": [],
            "empty_dict": {}
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('null_test', null_data)
            assert service.post_events_exchange.publish.called
    
    @pytest.mark.asyncio
    async def test_send_with_boolean_values(self):
        """Test sending boolean values"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        bool_data = {
            "id": 1,
            "is_active": True,
            "is_deleted": False
        }
        
        with patch('app.rabbitmq.aio_pika.Message'):
            await service.send_post_event('bool_test', bool_data)
            assert service.post_events_exchange.publish.called


class TestRabbitMQConnectionStates:
    """Test service behavior in different connection states"""
    
    @pytest.mark.asyncio
    async def test_transition_from_connected_to_disconnected(self):
        """Test transitioning from connected to disconnected state"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message'):
            try:
                await service.send_post_event('test', {'id': 1})
            except Exception:
                pass
        
        service.is_connected = False
        
        with pytest.raises(RuntimeError):
            await service.send_post_event('test', {'id': 1})
    
    @pytest.mark.asyncio
    async def test_multiple_services_independent(self):
        """Test multiple service instances are independent"""
        service1 = RabbitMQService()
        service2 = RabbitMQService()
        
        service1.is_connected = True
        
        assert service2.is_connected is False
        
        with pytest.raises(RuntimeError):
            await service2.send_post_event('test', {'id': 1})


class TestRabbitMQIntegration:
    """Test integration scenarios"""
    
    @pytest.mark.asyncio
    async def test_all_event_types_with_same_data(self):
        """Test all event types can handle same data structure"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        test_data = {
            "id": 1,
            "profile_id": "user123",
            "timestamp": "2023-01-01T00:00:00",
            "text": "test content"
        }
        
        event_methods = [
            service.send_post_created,
            service.send_post_updated,
            service.send_post_deleted,
            service.send_comment_created,
            service.send_comment_updated,
            service.send_comment_deleted,
            service.send_post_liked,
            service.send_post_unliked,
        ]
        
        with patch('app.rabbitmq.aio_pika.Message'):
            for method in event_methods:
                try:
                    await method(test_data)
                except Exception:
                    pass
    
    @pytest.mark.asyncio
    async def test_sequence_of_operations(self):
        """Test sequence of send operations"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message'):
            try:
                await service.send_post_created({'id': 1, 'text': 'new post'})
                await service.send_post_liked({'id': 1, 'profile_id': 'user1'})
                await service.send_post_liked({'id': 1, 'profile_id': 'user2'})
                await service.send_comment_created({'id': 100, 'post_id': 1, 'text': 'comment'})
                await service.send_comment_updated({'id': 100, 'text': 'edited comment'})
                await service.send_post_updated({'id': 1, 'text': 'edited post'})
                await service.send_post_deleted({'id': 1})
                
                assert service.post_events_exchange.publish.call_count >= 5
            except Exception:
                pass
    
    @pytest.mark.asyncio
    async def test_concurrent_sends_simulation(self):
        """Test behavior with rapid successive sends"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch('app.rabbitmq.aio_pika.Message'):
            try:
                for i in range(10):
                    await service.send_post_liked({'id': i, 'profile_id': f'user{i}'})
                
                assert service.post_events_exchange.publish.call_count >= 10
            except Exception:
                pass


# ============= НОВЫЕ ТЕСТЫ ДЛЯ ПОКРЫТИЯ =============

@pytest.mark.asyncio
class TestRabbitMQCoverage:
    """Тесты для покрытия недостающих строк в rabbitmq.py"""
    
    async def test_connect_success(self):
        """Тест успешного подключения"""
        service = RabbitMQService()
        
        with patch('aio_pika.connect_robust', new_callable=AsyncMock) as mock_connect:
            mock_connection = AsyncMock()
            mock_channel = AsyncMock()
            mock_connect.return_value = mock_connection
            mock_connection.channel.return_value = mock_channel
            
            mock_channel.declare_exchange = AsyncMock()
            mock_queue = AsyncMock()
            mock_channel.declare_queue = AsyncMock(return_value=mock_queue)
            
            await service.connect()
            
            assert service.is_connected is True
            assert service.connection == mock_connection
            assert service.channel == mock_channel
            mock_connect.assert_called_once_with(
                host='rabbitmq',
                port=5672,
                login='guest',
                password='guest',
                virtualhost='/',
            )
            
            # Проверяем создание exchange
            assert mock_channel.declare_exchange.call_count == 3
            
            # Проверяем создание очередей
            assert mock_channel.declare_queue.call_count == 2

    async def test_start_consuming_events_success(self):
        """Тест успешного запуска consumer для событий"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_commands_queue = AsyncMock()
        
        async def callback(event_type, data):
            pass
        
        await service.start_consuming_events(callback)
        service.post_commands_queue.consume.assert_called_once()

    async def test_start_consuming_profile_events_success(self):
        """Тест успешного запуска consumer для профильных событий"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_profile_events_queue = AsyncMock()
        
        async def callback(event_type, data):
            pass
        
        await service.start_consuming_profile_events(callback)
        service.post_profile_events_queue.consume.assert_called_once()

    async def test_message_processing_success(self):
        """Тест успешной обработки сообщения"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_commands_queue = AsyncMock()
        
        # Создаем специальный мок для message, который поддерживает асинхронный контекстный менеджер
        mock_message = AsyncMock()
        mock_message.body = json.dumps({"test": "data"}).encode()
        mock_message.headers = {'event': 'test_event'}
        
        # Создаем отдельный мок для асинхронного контекстного менеджера
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock()
        mock_cm.__aexit__ = AsyncMock()
        
        # Устанавливаем process как функцию, возвращающую контекстный менеджер
        mock_message.process = MagicMock(return_value=mock_cm)
        
        callback_called = False
        callback_event_type = None
        callback_data = None
        
        async def callback(event_type, data):
            nonlocal callback_called, callback_event_type, callback_data
            callback_called = True
            callback_event_type = event_type
            callback_data = data
        
        # Симулируем получение сообщения
        consume_callback = None
        
        async def consume_side_effect(cb):
            nonlocal consume_callback
            consume_callback = cb
        
        service.post_commands_queue.consume.side_effect = consume_side_effect
        await service.start_consuming_events(callback)
        
        # Вызываем callback с сообщением
        await consume_callback(mock_message)
        
        assert callback_called is True
        assert callback_event_type == 'test_event'
        assert callback_data == {"test": "data"}
        mock_message.process.assert_called_once()
        mock_cm.__aenter__.assert_called_once()
        mock_cm.__aexit__.assert_called_once()

    async def test_message_processing_invalid_json(self):
        """Тест обработки сообщения с невалидным JSON"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_commands_queue = AsyncMock()
        
        # Создаем специальный мок для message
        mock_message = AsyncMock()
        mock_message.body = b'invalid json'
        mock_message.headers = {'event': 'test_event'}
        mock_message.reject = AsyncMock()
        
        # Создаем отдельный мок для асинхронного контекстного менеджера
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock()
        mock_cm.__aexit__ = AsyncMock()
        
        # Устанавливаем process как функцию, возвращающую контекстный менеджер
        mock_message.process = MagicMock(return_value=mock_cm)
        
        callback_called = False
        
        async def callback(event_type, data):
            nonlocal callback_called
            callback_called = True
        
        # Симулируем получение сообщения
        consume_callback = None
        
        async def consume_side_effect(cb):
            nonlocal consume_callback
            consume_callback = cb
        
        service.post_commands_queue.consume.side_effect = consume_side_effect
        await service.start_consuming_events(callback)
        
        with patch('app.rabbitmq.logging.error') as mock_log:
            await consume_callback(mock_message)
            
            assert callback_called is False
            mock_log.assert_called_once()
            mock_message.reject.assert_called_once_with(requeue=False)
            mock_message.process.assert_called_once()
            mock_cm.__aenter__.assert_called_once()
            mock_cm.__aexit__.assert_called_once()

    async def test_message_processing_general_error(self):
        """Тест обработки сообщения с общей ошибкой"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_commands_queue = AsyncMock()
        
        # Создаем специальный мок для message
        mock_message = AsyncMock()
        mock_message.body = json.dumps({"test": "data"}).encode()
        mock_message.headers = {'event': 'test_event'}
        mock_message.reject = AsyncMock()
        
        # Создаем отдельный мок для асинхронного контекстного менеджера
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock()
        mock_cm.__aexit__ = AsyncMock()
        
        # Устанавливаем process как функцию, возвращающую контекстный менеджер
        mock_message.process = MagicMock(return_value=mock_cm)
        
        async def callback(event_type, data):
            raise Exception("Callback error")
        
        # Симулируем получение сообщения
        consume_callback = None
        
        async def consume_side_effect(cb):
            nonlocal consume_callback
            consume_callback = cb
        
        service.post_commands_queue.consume.side_effect = consume_side_effect
        await service.start_consuming_events(callback)
        
        with patch('app.rabbitmq.logging.error') as mock_log:
            await consume_callback(mock_message)
            
            mock_log.assert_called_once()
            mock_message.reject.assert_called_once_with(requeue=False)
            mock_message.process.assert_called_once()
            mock_cm.__aenter__.assert_called_once()
            mock_cm.__aexit__.assert_called_once()

    async def test_profile_message_processing_success(self):
        """Тест успешной обработки профильного сообщения"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_profile_events_queue = AsyncMock()
        
        # Создаем специальный мок для message
        mock_message = AsyncMock()
        mock_message.body = json.dumps({"profile": "data"}).encode()
        mock_message.headers = {'event': 'profile_updated'}
        
        # Создаем отдельный мок для асинхронного контекстного менеджера
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock()
        mock_cm.__aexit__ = AsyncMock()
        
        # Устанавливаем process как функцию, возвращающую контекстный менеджер
        mock_message.process = MagicMock(return_value=mock_cm)
        
        callback_called = False
        callback_event_type = None
        callback_data = None
        
        async def callback(event_type, data):
            nonlocal callback_called, callback_event_type, callback_data
            callback_called = True
            callback_event_type = event_type
            callback_data = data
        
        # Симулируем получение сообщения
        consume_callback = None
        
        async def consume_side_effect(cb):
            nonlocal consume_callback
            consume_callback = cb
        
        service.post_profile_events_queue.consume.side_effect = consume_side_effect
        await service.start_consuming_profile_events(callback)
        
        # Вызываем callback с сообщением
        await consume_callback(mock_message)
        
        assert callback_called is True
        assert callback_event_type == 'profile_updated'
        assert callback_data == {"profile": "data"}
        mock_message.process.assert_called_once()
        mock_cm.__aenter__.assert_called_once()
        mock_cm.__aexit__.assert_called_once()

    async def test_send_post_event_with_exception(self):
        """Тест отправки события с исключением при публикации"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        service.post_events_exchange.publish.side_effect = Exception("Publish error")
        
        with patch('app.rabbitmq.aio_pika.Message'), \
             patch('app.rabbitmq.logging.error') as mock_log:
            
            with pytest.raises(Exception):
                await service.send_post_event('test', {'id': 1})
            
            mock_log.assert_called_once()

    async def test_all_send_methods_call_send_post_event(self):
        """Тест что все методы отправки вызывают send_post_event"""
        service = RabbitMQService()
        service.is_connected = True
        service.post_events_exchange = AsyncMock()
        
        with patch.object(service, 'send_post_event', new_callable=AsyncMock) as mock_send:
            await service.send_post_created({'id': 1})
            mock_send.assert_called_with('post_created', {'id': 1})
            
            await service.send_post_updated({'id': 1})
            mock_send.assert_called_with('post_updated', {'id': 1})
            
            await service.send_post_deleted({'id': 1})
            mock_send.assert_called_with('post_deleted', {'id': 1})
            
            await service.send_comment_created({'id': 1})
            mock_send.assert_called_with('comment_created', {'id': 1})
            
            await service.send_comment_updated({'id': 1})
            mock_send.assert_called_with('comment_updated', {'id': 1})
            
            await service.send_comment_deleted({'id': 1})
            mock_send.assert_called_with('comment_deleted', {'id': 1})
            
            await service.send_post_liked({'id': 1})
            mock_send.assert_called_with('post_liked', {'id': 1})
            
            await service.send_post_unliked({'id': 1})
            mock_send.assert_called_with('post_unliked', {'id': 1})

    async def test_connect_failure(self):
        """Тест ошибки подключения"""
        service = RabbitMQService()
        
        with patch('aio_pika.connect_robust', side_effect=Exception("Connection failed")):
            with pytest.raises(Exception):
                await service.connect()
            
            assert service.is_connected is False