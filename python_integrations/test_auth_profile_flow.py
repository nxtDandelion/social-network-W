import pytest
import httpx
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

AUTH_SERVICE_URL = "http://localhost:8001"
PROFILE_SERVICE_URL = "http://localhost:8003"
PROFILE_DB_URL = os.getenv("PROFILE_DB_URL", "postgresql+asyncpg://profile_user:profile_password@localhost:5434/profile_db")
AUTH_DB_URL = os.getenv("AUTH_DB_URL", "postgresql+asyncpg://auth_user:auth_password@localhost:5432/auth_db")

@pytest.mark.asyncio
async def test_user_registration_creates_profile():
    """
    Проверяет, что успешная регистрация в Auth Service
    приводит к созданию профиля в БД Profile Service через RabbitMQ.
    """
    test_uuid = str(uuid.uuid4())
    test_username = f"testuser_{test_uuid[:8]}"
    test_email = f"test_{test_uuid[:8]}@example.com"
    test_login = f"login_{test_uuid[:8]}"

    payload = {
        "username": test_username,
        "email": test_email,
        "login": test_login,
        "password": "StrongPassword123!"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{AUTH_SERVICE_URL}/register", json=payload)
    assert response.status_code == 200, f"Ошибка регистрации: {response.text}"
    auth_data = response.json()
    user_uuid = auth_data.get("uuid")
    assert user_uuid is not None
    engine = create_async_engine(PROFILE_DB_URL)
    profile_found = False
    max_retries = 10
    delay_seconds = 0.5

    async with engine.begin() as conn:
        for _ in range(max_retries):
            query = text("SELECT uuid, username, email FROM profile WHERE uuid = :uuid")
            result = await conn.execute(query, {"uuid": user_uuid})
            profile_row = result.fetchone()

            if profile_row:
                assert profile_row.username == test_username
                assert profile_row.email == test_email
                profile_found = True
                break
            await asyncio.sleep(delay_seconds)

    await engine.dispose()
    assert profile_found, "Профиль не был создан в БД Profile Service в течение 5 секунд. Проверьте RabbitMQ и воркеры."


async def get_registered_user(client):
    """Хелпер для создания пользователя перед тестом обновления"""
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "username": f"user_{unique_id}",
        "email": f"email_{unique_id}@test.com",
        "login": f"login_{unique_id}",
        "password": "Password123!"
    }
    response = await client.post(f"{AUTH_SERVICE_URL}/register", json=user_data)
    return response.json(), user_data


async def wait_for_profile_ready(client, username):
    """
    Ждем, пока Profile Service создаст профиль.
    После регистрации в Auth профиль появляется не мгновенно.
    """
    for _ in range(10):
        resp = await client.get(f"{PROFILE_SERVICE_URL}/{username}")
        if resp.status_code == 200:
            return True
        await asyncio.sleep(0.5)
    return False


@pytest.mark.asyncio
async def test_update_login_syncs_to_auth():
    """Тест 1: Изменение Login"""
    async with httpx.AsyncClient() as client:
        auth_user, _ = await get_registered_user(client)
        username = auth_user["username"]
        user_uuid = auth_user["uuid"]
        new_login = f"new_log_{uuid.uuid4().hex[:5]}"
        assert await wait_for_profile_ready(client, username), "Профиль не создался вовремя"
        payload = {
            "login": new_login,
            "username": username,
            "email": auth_user["email"]
        }
        resp = await client.put(f"{PROFILE_SERVICE_URL}/{username}", json=payload)
        assert resp.status_code == 200, f"Ошибка PUT: {resp.text}"
        auth_engine = create_async_engine(AUTH_DB_URL)
        synced = False
        async with auth_engine.connect() as conn:
            for _ in range(15):
                res = await conn.execute(
                    text("SELECT login FROM users WHERE uuid = :uuid"),
                    {"uuid": user_uuid}
                )
                row = res.fetchone()
                if row and row.login == new_login:
                    synced = True
                    break
                await asyncio.sleep(0.5)

        await auth_engine.dispose()
        assert synced, "Login не синхронизировался в Auth Service"


@pytest.mark.asyncio
async def test_update_username_syncs_to_auth():
    """Тест 2: Изменение Username"""
    async with httpx.AsyncClient() as client:
        auth_user, _ = await get_registered_user(client)
        old_username = auth_user["username"]
        new_username = f"new_name_{uuid.uuid4().hex[:5]}"

        assert await wait_for_profile_ready(client, old_username)
        payload = {"username": new_username, "login": auth_user["login"], "email": auth_user["email"]}
        resp = await client.put(f"{PROFILE_SERVICE_URL}/{old_username}", json=payload)
        assert resp.status_code == 200

        auth_engine = create_async_engine(AUTH_DB_URL)
        async with auth_engine.connect() as conn:
            for _ in range(15):
                res = await conn.execute(
                    text("SELECT username FROM users WHERE uuid = :uuid"),
                    {"uuid": auth_user["uuid"]}
                )
                row = res.fetchone()
                if row and row.username == new_username:
                    await auth_engine.dispose()
                    return  # Успех
                await asyncio.sleep(0.5)

        await auth_engine.dispose()
        pytest.fail("Username не синхронизировался")


@pytest.mark.asyncio
async def test_update_email_syncs_to_auth():
    """Тест 3: Изменение Email"""
    async with httpx.AsyncClient() as client:
        auth_user, _ = await get_registered_user(client)
        username = auth_user["username"]
        new_email = f"new_{uuid.uuid4().hex[:5]}@test.com"

        assert await wait_for_profile_ready(client, username)

        payload = {"email": new_email, "username": username, "login": auth_user["login"]}
        resp = await client.put(f"{PROFILE_SERVICE_URL}/{username}", json=payload)
        assert resp.status_code == 200

        auth_engine = create_async_engine(AUTH_DB_URL)
        async with auth_engine.connect() as conn:
            for _ in range(15):
                res = await conn.execute(
                    text("SELECT email FROM users WHERE uuid = :uuid"),
                    {"uuid": auth_user["uuid"]}
                )
                row = res.fetchone()
                if row and row.email == new_email:
                    await auth_engine.dispose()
                    return
                await asyncio.sleep(0.5)

        await auth_engine.dispose()
        pytest.fail("Email не синхронизировался")