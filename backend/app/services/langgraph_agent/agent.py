from .core.state_manager import create_initial_state
from .core.graph import build_graph
from .core.mcp_tools import initialize_tools

class LangGraphAgent:

    def __init__(self):
        self.graph = None

    async def initialize(self):
        self.graph = build_graph()
    
    async def invoke(self, state):
        return await self.graph.ainvoke(state)