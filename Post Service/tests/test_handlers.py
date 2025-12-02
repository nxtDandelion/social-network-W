import pytest
from unittest.mock import AsyncMock, patch
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
    
    with patch('app.handlers.crud.create_profile') as mock_create:
        await handle_user_registered(event_data, mock_db)
        
        mock_create.assert_called_once()
        call_args = mock_create.call_args[0]
        assert call_args[1].uuid == 'test-uuid-123'
        assert call_args[1].username == 'testuser'

@pytest.mark.asyncio
async def test_handle_profile_updated():
    mock_db = AsyncMock()
    event_data = {
        'user_id': 'test-uuid-123',
        'update_data': {
            'username': 'updateduser',
            'tag': 'updatedtag'
        }
    }
    
    with patch('app.handlers.crud.update_profile') as mock_update:
        await handle_profile_updated(event_data, mock_db)
        
        mock_update.assert_called_once()
        call_args = mock_update.call_args[0]
        assert call_args[1] == 'test-uuid-123'
        assert call_args[2].username == 'updateduser'
        assert call_args[2].tag == 'updatedtag'

@pytest.mark.asyncio
async def test_handle_user_event_user_registered():
    mock_db = AsyncMock()
    event_data = {'uuid': 'test-123', 'username': 'testuser'}
    
    with patch('app.handlers.handle_user_registered') as mock_handler:
        await handle_user_event('user_registered', event_data, mock_db)
        mock_handler.assert_called_once_with(event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_event_profile_updated():
    mock_db = AsyncMock()
    event_data = {'user_id': 'test-123', 'update_data': {}}
    
    with patch('app.handlers.handle_profile_updated') as mock_handler:
        await handle_user_event('profile_updated', event_data, mock_db)
        mock_handler.assert_called_once_with(event_data, mock_db)

@pytest.mark.asyncio
async def test_handle_user_event_unknown():
    mock_db = AsyncMock()
    event_data = {}
    
    await handle_user_event('unknown_event', event_data, mock_db)