"""M0：生图接口连通性验证。

用法（在 backend 目录下）：
    .venv/bin/python scripts/m0_probe.py            # 文本生图 + 带参考图编辑，共 3 次调用
    .venv/bin/python scripts/m0_probe.py --text-only  # 只测文本生图，1～2 次调用

只读取 backend/.env 中的 IWEAR_IMAGE_*，不打印密钥。参考图全部由本脚本先用文本生成，
不使用任何真人照片。结果保存在 backend/data/m0/（已被 .gitignore 忽略）：
    - *.png / *.jpg       生成的图片
    - *.response.json     响应结构（base64 已截断）
    - report.json         汇总，供填写 PRD 附录 A
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import dotenv_values
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "m0"
TIMEOUT = httpx.Timeout(180.0, connect=15.0)

PERSON_PROMPT = (
    "Full body studio photo of a plain white fashion mannequin standing straight, "
    "front view, wearing a plain grey t-shirt and plain grey trousers, light beige background, "
    "no text, no logo."
)
GARMENT_PROMPT = (
    "A single red cotton t-shirt, flat lay product photo on a plain light beige background, "
    "no person, no mannequin, no text, no logo."
)
EDIT_PROMPT = (
    "Edit the first image. Keep the same person, face, body shape, pose, background and framing. "
    "Replace or add only the clothing categories specified below, using the garment images that "
    "follow as references. Do not copy any person from the garment images. Do not add text, logos "
    "or watermarks. Categories to change: top."
)

IMAGE_MAGIC = ("iVBORw0KGgo", "/9j/", "UklGR")  # PNG, JPEG, WEBP 的 base64 开头


def load_config() -> dict[str, str]:
    env_path = ROOT / ".env"
    if not env_path.exists():
        sys.exit("未找到 backend/.env。请先 cp .env.example .env，并用编辑器填写 IWEAR_IMAGE_*。")
    values = dotenv_values(env_path)
    cfg = {k: (values.get(k) or "").strip() for k in ("IWEAR_IMAGE_BASE_URL", "IWEAR_IMAGE_API_KEY", "IWEAR_IMAGE_MODEL")}
    missing = [k for k, v in cfg.items() if not v]
    if missing:
        sys.exit("以下变量未配置：" + "、".join(missing))
    cfg["IWEAR_IMAGE_BASE_URL"] = cfg["IWEAR_IMAGE_BASE_URL"].rstrip("/")
    return cfg


def looks_like_b64_image(s: str) -> bool:
    body = s.split(",", 1)[1] if s.startswith("data:image/") else s
    return len(body) > 1000 and body.startswith(IMAGE_MAGIC)


def find_images(node: Any, path: str = "$") -> list[tuple[str, str, str]]:
    """递归查找响应中的图片，返回 (JSON 路径, 类型 b64|url, 值)。"""
    found: list[tuple[str, str, str]] = []
    if isinstance(node, dict):
        for k, v in node.items():
            found += find_images(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            found += find_images(v, f"{path}[{i}]")
    elif isinstance(node, str):
        if looks_like_b64_image(node):
            found.append((path, "b64", node))
        elif node.startswith(("http://", "https://")) and any(
            x in node.lower() for x in (".png", ".jpg", ".jpeg", ".webp", "image")
        ):
            found.append((path, "url", node))
    return found


def redact(node: Any) -> Any:
    """截断 base64，保留结构，便于写进附录 A。"""
    if isinstance(node, dict):
        return {k: redact(v) for k, v in node.items()}
    if isinstance(node, list):
        return [redact(v) for v in node]
    if isinstance(node, str) and len(node) > 300:
        return f"<{len(node)} 字符，开头 {node[:40]!r}>"
    return node


def to_data_url(img_bytes: bytes) -> str:
    fmt = (Image.open(io.BytesIO(img_bytes)).format or "PNG").lower()
    mime = "jpeg" if fmt == "jpeg" else fmt
    return f"data:image/{mime};base64," + base64.b64encode(img_bytes).decode()


class Probe:
    def __init__(self, cfg: dict[str, str]):
        self.base = cfg["IWEAR_IMAGE_BASE_URL"]
        self.model = cfg["IWEAR_IMAGE_MODEL"]
        self._key = cfg["IWEAR_IMAGE_API_KEY"]
        self.client = httpx.Client(timeout=TIMEOUT, headers={"Authorization": f"Bearer {self._key}"})
        self.calls = 0
        self.attempts: list[dict[str, Any]] = []

    def scrub(self, text: str) -> str:
        return text.replace(self._key, "<KEY>") if self._key else text

    def _send(self, label: str, endpoint: str, *, json_body: dict | None = None,
              files: list | None = None, data: dict | None = None) -> list[tuple[str, str, str]]:
        url = f"{self.base}{endpoint}"
        self.calls += 1
        print(f"\n→ [{label}] POST {endpoint}")
        started = time.monotonic()
        record: dict[str, Any] = {"label": label, "endpoint": endpoint}
        try:
            resp = self.client.post(url, json=json_body, files=files, data=data)
        except httpx.TimeoutException:
            record.update(result="timeout", seconds=round(time.monotonic() - started, 1))
            print("  超时（180 秒）")
            self.attempts.append(record)
            return []
        except httpx.HTTPError as exc:
            record.update(result=f"network_error:{type(exc).__name__}")
            print(f"  网络错误：{type(exc).__name__}")
            self.attempts.append(record)
            return []
        elapsed = round(time.monotonic() - started, 1)
        record.update(status=resp.status_code, seconds=elapsed)
        print(f"  HTTP {resp.status_code}，耗时 {elapsed} 秒")
        try:
            payload = resp.json()
        except ValueError:
            record["result"] = "non_json"
            print("  响应不是 JSON：" + self.scrub(resp.text[:300]))
            self.attempts.append(record)
            return []
        safe = redact(payload)
        (OUT_DIR / f"{label}.response.json").write_text(
            self.scrub(json.dumps(safe, ensure_ascii=False, indent=2)), encoding="utf-8")
        if resp.status_code >= 400:
            record["result"] = "http_error"
            record["error"] = json.loads(self.scrub(json.dumps(safe, ensure_ascii=False)))
            print("  错误：" + self.scrub(json.dumps(safe, ensure_ascii=False))[:400])
            self.attempts.append(record)
            return []
        images = find_images(payload)
        record["top_level_keys"] = list(payload.keys()) if isinstance(payload, dict) else type(payload).__name__
        record["image_locations"] = [(p, kind) for p, kind, _ in images]
        record["usage"] = payload.get("usage") if isinstance(payload, dict) else None
        record["result"] = "image" if images else "no_image"
        print(f"  图片位置：{record['image_locations'] or '未找到'}")
        self.attempts.append(record)
        return images

    def save_first(self, label: str, images: list[tuple[str, str, str]]) -> bytes | None:
        _, kind, value = images[0]
        if kind == "b64":
            raw = base64.b64decode(value.split(",", 1)[1] if value.startswith("data:") else value)
        else:
            if not value.startswith("https://"):
                print("  图片 URL 不是 HTTPS，跳过下载")
                return None
            raw = httpx.get(value, timeout=30, follow_redirects=False).content
        img = Image.open(io.BytesIO(raw))
        img.load()
        ext = "jpg" if img.format == "JPEG" else (img.format or "png").lower()
        path = OUT_DIR / f"{label}.{ext}"
        path.write_bytes(raw)
        print(f"  已保存 {path.relative_to(ROOT)}（{img.format} {img.width}×{img.height}，{len(raw) // 1024} KB）")
        return raw

    def text_to_image(self, label: str, prompt: str) -> bytes | None:
        variants = [
            ("responses", "/responses", {"model": self.model, "input": prompt}),
            ("responses_tool", "/responses",
             {"model": self.model, "input": prompt, "tools": [{"type": "image_generation"}]}),
            ("images_generations", "/images/generations",
             {"model": self.model, "prompt": prompt, "n": 1}),
        ]
        for name, endpoint, body in variants:
            images = self._send(f"{label}-{name}", endpoint, json_body=body)
            if images:
                return self.save_first(f"{label}-{name}", images)
        return None

    def edit(self, label: str, prompt: str, refs: list[bytes]) -> bytes | None:
        content: list[dict[str, Any]] = [{"type": "input_text", "text": prompt}]
        for i, raw in enumerate(refs, 1):
            tag = "person photo" if i == 1 else "garment: top"
            content.append({"type": "input_text", "text": f"Image {i}: {tag}"})
            content.append({"type": "input_image", "image_url": to_data_url(raw)})
        message = [{"role": "user", "content": content}]
        variants = [
            ("responses", {"model": self.model, "input": message}),
            ("responses_tool", {"model": self.model, "input": message,
                                "tools": [{"type": "image_generation"}]}),
        ]
        for name, body in variants:
            images = self._send(f"{label}-{name}", "/responses", json_body=body)
            if images:
                return self.save_first(f"{label}-{name}", images)
        files = [("image[]", (f"ref{i}.png", raw, "image/png")) for i, raw in enumerate(refs, 1)]
        images = self._send(f"{label}-images_edits", "/images/edits", files=files,
                            data={"model": self.model, "prompt": prompt})
        if images:
            return self.save_first(f"{label}-images_edits", images)
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="iWear M0 生图接口连通性验证")
    parser.add_argument("--text-only", action="store_true", help="只测文本生图")
    args = parser.parse_args()

    cfg = load_config()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    probe = Probe(cfg)
    print(f"Base URL：{probe.base}\n模型：{probe.model}")
    print("每次成功调用都可能计费。每种调用方式只试一次，拿到图片就停止。")

    report: dict[str, Any] = {
        "date": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "base_url": probe.base,
        "model": probe.model,
    }
    try:
        person = probe.text_to_image("t2i-person", PERSON_PROMPT)
        report["text_to_image_ok"] = person is not None
        if person is None:
            print("\n文本生图所有方式都失败，不继续测编辑。请把 data/m0/ 下的 *.response.json 发给开发者排查。")
        elif not args.text_only:
            garment = probe.text_to_image("t2i-garment", GARMENT_PROMPT)
            if garment is not None:
                edited = probe.edit("edit", EDIT_PROMPT, [person, garment])
                report["edit_ok"] = edited is not None
    finally:
        probe.client.close()

    report["total_calls"] = probe.calls
    report["attempts"] = probe.attempts
    text = probe.scrub(json.dumps(report, ensure_ascii=False, indent=2))
    (OUT_DIR / "report.json").write_text(text, encoding="utf-8")
    print(f"\n共发起 {probe.calls} 次请求。汇总已写入 {(OUT_DIR / 'report.json').relative_to(ROOT)}")
    return 0 if report.get("text_to_image_ok") else 1


if __name__ == "__main__":
    sys.exit(main())
