import logging
import aio_pika
import json
from database import AsyncSessionLocal
from handlers import handle_profile_update

class RabbitMqService:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.is_connected = False

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(
                host='rabbitmq',
                port=5672,
                login='guest',
                password='guest',
                virtualhost='/',
            )
            self.channel = await self.connection.channel()
            await self.channel.declare_queue('auth_events', durable=True)
            await self.channel.declare_queue('auth_commands', durable=True)
            self.is_connected = True
            logging.info("Connected to RabbitMQ")
        except Exception as e:
            logging.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def start_consuming(self, queue_name: str, callback):
        queue = await self.channel.declare_queue(queue_name, durable=True)

        async def message_wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = message.body.decode()
                    data = json.loads(body)
                    print(f"Received message: {data}")
                    async with AsyncSessionLocal() as db:
                        await handle_profile_update(data, db)

                except Exception as e:
                    print(f"Error processing message: {e}")

        await queue.consume(message_wrapper)
        print(f"Started consuming from {queue_name}")

    async def close(self):
        if self.connection:
            await self.connection.close()

    async def send_user_register(self, user_event):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")
        try:
            message = aio_pika.Message(body=user_event.to_json().encode(),
                                       delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                                       content_type='application/json')
            await self.channel.default_exchange.publish(message, routing_key='auth_events', mandatory=True)
            logging.info(f"Sent user register {user_event.username}")
        except Exception as e:
            logging.error(f"Failed to send user register message: {e}")
            raise

def get_rabbitmq():
    return RabbitMqService()

rabbitmq_service = RabbitMqService()
