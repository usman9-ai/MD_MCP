from langchain_anthropic import ChatAnthropic
import os
from dotenv import load_dotenv
from . import config

# Load .env
load_dotenv(r"D:\Martin Dow\Tableau MCP\Clean Code\backend\.env")

sonnet_llm = ChatAnthropic(
        model=config.SONNET_MODEL_NAME,
        api_key=config.API_KEY,
        max_tokens=config.MAX_TOKENS,
    )


haiku_llm = ChatAnthropic(
            model=config.HAIKU_MODEL_NAME,
            api_key=config.API_KEY,
            max_tokens=config.MAX_TOKENS,
        )


opus_llm = ChatAnthropic(
            model=config.OPUS_MODEL_NAME,
            api_key=config.API_KEY,
            max_tokens=config.MAX_TOKENS,
        )