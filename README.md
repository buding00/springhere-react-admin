# SpringHere React Admin

SpringHere 的管理端，对接 SpringHere Gin Server。提供登录、控制台和用户管理，可独立运行。

界面用 Ant Design 做表单、表格和布局控件，用 Tailwind CSS 做页面结构。请求走 Axios，登录态放在 Zustand，列表数据由 TanStack
Query 缓存。

## 功能

- 邮箱 + 密码 + 图形验证码登录，点击验证码即可刷新
- 启动时用 HttpOnly Refresh Cookie 恢复会话，Access Token 只放在内存里
- 控制台首页；管理员可进入用户管理
- 用户列表：邮箱 / 角色 / 启停筛选，创建、编辑、启用或禁用、踢下线、删除
- 列表和详情展示真实在线状态（有未过期登录会话即为在线）
- 中文 / English，浅色 / 深色主题，选择会记住

普通用户只能使用控制台。用户管理入口按角色静态显示，不是动态 RBAC 菜单。

## 技术栈

| 类别 | 选用                                |
|----|-----------------------------------|
| 运行 | React 19、Vite 8、TypeScript 6、pnpm |
| 界面 | Ant Design 6、Tailwind CSS 4       |
| 数据 | Axios、TanStack Query、Zustand      |
| 路由 | React Router 7                    |
| 质量 | Vitest、oxlint                     |

## 快速开始

需要 **Node.js 22+** 和 **pnpm**。后端默认跑在 `http://localhost:8080`。

```bash
cp .env.example .env
pnpm install
pnpm dev
```

浏览器打开提示的本地地址。页面请求一律走同源 `/api`，由 Vite 代理到 `VITE_API_PROXY_TARGET` 或 `API_PROXY_TARGET`（默认
`http://localhost:8080`），这样 Refresh Cookie 能带上。环境变量只放后端地址，不要放密钥。

后端可按相邻仓库启动，例如：

```bash
# ../springhere-gin-server
docker compose -f deployments/docker-compose.yaml up -d postgres redis
go run ./cmd/migrate -dsn 'postgres://springhere:springhere@localhost:5432/springhere?sslmode=disable' -action up
go run ./cmd/server -config application.yaml
```

使用后端里已有的管理账户登录。

## 认证

1. 进入登录页会先拉 `/api/v1/auth/captcha`，提交时带上验证码。
2. 登录成功后，Access Token 只存在内存；Axios 自动加 `Authorization: Bearer <token>`。
3. Refresh Token 由后端写成 HttpOnly Cookie，前端不读、不存。
4. 再次打开应用时先 `POST /api/v1/auth/refresh`，成功再 `GET /api/v1/auth/me`。
5. 受保护接口返回 `401 UNAUTHORIZED` 时，会合并成一次刷新并重试。账号密码错误、验证码错误、`403`、`429`、`5xx` 不会触发刷新。
6. 刷新失败会清空本地状态，跳转登录，并用全局 Message 提示会话已失效。

不要把 Access Token 写进 `localStorage` 或 `sessionStorage`。

## 接口约定

请求、响应类型在 `src/api/types/`，按模块拆分。Axios 实例、进度条和全局错误提示在 `src/api/client/`。业务方法在
`src/api/auth.ts`、`src/api/users.ts`。

后端包一层 `{ code, message, success, data, reason? }`。`code !== 0` 或 `success === false` 时，拦截器会弹出 Ant Design
Message。登录、验证码和 refresh 由页面自己处理，避免重复提示。

## 目录

```text
src/
├── api/            # Axios 客户端、类型、auth / users 接口
├── components/     # 公共组件（语言、主题、错误面板等）
├── layout/         # 登录后侧栏和顶栏
├── locales/        # 中英文文案
├── pages/          # login / dashboard / users / 403 / 404
├── router/         # 路由、守卫、菜单
├── store/          # 登录态、语言、主题
└── utils/
```

路径别名 `@/` 指向 `src/`。

## 脚本

```bash
pnpm dev         # 本地开发
pnpm build       # 类型检查并打包
pnpm preview     # 预览生产构建
pnpm typecheck   # TypeScript
pnpm lint        # oxlint
pnpm test        # Vitest
```
