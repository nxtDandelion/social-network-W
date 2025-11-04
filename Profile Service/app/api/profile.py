from fastapi import APIRouter


router = APIRouter(prefix='/profile', tags=['profile'])


# @router.get("/health")
# def get_health():
#     return {"message": "healthy"}
