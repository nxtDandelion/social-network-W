import asyncio
import logging
from sqlalchemy import select
from .database import AsyncSessionLocal
from .models import Outbox
from .rabbitmq import rabbitmq_service

logger = logging.getLogger(__name__)

async def process_outbox():
    """Бесконечный цикл отправки неотправленных событий из Outbox."""
    while True:
        try:
            async with AsyncSessionLocal() as session:
                # Выбираем все события в статусе PENDING
                stmt = select(Outbox).where(Outbox.status == 'PENDING').order_by(Outbox.id)
                result = await session.execute(stmt)
                entries = result.scalars().all()

                for entry in entries:
                    try:
                        # Отправка через готовый обменник post_events
                        await rabbitmq_service.send_post_event(
                            event_type=entry.event_type,
                            data=entry.payload
                        )
                        entry.status = 'SENT'
                        logger.info(f"Outbox message {entry.message_id} sent")
                    except Exception as e:
                        logger.error(f"Failed to send outbox message {entry.message_id}: {e}")
                        # Оставляем PENDING для следующей попытки

                if entries:  # коммитим только если были изменения
                    await session.commit()
        except Exception as e:
            logger.error(f"Outbox processor error: {e}")

        await asyncio.sleep(5)  # интервал опроса

async def start_outbox_processor():
    """Запускает фоновую задачу обработки outbox."""
    logger.info("Starting outbox processor")
    asyncio.create_task(process_outbox())