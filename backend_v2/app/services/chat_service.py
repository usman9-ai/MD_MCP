from .session_manager import SessionManager
from .langgraph_agent.agent import LangGraphAgent
from .agent_validation_logger import AgentValidationLogger
from datetime import datetime, timezone
import time
import uuid


class ChatService:

    def __init__(
        self,
        agent: LangGraphAgent,
        session_manager: SessionManager,
        validation_logger: AgentValidationLogger | None = None,
    ):
        self.agent = agent
        self.session_manager = session_manager
        self.validation_logger = validation_logger or AgentValidationLogger()

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

        turn_started_monotonic = time.perf_counter()
        question_uuid = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc).isoformat()

        state["question_uuid"] = question_uuid
        state["validation_log"] = {
            "question_uuid": question_uuid,
            "started_at": started_at,
            "user_id": session_id,
            "session_id": session_id,
            "original_question": message,
            "user_profile": user_profile or {},
            "follow_up_node_response": None,
            "enhanced_prompt": "",
            "tool_calls": [],
            "tool_calls_summary": "",
            "final_agent_response": "",
            "validation_status": "",
            "correct_answer": "",
            "validator_notes": "",
            "error_category": "",
            "dashboard_reference": "",
        }

        if user_profile:
            state["user_profile"] = user_profile

        state["langchain_tools"] = self.agent.tools or []
        state["tools_by_name"] = self.agent.tools_by_name

        result = await self.agent.invoke(state)

        validation_log = result.get("validation_log", {})
        validation_log["finished_at"] = datetime.now(timezone.utc).isoformat()
        validation_log["duration_ms"] = round(
            (time.perf_counter() - turn_started_monotonic) * 1000
        )
        validation_log["final_agent_response"] = result.get("output", "")
        validation_log["tool_calls"] = result.get(
            "tool_call_log",
            validation_log.get("tool_calls", []),
        )
        validation_log["tool_calls_summary"] = result.get(
            "tool_calls_summary",
            validation_log.get("tool_calls_summary", ""),
        )
        result["validation_log"] = validation_log
        self.validation_logger.append_turn(validation_log)

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
