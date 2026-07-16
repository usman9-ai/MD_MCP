from typing import Optional
from xml.parsers.expat import model

from prompt_toolkit import prompt

from . import config
from .response_schema import RouterOutput
from .state import State
from .llm import *
import json
import re
import uuid
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from fastmcp import Client
import copy
from langgraph.types import Overwrite
import ast
from pathlib import Path
from functools import lru_cache


def manage_conversation_history(state: State):
    conversation_history = state.get("conversation_history", [])
    if len(conversation_history) > 17:
        messages_to_be_summarized = conversation_history[:11]
        conversation_history = conversation_history[11:]

        msg = llm.invoke(f"""You are a helpful assistant that summarizes conversation history
                                for a tableau assistant agent. Briefly summarize what user has been asking and 
                                what the assistant has been responding in the conversation history. 
                                The summary should be concise and capture the main points and key entities of the conversation.

                                Conversation History: {messages_to_be_summarized}
        """)
        summary = msg.content.strip()
        conversation_history = [SystemMessage(content=f"Summary of previous conversation: {summary}")] + conversation_history 
    return {"conversation_history": conversation_history}


@lru_cache(maxsize=1)
def get_followup_prompt() -> str:
    return Path(r"D:\Martin Dow\Tableau MCP\Langgraph Agent\system_prompts\followup_router_system_prompt.md").read_text(encoding="utf-8")   

@lru_cache(maxsize=1)
def get_business_info() -> str:
    return Path(r"D:\Martin Dow\Tableau MCP\Langgraph Agent\system_prompts\business_info_v2.md").read_text(encoding="utf-8")   


@lru_cache(maxsize=1)
def get_datasource_metadata() -> str:
    return Path(r"D:\Martin Dow\Tableau MCP\agent\metadata.txt").read_text(encoding="utf-8")   

from pydantic import ValidationError


def _parse_router_output(raw_msg, user_msg: str) -> RouterOutput:
    if getattr(raw_msg, "tool_calls", None):
        args = raw_msg.tool_calls[0].get("args", {})
        try:
            return RouterOutput.model_validate(args)
        except ValidationError as error:
            raise ValueError(f"Router tool args failed validation: {args!r}") from error

    content = raw_msg.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        )

    if not isinstance(content, str):
        return RouterOutput(enhanced_prompt=user_msg)

    text = content.strip()
    if not text:
        return RouterOutput(enhanced_prompt=user_msg)

    for candidate in (text, text.replace("'", '"')):
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            try:
                return RouterOutput.model_validate(data)
            except ValidationError:
                continue

    try:
        data = ast.literal_eval(text)
    except (ValueError, SyntaxError):
        return RouterOutput(enhanced_prompt=user_msg)

    if isinstance(data, dict):
        try:
            return RouterOutput.model_validate(data)
        except ValidationError:
            return RouterOutput(enhanced_prompt=user_msg)

    return RouterOutput(enhanced_prompt=user_msg)

async def follow_up_and_router(state: State):
    prompt = get_followup_prompt()
    conversation_history = state.get("conversation_history", [])
    user_msg = state.get('input', "")

    messages = [
        SystemMessage(content=[{"type": "text", "text": prompt, "cache_control": {"type": "ephemeral"}}]),
        HumanMessage(content=f"Recent conversation:\n{conversation_history}\n\nCurrent user message: {user_msg}")
    ]

    router_tool = {
        "name": "RouterOutput",
        "description": "For the follow-up/intent node.",
        "input_schema": RouterOutput.model_json_schema(),
        "cache_control": {"type": "ephemeral"},
    }
    structured_model = sonnet_llm.bind_tools(
        [router_tool], tool_choice={"type": "tool", "name": "RouterOutput"}
    )
    raw_msg = await sonnet_llm.ainvoke(messages)
    print(raw_msg)
    # raw_msg = await structured_model.ainvoke(messages)

    # if not raw_msg.tool_calls:
    #     raise ValueError(f"Router made no tool call. content={raw_msg.content!r}")

    # args = raw_msg.tool_calls[0]["args"]
    # try:
    #     parsed = RouterOutput(**args)
    # except ValidationError as e:
    #     raise ValueError(f"Router tool args failed validation: {args!r}") from e

    # result_dict = parsed.model_dump(exclude_none=True)
    # if not result_dict:
    #     raise ValueError("Router returned no populated field.")

    # usage = raw_msg.usage_metadata
    # print("input_tokens:", usage["input_tokens"])
    # print("cache_read:", usage.get("input_token_details", {}).get("cache_read"))
    # print("cache_creation:", usage.get("input_token_details", {}).get("cache_creation"))

    # return {"route_output": result_dict}
    try:
        parsed = json.loads(raw_msg.content)
    except:
        content = raw_msg.content.strip()

        if content.startswith("```json"):
            content = content[len("```json"):]

        content = content.replace("```", "").strip()

        parsed = json.loads(content)
    usage = raw_msg.usage_metadata
    print("User conversation: ", state["conversation_history"])
    print("input_tokens:", usage["input_tokens"])
    print("cache_read:", usage.get("input_token_details", {}).get("cache_read"))
    print("cache_creation:", usage.get("input_token_details", {}).get("cache_creation"))


    return {
        "follow_up_and_router_response": parsed, 
        "coversation_history": [user_msg],
        "tool_execution_history": Overwrite([]),
        "tool_calls": [],
        "replanning_attempts": 0
    }



