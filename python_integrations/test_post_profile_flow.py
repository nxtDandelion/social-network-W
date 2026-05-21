import os
import pytest
import httpx
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlalchemy.pool.impl import NullPool

POST_SERVICE_URL = os.getenv("POST_SERVICE_URL", "http://localhost:8002")
PROFILE_SERVICE_URL = os.getenv("PROFILE_SERVICE_URL", "http://localhost:8003")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")

POST_DB_URL = os.getenv("POST_DB_URL", "postgresql+asyncpg://post_user:post_password@localhost:5433/post_db")
PROFILE_DB_URL = os.getenv("PROFILE_DB_URL",
                           "postgresql+asyncpg://profile_user:profile_password@localhost:5434/profile_db")

post_engine = create_async_engine(POST_DB_URL, poolclass=NullPool)
profile_engine = create_async_engine(PROFILE_DB_URL, poolclass=NullPool)


async def wait_for_condition(engine, query, params, condition_func):
    for _ in range(20):
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text(query), params)
                row = result.fetchone()
                if row and condition_func(row):
                    return row
        except Exception as e:
            print(f"Connection retry due to: {e}")

        await asyncio.sleep(0.5)
    return None



@pytest.fixture(scope="function")
async def test_user():
    """
    Фикстура: создает пользователя через Auth,
    чтобы он пробросился в Profile и Post сервисы.
    """
    unique_id = uuid.uuid4().hex[:8]
    user_payload = {
        "username": f"user_{unique_id}",
        "email": f"email_{unique_id}@test.com",
        "login": f"login_{unique_id}",
        "password": "Password123!"
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{AUTH_SERVICE_URL}/register", json=user_payload)
        assert resp.status_code == 200
        user_data = resp.json()
        user_uuid = user_data["uuid"]

        synced_row = await wait_for_condition(
            post_engine,
            "SELECT uuid FROM profile WHERE uuid = :u",
            {"u": user_uuid},
            lambda r: r is not None
        )
        assert synced_row, "User profile didn't sync to Post Service in time"

        return user_data


@pytest.mark.asyncio
async def test_1_create_post_sync(test_user):
    """1. Создание поста: проверка связи Post -> Profile"""
    async with httpx.AsyncClient() as client:
        payload = {"text": "Test Post Content", "profile_id": test_user["uuid"]}
        resp = await client.post(f"{POST_SERVICE_URL}/", json=payload)
        assert resp.status_code == 200
        post_id = resp.json()["id"]
        row = await wait_for_condition(
            profile_engine,
            "SELECT user_posts FROM profile WHERE uuid = :u",
            {"u": test_user["uuid"]},
            lambda r: post_id in r.user_posts
        )
        assert row, "Post ID not found in Profile's user_posts list"


@pytest.mark.asyncio
async def test_3_post_like_sync(test_user):
    """3. Лайк на пост: проверка счетчиков в обеих БД"""
    async with httpx.AsyncClient() as client:
        p_resp = await client.post(f"{POST_SERVICE_URL}/",
                                   json={"text": "Like me", "profile_id": test_user["uuid"]})
        post_id = p_resp.json()["id"]

        await client.post(f"{POST_SERVICE_URL}/{post_id}/like",
                          json={"profile_id": test_user["uuid"]})

        row = await wait_for_condition(
            profile_engine,
            "SELECT likes_amount FROM post WHERE id = :id",
            {"id": post_id},
            lambda r: r.likes_amount > 0
        )
        assert row is not None

@pytest.mark.asyncio
async def test_4_comment_sync(test_user):
    """4. Создание комментария: инкремент comments_amount в обеих БД"""
    async with httpx.AsyncClient() as client:
        p_resp = await client.post(f"{POST_SERVICE_URL}/",
                                   json={"text": "Comment me", "profile_id": test_user["uuid"]})
        post_id = p_resp.json()["id"]

        await client.post(f"{POST_SERVICE_URL}/{post_id}/comments",
                          json={"text": "First!", "profile_id": test_user["uuid"]})

        row = await wait_for_condition(
            profile_engine,
            "SELECT comments_amount FROM post WHERE id = :id",
            {"id": post_id},
            lambda r: r.comments_amount == 1
        )
        assert row is not None

@pytest.mark.asyncio
async def test_6_profile_update_to_post_sync(test_user):
    """6. Обновление тега: Profile -> Post Service"""
    new_tag = "@tester_v2"
    async with httpx.AsyncClient() as client:
        await client.put(f"{PROFILE_SERVICE_URL}/{test_user['username']}",
                         json={"tag": new_tag, "username": test_user['username'], "email": test_user['email']})

        row = await wait_for_condition(
            post_engine,
            "SELECT tag FROM profile WHERE uuid = :u",
            {"u": test_user["uuid"]},
            lambda r: r.tag == new_tag
        )
        assert row is not None

@pytest.mark.asyncio
async def test_8_post_edit_sync(test_user):
    """8. Редактирование текста поста"""
    async with httpx.AsyncClient() as client:
        p_resp = await client.post(f"{POST_SERVICE_URL}/",
                                   json={"text": "Old text", "profile_id": test_user["uuid"]})
        post_id = p_resp.json()["id"]

        await client.put(f"{POST_SERVICE_URL}/{post_id}", json={"text": "New text", "profile_id": test_user["uuid"]})

        row = await wait_for_condition(
            profile_engine,
            "SELECT text, edited FROM post WHERE id = :id",
            {"id": post_id},
            lambda r: r.edited is True and r.text == "New text"
        )
        assert row is not None


@pytest.mark.asyncio
async def test_2_delete_post_sync(test_user):
    """2. Удаление поста: проверка удаления из Profile DB и списка user_posts"""
    async with httpx.AsyncClient() as client:
        payload = {"text": "Old text", "profile_id": test_user["uuid"]}
        resp = await client.post(f"{POST_SERVICE_URL}/", json=payload)
        post_id = resp.json()["id"]

        await wait_for_condition(
            profile_engine,
            "SELECT id FROM post WHERE id = :id",
            {"id": post_id},
            lambda r: r is not None
        )

        del_resp = await client.delete(f"{POST_SERVICE_URL}/{post_id}?profile_id={test_user['uuid']}")
        assert del_resp.status_code in [200, 204]

        deleted_from_db = await wait_for_condition(
            profile_engine,
            "SELECT id FROM post WHERE id = :id",
            {"id": post_id},
            lambda r: r is None
        )

        row = await wait_for_condition(
            profile_engine,
            "SELECT user_posts FROM profile WHERE uuid = :u",
            {"u": test_user["uuid"]},
            lambda r: post_id not in r.user_posts
        )
        assert row is not None


@pytest.mark.asyncio
async def test_5_comment_like_post_service_only(test_user):
    """5. Лайк на комментарий: проверка только в Post Service"""
    async with httpx.AsyncClient() as client:
        payload = {"text": "Old text", "profile_id": test_user["uuid"]}
        p_resp = await client.post(f"{POST_SERVICE_URL}/", json=payload)
        post_id = p_resp.json()["id"]

        comm_payload = {
            "text": "Cool!",
            "post_id": post_id,
            "profile_id": test_user["uuid"],
        }
        c_resp = await client.post(f"{POST_SERVICE_URL}/{post_id}/comments", json=comm_payload)
        comment_id = c_resp.json()["id"]

        await client.post(f"{POST_SERVICE_URL}/comments/{comment_id}/like",
                          json={"profile_id": test_user["uuid"]})

        row = await wait_for_condition(
            post_engine,
            "SELECT likes_amount FROM comment WHERE id = :id",
            {"id": comment_id},
            lambda r: r.likes_amount == 1
        )
        assert row is not None


@pytest.mark.asyncio
async def test_7_subscription_sync(test_user):
    """7. Подписка: Profile Service -> Post Service (поле subscribes)"""
    unique_id = uuid.uuid4().hex[:4]
    target_username = f"target_{unique_id}"

    async with httpx.AsyncClient() as client:
        target_reg = await client.post(f"{AUTH_SERVICE_URL}/register", json={
            "username": target_username,
            "email": f"t_{unique_id}@test.com",
            "login": f"l_{unique_id}",
            "password": "Password123!"
        })
        target_uuid = target_reg.json()["uuid"]

        await wait_for_condition(post_engine, "SELECT uuid FROM profile WHERE uuid = :u",
                                 {"u": target_uuid}, lambda r: r is not None)

        sub_resp = await client.post(f"{PROFILE_SERVICE_URL}/{target_username}/follow?current_user={test_user['username']}")
        if sub_resp.status_code != 200:
            print(sub_resp.json())
        assert sub_resp.status_code in [200, 201]

        row = await wait_for_condition(
            post_engine,
            "SELECT subscribes FROM profile WHERE uuid = :u",
            {"u": test_user["uuid"]},
            lambda r: target_uuid in str(r.subscribes)
        )
        assert row is not None