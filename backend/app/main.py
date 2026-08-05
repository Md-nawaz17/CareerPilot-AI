from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.analysis import router as analysis_router
from backend.app.routers.cover_letter import router as cover_letter_router

app = FastAPI(title="CareerPilot AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router, prefix="/api/analyze")
app.include_router(cover_letter_router, prefix="/api/analyze")
