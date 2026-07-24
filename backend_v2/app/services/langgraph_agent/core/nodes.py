from prompt_toolkit import prompt
from . import config
from .response_schema import RouterOutput
from .state import State
from .llm import *
import json
import uuid
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from fastmcp import Client
import copy
from langgraph.types import Overwrite
import ast
from pathlib import Path
from functools import lru_cache
from datetime import datetime, timezone
import time
from datetime import datetime, timedelta

def manage_conversation_history(state: State):
    conversation_history = state.get("conversation_history", [])
    if len(conversation_history) > 17:
        messages_to_be_summarized = conversation_history[:11]
        conversation_history = conversation_history[11:]

        msg = haiku_llm.invoke(f"""You are a helpful assistant that summarizes conversation history
                                for a tableau assistant agent. Briefly summarize what user has been asking and 
                                what the assistant has been responding in the conversation history. 
                                The summary should be concise and capture the main points and key entities of the conversation.

                                Conversation History: {messages_to_be_summarized}
        """)
        summary = msg.content.strip()
        conversation_history = [SystemMessage(content=f"Summary of previous conversation: {summary}")] + conversation_history 
    return {"conversation_history": conversation_history}



def _normalize_text_output(content) -> str:
    if content is None:
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts = []

        for block in content:
            if isinstance(block, dict):
                block_type = block.get("type")
                block_text = block.get("text")

                if block_type == "text" and isinstance(block_text, str):
                    text_parts.append(block_text)

                # Ignore tool/result blocks for the final user-facing response
                # because they are not plain answer text.
                continue

            if isinstance(block, str):
                text_parts.append(block)

        return "".join(text_parts).strip()

    return str(content).strip()

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_safe(value):
    return json.loads(json.dumps(value, default=str, ensure_ascii=False))


def _tool_calls_summary(tool_calls: list[dict]) -> str:
    summary_lines = []
    for tool_call in tool_calls:
        result = tool_call.get("result")
        error = tool_call.get("error")
        if error:
            detail = f"{len(str(error))} chars error"
        else:
            detail = f"{len(str(result))} chars result"
        summary_lines.append(
            f"{tool_call.get('sequence')}. {tool_call.get('tool_name')} | "
            f"{tool_call.get('status')} | {detail}"
        )
    return "\n".join(summary_lines)


@lru_cache(maxsize=1)
def get_followup_prompt() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\followup_router_system_prompt.md").read_text(encoding="utf-8")   

@lru_cache(maxsize=1)
def get_business_info() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\KPIs_v5.md").read_text(encoding="utf-8")   


@lru_cache(maxsize=1)
def get_datasource_metadata() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\Meta_Data_v5.md").read_text(encoding="utf-8")   

@lru_cache(maxsize=1)
def get_agent_rules() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\agent_rules_v5.md").read_text(encoding="utf-8")   


@lru_cache(maxsize=1)
def get_string_search_instructions() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\string search instructions.txt").read_text(encoding="utf-8")   



