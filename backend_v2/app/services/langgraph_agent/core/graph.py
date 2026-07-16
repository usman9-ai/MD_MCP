from langgraph.graph import StateGraph
from .state import State
from .nodes import *
from langgraph.prebuilt import ToolNode
from langgraph.graph import END



def build_graph(return_builder=False):
    builder = StateGraph(State)

    builder.add_node("follow_up_and_route", follow_up_and_router)
    builder.add_node("context_window_manager", manage_conversation_history)
    builder.add_node("other_domain_message_handler", other_domain_message_handler)
    builder.add_node("greeting_handler", greeting_handler)
    builder.add_node("enhanced_prompt_handler", enhanced_prompt_handler)
    builder.add_node("agent", autonomous_executor)
    builder.add_node("tool_calls", execute_tool, async_node=True)
    builder.add_node("final_response_after_tool_call_node", final_response_after_tool_call_node)


    # Edges
    builder.add_edge("context_window_manager", "follow_up_and_route")
    def check_follow_up(state):
        response =  state.get("follow_up_and_router_response", {}).keys()
        print("Follow-up detection response keys:", response)
        print(type(response))
        print(list(response))  # This will print the actual value of the keys
        if 'greeting_response' in response:
            return "greeting_handler"
        elif 'other_domain_response' in response:
            return "other_domain_message_handler"
        else:
            return "proceed"
            

    builder.add_conditional_edges(
        source="follow_up_and_route",
        path=check_follow_up,
        path_map={
            "greeting_handler": "greeting_handler",
            "other_domain_message_handler": "other_domain_message_handler",
            "proceed": "enhanced_prompt_handler"
        }
    )

    builder.add_edge("enhanced_prompt_handler","agent")

    def check_tool_calls(state: State):
        if state.get("tool_calls") != []:
            print("Tool calls detected:", state.get("tool_calls"))
            print("output:", state.get("output"))
            return "has_tool_calls"
        else:
            return "no_tool_calls"


    builder.add_conditional_edges(
        source="agent",
        path=check_tool_calls,
        path_map={
            "has_tool_calls": "tool_calls",
            "no_tool_calls": "final_response_after_tool_call_node"
        }
    )

    builder.add_edge("tool_calls", "agent")

    builder.set_entry_point("context_window_manager")

    if return_builder:
        return builder

    return builder.compile()
