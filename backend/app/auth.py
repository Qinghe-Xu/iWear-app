"""手机号验证码登录、会话、鉴权依赖。"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, field_validator

from .db import get_db
from .sms import send_code

router = APIRouter(prefix="/api/auth", tags=["auth"])

CODE_TTL = timedelta(minutes=5)
CODE_RESEND = timedelta(seconds=60)
CODE_MAX_FAILURES = 5
CODE_LOCK = timedelta(minutes=10)
PHONE_DAILY_LIMIT = 10
IP_HOURLY_LIMIT = 20
SESSION_TTL = timedelta(days=30)
DEV_CODE = "123456"


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat(timespec="seconds")


def _hash_code(phone: str, code: str) -> str:
    from .config import settings

    secret = settings.otp_secret or "development-only-secret"
    return hmac.new(secret.encode(), f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def valid_phone(phone: str) -> bool:
    return len(phone) == 11 and phone.isdigit() and phone[0] == "1"


class PhoneBody(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def _check(cls, value: str) -> str:
        value = value.strip()
        if not valid_phone(value):
            raise ValueError("请输入 11 位手机号")
        return value


class VerifyBody(BaseModel):
    phone: str
    code: str

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, value: str) -> str:
        value = value.strip()
        if not valid_phone(value):
            raise ValueError("请输入 11 位手机号")
        return value

    @field_validator("code")
    @classmethod
    def _check_code(cls, value: str) -> str:
        value = value.strip()
        if not (value.isdigit() and len(value) == 6):
            raise ValueError("请输入 6 位验证码")
        return value


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/send-code")
async def send_code_route(body: PhoneBody, request: Request, db=Depends(get_db)):
    ip = client_ip(request)
    current = now()

    async with db.execute(
        "SELECT sent_at FROM sms_limits WHERE scope='phone' AND subject=? ORDER BY sent_at DESC LIMIT 1",
        (body.phone,),
    ) as cur:
        last = await cur.fetchone()
    if last and now() - datetime.fromisoformat(last["sent_at"]) < CODE_RESEND:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "发送太频繁，请 60 秒后再试")

    async with db.execute(
        "SELECT COUNT(*) AS n FROM sms_limits WHERE scope='phone' AND subject=? AND sent_at > ?",
        (body.phone, iso(current - timedelta(days=1))),
    ) as cur:
        if (await cur.fetchone())["n"] >= PHONE_DAILY_LIMIT:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "该手机号今天发送次数已达上限")

    async with db.execute(
        "SELECT COUNT(*) AS n FROM sms_limits WHERE scope='ip' AND subject=? AND sent_at > ?",
        (ip, iso(current - timedelta(hours=1))),
    ) as cur:
        if (await cur.fetchone())["n"] >= IP_HOURLY_LIMIT:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "请求过于频繁，请稍后再试")

    from .config import settings

    code = DEV_CODE if not settings.is_production else f"{secrets.randbelow(1_000_000):06d}"
    if settings.is_production:
        await send_code(body.phone, code)

    await db.execute(
        "INSERT INTO auth_codes (phone, code_hash, created_at, expires_at, failed_attempts) "
        "VALUES (?, ?, ?, ?, 0) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, "
        "created_at=excluded.created_at, expires_at=excluded.expires_at, failed_attempts=0, locked_until=NULL",
        (body.phone, _hash_code(body.phone, code), iso(current), iso(current + CODE_TTL)),
    )
    await db.executemany(
        "INSERT INTO sms_limits (scope, subject, sent_at) VALUES (?, ?, ?)",
        [("phone", body.phone, iso(current)), ("ip", ip, iso(current))],
    )
    await db.commit()
    return {"sent": True, "expires_in": int(CODE_TTL.total_seconds())}


@router.post("/verify")
async def verify_route(body: VerifyBody, db=Depends(get_db)):
    current = now()
    async with db.execute("SELECT * FROM auth_codes WHERE phone=?", (body.phone,)) as cur:
        row = await cur.fetchone()
    if row is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "请先获取验证码")
    if row["locked_until"] and datetime.fromisoformat(row["locked_until"]) > current:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "错误次数过多，请 10 分钟后再试")
    if datetime.fromisoformat(row["expires_at"]) < current:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "验证码已过期，请重新获取")
    if not hmac.compare_digest(row["code_hash"], _hash_code(body.phone, body.code)):
        failures = row["failed_attempts"] + 1
        locked = iso(current + CODE_LOCK) if failures >= CODE_MAX_FAILURES else None
        await db.execute(
            "UPDATE auth_codes SET failed_attempts=?, locked_until=? WHERE phone=?",
            (failures, locked, body.phone),
        )
        await db.commit()
        if locked:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "错误次数过多，请 10 分钟后再试")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"验证码错误，还可尝试 {CODE_MAX_FAILURES - failures} 次")

    async with db.execute("SELECT id FROM users WHERE phone=?", (body.phone,)) as cur:
        user = await cur.fetchone()
    is_new_user = user is None
    if is_new_user:
        user_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO users (id, phone, created_at) VALUES (?, ?, ?)",
            (user_id, body.phone, iso(current)),
        )
    else:
        user_id = user["id"]

    await db.execute("DELETE FROM auth_codes WHERE phone=?", (body.phone,))
    raw_token = secrets.token_urlsafe(32)
    expires = current + SESSION_TTL
    await db.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (hash_token(raw_token), user_id, iso(current), iso(expires)),
    )
    await db.commit()
    return {"token": raw_token, "expires_at": iso(expires), "is_new_user": is_new_user}


class CurrentUser(BaseModel):
    id: str
    phone: str


async def current_user(request: Request, db=Depends(get_db)) -> CurrentUser:
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "请先登录")
    token = header[7:].strip()
    async with db.execute(
        "SELECT u.id, u.phone, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token_hash=?",
        (hash_token(token),),
    ) as cur:
        row = await cur.fetchone()
    if row is None or datetime.fromisoformat(row["expires_at"]) < now():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "登录已过期，请重新登录")
    return CurrentUser(id=row["id"], phone=row["phone"])


@router.post("/logout")
async def logout(request: Request, db=Depends(get_db), user: CurrentUser = Depends(current_user)):
    header = request.headers.get("authorization", "")
    token = header[7:].strip()
    await db.execute("DELETE FROM sessions WHERE token_hash=?", (hash_token(token),))
    await db.commit()
    return {"ok": True}