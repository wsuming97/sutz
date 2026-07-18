# 服务器监控面板

基于 [Komari](https://github.com/komari-monitor/komari)（Go 后端）+ [Komari-Next](https://github.com/tonyliuzj/komari-next)（Next.js 前端主题）二次开发的服务器监控面板。

> 前端（本仓库）负责展示面板和主题系统，后端位于 `monitor-backend/` 目录。

## 功能特性

### 监控核心
- 📊 实时服务器状态仪表盘（CPU、内存、磁盘、网络流量）
- 📈 历史负载与延迟图表（基于 Recharts）
- 🌍 节点地图视图（GeoIP 定位）
- 🔔 离线/负载/流量告警通知
- 🔐 登录认证（含 2FA 双因素认证）
- 🔑 OAuth 第三方登录（GitHub / OIDC）
- 💻 一键部署 Agent 命令生成（支持 Linux / Windows / macOS）

### 主题与个性化
- 🎨 **6 种配色主题**：Default、Ocean、Sunset、Forest、Midnight、Rose
- 📐 **5 种卡片布局**：Classic、Modern、Minimal、Detailed、Compact
- 📊 **4 种图表样式**：Circle、Progress Bar、Bar Chart、Minimal
- 🌓 **深色/浅色模式**：支持手动切换或跟随系统
- 🖼️ **自定义背景图片**：支持 URL 设置背景，可调节模糊度与蒙版不透明度
- 💎 **毛玻璃效果**：卡片和背景均支持 Soft / Glass 两种模糊模式，可拖拽调节透明度
- 📱 **响应式设计**：适配桌面和移动设备
- 🔄 **卡片/列表视图切换**：Grid 与 Table 两种节点展示方式

### 多语言
- 🌐 内置 English、简体中文、繁体中文
- 支持浏览器自动检测语言或手动切换

## 技术栈

| 组件 | 技术 |
|------|------|
| **前端框架** | Next.js 16 (App Router, 静态导出) |
| **语言** | TypeScript, React 19 |
| **UI 组件** | shadcn/ui + Radix UI |
| **样式** | Tailwind CSS v4 (OKLCH 色彩空间) |
| **图表** | Recharts |
| **国际化** | react-i18next |
| **后端** | Go 1.24+ (Gin + GORM + SQLite) |
| **通信协议** | WebSocket + HTTP REST + JSON-RPC2 |

## 项目结构

```
xiangfa/
├── monitor/              # 前端（本仓库）
│   ├── src/
│   │   ├── app/          # Next.js App Router 页面
│   │   ├── components/   # UI 组件（Node、ThemeSwitcher、admin 等）
│   │   ├── contexts/     # 状态管理（主题、实时数据、账户等）
│   │   ├── hooks/        # 自定义 Hook
│   │   ├── i18n/         # 多语言资源文件
│   │   └── global.css    # 全局样式（含 6 套主题的 CSS 变量）
│   ├── komari-theme.json # 主题配置元数据
│   ├── next.config.ts    # Next.js 配置（静态导出 + API 代理）
│   └── .env.local        # 后端 API 地址配置
│
└── monitor-backend/      # 后端
    ├── cmd/              # 启动入口
    ├── web/              # HTTP 路由、WebSocket、RPC
    ├── database/         # 数据模型与存储
    ├── protocol/         # Agent 通信协议 (Protobuf)
    ├── utils/            # 工具（GeoIP、通知、Cloudflared）
    ├── Dockerfile        # 多阶段构建（含 CGO/SQLite 支持）
    └── docker-compose.yml
```

## 快速开始

### 方式一：Docker 一键部署（推荐）

将 `monitor-backend/` 上传至你的 Linux VPS，然后执行：

```bash
cd monitor-backend
docker compose up -d --build
```

启动后访问 `http://你的服务器IP:25774`，首次启动会自动创建管理员账号（在终端日志中查看）。

### 方式二：本地开发

#### 前提条件
- **Node.js** 22+
- **Go** 1.24+（后端编译需要 CGO 和 GCC）

#### 1. 配置前端 API 目标

在前端目录创建 `.env.local`：

```env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
```

#### 2. 安装依赖并启动前端

```bash
cd monitor
npm install
npm run dev
```

打开 `http://localhost:3000` 查看前端面板。

> 开发模式下，Next.js 会将 `/api/*` 请求自动代理到 `NEXT_PUBLIC_API_TARGET` 指定的后端地址。

#### 3. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可作为 Komari 主题包上传，也可直接嵌入后端的 `web/public/defaultTheme/dist/` 目录后一起编译。

## 部署说明

### Docker Compose 配置

```yaml
services:
  monitor:
    build: .
    container_name: server-monitor
    restart: always
    ports:
      - "25774:25774"
    volumes:
      - ./data:/app/data
    environment:
      - GIN_MODE=release
      - KOMARI_LISTEN=0.0.0.0:25774
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `KOMARI_LISTEN` | `0.0.0.0:25774` | 监听地址 |
| `KOMARI_DB_TYPE` | `sqlite` | 数据库类型 |
| `KOMARI_DB_FILE` | `/app/data/monitor.db` | SQLite 数据库路径 |
| `GIN_MODE` | `release` | Gin 运行模式 |

### Nginx 反向代理参考

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://127.0.0.1:25774;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

> **注意**：WebSocket 连接需要 `Upgrade` 和 `Connection` 头部，务必添加以支持实时数据推送。

### 性能优化建议

- 启用 Gzip 压缩以加速静态资源加载
- 使用 `fail2ban` 监控 Nginx 日志防止恶意扫描
- 建议配合 CDN（Cloudflare / EdgeOne）使用

## 已移除的模块

出于安全与精简考虑，以下原版模块已被剔除：

| 模块 | 原功能 | 移除原因 |
|------|--------|----------|
| `web/api/terminal/` | 远程终端 (WebSSH) | 安全风险高，容易被滥用 |
| `web/nezha/` | 哪吒探针兼容 | 不需要兼容哪吒协议 |

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 构建静态站点到 `dist/` |
| `npm run lint` | ESLint 代码检查 |
| `npm run i18n:sync` | 同步 Crowdin 多语言翻译 |

## 致谢

本项目基于以下开源项目二次开发，遵循 MIT 许可证：

- [komari-monitor/komari](https://github.com/komari-monitor/komari) — Go 后端探针服务
- [tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next) — Next.js 前端主题
- [piphase/komari-nexus](https://github.com/piphase/komari-nexus)
- [fanchengliu/komari-next-pro](https://github.com/fanchengliu/komari-next-pro)

## 许可证

MIT License — 允许商用，需保留原始版权声明。