def other_domain_message_handler(state: State):
        response = state.get("follow_up_and_router_response", {})
        reply = response.get("other_domain_response", "")
        return {"output": reply, "conversation_history": [AIMessage(content=reply)]}


def greeting_handler(state: State):
        response = state.get("follow_up_and_router_response", {})
        reply = response.get("greeting_response", "")
        return {"output": reply,"conversation_history":[AIMessage(content=reply)] }

def enhanced_prompt_handler(state: State):
        response = state.get("follow_up_and_router_response", {})
        reply = response.get("enhanced_prompt", "")
        return {"enhanced_input": reply }


def autonomous_executor(state: dict):
    langchain_tools = state.get("langchain_tools", [])
    llm_with_tools = sonnet_llm.bind_tools(langchain_tools)
    business_info = get_business_info()
    datasource_uuid = "b6bbffe2-ebdb-4deb-808c-825fe0896e85"
    datasource_metadata = get_datasource_metadata()

    prompt = f"""{business_info}\n DataSource UUID: {datasource_uuid}\n Metadata of the datasource:\n{datasource_metadata}\n\n"""
    
    
    conversation_history = state.get("conversation_history", [])
    tool_execution_history = state.get("tool_execution_history", [])
    print("tool_execution_history:", tool_execution_history)
    import time
    user_msg = state.get('enhanced_input', "") 
    print("user enahnced msg: ", user_msg)  

    messages = [
        SystemMessage(content=[{"type": "text", "text": prompt, "cache_control": {"type": "ephemeral"}}]),
        HumanMessage(content=f"Current user message: {user_msg}\n\nRecent tool executions:\n{tool_execution_history}\n\n")
    ]

    while True:

        msg = llm_with_tools.invoke(messages)
        usage = msg.usage_metadata
        print("input_tokens:", usage["input_tokens"])
        print("cache_read:", usage.get("input_token_details", {}).get("cache_read"))
        print("cache_creation:", usage.get("input_token_details", {}).get("cache_creation"))

        
        ai_message = msg.content
        # Extract just the text portion (msg.content may be a list of blocks or a plain string)
        if isinstance(msg.content, list):
            text_parts = [block.get("text", "") for block in msg.content if isinstance(block, dict) and block.get("type") == "text"]
            ai_message = "".join(text_parts)
        else:
            ai_message = msg.content or ""


        tool_calls = getattr(msg, "tool_calls", [])
        # print("Tool calls extracted from LLM response:", tool_calls)

        for tool_call in tool_calls:
            tool_name = tool_call.get("name")
            tool_args = tool_call.get("args", {})

            ai_message += f"\n\n[Executing tool: '{tool_name}' with arguments: {tool_args}]"

        print("AI Message:", ai_message)
        print("Tool Calls:", tool_calls)
        return  {
        "tool_calls": tool_calls,
        "tool_execution_history": [AIMessage(content=ai_message)],
        "output": msg.content,
        "follow_up": False,
        "intent": 'None'
        }
        

