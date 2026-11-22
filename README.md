# iWear

AI 智能衣橱与试穿应用：拍照录入衣物、生成试穿效果、与 AI 搭配师对话。

> 当前处于工程骨架阶段，业务代码尚未提交。目录结构、接口定义与功能细节在开发过程中逐步补齐。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 客户端 | Expo（React Native）+ TypeScript + Expo Router |
| 服务端 | Python 3.11+ / FastAPI / Uvicorn / Pydantic v2 |
| 数据库 | SQLite（`aiosqlite`，手写参数化 SQL，不使用 ORM） |
| 外部服务 | 生图、视觉识别、对话三类 AI 接口；生产环境短信验证码 |
| 部署 | Caddy（HTTPS 反向代理）+ systemd |

## 目录结构

```text
.
├── mobile/          # Expo 客户端（待补充）
├── backend/
│   ├── app/         # FastAPI 应用
│   ├── scripts/     # 配置检查、接口连通性探测
│   ├── tests/
│   ├── .env.example # 环境变量模板，只有变量名
│   └── requirements.txt
├── docs/            # 用户协议、隐私政策
├── deploy/
└── .gitignore
```

## 本地运行

后端：

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 用编辑器填入密钥，不要写进命令行历史
python scripts/check_config.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

客户端（待补充）：

```bash
cd mobile
npm install && npm start
```

## 配置与密钥

- 所有密钥只放在 `backend/.env`，该文件已被 `.gitignore` 忽略，权限建议 `chmod 600`。
- `backend/.env.example` 只保留变量名，不包含任何值。
- `backend/scripts/check_config.py` 只输出变量「已配置 / 未配置」，不会打印值，可安全用于排查。
- 请不要在 issue、PR 或截图中粘贴任何真实密钥。

## 接口探测

`backend/scripts/m0_probe.py` 用于验证生图接口连通性，仅读取 `backend/.env` 中的 `IWEAR_IMAGE_*`，不打印密钥，测试图全部由脚本自行生成、不使用真人照片。产物写入 `backend/data/`（已忽略）。

## 许可证

[MIT](LICENSE)
