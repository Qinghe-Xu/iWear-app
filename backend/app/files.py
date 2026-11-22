"""图片文件的安全读取。按数据库归属校验，不属于当前用户时返回 404。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from .auth import CurrentUser, current_user
from .db import get_db
from .images import path_for

router = APIRouter(prefix="/api/files", tags=["files"])

OWNER_QUERIES = [
    "SELECT 1 FROM wardrobe_items WHERE user_id=? AND image_path=?",
    "SELECT 1 FROM person_photos WHERE user_id=? AND image_path=?",
    "SELECT 1 FROM tryon_records WHERE user_id=? AND result_path=?",
    "SELECT 1 FROM uploads WHERE user_id=? AND image_path=?",
    "SELECT 1 FROM suggestion_images s JOIN chat_messages m ON m.id = s.message_id "
    "JOIN chat_sessions c ON c.id = m.session_id WHERE c.user_id=? AND s.image_path=?",
]

MEDIA_TYPES = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


async def owns_file(db, user_id: str, filename: str) -> bool:
    for query in OWNER_QUERIES:
        async with db.execute(query, (user_id, filename)) as cur:
            if await cur.fetchone():
                return True
    return False


@router.get("/{filename}")
async def read_file(
    filename: str, db=Depends(get_db), user: CurrentUser = Depends(current_user)
):
    path = path_for(filename)
    if path is None or not await owns_file(db, user.id, filename):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "图片不存在")
    return FileResponse(
        path,
        media_type=MEDIA_TYPES[filename.rsplit(".", 1)[1]],
        headers={
            "Cache-Control": "private, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    )