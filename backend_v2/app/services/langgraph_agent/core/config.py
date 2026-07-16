"""Central configuration, loaded from environment variables (.env supported)."""
import os

from dotenv import load_dotenv

load_dotenv()

# --- Anthropic / model ---------------------------------------------------
API_KEY = os.getenv("claude_api_key")
HAIKU_MODEL_NAME = os.getenv("HAIKU_MODEL_NAME", "claude-sonnet-4-5")
SONNET_MODEL_NAME = os.getenv("SONNET_MODEL_NAME", "claude-sonnet-4-6")
OPUS_MODEL_NAME = os.getenv("OPUS_MODEL_NAME", "claude-opus-4-5")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))

# --- Tableau / MCP -------------------------------------------------------
METADATA_PATH = os.getenv("METADATA_PATH", "metadata.txt")
DATASOURCE_UUID = os.getenv("DATASOURCE_UUID", "b6bbffe2-ebdb-4deb-808c-825fe0896e85")
TABLEAU_MCP_URL = os.getenv("TABLEAU_MCP_URL", "http://localhost:3927/tableau-mcp")

# Only bind Tableau's VizQL Data Service tools to the LLM.
VDS_TOOL_NAMES = {"query-datasource", "read-metadata"}
QUERY_TOOL = "query-datasource"
MAX_TOOL_HOPS = int(os.getenv("MAX_TOOL_HOPS", "10"))

# Prompt-caching marker used on the (large) system message.
FIVE_MIN = {"type": "ephemeral"}

# --- Auth ----------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 12)))
USERS_PATH = os.getenv("USERS_PATH", "users.json")

# --- CORS ----------------------------------------------------------------
# Comma-separated list of allowed origins, or "*" for all (dev only).
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
