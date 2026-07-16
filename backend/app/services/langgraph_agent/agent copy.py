import asyncio
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from utils.graph import build_graph
from utils.mcp_tools import initialize_tools

MCP_URL = "http://localhost:3927/tableau-mcp"




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