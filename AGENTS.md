# AGENTS.md

给在本仓库上改代码的模型用。先读这一份，再改文件。对外介绍见 `README.md`。

## 项目是什么

SpringHere React Admin：对接 SpringHere Gin Server 的管理端。登录、控制台、用户管理。不是模板生成器，没有动态 RBAC / 动态菜单。

菜单按 `role` 静态过滤：`admin` 能进用户管理，`user` 只能用控制台。

## 技术栈

| 用途 | 选用 |
| --- | --- |
| 运行 | React 19、Vite 8、TypeScript ~6、pnpm、Node 22+ |
| UI | Ant Design 6、`@ant-design/icons`、Tailwind CSS 4 |
| 数据 | Axios、TanStack Query 5、Zustand 5 |
| 路由 | React Router 7 |
| 质量 | oxlint、Vitest、`pnpm typecheck` |

路径别名 `@/` → `src/`。跨目录导入一律 `@/xxx`，并带上扩展名（`.ts` / `.tsx`）。不要用跨文件夹相对路径。

## 目录

```text
src/
├── api/            # 请求：client、types、按模块的接口文件
├── components/     # 跨页面公共组件（尽量少）
├── config/         # 品牌名、登录文案、页脚等站点配置
├── layout/         # 登录后壳子，只放 tsx
├── locales/        # zh-CN / en-US
├── pages/          # 按路由一页一个目录
├── router/         # 路由表、守卫、导航
├── store/          # 纯 ts 状态，不要放 tsx
└── utils/
```

`layout/` 不要出现 `.ts` 菜单文件。导航项写在 `src/router/nav.tsx`，`AppShell` 从那里读。

## 硬约束

- Access Token 只放内存（Zustand）。不要写入 `localStorage` / `sessionStorage`。
- Refresh Token 只走 HttpOnly Cookie。前端不读、不存。
- 不要接回 OpenAPI 生成客户端。类型手写在 `src/api/types/`。
- 能用 Ant Design 现成组件就用现成的，不要为表格、表单、弹窗、抽屉、分页、消息另起一套。
- 用户可见文案走 i18n 或 `src/config`。不要在 JSX 里写死中文/英文（占位符等配置项除外）。
- 系统名称、标记、登录页说明、页脚只改 `src/config/index.ts`。
- 新增代码必须按现有规则补注释，不能只写实现不写说明。对照 `src/api/types/`、`src/api/*.ts`、`src/config/index.ts`。
- 提交前至少跑：`pnpm typecheck`、`pnpm lint`。改逻辑就加或改测试，跑 `pnpm test`。

## `src/api` 怎么放接口

### 分层

| 位置 | 放什么 |
| --- | --- |
| `src/api/client/` | Axios 实例、拦截器、进度条、全局错误 toast、`ApiError` |
| `src/api/types/` | 请求/响应类型。`common.ts` 放公共信封；`auth.ts`、`users.ts` 按模块 |
| `src/api/auth.ts`、`src/api/users.ts` | 业务方法。一个后端模块一个文件 |
| `src/api/queryClient.ts` | TanStack Query 的 client |

新模块：在 `types/` 加类型文件，在 `api/` 根加同名方法文件。不要把业务请求写进 `client/`，也不要在页面里直接 `axios.get`。

### 方法写法

拦截器已经解开统一信封 `{ code, message, success, data, reason? }`。成功时 `apiClient.get<T>` 的 `data` 就是业务数据 `T`。

```ts
/** 分页查询用户。本页 `online` 由 Redis 批量查询。 */
export async function listUsers(params: UserListParams) {
  const { data } = await apiClient.get<UserPage>('/api/v1/users', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      email: params.email,
    },
  })
  return data
}
```

- 每个导出函数上方写一句中文 JSDoc，说明做什么、有无副作用（例如踢下线不返回 `User`）。
- 类型字段也写 JSDoc，尤其是容易混的字段（如 `active` vs `online`）。
- 登录、验证码、refresh 需要 `skipErrorToast: true`（或走已有 silent 名单），错误由页面自己展示。其它接口失败走全局 `message`。
- `code !== 0` 或 `success === false` 由拦截器处理，页面不要再 toast 一遍。
- 路径跟后端走：`/api/v1/...`。查询参数名以后端为准（如 `page_size`）。

## `src/pages` 怎么写页面

- 一个路由一个目录：`src/pages/<name>/`。
- 页面主体：`XxxPage.tsx`，导出命名函数组件 `XxxPage`。
- 需要懒加载时加 `XxxRoute.tsx`，用 `lazy` + `Suspense` + `PageLoading`，路由表挂 Route 而不是 Page。
- 轻量页（控制台、403、404、登录）可以直接把 Page 挂到路由上。
- 数据用 TanStack Query / Mutation，不要在页面里自己堆一套缓存。
- 列表页用 Ant Design `Table`、`Form`、`Modal`、`Popconfirm`。筛选、分页、空态跟现有用户页对齐。
- 新页面的菜单：改 `src/router/nav.tsx`（key、文案 key、roles、图标），再改 `src/router/index.tsx` 和守卫。

