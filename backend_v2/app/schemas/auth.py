from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(
        min_length=1,
        description="Username for login."
    )
    password: str = Field(
        min_length=1,
        description="Password for login."
    )