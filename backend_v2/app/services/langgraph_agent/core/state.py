from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from typing import TypedDict
from typing_extensions import TypedDict, Annotated
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class State(TypedDict):
    follow_up_and_router_response: dict
    context_window_size: int
    conversation_history: Annotated[list[BaseMessage], add_messages]
    input: str
    question_uuid: str
    enhanced_input: str
    langchain_tools: dict
    tools_by_name: dict
    tool_calls: list[dict]
    tool_call_log: list[dict]
    tool_calls_summary: str
    validation_log: dict
    shortlisted_datasources: list[dict]
    agent_system_prompt: str
    tool_execution_history: Annotated[list[BaseMessage], add_messages]
    final_response: str
    replanning_attempts: int
    max_replanning_attempts: int
    output: str



