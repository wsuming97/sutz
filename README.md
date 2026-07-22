# 服务器监控面板

[![GitHub Release](https://img.shields.io/github/v/release/wsuming97/sutz?style=flat-square)](https://github.com/wsuming97/sutz/releases)
[![License](https://img.shields.io/github/license/wsuming97/sutz?style=flat-square)](LICENSE)

基于 [Komari](https://github.com/komari-monitor/komari)（Go 后端）+ [Komari-Next](https://github.com/tonyliuzj/komari-next)（Next.js 前端主题）二次开发的服务器监控面板。

## 功能特性

- 📊 实时服务器状态仪表盘（CPU、内存、磁盘、网络流量）
- 📈 历史负载与延迟图表（平滑曲线）
- 🔍 TCP / ICMP / HTTP 多协议延迟监测
- 💰 计费管理（到期时间 / 价格 / 货币 / 计费周期 / 自动续费）
- 🌍 节点地图视图（GeoIP 定位）
- 🔔 离线/负载/流量告警通知（Telegram / Bark / 邮件 / Webhook）
- 🔐 登录认证（含 2FA 双因素认证）
- 🔑 OAuth 第三方登录（GitHub / OIDC / QQ / Cloudflare）
- 💻 一键部署 Agent 命令生成（支持 Linux / Windows / macOS）
- 🎨 6 种配色主题 + 5 种卡片布局 + 4 种图表样式
- 🌓 深色/浅色模式
- 🌐 多语言（English / 简体中文 / 日本語）
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
| **容器化** | Docker 三阶段构建 |

## 快速部署

### Docker 一键部署（推荐）

```bash
git clone https://github.com/wsuming97/sutz.git
cd sutz
```

启动：

```bash
docker compose up -d --build
```

> 首次构建需要下载 Node.js 和 Go 依赖，大约需要 3-5 分钟。后续构建有 Docker 缓存会很快。

启动后访问 `http://你的服务器IP:25774`，**首次访问会自动显示初始化设置页面**，在浏览器中设置管理员账号和密码即可。

### 管理员账号说明

| 方式 | 说明 |
|------|------|
| **Web 端初始化（推荐）** | 首次访问面板时自动显示设置页面，在浏览器中输入用户名和密码 |
| 环境变量 | 在 `docker-compose.yml` 中设置 `ADMIN_USERNAME` + `ADMIN_PASSWORD` |

> ⚠️ 管理员账号仅在数据库中无用户时创建（首次启动），后续修改环境变量不会覆盖已有账号。

### Agent 安装

在管理后台添加节点后，系统会生成一键安装命令。在被监控的服务器上执行即可：

```bash
# Linux（示例，实际命令从管理后台复制）
curl -fsSL http://你的面板地址:25774/install.sh | bash -s -- --token YOUR_TOKEN
```

支持 Linux / Windows / macOS，支持 systemd / OpenRC 等多种 init 系统。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ADMIN_USERNAME` | `admin` | 初始管理员用户名 |
| `ADMIN_PASSWORD` | （随机） | 初始管理员密码 |
| `KOMARI_LISTEN` | `0.0.0.0:25774` | 监听地址 |
| `KOMARI_DB_TYPE` | `sqlite` | 数据库类型 |
| `KOMARI_DB_FILE` | `/app/data/monitor.db` | SQLite 路径 |
| `GIN_MODE` | `release` | Gin 运行模式 |
| `KOMARI_CLOUDFLARED_TOKEN` | （空） | Cloudflare Tunnel Token |

### 反向代理（可选）

使用 Nginx 反向代理并启用 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name monitor.example.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:25774;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 卸载 / 删除

### 删除主控（服务端）

```bash
# 1. 停止并删除容器
docker compose down

# 2. 删除数据（数据库、配置等）
rm -rf ./data

# 3. 删除 Docker 镜像（可选）
docker rmi $(docker images -q server-monitor*)

# 4. 删除项目源码（可选）
cd .. && rm -rf sutz
```

### 删除被控机（Agent）

**方式一：使用安装脚本的卸载功能（推荐）**

```bash
# 在被控机上运行安装脚本，选择菜单中的「卸载」选项
curl -fsSL http://你的面板地址:25774/install.sh | bash
# 然后选择 3) 卸载
```

**方式二：手动卸载（Linux systemd）**

```bash
# 1. 停止并禁用服务
systemctl stop komari
systemctl disable komari

# 2. 删除服务文件
rm -f /etc/systemd/system/komari.service
systemctl daemon-reload

# 3. 删除 Agent 二进制文件
rm -f /opt/komari/komari

# 4. 删除数据目录（可选，保留则保留历史数据）
rm -rf /opt/komari
```

**方式三：手动卸载（Windows）**

```powershell
# 1. 停止并删除服务
sc stop komari
sc delete komari

# 2. 删除 Agent 文件
Remove-Item -Recurse -Force "C:\Program Files\komari"
```

> 💡 卸载 Agent 后，记得在管理后台删除对应节点（节点列表 → 操作 → 删除）。

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
│   │   ├── utils/         # 工具函数（日期、复制、单位格式化）
│   │   └── global.css     # 全局样式（含 6 套主题变量）
│   ├── komari-theme.json  # 主题配置
│   └── package.json
│
├── cmd/                   # 后端启动入口
├── web/                   # HTTP 路由、WebSocket、RPC、静态资源
│   └── rpc/jsonrpc/       # JSON-RPC2 方法（admin/common 命名空间）
├── database/              # 数据模型与存储
│   ├── clients/           # 节点管理（SaveClient / SaveClientInfo）
│   └── models/            # ORM 模型（含 LocalTime 自定义类型）
├── protocol/              # Agent 通信协议 (Protobuf v1/v2)
├── utils/                 # GeoIP、通知、Cloudflare Tunnel
├── Dockerfile             # 三阶段构建（前端+后端+运行时）
└── docker-compose.yml     # 一键部署
```

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
| `/api/admin/ping/*` | * | Ping/TCP/HTTP 延迟任务管理 |
| `/api/rpc2` | GET/POST | JSON-RPC2 直连入口 |

## 更新日志

### v1.0.0（2026-07-22）

**功能**
- 服务器资源实时监控（CPU / RAM / Disk / 网络）
- 多节点管理与 WebSocket 实时推送
- TCP / ICMP / HTTP 延迟监测与平滑曲线图表
- 计费管理（到期时间 / 价格 / 货币 / 自动续费）
- 管理后台（节点管理 / 操作日志 / Ping 任务 / 系统设置）
- Docker 三阶段构建一键部署
- 用户自定义管理员账号密码
- 多语言支持（中 / 英 / 日）

**修复**
- 到期时间保存后显示"长期"的问题
- 手动输入到期日期无法保存
- 延迟图表曲线平滑化（linear → monotone）
- 仪表盘网络速率显示精度不足
- 日期解析 NaN / 复制功能 HTTP 兼容性
- 分页逻辑与国际化完善

## 致谢

- 后端基于 [komari-monitor/komari](https://github.com/komari-monitor/komari)，MIT 许可证
- 前端主题基于 [tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next)，MIT 许可证
