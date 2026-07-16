from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api.auth import router as auth_router
from .api.chat import router as chat_router

from .services.langgraph_agent import LangGraphAgent
from .services.chat_service import ChatService
from .services.session_manager import SessionManager
from .services.langgraph_agent.core.state_manager import create_initial_state

from app.services.service_container import (
    agent,
)

@asynccontextmanager
async def lifespan(app: FastAPI):

    await agent.initialize()

    yield

# -------------------------------------------------------------------
# FastAPI Application
# -------------------------------------------------------------------

app = FastAPI(
    title="Martin Dow AI Backend",
    version="1.0.0",
    lifespan = lifespan
)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Martin Dow AI Backend"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }