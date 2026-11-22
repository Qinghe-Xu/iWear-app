"""用户资料、注销账号。"""

from __future__ import annotations

import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from .auth import CurrentUser, current_user, iso, now
from .db import get_db

router = APIRouter(prefix="/api/user", tags=["user"])

DELETE_PHRASE = "删除我的账号"


class ProfilePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=20)
    city: str | None = Field(default=None, max_length=20)
    gender: Literal["male", "female", "unspecified"] | None = None
    height: int | None = Field(default=None, ge=80, le=240)
    weight: int | None = Field(default=None, ge=25, le=250)
    waist: int | None = Field(default=None, ge=30, le=200)
    body_shape: Literal["pear", "apple", "hourglass", "rectangle", "inverted_triangle"] | None = None
    style_tags: list[str] | None = None

    @field_validator("style_tags")
    @classmethod
    def _tags(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [t.strip() for t in value if t.strip()]
        if len(cleaned) > 10:
            raise ValueError("风格标签最多 10 个")
        if any(len(t) > 10 for t in cleaned):
            raise ValueError("每个风格标签最多 10 个字")
        return cleaned


def _shape(row) -> dict:
    return {
        "id": row["id"],
        "phone": row["phone"],
        "name": row["name"],
        "city": row["city"],
        "gender": row["gender"],
        "height": row["height"],
        "weight": row["weight"],
        "waist": row["waist"],
        "body_shape": row["body_shape"],
        "style_tags": json.loads(row["style_tags"] or "[]"),
        "created_at": row["created_at"],
    }


@router.get("/profile")
async def get_profile(db=Depends(get_db), user: CurrentUser = Depends(current_user)):
    async with db.execute("SELECT * FROM users WHERE id=?", (user.id,)) as cur:
        return _shape(await cur.fetchone())


@router.put("/profile")
async def update_profile(
    patch: ProfilePatch, db=Depends(get_db), user: CurrentUser = Depends(current_user)
):
    changes = patch.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "没有要更新的内容")
    if "style_tags" in changes and changes["style_tags"] is not None:
        changes["style_tags"] = json.dumps(changes["style_tags"], ensure_ascii=False)
    assignments = ", ".join(f"{key}=?" for key in changes)
    await db.execute(
        f"UPDATE users SET {assignments} WHERE id=?", (*changes.values(), user.id)
    )
    await db.commit()
    async with db.execute("SELECT * FROM users WHERE id=?", (user.id,)) as cur:
        return _shape(await cur.fetchone())


class DeleteAccount(BaseModel):
    confirm: str


@router.delete("")
async def delete_account(
    body: DeleteAccount, db=Depends(get_db), user: CurrentUser = Depends(current_user)
):
    if body.confirm.strip() != DELETE_PHRASE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"请输入“{DELETE_PHRASE}”确认")

    from .images import delete_file

    files: set[str] = set()
    for query in (
        "SELECT image_path AS p FROM wardrobe_items WHERE user_id=?",
        "SELECT image_path AS p FROM person_photos WHERE user_id=?",
        "SELECT image_path AS p FROM uploads WHERE user_id=?",
        "SELECT result_path AS p FROM tryon_records WHERE user_id=?",
        "SELECT s.image_path AS p FROM suggestion_images s "
        "JOIN chat_messages m ON m.id = s.message_id "
        "JOIN chat_sessions c ON c.id = m.session_id WHERE c.user_id=?",
    ):
        async with db.execute(query, (user.id,)) as cur:
            files.update(row["p"] for row in await cur.fetchall())

    await db.execute("DELETE FROM users WHERE id=?", (user.id,))
    await db.commit()
    for filename in files:
        delete_file(filename)
    return {"deleted": True, "at": iso(now())}