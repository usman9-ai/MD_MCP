import asyncio
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from utils.graph import build_graph
from utils.mcp_tools import initialize_tools
from langchain_core.messages import SystemMessage

MCP_URL = "http://localhost:3927/tableau-mcp"


def create_initial_state(mcp_tool_descriptions, langchain_tools):
    with open(r"D:\Martin Dow\Tableau MCP\Langgraph Agent\system_prompts\followup_router_system_prompt.md", "r", encoding="utf-8") as f:
        follow_up_prompt = f.read()
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
        "langchain_tools": langchain_tools,
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


async def main():
    mcp_tool_descriptions, langchain_tools = await initialize_tools(MCP_URL)

    graph = build_graph()
    state = create_initial_state(mcp_tool_descriptions, langchain_tools)

    while True:
        user_input = input("You:")

        if user_input.lower() in ["exit", "quit"]:
            break

        state["replanning_attempts"] = 0
        state["input"] = user_input
        result = await graph.ainvoke(state)

        assistant_reply = result.get("output", "")
        print("\nAssistant:", assistant_reply)
        state.update(result)


if __name__ == "__main__":
    asyncio.run(main())