async def execute_tool(state: dict):
    print( "I am in execute tool node")
    tool_calls = state.get("tool_calls", [])
    # print("Tool calls to execute:", tool_calls)
    if not tool_calls:
        return {
            "tool_execution_history": [
                ToolMessage(content="No tool calls detected in response JSON.")
            ]
        }

    tool_call = tool_calls[0]
    tool_name = tool_call.get("name")
    tool_args = tool_call.get("args", {})
    tool_call_id = tool_call.get("id", str(uuid.uuid4()))

    # 🔒 ALWAYS COPY STATE STRUCTURES (IMMUTABLE PATTERN)
    current_tool_calls = copy.deepcopy(state.get("current_tool_calls", {}))
    most_recent_tool_calls = copy.deepcopy(state.get("most_recent_tool_calls", {}))

    # ==========================================================
    # 1️⃣ Prevent infinite loop (same tool + same args in current tick)
    # ==========================================================
    if tool_name in current_tool_calls:
        previous_args = current_tool_calls[tool_name].get("arguments", {})

        if previous_args == tool_args:
            previous_status = current_tool_calls[tool_name].get("status", "unknown")
            previous_response = current_tool_calls[tool_name].get("response")

            error_msg = (
                f"Identical tool call detected for '{tool_name}'.\n"
                f"Previous status: {previous_status}\n"
                f"Previous response: {previous_response}\n"
                "Adjust plan to avoid infinite loop."
            )
            # # print(error_msg, "\n tool args:", tool_args)
            tool_msg = ToolMessage(
                content=error_msg,
                tool_name=tool_name,
                tool_call_id=tool_call_id,
            )

            return {
                "tool_execution_history": [tool_msg]
            }

    # ==========================================================
    # 2️⃣ Use cached result if already completed previously
    # ==========================================================
    if tool_name in most_recent_tool_calls:
        previous_args = most_recent_tool_calls[tool_name].get("arguments", {})
        previous_status = most_recent_tool_calls[tool_name].get("status", "")

        if previous_args == tool_args and previous_status == "completed":
            response = most_recent_tool_calls[tool_name]["response"]

            tool_msg = ToolMessage(content=response,
            tool_name=tool_name,
            tool_call_id=tool_call_id)


            # Reset prompts counter safely
            most_recent_tool_calls[tool_name]["prompts_after_last_call"] = 0
            # print(f"Using cached result for tool '{tool_name}' with identical arguments. Previous status: {previous_status}")
            # print("="*50)
            # # print(tool_msg, "\n tool args:", tool_args)

            return {
                "most_recent_tool_calls": most_recent_tool_calls,
                "tool_execution_history": [tool_msg]
            }

    # ==========================================================
    # 3️⃣ Execute Tool
    # ==========================================================
    try:
        async with Client("http://localhost:3927/tableau-mcp") as client:
            tool_result = await client.call_tool(tool_name, tool_args)

        tool_msg = ToolMessage(
            content=f"Result from tool {tool_name}: {tool_result}",
            tool_name=tool_name,
            tool_call_id=tool_call_id,
        )


        # # print(tool_msg, "\n tool args:", tool_args)
        # Update tracking dictionaries safely
        current_tool_calls[tool_name] = {
            "arguments": tool_args,
            "response": tool_msg,
            "status": "completed"
        }


        return {
            "current_tool_calls": current_tool_calls,
            "tool_execution_history": [tool_msg],
        }

    # ==========================================================
    # 4️⃣ Handle Tool Error
    # ==========================================================
    except Exception as e:

        error_msg = f"Error executing tool '{tool_name}': {str(e)}"

        tool_msg = ToolMessage(
            content=error_msg,
            tool_name=tool_name,
            tool_call_id=tool_call_id,
        )
        # # print(tool_msg, "\n tool args:", tool_args)


        return {
            "current_tool_calls": current_tool_calls,
            "most_recent_tool_calls": most_recent_tool_calls,
            "tool_execution_history": [tool_msg],
            "datasource_metadata": {}
        }


def final_response_after_tool_call_node(state: State):
    print("final_response_after_tool_call_node ")
    """
    Generate the final response to the user using:
    - enhanced_input
    - implementation_plan
    - context_anchors
    - tool execution history (to summarize results and explain any adjustments)
    - final results from tool calls
    """

    enhanced_input = state.get("enhanced_input", "")
    implementation_plan = state.get("implementation_plan", "")
    context_anchors = state.get("context_anchors", [])
    tool_execution_history = state.get("tool_execution_history", [])
    final_results = state.get("output", [])
    print("final_results:", final_results)

    msg = haiku_llm.invoke(f"""
        You are a Tableau assistant.

        Based on the conversation so far and the user's latest request, generate
        a concise and accurate response.

        Inputs you can use:
        1. Enhanced user input:
        {enhanced_input}

        2. Final results from tool calls:
        {final_results}

        Instructions:
        - Respond only with the message text, no JSON or extra formatting.
    """)

    assistant_reply = msg.content.strip()


    return {"output": assistant_reply, "conversation_history":[AIMessage(content=assistant_reply)]}

