from fastapi import APIRouter, Depends
from app.schemas.chat import ChatRequest
from app.services import ChatService, LangGraphAgent, SessionManager
from app.depedecies import verify_token
from app.services import create_initial_state
from app.services.service_container import chat_service
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("")
async def chat(
    request: ChatRequest,
    user=Depends(verify_token),  # Replace with your auth dependency
):
    """
    Process a single chat message.
    """
    print(user)
    user_id = str(user["sub"])
    print("user_id: ", user_id)

    user_profile = user.get("profile", {})
    print("user profile: ", user_profile),
    agent = LangGraphAgent()
    print("Agent: ", agent)
    await agent.initialize() 
    session = SessionManager(create_initial_state)
    user_obj = ChatService(agent,session)
    result = await chat_service.chat(
        session_id=user_id,
        message=request.message,
        user_profile=user_profile,
    )

    return {
        "response": result.get("output", ""),
        "citations": result.get("citations", []),
        "chart": result.get("chart"),
    }


@router.post("/clear")
async def clear_chat(
    user=Depends(verify_token),
):

    user_id = str(user["sub"])

    await chat_service.clear_chat(user_id)

    return {
        "success": True,
        "message": "Chat history cleared."
    }