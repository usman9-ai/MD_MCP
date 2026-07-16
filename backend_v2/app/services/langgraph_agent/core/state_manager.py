from langchain_core.messages import SystemMessage
from pathlib import Path


PROMPTS_DIR = Path(__file__).parent.parent / "system_prompts"

with open(
    PROMPTS_DIR / "followup_router_system_prompt.md",
    encoding="utf-8"
) as f:
    follow_up_prompt = f.read()
def create_initial_state():
    return {
        "follow_up_prompt": follow_up_prompt,
        "intent": "",
        "conversation_history": [
            SystemMessage(
                content="You are a Tableau MCP assistant with access to tools."
            )
        ],
        "input": "",
        "context_window_size": 5,
        "follow_up_and_router_response": dict,

        "enhanced_input": "",
        "langchain_tools": [],
        "current_tool_calls": {},
        "tool_execution_history": [],
        "tool_calls": [],
        "final_response": "",
        "replanning_attempts": 0,
        "max_replanning_attempts": 3,
        "output": "",
        "identified_datasource": "",
        "list_datasources_tool_call_id": "",
        "get_datasource_metadata_tool_call_id": "",
    }
