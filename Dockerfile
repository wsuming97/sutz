# ============================================================
# 三阶段构建：前端 → 后端 → 运行时
# 一条 docker compose up --build 即可完成全部构建与部署
# ============================================================

# ---- Stage 1: 构建前端 ----
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

# 先拷贝依赖清单，利用 Docker 缓存层
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild

# 拷贝前端源码并构建静态产物
COPY frontend/ .
RUN npm run build

# ---- Stage 2: 构建后端 ----
FROM golang:1.24-alpine AS backend-builder

WORKDIR /src

# 安装 CGO 编译依赖（SQLite 需要 C 编译器）
RUN apk add --no-cache build-base git

# 先拷贝依赖清单，利用 Docker 缓存层
COPY go.mod go.sum ./
RUN go mod download

# 拷贝后端源码
COPY . .

# 将前端构建产物嵌入后端静态资源目录
COPY --from=frontend-builder /frontend/dist ./web/public/defaultTheme/dist/
COPY --from=frontend-builder /frontend/komari-theme.json ./web/public/defaultTheme/theme.json

# 编译后端二进制（启用 CGO 支持 SQLite）
ENV CGO_ENABLED=1
RUN go build -ldflags "-s -w" -o monitor-server .

# ---- Stage 3: 最小运行时镜像 ----
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates curl tzdata

# 下载 cloudflared 客户端（按架构自动选择）
RUN set -eux; \
    apk_arch="$(apk --print-arch)"; \
    case "${apk_arch}" in \
      x86_64) cloudflared_arch="amd64" ;; \
      x86) cloudflared_arch="386" ;; \
      aarch64) cloudflared_arch="arm64" ;; \
      armhf) cloudflared_arch="arm" ;; \
      *) echo "Unsupported arch: ${apk_arch}" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cloudflared_arch}" -o /usr/local/bin/cloudflared; \
    chmod +x /usr/local/bin/cloudflared

# 拷贝编译好的后端二进制
COPY --from=backend-builder /src/monitor-server /app/monitor-server

ENV GIN_MODE=release
ENV KOMARI_DB_TYPE=sqlite
ENV KOMARI_DB_FILE=/app/data/monitor.db
ENV KOMARI_LISTEN=0.0.0.0:25774

EXPOSE 25774

CMD ["/app/monitor-server", "server"]
