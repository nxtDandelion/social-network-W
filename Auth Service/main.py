from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
import uvicorn
import utils
import api

app = FastAPI(title="Auth Service", lifespan=utils.lifespan)

@app.get("/")
async def root():
    return await api.root()

@app.get("/auth")
async def auth():
    return await api.auth()

@app.get("/db_health")
async def db_health(db: AsyncSession = Depends(get_db)):
    return await api.db_health(db)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)