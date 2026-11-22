# iWear

把衣柜搬进手机：AI 识别录入衣物、AI 试穿预览、AI 搭配师。

需求文档：[`iwear-prd.md`](iwear-prd.md)（V1.2，开发以该文档为准）。

## 当前进度

| 里程碑 | 状态 |
| --- | --- |
| M0 生图接口连通性验证 | ✅ 完成（结论见 PRD 附录 A：`/responses` 不可用，改用 `/images/generations` 与 `/images/edits`） |
| M1 工程骨架 | ✅ 登录、四标签导航、双主题、用户资料、注销 |
| M2 衣橱 | ⏳ 下一步 |
| M3 形象照与试穿 | ⏳ |
| M4 搭配师 | ⏳ |
| M5 收尾 | ⏳ |

## 技术栈

- 客户端：Expo SDK 58、React Native 0.88、React 19.3、TypeScript、Expo Router、expo-image、lucide-react-native
- 服务端：Python 3.12、FastAPI、Pydantic v2、aiosqlite（手写参数化 SQL）
- 数据库：SQLite（WAL 模式）

## 目录

```text
backend/         FastAPI 服务
  app/           业务代码（auth、user、files、images、db、config）
  scripts/       check_config.py、m0_probe.py
  tests/         unittest（AI 调用全部 mock）
mobile/          Expo 客户端
  src/app/       Expo Router 页面
  src/components/  通用组件（AuthImage、ui）
  src/lib/       api、store、theme、storage
design-system/   ui-ux-pro-max 生成的设计系统与双主题规范
tools/           CDP 截图与端到端脚本
deploy/          部署配置
docs/            用户协议、隐私政策（待审定）
```

## 本地运行

### 后端

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && chmod 600 .env   # 用编辑器填写密钥，不要写进命令行
python scripts/check_config.py            # 只输出"已配置/未配置"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

开发模式验证码固定为 `123456`，不发送短信。

### 客户端

```bash
cd mobile
cp .env.example .env     # 只改 EXPO_PUBLIC_API_URL
npm install
npx expo start           # 手机用 Expo Go 扫码；按 w 打开浏览器版
```

手机与电脑需在同一局域网，`EXPO_PUBLIC_API_URL` 填电脑的局域网 IP，例如
`http://192.168.1.10:8000`。

### 浏览器版

浏览器版跨域需要后端设置 `IWEAR_CORS_ORIGINS`。开发时可用：

```bash
IWEAR_CORS_ORIGINS=http://localhost:8081 uvicorn app.main:app --port 8000
```

生产环境该变量必须是 HTTPS 来源。

## 测试

```bash
cd backend && python -m unittest discover -s tests -v
cd mobile && npx tsc --noEmit && npx expo lint
```

## 设计规范

两套可切换主题（素雅 / 玫瑰）的 token 在 `mobile/src/lib/theme.ts`，
设计系统说明在 `design-system/iwear/MASTER.md`。组件只通过 `useTheme()` 取色。

## 密钥

- 所有密钥只放 `backend/.env`（权限 600），已列入 `.gitignore`。
- 不要把密钥写进代码、文档、日志或前端环境变量。
- `backend/app/images.py` 存储的图片只能经 `GET /api/files/{文件名}` 鉴权访问。
