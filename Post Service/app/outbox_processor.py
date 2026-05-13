import asyncio
import logging
from sqlalchemy import select
from datetime import datetime, timezone
from .database import AsyncSessionLocal
from .models import Outbox
from .rabbitmq import rabbitmq_service
from prometheus_client import Histogram

logger = logging.getLogger(__name__)

# Гистограмма задержки в секундах
outbox_lag = Histogram(
    'outbox_lag_seconds',
    'Lag between outbox creation and successful sending',
    buckets=(0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600)
)

async def process_outbox():
    while True:
        try:
            async with AsyncSessionLocal() as session:
                stmt = select(Outbox).where(Outbox.status == 'PENDING').order_by(Outbox.id).limit(100)
                result = await session.execute(stmt)
                entries = result.scalars().all()

                if entries:
                    tasks = []
                    for entry in entries:
                        tasks.append(send_one(entry))
                    await asyncio.gather(*tasks, return_exceptions=True)
                    await session.commit()
        except Exception as e:
            logger.error(f"Outbox processor error: {e}")
        await asyncio.sleep(1)

async def start_outbox_processor():
    logger.info("Starting outbox processor")
    asyncio.create_task(process_outbox())