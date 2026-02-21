import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.handlers import handle_user_registered, handle_profile_updated, handle_user_event
from app import schemas

@pytest.mark.asyncio
async def test_handle_user_registered():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123',
        'username': 'testuser'
    }
    
    with patch('app.handlers.crud.create_profile', new_callable=AsyncMock) as mock_create:
        await handle_user_registered(event_data, mock_db)
        
        mock_create.assert_called_once()
        call_args = mock_create.call_args[0]
        assert call_args[1].uuid == 'test-uuid-123'
        assert call_args[1].username == 'testuser'

@pytest.mark.asyncio
async def test_handle_profile_updated():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123',
        'username': 'updateduser',
        'tag': 'updatedtag',
        'photo': 'new_photo.jpg',
        'subscribes': {'user2': {'uuid': 'user2'}}
    }
    
    with patch('app.handlers.crud.update_profile', new_callable=AsyncMock) as mock_update:
        await handle_profile_updated(event_data, mock_db)
        
        mock_update.assert_called_once()
        call_args = mock_update.call_args[0]
        assert call_args[1] == 'test-uuid-123'
        assert call_args[2].username == 'updateduser'
        assert call_args[2].tag == 'updatedtag'
        assert call_args[2].photo == 'new_photo.jpg'
        assert call_args[2].subscribes == {'user2': {'uuid': 'user2'}}

@pytest.mark.asyncio
async def test_handle_user_event_user_registered():
    mock_db = AsyncMock()
    event_data = {'uuid': 'test-123', 'username': 'testuser'}
    
    with patch('app.handlers.handle_user_registered', new_callable=AsyncMock) as mock_handler:
        await handle_user_event('user_registered', event_data, mock_db)
        mock_handler.assert_called_once_with(event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_event_profile_updated():
    mock_db = AsyncMock()
    event_data = {'uuid': 'test-123', 'username': 'updateduser'}
    
    with patch('app.handlers.handle_profile_updated', new_callable=AsyncMock) as mock_handler:
        await handle_user_event('profile_updated', event_data, mock_db)
        mock_handler.assert_called_once_with(event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_event_unknown():
    mock_db = AsyncMock()
    event_data = {}
    
    await handle_user_event('unknown_event', event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_registered_with_error():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123',
        'username': 'testuser'
    }
    
    with patch('app.handlers.crud.create_profile', side_effect=Exception("DB Error")):
        await handle_user_registered(event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_registered_with_tag():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123',
        'username': 'testuser',
        'tag': 'premium'
    }
    
    with patch('app.handlers.crud.create_profile', new_callable=AsyncMock) as mock_create:
        await handle_user_registered(event_data, mock_db)
        
        mock_create.assert_called_once()
        call_args = mock_create.call_args[0]
        assert call_args[1].uuid == 'test-uuid-123'
        assert call_args[1].username == 'testuser'

@pytest.mark.asyncio
async def test_handle_profile_updated_with_photo():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123',
        'photo': 'base64_encoded_image'
    }
    
    with patch('app.handlers.crud.update_profile', new_callable=AsyncMock) as mock_update:
        await handle_profile_updated(event_data, mock_db)
        
        mock_update.assert_called_once()
        call_args = mock_update.call_args[0]
        assert call_args[1] == 'test-uuid-123'
        assert call_args[2].photo == 'base64_encoded_image'

@pytest.mark.asyncio
async def test_handle_user_registered_minimal():
    mock_db = AsyncMock()
    event_data = {
        'uuid': 'test-uuid-123'
        # Без username - это вызывает ошибку валидации
    }
    
    with patch('app.handlers.crud.create_profile', new_callable=AsyncMock) as mock_create:
        # Функция должна поймать ошибку и не вызвать create_profile
        await handle_user_registered(event_data, mock_db)
        
        # Проверяем, что create_profile НЕ был вызван из-за ошибки валидации
        mock_create.assert_not_called()

@pytest.mark.asyncio
async def test_handle_user_event_multiple_calls():
    mock_db = AsyncMock()
    events = [
        ('user_registered', {'uuid': '1', 'username': 'user1'}),
        ('profile_updated', {'uuid': '1', 'username': 'user1_updated'}),
        ('user_registered', {'uuid': '2', 'username': 'user2'})
    ]
    
    with patch('app.handlers.handle_user_registered', new_callable=AsyncMock) as mock_reg, \
         patch('app.handlers.handle_profile_updated', new_callable=AsyncMock) as mock_upd:
        
        for event_type, data in events:
            await handle_user_event(event_type, data, mock_db)
        
        assert mock_reg.call_count == 2
        assert mock_upd.call_count == 1