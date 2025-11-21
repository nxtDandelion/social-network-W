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
        self.post_commands_queue = None

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(
                host='localhost',
                port=5672,
                login='guest',
                password='guest',
                virtualhost='/',
            )
            self.channel = await self.connection.channel()
            self.user_events_exchange = await self.channel.declare_exchange(
                'user_events',
                aio_pika.ExchangeType.DIRECT,
                durable=True
            )
            self.post_events_exchange = await self.channel.declare_exchange(
                'post_events',
                aio_pika.ExchangeType.FANOUT,
                durable=True
            )
            self.post_commands_queue = await self.channel.declare_queue(
                'post_commands_queue',
                durable=True
            )
            await self.post_commands_queue.bind(
                self.user_events_exchange,
                routing_key='user_registered'
            )
            self.is_connected = True
            logging.info("Connected to RabbitMQ")

        except Exception as e:
            logging.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def start_consuming_events(self, callback):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")

        async def message_wrapper(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    body = message.body.decode()
                    data = json.loads(body)
                    event_type = message.headers.get('event')

                    await callback(event_type, data)

                except Exception as e:
                    logging.error(f"Error processing user event: {e}")
                    await message.reject(requeue=False)

        await self.post_commands_queue.consume(message_wrapper)
        logging.info("Started consuming events")

    async def send_post_created(self, post_data: Dict[str, Any]):
        try:
            await self.send_post_event('post_created', post_data)
        except Exception as e:
            logging.error(f"Failed to send post_created event: {e}")

    async def send_post_updated(self, post_data: Dict[str, Any]):
        try:
            await self.send_post_event('post_updated', post_data)
        except Exception as e:
            logging.error(f"Failed to send post_updated event: {e}")

    async def send_post_deleted(self, post_data: Dict[str, Any]):
        await self.send_post_event('post_deleted', post_data)

    async def send_comment_created(self, comment_data: Dict[str, Any]):
        await self.send_post_event('comment_created', comment_data)

    async def send_comment_updated(self, comment_data: Dict[str, Any]):
        await self.send_post_event('comment_updated', comment_data)

    async def send_comment_deleted(self, comment_data: Dict[str, Any]):
        await self.send_post_event('comment_deleted', comment_data)

    async def send_post_liked(self, like_data: Dict[str, Any]):
        await self.send_post_event('post_liked', like_data)

    async def send_post_unliked(self, unlike_data: Dict[str, Any]):
        await self.send_post_event('post_unliked', unlike_data)

    async def send_post_event(self, event_type: str, data: Dict[str, Any]):
        if not self.is_connected:
            raise RuntimeError("Not connected to RabbitMQ")

        try:
            message_data = {
                "event_type": event_type,
                "timestamp": datetime.now().isoformat(),
                **data
            }

            message = aio_pika.Message(
                body=json.dumps(message_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type='application/json',
                headers={'event': event_type}
            )

            await self.post_events_exchange.publish(message, routing_key='')
            logging.info(f"Sent {event_type} event, data = {message.body}")

        except Exception as e:
            logging.error(f"Failed to send {event_type} message: {e}")
            raise

    async def close(self):
        if self.connection:
            await self.connection.close()

rabbitmq_service = RabbitMQService()

async def connect_rabbitmq():
    await rabbitmq_service.connect()

def get_rabbitmq():
    return rabbitmq_service