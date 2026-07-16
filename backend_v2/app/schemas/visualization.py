from pydantic import BaseModel, Field

class VisualizationRequest(BaseModel):
    message: str = Field(
        min_length=1,
        description="User's message to the AI assistant."
    )
    answer: str = Field(
        min_length=1,
        description="AI assistant Response."
    )
