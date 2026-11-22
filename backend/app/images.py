"""图片校验与本地存储。

所有图片扁平保存在 backend/data/uploads/ 下，文件名是 UUID + 扩展名。
归属关系由数据库判断（wardrobe_items / person_photos / tryon_records / suggestion_images / uploads），
读取时必须经过 files.py 的鉴权检查，不提供公开静态目录。
"""

from __future__ import annotations

import io
import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from .config import settings

MAX_BYTES = 5 * 1024 * 1024
MAX_SIDE = 8192
MAX_PIXELS = 32_000_000
ALLOWED_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
NAME_PATTERN = re.compile(r"^[0-9a-f]{32}\.(jpg|png|webp)$")


class ImageRejected(ValueError):
    pass


@dataclass(frozen=True)
class StoredImage:
    filename: str
    width: int
    height: int
    size: int

    @property
    def url(self) -> str:
        return f"/api/files/{self.filename}"


def validate_image(raw: bytes) -> Image.Image:
    if not raw:
        raise ImageRejected("图片为空")
    if len(raw) > MAX_BYTES:
        raise ImageRejected("图片超过 5MB，请压缩后重试")
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except UnidentifiedImageError:
        raise ImageRejected("无法识别该图片，请上传 JPG、PNG 或 WEBP")
    except (OSError, ValueError):
        raise ImageRejected("图片已损坏，请换一张")
    if img.format not in ALLOWED_FORMATS:
        raise ImageRejected("只支持 JPG、PNG、WEBP 格式")
    if img.width > MAX_SIDE or img.height > MAX_SIDE:
        raise ImageRejected(f"图片边长超过 {MAX_SIDE} 像素")
    if img.width * img.height > MAX_PIXELS:
        raise ImageRejected("图片像素总数过大")
    return img


def validate_and_encode(raw: bytes) -> tuple[bytes, str]:
    """校验并返回 (字节, 扩展名)。超过 4MB 时按需转成 JPEG 控制体积。"""
    img = validate_image(raw)
    ext = ALLOWED_FORMATS[img.format]
    if len(raw) <= 4 * 1024 * 1024:
        return raw, ext
    buffer = io.BytesIO()
    img.convert("RGB").save(buffer, "JPEG", quality=90, optimize=True)
    return buffer.getvalue(), "jpg"


def store_image(raw: bytes) -> StoredImage:
    data, ext = validate_and_encode(raw)
    filename = f"{uuid.uuid4().hex}.{ext}"
    (settings.upload_dir / filename).write_bytes(data)
    img = validate_image(data)
    return StoredImage(filename, img.width, img.height, len(data))


def path_for(filename: str) -> Path | None:
    """只接受 UUID.扩展名，防止路径穿越。"""
    if not NAME_PATTERN.match(filename):
        return None
    path = settings.upload_dir / filename
    return path if path.is_file() else None


def delete_file(filename: str) -> None:
    if NAME_PATTERN.match(filename or ""):
        (settings.upload_dir / filename).unlink(missing_ok=True)