## 组件

优先顺序：

1. Ant Design 6 已有组件（`Table`、`Form`、`Input`、`Select`、`Modal`、`Drawer`、`Message`、`Switch`、`Tag`、`Dropdown`、`Layout` 等）
2. 已有 `src/components/`（进度条、错误面板、语言/主题、加载）
3. 实在没有、且至少两处复用，再在 `components/` 新增

不要：

- 为了一个按钮或一张卡片新建组件文件
- 引入另一套 UI 库（shadcn、MUI 等）
- 手写一套 Message / Modal 替代 antd
- 把页面私有大块拆到 `components/`（留在对应 `pages/` 即可）

图标用 `@ant-design/icons`。布局壳在 `src/layout/`。样式：页面结构用 Tailwind；主题色、登录/侧栏等壳用 `src/index.css` 的 token（`--color-brand`、`--color-surface`、`--color-ink` 等）。主色是春水色 `#1a7a6d`，不要改回默认 Ant 蓝，除非产品要求。

## 注释

新增文件、新导出、新字段都要按现有代码补注释，不要留「没注释的新代码」。以 `src/api/types/users.ts`、`src/api/auth.ts`、`src/config/index.ts` 为准。

### 必须写

- 语言：中文。
- 形式：JSDoc `/** ... */`，一句说完。句末用句号。
- `src/api/types/`：每个 `export interface` / `export type` 上方一条；每个字段一行 `/** ... */`。容易混的字段写清区别和副作用。
- `src/api/*.ts`：每个导出的请求函数上方一条，说明做什么；必要时补返回值或副作用（如「不返回 `User`」「成功后 `online` 为 `false`」）。
- `src/config/index.ts`：配置对象和对外字段写清用在哪里。
- 新的 store、工具函数、导出类型：同样补 JSDoc。

```ts
/** 用户管理中的用户，比登录用户多了状态、在线和时间字段。 */
export interface User extends AuthUser {
  /** 账号是否启用，存在 PostgreSQL。禁用后不能登录，现有登录会立即失效。 */
  active: boolean
}

/** 踢用户下线。只清 Redis Session，不返回 `User`。 */
export async function kickUser(id: string) { ... }
```

### 不要写

- 「接下来实现了 xxx」「这里开始改」这类过程注释。
- 用注释占位未完成功能。
- 复述代码字面意思（如 `/** id */ id: string`，除非字段名会误导）。
- 英文注释（专有名词、路径、字段名可以夹在中文里）。
- 组件 JSX 里成段注释。页面/组件只在有隐藏条件、断点行为、或和非直觉副作用时加一行。

## 文案与配置

- UI 词条：`src/locales/zh-CN.ts` 为源，同步改 `en-US.ts`。页面用 `t('users.email')`。
- 品牌、登录占位、页脚：`src/config/index.ts`，用 `localeText(...)` 按语言取。
- 不要在界面文案里用长破折号 `—`。空值用 `-` 或「暂无」类词条。

## 状态与鉴权

- `store/` 只放 ts：`auth.ts`、`locale.ts`、`theme.ts`。Provider、监听、跳转放 `App.tsx` 或 `router/guards.tsx`。
- 启动：`POST /api/v1/auth/refresh` 成功后再 `GET /api/v1/auth/me`。
- 仅当受保护接口返回 `401 UNAUTHORIZED` 时单飞刷新。`INVALID_CREDENTIALS`、验证码错误、`403`、`429`、`5xx` 不刷新。
- 刷新失败：清空内存 token 和用户，跳转登录，用全局 `message` 提示，不要在登录卡片上再挂一块过期 Alert。

## 布局与断点

登录后壳：`AppShell`。

| 宽度 | 侧栏 |
| --- | --- |
| `≥ 1024px` | 220px，可收成图标栏 |
| `768–1023px` | 进入时自动收成约 80px 图标栏 |
| `< 768px` | 不占布局，汉堡打开 `Drawer`（`size={200}`） |

抽屉与桌面侧栏都是深色 `#15211f`，不要跟页面浅色主题混在一起。Ant Design Drawer 用 `size`，样式用 `styles.section` / `styles.body`，不要用已废弃的 `width`、`styles.content`。

## 主题

- 浅色 / 深色：`html.dark` + Ant Design `ConfigProvider`（`cssVar`、`hashed: false`）。
- 切换走 `src/utils/themeTransition.ts` 的圆形展开，不要再接一套过渡。
- 换肤时不要让用户表自己播颜色 transition。表格表面颜色跟 CSS 变量走。

## 测试

测试放 `tests/`，目录尽量对应 `src/`（如 `tests/api/`、`tests/pages/`）。Vitest + Testing Library。环境需要时文件头加 `/** @vitest-environment jsdom */`。
