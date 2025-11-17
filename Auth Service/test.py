# test_profile_update.py
import asyncio
import aio_pika
import json
from datetime import datetime


async def send_test_profile_update():
    """Отправляет тестовое сообщение об обновлении профиля"""
    try:
        # Подключаемся к RabbitMQ
        connection = await aio_pika.connect_robust(
            host='localhost',
            port=5672,
            login='guest',
            password='guest',
            virtualhost='/',
        )

        async with connection:
            channel = await connection.channel()

            # Объявляем очередь (на всякий случай)
            await channel.declare_queue('auth_commands', durable=True)

            # Создаем тестовые данные
            test_data = {
                "command_type": "profile_update",
                "user_id": 12545,
                "update_data": {
                    "login": "new_login_2024",
                    "username": "new_username"
                },
                "timestamp": datetime.now().isoformat(),
                "source": "profile_service"
            }

            # Создаем сообщение
            message = aio_pika.Message(
                body=json.dumps(test_data).encode('utf-8'),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type='application/json'
            )

            # Отправляем в очередь auth_commands
            await channel.default_exchange.publish(
                message,
                routing_key='auth_commands'
            )

            print("✅ Test profile update sent successfully!")
            print(f"📨 Data: {json.dumps(test_data, indent=2)}")

    except Exception as e:
        print(f"❌ Failed to send test message: {e}")


if __name__ == "__main__":
    asyncio.run(send_test_profile_update())