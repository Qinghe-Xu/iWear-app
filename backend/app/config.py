"""读取并校验环境变量。只在此处读取 backend/.env，其他模块通过 Settings 取用。"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# 允许用 IWEAR_DATA_DIR 覆盖数据目录（测试用）
DATA_DIR = Path(os.environ.get("IWEAR_DATA_DIR") or (ROOT / "data"))
UPLOAD_DIR = DATA_DIR / "uploads"


class ConfigError(RuntimeError):
    pass


def _get(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def _int(name: str, default: int) -> int:
    raw = _get(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} 必须是整数") from exc


@dataclass(frozen=True)
class AIConfig:
    base_url: str
    api_key: str
    model: str

    @property
    def available(self) -> bool:
        return bool(self.base_url and self.api_key and self.model)


@dataclass(frozen=True)
class Settings:
    image: AIConfig
    vision: AIConfig
    stylist: AIConfig
    auth_mode: str
    otp_secret: str
    sms: dict[str, str] = field(default_factory=dict)
    cors_origins: list[str] = field(default_factory=list)
    quotas: dict[str, int] = field(default_factory=dict)
    data_dir: Path = DATA_DIR
    upload_dir: Path = UPLOAD_DIR
    environment: str = "development"

    @property
    def is_production(self) -> bool:
        return self.auth_mode == "production"


def load_settings() -> Settings:
    settings = Settings(
        image=AIConfig(_get("IWEAR_IMAGE_BASE_URL"), _get("IWEAR_IMAGE_API_KEY"), _get("IWEAR_IMAGE_MODEL")),
        vision=AIConfig(_get("IWEAR_VISION_BASE_URL"), _get("IWEAR_VISION_API_KEY"), _get("IWEAR_VISION_MODEL")),
        stylist=AIConfig(_get("IWEAR_STYLIST_BASE_URL"), _get("IWEAR_STYLIST_API_KEY"), _get("IWEAR_STYLIST_MODEL")),
        auth_mode=_get("IWEAR_AUTH_MODE", "development") or "development",
        otp_secret=_get("IWEAR_OTP_SECRET"),
        sms={
            "secret_id": _get("TENCENT_SMS_SECRET_ID"),
            "secret_key": _get("TENCENT_SMS_SECRET_KEY"),
            "sdk_app_id": _get("TENCENT_SMS_SDK_APP_ID"),
            "sign_name": _get("TENCENT_SMS_SIGN_NAME"),
            "template_id": _get("TENCENT_SMS_TEMPLATE_ID"),
            "region": _get("TENCENT_SMS_REGION", "ap-guangzhou") or "ap-guangzhou",
        },
        cors_origins=[o.strip() for o in _get("IWEAR_CORS_ORIGINS").split(",") if o.strip()],
        quotas={
            "tryon": _int("IWEAR_QUOTA_TRYON", 20),
            "suggestion_image": _int("IWEAR_QUOTA_SUGGESTION", 20),
            "stylist": _int("IWEAR_QUOTA_STYLIST", 200),
            "vision": _int("IWEAR_QUOTA_VISION", 100),
        },
    )
    _validate(settings)
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings


def _validate(settings: Settings) -> None:
    if settings.auth_mode not in ("development", "production"):
        raise ConfigError("IWEAR_AUTH_MODE 只能是 development 或 production")
    if settings.is_production and len(settings.otp_secret.encode()) < 32:
        raise ConfigError("生产模式需要 IWEAR_OTP_SECRET，且至少 32 字节")
    missing = [k for k, v in settings.sms.items() if k != "region" and not v]
    if settings.is_production and missing:
        raise ConfigError("生产模式缺少腾讯云短信配置：" + "、".join(missing))
    for origin in settings.cors_origins:
        if origin.startswith("https://"):
            continue
        # 开发模式允许本机调试来源，生产模式必须是 HTTPS
        local_dev = origin.startswith(("http://localhost", "http://127.0.0.1"))
        if settings.is_production or not local_dev:
            raise ConfigError("IWEAR_CORS_ORIGINS 只接受 HTTPS 来源（开发模式可用 http://localhost:<端口>）")


settings = load_settings()
