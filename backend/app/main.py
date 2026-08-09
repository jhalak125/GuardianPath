from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .routers import routing, incidents, emergency, ws_tracking, tts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifespan startup
    print("🛡️ [GuardianPath] Backend Initialized. Safety Graph & Routing Engine Ready.")
    yield
    # Lifespan shutdown
    print("🛡️ [GuardianPath] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Tactical Night-Safety Routing & Real-Time Escort API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(routing.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(emergency.router, prefix=settings.API_V1_STR)
app.include_router(tts.router, prefix=settings.API_V1_STR)
app.include_router(ws_tracking.router)

@app.get("/")
async def root():
    return {
        "system": "GuardianPath Tactical Safety Hub",
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }
