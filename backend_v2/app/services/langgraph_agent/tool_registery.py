from langchain_mcp_adapters.client import MultiServerMCPClient


async def initialize_tools():
    mcp_url = r"http://localhost:3927/tableau-mcp"
    mcp_client = MultiServerMCPClient(
            {
                "tableau": {
                    "transport": "streamable_http",  # use "http" if your version rejects this
                    "url": mcp_url,
                    # "headers": {"Authorization": f"Bearer {os.getenv('TABLEAU_MCP_TOKEN')}"},
                }
            },
            handle_tool_errors=False,  # let VDS errors raise so we can brief them
        )

    all_tools = await mcp_client.get_tools()
    tools = [t for t in all_tools if t.name in ['query-datasource']]
    tools_by_name = {t.name: t for t in tools}
    return tools, tools_by_name