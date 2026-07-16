from app.services.chat_service import ChatService
from app.services.session_manager import SessionManager
from app.services.langgraph_agent.agent import LangGraphAgent
from app.services.langgraph_agent.core.state_manager import create_initial_state

agent = LangGraphAgent()

session_manager = SessionManager(create_initial_state)

chat_service = ChatService(
    agent,
    session_manager,
)