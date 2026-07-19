from .core.state_manager import create_initial_state
from .core.graph import build_graph
print(build_graph.__module__)
from .tool_registery import initialize_tools
class LangGraphAgent:

    def __init__(self):
        self.graph = None
        self.tools = None

    async def initialize(self):

        self.tools, self.tools_by_name = await initialize_tools()
        self.graph = build_graph()
 

    async def invoke(self, state):
        return await self.graph.ainvoke(state)
