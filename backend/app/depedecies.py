from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer

from .api.auth import verify_access_token
from .users import get_user

security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):

    token = credentials.credentials

    try:

        payload = verify_access_token(token)

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    username = payload["sub"]

    user = get_user(username)

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return {
        "sub": username,
        "profile": user,
    }