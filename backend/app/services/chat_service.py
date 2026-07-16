from .session_manager import SessionManager
from .langgraph_agent.agent import LangGraphAgent


class ChatService:

    def __init__(
        self,
        agent: LangGraphAgent,
        session_manager: SessionManager,
    ):
        self.agent = agent
        self.session_manager = session_manager

    async def chat(
        self,
        session_id: str,
        message: str,
        user_profile: dict | None = None,
    ):
        """
        Executes one chat turn.

        Returns the updated graph state.
        """

        session = await self.session_manager.get_session(session_id)

        state = session.state

        print(f"User: {session_id}")
        print(f"State object id: {id(state)}")

        state["input"] = message
        state["replanning_attempts"] = 0
        state["output"] = ""

        if user_profile:
            state["user_profile"] = user_profile

        result = await self.agent.invoke(state)

        # Persist the latest state for the next turn.
        session.state = result

        return result

    async def clear_chat(
        self,
        session_id: str,
    ):
        """
        Clears the conversation by replacing the session state.
        """

        await self.session_manager.reset_session(session_id)