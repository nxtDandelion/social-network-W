from fastapi import FastAPI
from app.api.profile import router as profile_router

app = FastAPI()

app.include_router(profile_router)


@app.get("/")
async def main():
    return {"message": "profile service works"}


@app.get("/health")
def get_health():
    return {"message": "healthy"}
