from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def main():
    return {"message": "Hello World"}

@app.get("/health")
async def health():
    return {"message": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)