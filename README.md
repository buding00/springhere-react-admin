# SpringHere React Admin

本仓库是普通、可独立运行的 React 管理端，对接 SpringHere Gin Server。不加入模板占位、CLI、RBAC 或动态菜单。后续若模板化，以这套经过真实联调验证的源码为基础。

界面使用 Ant Design 承载表单/表格/菜单，布局由 Tailwind CSS 提供。HTTP 使用 Axios，认证状态使用 Zustand，服务端缓存使用 TanStack Query。

## 建设原则

建议分两次交付：

1. 先完成不依赖后端契约的应用壳、路由、布局和质量基线。
2. 后端阶段 1 完成后，再完成生成 Client 和真实认证联调。

当前仓库已进入第 2 步：应用壳可独立运行，认证按真实契约接入，OpenAPI Client 由本仓库冻结的契约快照生成。

方案原文中的 `GET /api/v1/users/me` 已被后端冻结契约替换为 `GET /api/v1/auth/me`。本仓库以后者为准。

## 范围

### 做

- 登录、Dashboard、403、404，以及对接真实 `/api/v1/users` 的用户管理页。
- 登录后布局：侧栏、顶部用户菜单、内容区。第一版菜单固定为控制台；管理员额外看到用户管理入口。这是静态菜单 + 角色字段，不是 RBAC / 动态菜单。
- Access Token 只保存在内存；Refresh Token 只走 HttpOnly Cookie。
- 启动时 `POST /api/v1/auth/refresh`，成功后再 `GET /api/v1/auth/me`。
- 仅在明确的 `401 UNAUTHORIZED` 时单飞刷新并重试；刷新失败清空状态并跳转登录。
- 统一映射 401 / 403 / 429 / 500 / 网络异常。
- 请求响应类型写在 `src/api/types/`，接口方法写在 `src/api/*.ts`。

### 明确不做

- 模板占位符、SpringHere CLI、项目脚手架
- RBAC / Casbin / 动态菜单
- 多租户、主题市场、低代码、微前端
- 把 Access Token 写入 `localStorage` 或 `sessionStorage`

## 目录

```text
springhere-react-admin/
├── api/openapi/openapi.yaml          # 当前冻结的 API 契约快照
├── src/
│   ├── api/                          # 接口封装；client 为基础 Axios，types 为请求响应类型
│   ├── layout/                       # 应用壳、菜单
│   ├── locales/                      # 中英文文案
│   ├── router/                       # 路由与守卫
│   ├── store/                        # 登录态、语言等前端状态
│   ├── pages/                        # login / dashboard / forbidden / not-found / users
│   ├── components/                   # 公共组件
│   └── main.tsx
├── tests/                            # 认证状态机、单飞 refresh、路由保护、错误映射
├── integration/fullstack/
│   └── compatibility.yaml            # 对应后端 commit 与 OpenAPI hash
└── .github/workflows/ci.yaml
```

## 本地启动

```bash
cp .env.example .env
pnpm install
pnpm dev
```

浏览器请求始终使用 `/api`。Vite 将其代理到 `VITE_API_PROXY_TARGET` 或 `API_PROXY_TARGET`，默认 `http://localhost:8080`，以保持同源 Cookie。环境变量只放非敏感后端地址。

后端可按相邻仓库启动：

```bash
# ../springhere-gin-server
docker compose -f deployments/docker-compose.yaml up -d postgres redis
go run ./cmd/migrate -dsn 'postgres://springhere:springhere@localhost:5432/springhere?sslmode=disable' -action up
go run ./cmd/server -config application.yaml
```

## 认证流程

- 登录成功后，Access Token 保存在 Zustand 内存中；Axios 请求拦截器自动加 `Authorization: Bearer <token>`。
- Refresh Token 由后端写入 HttpOnly Cookie，前端不读取、不落盘。
- 应用启动时请求 `/api/v1/auth/refresh`（浏览器自动带 Cookie），成功后拉取 `/api/v1/auth/me`。
- 只有受保护接口明确返回 `401 UNAUTHORIZED` 时才单飞刷新并重试一次。`INVALID_CREDENTIALS`、`403`、`429`、`5xx` 不会触发刷新。
- 多个并发 401 合并为一次 refresh。刷新失败则清空 Access Token、用户信息和查询缓存，并跳转登录页。

## API 封装

请求响应类型写在 `src/api/types/`，按模块拆分。Axios 基础设置、进度条和全局错误提示在 `src/api/client/`。业务接口方法在 `src/api/*.ts`。

后端返回 `code !== 0` 或 `success === false` 时，拦截器会用 Ant Design `message` 弹出全局错误；登录、验证码和 refresh 由页面自己处理，不重复提示。

## 质量与验收

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

单元测试覆盖：

- 认证状态机（登录、恢复、退出、过期清理）
- 单飞 refresh 与「非 token 错误不刷新」
- 路由保护（未登录、加载中、管理员）
- 401 / 403 / 429 / 500 / 网络错误映射

真实服务联调（后端就绪后）应覆盖：登录、刷新、`/auth/me`、退出、token 过期自动续期、限流。对应后端记录见 `integration/fullstack/compatibility.yaml`。

## 对照方案

| 方案项 | 状态 |
|---|---|
| pnpm、lockfile、lint / typecheck / test / build | 已完成 |
| React Router、TanStack Query、Vitest、Ant Design | 已完成 |
| 目录 `api/` `layout/` `locales/` `router/` `store/` `pages/` `components/` | 已完成 |
| 登录、Dashboard、403、404 与登录后布局 | 已完成 |
| 第一版菜单固定 Dashboard，不实现 RBAC | 已完成；用户管理是静态入口，仅按 `role` 显示 |
| 加载、空态、401/403/429/500/网络异常统一展示 | 已完成 |
| Access Token 仅内存；启动 refresh + `/auth/me` | 已完成 |
| Bearer、单飞 refresh、失败跳转登录 | 已完成 |
| `src/api/types` + `src/api/client` 手写接口封装 | 已完成 |
| Vite `/api` 代理与非敏感环境变量 | 已完成 |
| 认证状态机 / refresh / 路由 / 错误映射测试 | 已完成 |
| 用真实 Gin 服务做浏览器联调 | 待后端环境联调 |
| 固定后端 tag | 当前后端无发布 tag，已记录 commit `45d3ad0` |
