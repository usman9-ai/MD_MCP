import asyncio
import time
from dataclasses import dataclass
from typing import Callable, Dict

from .langgraph_agent.core.state import State
# from .serives import lang


@dataclass
class UserSession:
    session_id: str
    state: State
    created_at: float
    last_accessed: float


class SessionManager:
    """
    Manages in-memory user sessions.

    The manager knows nothing about LangGraph.
    It only stores and retrieves session objects.
    """

    def __init__(
        self,
        state_factory: Callable[[], State],
        ttl_seconds: int = 6 * 60 * 60,
    ):
        self._state_factory = state_factory
        self._ttl = ttl_seconds

        self._sessions: Dict[str, UserSession] = {}
        self._lock = asyncio.Lock()

    async def get_session(self, session_id: str) -> UserSession:
        """
        Returns an existing session or creates a new one.
        """

        async with self._lock:

            await self._cleanup_expired_locked()

            session = self._sessions.get(session_id)

            if session is None:

                now = time.time()
                state = self._state_factory()
                print("State: ", state["conversation_history"])
                session = UserSession(
                    session_id=session_id,
                    state= state,
                    created_at=now,
                    last_accessed=now,
                )

                self._sessions[session_id] = session

            else:
                session.last_accessed = time.time()

            return session

    async def delete_session(self, session_id: str) -> None:
        """
        Deletes a user's session.
        Used by Clear Chat or Logout.
        """

        async with self._lock:
            self._sessions.pop(session_id, None)


    async def reset_session(self, session_id: str):
        async with self._lock:
            now = time.time()

            self._sessions[session_id] = UserSession(
                session_id=session_id,
                state= await self._state_factory(),
                created_at=now,
                last_accessed=now,
            )
    async def session_exists(self, session_id: str) -> bool:

        async with self._lock:
            return session_id in self._sessions

    async def touch_session(self, session_id: str) -> None:

        async with self._lock:

            session = self._sessions.get(session_id)

            if session:
                session.last_accessed = time.time()

    async def cleanup(self) -> None:

        async with self._lock:
            await self._cleanup_expired_locked()

    async def clear_all(self) -> None:

        async with self._lock:
            self._sessions.clear()

    async def active_session_count(self) -> int:

        async with self._lock:
            return len(self._sessions)

    async def _cleanup_expired_locked(self):

        now = time.time()

        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if now - session.last_accessed > self._ttl
        ]

        for session_id in expired:
            self._sessions.pop(session_id, None)