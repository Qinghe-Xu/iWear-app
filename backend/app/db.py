"""SQLite 连接与建表。aiosqlite + 手写参数化 SQL。"""

from __future__ import annotations

import aiosqlite

SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'iWear 用户',
    city TEXT,
    gender TEXT NOT NULL DEFAULT 'unspecified' CHECK (gender IN ('male', 'female', 'unspecified')),
    height INTEGER,
    weight INTEGER,
    waist INTEGER,
    body_shape TEXT,
    style_tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS auth_codes (
    phone TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT
);

CREATE TABLE IF NOT EXISTS sms_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scope TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sms_limits ON sms_limits(scope, subject, sent_at);

CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    closet TEXT NOT NULL CHECK (closet IN ('owned', 'tryon')),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    style TEXT,
    season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all')),
    image_path TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wardrobe_user ON wardrobe_items(user_id, closet, created_at);

CREATE TABLE IF NOT EXISTS person_photos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_user ON person_photos(user_id);

CREATE TABLE IF NOT EXISTS tryon_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id TEXT NOT NULL,
    item_ids TEXT NOT NULL,
    result_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tryon_user ON tryon_records(user_id, created_at);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    item_refs TEXT NOT NULL DEFAULT '[]',
    new_item TEXT,
    feedback TEXT CHECK (feedback IN ('like', 'dislike') OR feedback IS NULL),
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS suggestion_images (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    image_path TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestion_message ON suggestion_images(message_id);

CREATE TABLE IF NOT EXISTS ai_usage (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date, kind)
);
"""


async def connect(db_path: str) -> aiosqlite.Connection:
    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    await db.execute("PRAGMA journal_mode = WAL")
    return db


async def init_db(db_path: str) -> None:
    db = await connect(db_path)
    try:
        await db.executescript(SCHEMA)
        await db.commit()
    finally:
        await db.close()

# 运行时数据库路径由 main.py 设置
_db_path: str = ""


def set_db_path(path: str) -> None:
    global _db_path
    _db_path = path


async def get_db():
    """FastAPI 依赖：每个请求一个连接，请求结束关闭。"""
    db = await connect(_db_path)
    try:
        yield db
    finally:
        await db.close()
