import logging
import aio_pika

class RabbitMqService:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.is_connected = False

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
            await self.channel.declare_queue('auth_queue', durable=True)
            self.is_connected = True
            logging.info("Connected to RabbitMQ")
        except Exception as e:
            logging.error(f"Failed to connect to RabbitMQ: {e}")
            raise

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
            await self.channel.default_exchange.publish(message, routing_key='auth_queue', mandatory=True)
            logging.info(f"Sent user register {user_event.username}")
        except Exception as e:
            logging.error(f"Failed to send user register message: {e}")
            raise

rabbitmq_service = RabbitMqService()