@lru_cache(maxsize=1)
def get_datasource_descriptions() -> str:
    current_file = Path(__file__).resolve()
    parent_dir = current_file.parent.parent
    return Path(rf"{parent_dir}\system_prompts\DS Description\Datasource_Descriptions_v2.md").read_text(encoding="utf-8")  





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
    print("============== FOLLOW UP NODE =================")
    print("User conversation: ", state["conversation_history"])
    print("input_tokens:", usage["input_tokens"])
    print("cache_read:", usage.get("input_token_details", {}).get("cache_read"))
    print("cache_creation:", usage.get("input_token_details", {}).get("cache_creation"))

    validation_log = copy.deepcopy(state.get("validation_log", {}))
    validation_log["follow_up_node_response"] = _json_safe(parsed)

    return {
        "follow_up_and_router_response": parsed, 
        "coversation_history": [user_msg],
        "tool_execution_history": Overwrite([]),
        "tool_calls": [],
        "tool_call_log": [],
        "tool_calls_summary": "",
        "validation_log": validation_log,
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
        validation_log = copy.deepcopy(state.get("validation_log", {}))
        validation_log["enhanced_prompt"] = reply
        return {"enhanced_input": reply, "validation_log": validation_log}

def datasource_resolver(state: State):
    question = state.get("enhanced_input", "")
    datasource_descriptions = get_datasource_descriptions()
    prompt = rf"""{datasource_descriptions}\n User Question: {question}"""

    msg = sonnet_llm.invoke(prompt)
    print("table resolver")
    print(msg)
    result = json.loads(msg.content)
    print(result)

    return{"shortlisted_datasources": result}


def load_relevant_metadata(state: dict):
    datasources = state.get("shortlisted_datasources", [])
    print("FULL STATE KEYS:", list(state.keys()))
    print("shortlisted_datasources RAW:", state.get("shortlisted_datasources", "<MISSING>"))
    datasources = state.get("shortlisted_datasources", [])
    print("Type of result: ", type(datasources))
    prompt = ''
    for ds in datasources:
        if ds.get("datasource_name","") == 'Secondary Sales DS - BDC':
            ds_info = rf"""Datasource name: {ds.get("datasource_name", "")} , datasourceLuid: '{ds.get("datasource_id","")}' """
            prompt += ds_info
            current_file = Path(__file__).resolve()
            parent_dir = current_file.parent.parent            
            prompt += Path(rf"{parent_dir}\system_prompts\KPIs_v5.md").read_text(encoding="utf-8")   
            prompt += Path(rf"{parent_dir}\system_prompts\Meta_Data_v5.md").read_text(encoding="utf-8")   
            prompt += Path(rf"{parent_dir}\system_prompts\agent_rules_v5.md").read_text(encoding="utf-8")  

        elif ds.get("datasource_name","") == 'IMS New - DS - BDC - Pulse':
            ds_info = rf"""Datasource name: {ds.get("datasource_name", "")} , datasourceLuid: '{ds.get("datasource_id","")}' """
            prompt += ds_info
            current_file = Path(__file__).resolve()
            parent_dir = current_file.parent.parent    
            prompt += Path(rf"{parent_dir}\system_prompts\IMS Metadata\IMS_Metadata_v2.md").read_text(encoding="utf-8")   
            prompt += Path(rf"{parent_dir}\system_prompts\IMS Metadata\IMS_KPIs_v1.md").read_text(encoding="utf-8")   
    
    print("THE SYSTEM PROMPT: ", prompt)
    return {"agent_system_prompt": prompt}


async def autonomous_executor(state: dict):
    langchain_tools = state.get("langchain_tools", [])
    tools_by_name = state.get("tools_by_name", {})
    agent_system_prompt = state.get("agent_system_prompt", "")
    CODE_EXECUTION_TOOL = {"type": "code_execution_20250825", "name": "code_execution"}

    llm_with_tools = sonnet_llm.bind_tools(langchain_tools)
    datasource_uuid = "b6bbffe2-ebdb-4deb-808c-825fe0896e85"

    business_info = get_business_info()
    datasource_metadata = get_datasource_metadata()
    agent_rules = get_agent_rules()
    string_search_instructions = get_string_search_instructions()

    today = datetime.now()
    latest_date = today - timedelta(days=1)

    latest_date_msg = f"Today's date is {today}"

    prompt = f"""{agent_rules}\n\n{business_info}\n DataSource UUID: {datasource_uuid}\n Metadata of the datasource:\n{datasource_metadata}\n\n"""
    
    
    tool_execution_history = state.get("tool_execution_history", [])
    user_msg = state.get('enhanced_input', "") 

    messages = [
        SystemMessage(content=[{"type": "text", "text": agent_system_prompt, "cache_control": {"type": "ephemeral"}}]),
    ]
    messages.append(HumanMessage(content=user_msg))

    history = copy.deepcopy(tool_execution_history)
    tool_call_log = copy.deepcopy(state.get("tool_call_log", []))
    validation_log = copy.deepcopy(state.get("validation_log", {}))



    if history:
        last = history[-1]
        if isinstance(last.content, str):
            last.content = [
                {"type": "text", "text": last.content, "cache_control": {"type": "ephemeral"}}
            ]
        elif isinstance(last.content, list) and last.content:
            last.content[-1]["cache_control"] = {"type": "ephemeral"}
        
    messages.extend(history)    
    messages.append(HumanMessage(content=[{"type": "text", "text": latest_date_msg}]))


    while True:
        current_tool_calls = []

        ai_message = llm_with_tools.invoke(messages)

        usage = ai_message.usage_metadata
        print("Response from LLM: ", ai_message)
        print("============== AGENT NODE ================")
        print("input_tokens:", usage["input_tokens"])
        print("cache_read:", usage.get("input_token_details", {}).get("cache_read"))
        print("cache_creation:", usage.get("input_token_details", {}).get("cache_creation"))

        current_tool_calls.append(ai_message)

        tool_calls = getattr(ai_message, "tool_calls", [])
        print(f"Agent sent {len(tool_calls)} tool_calls")

        for call in tool_calls:
            name = call.get("name")
            args = call.get("args", {})
            tool_started_at = _utc_now_iso()
            tool_started_monotonic = time.perf_counter()
            tool_log_entry = {
                "sequence": len(tool_call_log) + 1,
                "tool_call_id": call.get("id", ""),
                "tool_name": name,
                "arguments": _json_safe(args),
                "status": "started",
                "result": None,
                "error": None,
                "started_at": tool_started_at,
                "finished_at": "",
                "duration_ms": None,
            }

            try: 
                tool = tools_by_name.get(name)
                if tool is None:
                    msg = f"Tool '{name}' is not available (VDS tools only)."
                    # print("\n=== Error ===\n" + msg)
                    messages.append(ToolMessage(content=msg, tool_call_id=call["id"], status="error"))
                    tool_log_entry["status"] = "error"
                    tool_log_entry["error"] = msg
                    continue
                    

                result = await tool.ainvoke(args)
                tool_log_entry["status"] = "success"
                tool_log_entry["result"] = _json_safe(result)
                if name == 'query-datasource':
                    
                    tool_msg = ToolMessage(
                        content=result,
                        tool_name=name,
                        tool_call_id=call["id"],
                    )
                    current_tool_calls.append(tool_msg)


            except Exception as e:  # VDS/MCP raised -> brief it and feed back


                tool_msg = ToolMessage(
                    content=str(e),
                    tool_name=name,
                    tool_call_id=call["id"],
                )
                tool_log_entry["status"] = "error"
                tool_log_entry["error"] = str(e)
                current_tool_calls.append(tool_msg)
            finally:
                tool_log_entry["finished_at"] = _utc_now_iso()
                tool_log_entry["duration_ms"] = round(
                    (time.perf_counter() - tool_started_monotonic) * 1000
                )
                tool_call_log.append(tool_log_entry)

        tool_calls_summary = _tool_calls_summary(tool_call_log)
        validation_log["tool_calls"] = tool_call_log
        validation_log["tool_calls_summary"] = tool_calls_summary
        
        
        normalized_output = _normalize_text_output(ai_message.content)

        return  {
        "tool_calls": tool_calls,
        "tool_execution_history": current_tool_calls,
        "tool_call_log": tool_call_log,
        "tool_calls_summary": tool_calls_summary,
        "validation_log": validation_log,
        "output": normalized_output,
        "follow_up": False,
        }
    
def execute_tool(state: dict):
    return
        


def final_response_after_tool_call_node(state: State):
    """
    Generate the final response to the user using:
    - enhanced_input
    - implementation_plan
    - context_anchors
    - tool execution history (to summarize results and explain any adjustments)
    - final results from tool calls
    """

    enhanced_input = state.get("enhanced_input", "")
    final_results = state.get("output", [])

    # msg = sonnet_llm.invoke(f"""
    #     You are a Tableau assistant.

    #     Based on the conversation so far and the user's latest request, generate
    #     a concise and accurate response.

    #     Inputs you can use:
    #     1. Enhanced user input:
    #     {enhanced_input}

    #     2. Final results from tool calls:
    #     {final_results}

    #     Instructions:
    #     - Respond only with the message text, no JSON or extra formatting.
    # """)

    # assistant_reply = msg.content.strip()


    return {"output": final_results, "conversation_history":[AIMessage(content=final_results)]}

