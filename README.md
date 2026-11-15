# NOMP 矿池前端

[Not-Only-Mining-Pool](https://github.com/mining-pool/not-only-mining-pool) 的矿池网页。独立部署的 React 单页应用，与 Go 后端的 JSON API 对接，界面采用类 VS Code 的编辑器工作台风格。Go 只提供 API，不托管 HTML 或静态文件。使用 React 19、TypeScript、Ant Design 6、React Router、TanStack Query、Recharts 和 Vite。用户无需注册、签名或连接钱包，输入挖矿时使用的钱包地址即可查询。

> 后端接口、管理员账号、HTTPS 与跨域配置见矿池仓库的 [API 文档](https://github.com/mining-pool/not-only-mining-pool/blob/master/docs/API_zh.md)（[English](https://github.com/mining-pool/not-only-mining-pool/blob/master/docs/API.md)）。

## 本地运行

需要 Node.js 22.12+（推荐 Node.js 24 LTS）和 npm。

```bash
git clone https://github.com/mining-pool/pool-webpage.git
cd pool-webpage
npm ci
cp .env.example .env.local
# 修改 .env.local 中的 API 地址、矿池名称和对外挖矿域名
npm run dev
```

默认访问 http://127.0.0.1:5173，需要本机运行的 nomp API，见下文[对接矿池后端](#对接矿池后端)。

没有节点或 Redis 时可以单独预览：

```bash
npm run dev:demo
```

演示模式会明确显示“演示数据”，提供可点击的演示矿工地址。普通开发和生产构建不会在请求失败时回退到假数据。`npm run build` 使用 production 模式，不读取 `.env.demo`；不要在 `.env.local` 或生产环境中设置 `VITE_DEMO=true`。

## 界面

整个站点是一个“编辑器工作台”：

| 区域              | 作用                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 标题栏 / 命令中心 | 点击或按 `⌘K` / `Ctrl+K` / `Ctrl+Shift+P` / `F1` 打开命令面板：输入钱包地址直接查询矿工，或跳转页面、切换主题和布局       |
| 活动栏            | 资源管理器（页面树、最近查询、矿池大纲）、搜索（筛选矿工索引）、管理控制台；再次点击当前视图收起侧边栏（`⌘B` / `Ctrl+B`） |
| 编辑器标签页      | 访问过的页面以标签打开，可关闭（中键亦可），会话内保留；下方面包屑显示当前位置                                            |
| 面板              | `⌘J` / `Ctrl+J` 打开。“输出”记录前端实际发出的每次接口请求结果，“问题”列出当前失败的请求；不产生任何虚构日志              |
| 状态栏            | 接口状态（实时 / 演示 / 不可用）、问题数量、矿池 1 分钟工作量、已确认高度、币种算法、最近更新时间、主题切换               |

内置 Dark Modern / Light Modern 两套配色，默认跟随系统，选择保存在本机。数值、地址和配置使用等宽字体与语法高亮配色；概览页的 `pool.json` 片段直接由接口返回值生成。窄屏下侧边栏变为覆盖式抽屉。

## 页面

| 路由                        | 功能                                                |
| --------------------------- | --------------------------------------------------- |
| `/`                         | 矿池概览、统计窗口比较、历史矿工索引、钱包查询      |
| `/miner`、`/miner/:address` | 免注册查询、矿机分页及详情、本轮贡献、余额与支付    |
| `/payments`                 | 最新支付回执、按完整钱包地址筛选、待确认交易        |
| `/connect`                  | 币种、算法、端口、TLS / QUIC 提示、可复制的连接参数 |
| `/admin`                    | 只读运维概览、接口状态、支付故障、最近结算区块      |
| `/admin/miners`             | 搜索矿工地址、查看贡献和矿机数量                    |
| `/admin/payments`           | 支付监控及故障信息                                  |
| `/admin/config`             | 当前币种、算法和端口配置检查                        |

矿工地址是公开查询标识，不是登录凭证。地址仅在用户勾选“在此设备记住地址”时写入当前浏览器，并可清除。普通矿工没有账户系统。访问任意管理页面时，未登录会显示管理员登录表单，登录后继续原页面。

## 数据展示约定

前端使用的接口：`/api/`（能力检测）、`/api/pool`、`/api/config/{coin,algorithm,ports}`、`/api/miner/{miner}`、`/api/miner/{miner}/rig/{rig}`、可选的 `/api/payments`；管理页面使用对应的 `/admin-api/*`。接口字段含义见 [API 文档](https://github.com/mining-pool/not-only-mining-pool/blob/master/docs/API_zh.md#公开接口)。

- 工作量按接口原值以 `diff/s` 显示，不在前端换算或补造算力。五个窗口均值用柱状对比，不画成历史趋势；矿工 / 矿机索引不代表在线数量。
- Go 的 `null` 集合归一化为空数组 / 对象，其余字段由 Zod 校验。请求超时 12 秒；统计每 30 秒、支付每 60 秒更新，隐藏标签页暂停轮询。更新失败会提示并保留上次成功的数据与时间。
- 矿机分页后只请求当前页最多 8 台的详情；地址或页面变化会取消失效请求。
- 金额以字符串和 BigInt 按最小单位精确换算，不经浮点。支付接口未注册时显示“未开放支付查询”，已注册但异常时显示请求错误。
- 管理配置页只展示公开白名单字段；管理功能目前只读。
- 一套前端对应一个矿池实例，多币种按域名分别构建部署。Quantus 原生 QUIC 与 LuckyPool Stratum 按 `ports.protocol` 区分，矿机启动参数见 [Quantus 文档](https://github.com/mining-pool/not-only-mining-pool/blob/master/engine/quantus/README.md)。

## 配置与目录

| 变量                | 默认                     | 说明                                                                                 |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `NOMP_API_TARGET`   | `http://127.0.0.1:20000` | 仅用于 Vite 开发代理                                                                 |
| `VITE_API_BASE_URL` | 空                       | 独立部署时的 Go API origin，如 `https://api.pool.example`；为空时使用当前网页 origin |
| `VITE_POOL_NAME`    | `NOMP Pool`              | 展示名称                                                                             |
| `VITE_STRATUM_HOST` | 当前网页域名             | 实际对外挖矿域名，不含协议或端口                                                     |
| `VITE_DEMO`         | 关闭                     | 仅显式 `true` 时启用预览数据                                                         |

`VITE_*` 是构建时公开变量，不能放入 RPC 密码、管理员凭证或钱包秘密。修改展示配置后需重新构建。

```text
src/components/            查询输入、状态反馈、统计图、支付表、代码块
src/components/workbench/  标题栏、活动栏、侧边栏、标签页、面板、状态栏、命令面板
src/pages/                 用户页面和管理控制台（按路由懒加载）
src/lib/                   API、类型校验、查询 hooks、格式化、主题、演示数据
```

## 对接矿池后端

后端是 [mining-pool/not-only-mining-pool](https://github.com/mining-pool/not-only-mining-pool)。Go 只提供 API，不托管本站点，两边分别部署：

```text
浏览器 ──► 前端站点 https://pool.example         （本仓库 npm run build 产出的 dist/）
   └────► 矿池 API  https://api.pool.example:20000（nomp 进程的 api 配置段）
```

### 本机联调

1. 按 [API 文档 · 快速开始](https://github.com/mining-pool/not-only-mining-pool/blob/master/docs/API_zh.md#快速开始本机联调) 启动 nomp：`api.allowedOrigins` 包含 `http://127.0.0.1:5173`；需要管理控制台时用 `./nomp -hash-admin-password` 生成密码哈希，并配置 `api.admin`（本机 HTTP 需 `allowInsecureHTTP: true`）。
2. 本仓库执行 `npm run dev`。Vite 将 `/api/*`、`/admin-api/*` 代理到 `NOMP_API_TARGET`（默认 `http://127.0.0.1:20000`）并保留 Host，无需额外跨域配置。
3. 也可以在 `.env.local` 设置 `VITE_API_BASE_URL=http://127.0.0.1:20000` 直接跨端口访问，此时依赖 `allowedOrigins`。测试 Cookie 时前端和 API 请统一使用 `127.0.0.1` 或统一使用 `localhost`。

### 生产部署

```bash
npm ci
VITE_API_BASE_URL=https://api.pool.example:20000 VITE_POOL_NAME="My Pool" VITE_STRATUM_HOST=stratum.pool.example npm run build
```

- 把 `dist/` 部署到任意静态托管，并把所有未知路径回退到 `/index.html`，否则刷新 `/miner/:address`、`/admin/config` 会 404。项目不要求 Nginx，任何支持 SPA 回退的托管均可。
- `VITE_API_BASE_URL` 是 API 的 origin：非 443 端口要带端口，不要带路径。
- 后端 `api.allowedOrigins` 必须包含前端站点的精确 origin（如 `https://pool.example`）。
- 前端与 API 优先使用同一站点的域名（如 `pool.example` + `api.pool.example`），默认 `SameSite=Strict` 的管理 Cookie 即可工作；完全跨站时需后端设置 `cookieSameSite: "none"`，详见 [CORS 与 Cookie](https://github.com/mining-pool/not-only-mining-pool/blob/master/docs/API_zh.md#cors-与-cookie)。
- 管理员登录由 Go 校验并使用 HttpOnly Cookie，前端只在内存中保存 CSRF token，不保存密码或会话。权限在后端校验，不依赖前端隐藏路由。

## 验证

```bash
npm test
npm run format:check
npm run build
```

测试覆盖认证契约、会话过期通知、矿池数据适配、精确金额换算以及标签页路由，不依赖真实节点。CI（`.github/workflows/ci.yml`）在每次推送和 PR 上执行格式检查、测试与生产构建。后端测试见矿池仓库。
