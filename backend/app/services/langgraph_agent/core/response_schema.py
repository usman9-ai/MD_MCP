from pydantic import BaseModel
from typing import Optional


class RouterOutput(BaseModel):
    enhanced_prompt: Optional[str] = None
    greeting_response: Optional[str] = None
    other_domain_response: Optional[str] = None