# rabbitmq/profile_rabbitmq.py
import logging
import aio_pika
import json
from datetime import datetime
from typing import Dict, Any


class RabbitMQService:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.is_connected = False
        self.user_events_exchange = None
        self.post_events_exchange = None
        self.profile_events_exchange = None
        self.profile_user_events_queue = None
        self.profile_post_events_queue = None

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

            self.post_events_exchange = await self.channel.declare_exchange(
                'post_events',
                aio_pika.ExchangeType.FANOUT,
                durable=True
            )

            self.profile_events_exchange = await self.channel.declare_exchange(
                'profile_events',
                aio_pika.ExchangeType.FANOUT,
                durable=True
            )

            self.profile_user_events_queue = await self.channel.declare_queue(
                'profile_user_events_queue',
                durable=True
            )

            self.profile_post_events_queue = await self.channel.declare_queue(
                'profile_post_events_queue',
                durable=True
            )

            await self.profile_user_events_queue.bind(
                self.user_events_exchange,
                routing_key=''
            )

            await self.profile_post_events_queue.bind(
                self.post_events_exchange,
                routing_key=''
            )

            self.is_connected = True
            logging.info("Profile Service connected to RabbitMQ")

        except Exception as e:
            logging.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def start_consuming_user_events(self, callback):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")

        async def message_wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = message.body.decode()
                    data = json.loads(body)
                    event_type = message.headers.get('event')

                    logging.info(f"Received user event: {event_type}")
                    await callback(event_type, data)

                except Exception as e:
                    logging.error(f"Error processing user event: {e}")
                    await message.reject(requeue=False)

        await self.profile_user_events_queue.consume(message_wrapper)
        logging.info("Started consuming user events from Auth Service")

    async def start_consuming_post_events(self, callback):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")

        async def message_wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = message.body.decode()
                    data = json.loads(body)
                    event_type = message.headers.get('event')

                    logging.info(f"Received post event: {event_type}")
                    await callback(event_type, data)

                except Exception as e:
                    logging.error(f"Error processing post event: {e}")
                    await message.reject(requeue=False)

        await self.profile_post_events_queue.consume(message_wrapper)
        logging.info("Started consuming post events from Post Service")

    async def send_profile_updated(self, profile_data: Dict[str, Any]):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")

        try:
            message_data = {
                "event_type": "profile_updated",
                "timestamp": datetime.now().isoformat(),
                "user_id" : profile_data['user_id'],
                "update_data": profile_data,
            }

            message = aio_pika.Message(
                body=json.dumps(message_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type='application/json',
                headers={'event': 'profile_updated'}
            )

            await self.profile_events_exchange.publish(message, routing_key='auth_commands')
            logging.error(f"Sent profile_updated event")

        except Exception as e:
            logging.error(f"Failed to send profile_updated message: {e}")
            raise

    async def close(self):
        if self.connection:
            await self.connection.close()
            logging.info("RabbitMQ connection closed")


rabbitmq_service = RabbitMQService()

async def connect_rabbitmq():
    await rabbitmq_service.connect()

def get_rabbitmq():
    return rabbitmq_service