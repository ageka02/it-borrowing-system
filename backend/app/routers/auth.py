import hashlib
import base64
import json
import time
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AdminUser
from app.schemas import AdminLogin, TokenResponse, AdminUserResponse
from app.config import get_settings

router = APIRouter()
settings = get_settings()

TOKEN_EXPIRY_HOURS = 24


def hash_password(password: str) -> str:
    """Simple SHA-256 hash for MVP."""
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(username: str) -> str:
    """Create a simple base64-encoded token with expiry."""
    payload = {
        "username": username,
        "exp": time.time() + (TOKEN_EXPIRY_HOURS * 3600),
        "secret": settings.SECRET_KEY[:8],
    }
    token_bytes = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(token_bytes).decode("utf-8")


def decode_token(token: str) -> dict:
    """Decode and validate a token."""
    try:
        token_bytes = base64.urlsafe_b64decode(token.encode("utf-8"))
        payload = json.loads(token_bytes.decode("utf-8"))

        if payload.get("secret") != settings.SECRET_KEY[:8]:
            raise ValueError("Invalid token secret")

        if time.time() > payload.get("exp", 0):
            raise ValueError("Token expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )


def get_current_admin(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
) -> AdminUser:
    """Dependency to verify admin token and return admin user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
        )

    # Support "Bearer <token>" format
    token = authorization
    if authorization.lower().startswith("bearer "):
        token = authorization[7:]

    payload = decode_token(token)
    username = payload.get("username")

    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user not found",
        )
    return admin


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """Admin login - returns a JWT-like token."""
    admin = db.query(AdminUser).filter(
        AdminUser.username == login_data.username
    ).first()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if admin.password_hash != hash_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_token(admin.username)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=admin.username,
    )


@router.get("/me", response_model=AdminUserResponse)
def get_me(current_admin: AdminUser = Depends(get_current_admin)):
    """Get current authenticated admin info."""
    return current_admin
