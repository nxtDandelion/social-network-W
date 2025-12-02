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
        self.user_events_exchange = None
        self.auth_commands_exchange = None

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
            self.user_events_exchange = await self.channel.declare_exchange(
                'user_events',
                aio_pika.ExchangeType.FANOUT,
                durable=True
            )
            self.auth_commands_exchange = await self.channel.declare_exchange(
                'auth_commands',
                aio_pika.ExchangeType.DIRECT,
                durable=True
            )
            self.auth_commands_queue = await self.channel.declare_queue(
                'auth_commands_queue',
                durable=True
            )
            await self.auth_commands_queue.bind(
                self.auth_commands_exchange,
                routing_key='auth_commands'
            )

            self.profile_events_exchange = await self.channel.declare_exchange(
                'profile_events',
                aio_pika.ExchangeType.FANOUT,
                durable=True
            )

            self.auth_profile_events_queue = await self.channel.declare_queue(
                'auth_profile_events_queue',
                durable=True
            )

            await self.auth_profile_events_queue.bind(
                self.profile_events_exchange,
                routing_key=''
            )
            self.is_connected = True
            logging.info("Connected to RabbitMQ")
        except Exception as e:
            logging.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def start_consuming(self, queue_name: str, callback):
        async def message_wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = message.body.decode()
                    data = json.loads(body)
                    logging.error(f"Received message: {data}")
                    async with AsyncSessionLocal() as db:
                        await handle_profile_update(data, db)

                except Exception as e:
                    logging.error(f"Error processing message: {e}")

        await self.auth_profile_events_queue.consume(message_wrapper)
        logging.error(f"Started consuming from {queue_name}")

    async def close(self):
        if self.connection:
            await self.connection.close()

    async def send_user_register(self, user_event):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")
        try:
            message = aio_pika.Message(body=user_event.to_json().encode(),
                                       delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                                       content_type='application/json',
                                       headers={'event': 'user_registered'})
            await self.user_events_exchange.publish(message, routing_key='user_registered', mandatory=True)
            logging.info(f"Sent user register {user_event.username}")
        except Exception as e:
            logging.error(f"Failed to send user register message: {e}")
            raise

rabbitmq_service = RabbitMqService()

async def connect_rabbitmq():
    await rabbitmq_service.connect()

def get_rabbitmq():
    return rabbitmq_service
