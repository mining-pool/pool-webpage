# NOMP 矿池前端

[Not-Only-Mining-Pool](https://github.com/mining-pool/not-only-mining-pool) 的矿池网页。独立部署的 React 单页应用，与 Go 后端的 JSON API 对接，界面采用类 VS Code 的编辑器工作台风格。Go 只提供 API，不托管 HTML 或静态文件。使用 React 19、TypeScript、Ant Design 6、React Router、TanStack Query、Recharts 和 Vite。用户无需注册、签名或连接钱包，输入挖矿时使用的钱包地址即可查询。

## 本地运行

需要 Node.js 22.12+（推荐 Node.js 24 LTS）和 npm。

```bash
cd pool-webpage
npm ci
cp .env.example .env.local
# 修改 .env.local 中的 API 地址、矿池名称和对外挖矿域名
npm run dev
```

默认访问 http://localhost:5173。启动 Go 矿池后，Vite 将 `/api/*` 和 `/admin-api/*` 原样代理到 `http://127.0.0.1:20000`，保留请求 Host 供 Go 校验 Origin，无需放开 CORS。开发服务默认只监听本机，管理登录同样经过后端鉴权。使用本机 HTTP 开发时，需要在 Go 配置中显式设置 `api.admin.allowInsecureHTTP: true`。

没有节点或 Redis 时可以单独预览：

```bash
npm run dev:demo
```

演示模式会明确显示“演示数据”，提供可点击的演示矿工地址。普通开发和生产构建不会在请求失败时回退到假数据。`npm run build` 使用 production 模式，不读取 `.env.demo`；不要在 `.env.local` 或生产环境中设置 `VITE_DEMO=true`。

## 界面

整个站点是一个“编辑器工作台”：

| 区域 | 作用 |
| --- | --- |
| 标题栏 / 命令中心 | 点击或按 `⌘K` / `Ctrl+K` / `Ctrl+Shift+P` / `F1` 打开命令面板：输入钱包地址直接查询矿工，或跳转页面、切换主题和布局 |
| 活动栏 | 资源管理器（页面树、最近查询、矿池大纲）、搜索（筛选矿工索引）、管理控制台；再次点击当前视图收起侧边栏（`⌘B` / `Ctrl+B`） |
| 编辑器标签页 | 访问过的页面以标签打开，可关闭（中键亦可），会话内保留；下方面包屑显示当前位置 |
| 面板 | `⌘J` / `Ctrl+J` 打开。“输出”记录前端实际发出的每次接口请求结果，“问题”列出当前失败的请求；不产生任何虚构日志 |
| 状态栏 | 接口状态（实时 / 演示 / 不可用）、问题数量、矿池 1 分钟工作量、已确认高度、币种算法、最近更新时间、主题切换 |

内置 Dark Modern / Light Modern 两套配色，默认跟随系统，选择保存在本机。数值、地址和配置使用等宽字体与语法高亮配色；概览页的 `pool.json` 片段直接由接口返回值生成。窄屏下侧边栏变为覆盖式抽屉。

## 页面

| 路由 | 功能 |
| --- | --- |
| `/` | 矿池概览、统计窗口比较、历史矿工索引、钱包查询 |
| `/miner`、`/miner/:address` | 免注册查询、矿机分页及详情、本轮贡献、余额与支付 |
| `/payments` | 最新支付回执、按完整钱包地址筛选、待确认交易 |
| `/connect` | 币种、算法、端口、TLS / QUIC 提示、可复制的连接参数 |
| `/admin` | 只读运维概览、接口状态、支付故障、最近结算区块 |
| `/admin/miners` | 搜索矿工地址、查看贡献和矿机数量 |
| `/admin/payments` | 支付监控及故障信息 |
| `/admin/config` | 当前币种、算法和端口配置检查 |

矿工地址是公开查询标识，不是登录凭证。地址仅在用户勾选“在此设备记住地址”时写入当前浏览器，并可清除。普通矿工没有账户系统。管理员账号在服务器配置中指定，密码由 Go 校验，登录后使用 HttpOnly Cookie；密码和会话 Cookie 都不会写入 localStorage。访问任意管理页面时，未登录会显示管理员登录表单，登录后继续原页面。

## API 与数据语义

| 后端接口 | 用途 |
| --- | --- |
| `GET /api/` | 检测可选接口能力 |
| `GET /api/pool` | 五个窗口的工作量指标与历史矿工索引 |
| `GET /api/config/coin`、`/api/config/algorithm`、`/api/config/ports` | 币种和接入信息 |
| `GET /api/miner/{miner}` | 矿工工作量、本轮贡献、历史矿机索引 |
| `GET /api/miner/{miner}/rig/{rig}` | 单台矿机的窗口数据 |
| `GET /api/payments`（可选） | Quantus 余额、待处理交易、已确认支付及区块 |

- `storage.Get*Hashrate` 当前返回累计难度 / 秒，没有进行算法相关的 H/s 换算，因此 UI 使用 `diff/s`。现有存储读取还存在按 rank 而非 score 查询时间窗口、矿工读写 key 不一致、相同难度 ZSet 成员覆盖等限制；此框架忠实显示接口返回值，不在前端补造算力。需要准确生产统计时应单独修复并验证后端存储。
- 五个均值是不同长度的统计窗口，不是五个历史时间点，使用柱状比较，不生成虚假的历史趋势。历史矿工 / 矿机索引不是在线数量；近一分钟工作量也不能证明 TCP 连接状态。
- Go 的 `null` 集合会归一化为空数组 / 对象，其余字段由 Zod 校验。请求超时 12 秒；统计每 30 秒更新，支付每 60 秒更新，隐藏标签页暂停轮询。更新失败明确提示并保留上次成功数据与时间；首次失败显示重试入口。
- 矿机分页后只请求当前页的最多 8 台详情；地址或页面变化会取消已失效请求。
- 支付接口只展示后端保留的最近最多 100 笔回执，不据此推算累计收入。所有最小单位金额使用字符串与 BigInt，不经浮点转换。未注册支付接口显示“未开放支付查询”，已注册但停用 / 异常显示请求错误。
- 管理配置 UI 只展示公开白名单字段。后端 `/config/api` 和 `/api/config/api` 仅返回 host 与 port，绝不返回管理员配置、密码哈希文件位置或 TLS 配置。管理数据接口现已受 Go 会话鉴权保护；业务功能仍为只读运维，配置修改、封禁、重启和手动付款需要额外实现相应后端业务接口。
- 一套前端对应一个矿池实例。多币种可以按域名分别部署；接入新的引擎时保留各自的钱包格式和协议说明。Quantus 原生 QUIC 与 LuckyPool Stratum 会按 `ports.protocol` 区分，实际启动参数见 [Quantus 文档](https://github.com/mining-pool/not-only-mining-pool/blob/master/engine/quantus/README.md)。

## 配置与目录

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `NOMP_API_TARGET` | `http://127.0.0.1:20000` | 仅用于 Vite 开发代理 |
| `VITE_API_BASE_URL` | 空 | 独立部署时的 Go API origin，如 `https://api.pool.example`；为空时使用当前网页 origin |
| `VITE_POOL_NAME` | `NOMP Pool` | 展示名称 |
| `VITE_STRATUM_HOST` | 当前网页域名 | 实际对外挖矿域名，不含协议或端口 |
| `VITE_DEMO` | 关闭 | 仅显式 `true` 时启用预览数据 |

`VITE_*` 是构建时公开变量，不能放入 RPC 密码、管理员凭证或钱包秘密。修改展示配置后需重新构建。

```text
src/components/            查询输入、状态反馈、统计图、支付表、代码块
src/components/workbench/  标题栏、活动栏、侧边栏、标签页、面板、状态栏、命令面板
src/pages/                 用户页面和管理控制台（按路由懒加载）
src/lib/                   API、类型校验、查询 hooks、格式化、主题、演示数据
```

## Go API 与管理员配置

后端位于 [mining-pool/not-only-mining-pool](https://github.com/mining-pool/not-only-mining-pool)（会话登录、鉴权、CORS 和矿池 API 在其 `api/` 目录）。在后端仓库根目录执行：

```bash
go build -o nomp ./cmd/nomp
umask 077
./nomp -hash-admin-password > admin-password.hash
```

最后一条命令通过终端读取并确认密码（不回显），输出 bcrypt 哈希。密码需为 12–72 字节，哈希文件只保存在 API 服务器，不放入前端产物。没有内置管理员密码或管理员注册入口。

将以下 `api` 段合并到完整的矿池配置（其他币种、节点、端口、Redis 参数照常设置）：

```json
{
  "api": {
    "host": "127.0.0.1",
    "port": 20000,
    "allowedOrigins": ["http://127.0.0.1:5173"],
    "admin": {
      "username": "admin",
      "passwordHashFile": "admin-password.hash",
      "sessionTTLSeconds": 28800,
      "allowInsecureHTTP": true
    }
  }
}
```

```bash
./nomp -c config.json
```

相对文件路径以启动进程的工作目录为基准，也可以使用绝对路径。Go 的 `:20000` 端口只提供 API；访问 `/admin` 或 `/index.html` 返回 404。React 管理入口始终在前端站点 `/admin`。

`allowInsecureHTTP` 只允许 API Host 为 localhost / 回环 IP 且连接来源也为回环 IP 的请求，适用于本机访问和 Vite 本机代理，不是面向公网的 HTTP 登录开关。Go 不信任 `X-Forwarded-For` 或 `X-Forwarded-Proto`。

## 前端独立运行与部署

开发时运行 `npm run dev`，前端默认 `http://127.0.0.1:5173`，通过 Vite 代理连接 Go。也可以在 `.env.local` 设置 `VITE_API_BASE_URL=http://127.0.0.1:20000`，直接跨端口访问 API；此时需要上面配置的 `allowedOrigins`。测试 Cookie 时前端、API 请统一使用 `127.0.0.1` 或统一使用 `localhost`。

生产前端使用自己的静态托管服务，构建时配置 API 地址：

```bash
cd pool-webpage
npm ci
VITE_API_BASE_URL=https://api.pool.example npm run build
```

部署 `dist/` 到前端站点（例如 `https://pool.example`），并让该静态托管平台将前端路由回退至 `/index.html`，以支持 `/admin/config`、`/miner/:address` 刷新。Go 不承担这项回退。静态托管方式由部署环境选择，项目不要求独立 Nginx。

生产 API 可由 Go 直接提供 HTTPS：

```json
{
  "api": {
    "host": "0.0.0.0",
    "port": 20000,
    "allowedOrigins": ["https://pool.example"],
    "tls": {
      "certFile": "/srv/nomp/tls/fullchain.pem",
      "keyFile": "/srv/nomp/tls/privkey.pem"
    },
    "admin": {
      "username": "admin",
      "passwordHashFile": "/srv/nomp/admin-password.hash",
      "sessionTTLSeconds": 28800
    }
  }
}
```

如果 API 使用 20000 端口，前端 `VITE_API_BASE_URL` 也应包含 `:20000`；使用 443 时可省略端口。证书需要与 API 域名匹配。未配置 `admin` 时管理 API 返回 503，公开查询照常可用；无效哈希、证书或跨域配置会在启动时明确报错。

`allowedOrigins` 是包含协议和端口的精确 origin 列表，不接受 `*` 或路径。服务端只对许可的 origin 返回携带凭证的 CORS 响应，并处理浏览器预检；未知来源返回 403。同源请求也允许，未带 Origin 的普通 API 客户端继续工作。管理写请求始终需要合法 Origin。

默认会话 Cookie 使用 `SameSite=Strict`，适用于同源或同站点的前后端域名（如 HTTPS 的 `pool.example` 与 `api.pool.example`）。如果前端和 API 使用完全不同的站点，可设置 `api.admin.cookieSameSite: "none"`，必须使用 HTTPS，且不能同时启用 `allowInsecureHTTP`；CSRF token 和 origin 白名单仍然生效。浏览器的第三方 Cookie 策略可能限制跨站登录，生产优先使用同站点域名。

## 管理会话接口

| 接口 | 行为 |
| --- | --- |
| `POST /admin-api/auth/login` | JSON `{username,password}` 登录，返回账号、到期时间、CSRF token 并设置会话 Cookie |
| `GET /admin-api/auth/session` | 查询当前会话；未登录或到期返回 401 |
| `POST /admin-api/auth/logout` | 校验 CSRF 后销毁会话，并清除 Cookie |
| `/admin-api/*` | 已登录后访问矿池 API；业务数据仍只读 |

会话 Cookie 为 HttpOnly，HTTPS 下启用 Secure，作用域限于 `/admin-api`。会话默认绝对有效期 8 小时，可配置 60–86400 秒，重新登录轮换当前会话。会话只存于进程内存（最多 256 个），退出立即失效，服务重启后所有管理员重新登录。

登录要求 JSON 和合法 Origin；退出及未来管理写接口还要求 `X-CSRF-Token`。前端使用 `credentials: include` 发送 Cookie，仅将 CSRF token 保存在内存。会话无效时返回登录表单并清除管理查询缓存。普通用户页面完全不需要会话。登录按连接来源限制为每 5 分钟最多 10 次，并限制并发密码校验。

权限由 Go 对 `/admin-api/*` 校验，不依赖前端隐藏路由。公开的矿池统计和支付数据仍可从 `/api/*` 读取；以后新增敏感运维接口应挂载到受鉴权保护的管理路径，不能加到公开路由中。

## 旧 API 兼容性

原有 `/`、`/pool`、`/miner/:address`、`/config/*`、`/payments` 等路径保持 JSON API 语义，不根据浏览器 Accept 切换成页面。新增 `/api/*` 别名供 React 使用，根路径 `/api/` 返回能力列表。矿池 API 只接受 GET / HEAD，登录与退出使用 POST。

## 验证

```bash
npm test
npm run format:check
npm run build
```

后端仓库中执行 `go test -race ./api` 与 `go test -short ./...`。后端测试覆盖登录、错误密码、Cookie 属性、会话轮换与到期、退出后失效、CSRF、CORS 预检与白名单、登录限流、HTTP 来源限制、配置脱敏和纯 API 路由。前端测试覆盖认证契约、会话过期通知及矿池数据适配。前端测试不依赖真实节点。
