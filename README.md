# 服务器监控面板

基于 [Komari](https://github.com/komari-monitor/komari)（Go 后端）+ [Komari-Next](https://github.com/tonyliuzj/komari-next)（Next.js 前端主题）二次开发的服务器监控面板。

## 功能特性

- 📊 实时服务器状态仪表盘（CPU、内存、磁盘、网络流量）
- 📈 历史负载与延迟图表
- 🌍 节点地图视图（GeoIP 定位）
- 🔔 离线/负载/流量告警通知（Telegram / Bark / 邮件 / Webhook）
- 🔐 登录认证（含 2FA 双因素认证）
- 🔑 OAuth 第三方登录（GitHub / OIDC / QQ / Cloudflare）
- 💻 一键部署 Agent 命令生成（支持 Linux / Windows / macOS）
- 🎨 6 种配色主题 + 5 种卡片布局 + 4 种图表样式
- 🌓 深色/浅色模式
- 🌐 多语言（English / 简体中文 / 繁体中文）
- 📱 响应式设计，适配桌面和移动设备

## 技术栈

| 组件 | 技术 |
|------|------|
| **前端框架** | Next.js 16 (App Router, 静态导出) |
| **语言** | TypeScript + React 19 / Go 1.24+ |
| **UI 组件** | shadcn/ui + Radix UI |
| **样式** | Tailwind CSS v4 |
| **图表** | Recharts |
| **国际化** | react-i18next |
| **后端框架** | Gin + GORM + SQLite |
| **通信协议** | WebSocket + HTTP REST + JSON-RPC2 |

## 项目结构

```
server-monitor/
├── frontend/              # 前端（Next.js）
│   ├── src/
│   │   ├── app/           # Next.js App Router 页面
│   │   ├── components/    # UI 组件
│   │   ├── contexts/      # 状态管理
│   │   ├── hooks/         # 自定义 Hook
│   │   ├── i18n/          # 多语言资源
│   │   └── global.css     # 全局样式（含 6 套主题变量）
│   ├── komari-theme.json  # 主题配置
│   └── package.json
│
├── cmd/                   # 后端启动入口
├── web/                   # HTTP 路由、WebSocket、RPC、静态资源
├── database/              # 数据模型与存储
├── protocol/              # Agent 通信协议 (Protobuf v1/v2)
├── utils/                 # GeoIP、通知、Cloudflare Tunnel
├── Dockerfile             # 三阶段构建（前端+后端+运行时）
└── docker-compose.yml     # 一键部署
```

## 快速部署

### Docker 一键部署（推荐）

将本仓库克隆到 Linux VPS，然后执行：

```bash
git clone https://github.com/wsuming97/sutz.git
cd sutz
docker compose up -d --build
```

> 首次构建需要下载 Node.js 和 Go 依赖，大约需要 3-5 分钟。后续构建有 Docker 缓存会很快。

启动后访问 `http://你的服务器IP:25774`（请替换为你的实际 IP）。

首次启动自动创建管理员账号，在日志中查看：

```bash
docker logs server-monitor
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `KOMARI_LISTEN` | `0.0.0.0:25774` | 监听地址 |
| `KOMARI_DB_TYPE` | `sqlite` | 数据库类型 |
| `KOMARI_DB_FILE` | `/app/data/monitor.db` | SQLite 路径 |
| `GIN_MODE` | `release` | Gin 运行模式 |
| `KOMARI_CLOUDFLARED_TOKEN` | （空） | Cloudflare Tunnel Token |

## 本地开发

### 前提条件

- **Node.js** 22+
- **Go** 1.24+（需要 CGO 和 GCC）

### 1. 启动后端

```bash
# 编译并运行
CGO_ENABLED=1 go build -o monitor-server .
./monitor-server server
```

### 2. 启动前端开发服务器

```bash
cd frontend

# 配置 API 代理目标
echo "NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774" > .env.local

# 安装依赖并启动
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:3000`，API 请求会自动代理到后端。

## API 端点概览

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/login` | POST | 用户登录 |
| `/api/logout` | GET | 注销 |
| `/api/clients` | GET (WS) | WebSocket 实时节点列表 |
| `/api/nodes` | GET | 获取节点信息 |
| `/api/recent/:uuid` | GET | 获取节点最近记录 |
| `/api/clients/register` | POST | Agent 注册 |
| `/api/clients/report` | GET/POST | Agent 数据上报 |
| `/api/admin/client/*` | * | 节点管理（增删改查排序） |
| `/api/admin/settings/*` | * | 系统设置 |
| `/api/admin/theme/*` | * | 主题管理 |
| `/api/rpc2` | GET/POST | JSON-RPC2 直连入口 |

## 致谢

- 后端基于 [komari-monitor/komari](https://github.com/komari-monitor/komari)，MIT 许可证
- 前端主题基于 [tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next)，MIT 许可证
