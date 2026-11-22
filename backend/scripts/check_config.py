"""检查 backend/.env 中各变量是否已配置。只输出"已配置/未配置"，不输出任何值。"""

import os
import stat
import sys
from pathlib import Path

from dotenv import dotenv_values

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

GROUPS = {
    "生图服务（试穿、示意图）": ["IWEAR_IMAGE_BASE_URL", "IWEAR_IMAGE_API_KEY", "IWEAR_IMAGE_MODEL"],
    "视觉识别": ["IWEAR_VISION_BASE_URL", "IWEAR_VISION_API_KEY", "IWEAR_VISION_MODEL"],
    "搭配师": ["IWEAR_STYLIST_BASE_URL", "IWEAR_STYLIST_API_KEY", "IWEAR_STYLIST_MODEL"],
    "登录": ["IWEAR_AUTH_MODE", "IWEAR_OTP_SECRET"],
    "腾讯云短信（仅生产）": [
        "TENCENT_SMS_SECRET_ID",
        "TENCENT_SMS_SECRET_KEY",
        "TENCENT_SMS_SDK_APP_ID",
        "TENCENT_SMS_SIGN_NAME",
        "TENCENT_SMS_TEMPLATE_ID",
        "TENCENT_SMS_REGION",
    ],
    "其他": [
        "IWEAR_CORS_ORIGINS",
        "IWEAR_QUOTA_TRYON",
        "IWEAR_QUOTA_SUGGESTION",
        "IWEAR_QUOTA_STYLIST",
        "IWEAR_QUOTA_VISION",
    ],
}


def main() -> int:
    if not ENV_PATH.exists():
        print("未找到 backend/.env，请先 cp .env.example .env 并用编辑器填写。")
        values: dict[str, str | None] = {}
    else:
        mode = stat.S_IMODE(ENV_PATH.stat().st_mode)
        if mode & 0o077:
            print(f"警告：backend/.env 权限为 {oct(mode)}，建议执行 chmod 600 .env")
        values = dotenv_values(ENV_PATH)

    for group, names in GROUPS.items():
        print(f"\n[{group}]")
        for name in names:
            raw = values.get(name) or os.environ.get(name) or ""
            status = "已配置" if raw.strip() else "未配置"
            print(f"  {name}: {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
