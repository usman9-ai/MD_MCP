from datetime import datetime, timedelta
import json
import profile
import jwt
from app.schemas.auth import LoginRequest
from fastapi import HTTPException
from fastapi import APIRouter, Depends

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(prefix="/chat", tags=["Chat"])


def load_users():

    with open(r"D:\Martin Dow\Tableau MCP\Clean Code\backend\app\user.json", "r") as f:
        return json.load(f)
    
def get_user(username: str):

    users = load_users()
    print(f"Loaded users: {users}")  # Debugging line
    return users

def create_access_token(data: dict):

    payload = data.copy()

    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )


@router.post("/login")
async def login(request: LoginRequest):
    user = request.username
    users = load_users()
    print(f"User fetched: {users}")  # Debugging line
    print("type of users:", type(users))  # Debugging line
    for i in users.values():
        print(f"User in loop: {i}")  # Debugging line
    user_names = [user.get("username") for user in users.values()]
    print(f"User names: {user_names}")  # Debugging line
    if user not in user_names:
        raise HTTPException(401, "Invalid username")

    for user in users.values():
        if user.get("username") == request.username:
            user_data = user
            break
    print(f"User data: {user_data}")  # Debugging line
    if user_data is None or user_data["password"] != request.password:
        raise HTTPException(401, "Invalid password")

    token = create_access_token(
        {
            "sub": request.username,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }