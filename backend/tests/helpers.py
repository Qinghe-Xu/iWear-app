"""测试公共工具：临时数据目录、测试客户端。"""

from __future__ import annotations

import asyncio
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

# 必须在导入 app 之前设置
_TMP = tempfile.mkdtemp(prefix="iwear-test-")
os.environ["IWEAR_DATA_DIR"] = _TMP
os.environ["IWEAR_AUTH_MODE"] = "development"
os.environ["IWEAR_IMAGE_BASE_URL"] = ""
os.environ["IWEAR_IMAGE_API_KEY"] = ""
os.environ["IWEAR_VISION_BASE_URL"] = ""
os.environ["IWEAR_STYLIST_BASE_URL"] = ""
os.environ["IWEAR_CORS_ORIGINS"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app import config, db as db_module, main as main_module  # noqa: E402


class BaseCase(unittest.TestCase):
    """每个测试用独立的数据库文件。"""

    counter = 0

    def setUp(self) -> None:
        type(self).counter += 1
        db_file = Path(_TMP) / f"db-{type(self).counter}.db"
        db_file.unlink(missing_ok=True)
        db_module.set_db_path(str(db_file))
        asyncio.run(db_module.init_db(str(db_file)))
        main_module.DB_PATH = db_file
        self.client = TestClient(main_module.create_app())
        self.db_file = db_file

    @classmethod
    def tearDownClass(cls) -> None:
        pass

    def login(self, phone: str = "13800138000") -> str:
        r = self.client.post("/api/auth/send-code", json={"phone": phone})
        self.assertEqual(r.status_code, 200, r.text)
        r = self.client.post("/api/auth/verify", json={"phone": phone, "code": "123456"})
        self.assertEqual(r.status_code, 200, r.text)
        return r.json()["token"]

    def auth(self, token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}


def cleanup() -> None:
    shutil.rmtree(_TMP, ignore_errors=True)