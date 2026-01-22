# Cloudflare Worker 部署指南

## 📋 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
# 创建生产环境 KV
wrangler kv:namespace create "NAV_KV"

# 创建预览环境 KV
wrangler kv:namespace create "NAV_KV" --preview
```

### 4. 更新 wrangler.toml

将上面命令返回的 ID 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "NAV_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 替换为生产环境 ID
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # 替换为预览环境 ID
```

### 5. 安装依赖并部署

```bash
cd worker
npm install
npm run deploy
```

### 6. 获取 Worker URL

部署成功后，Wrangler 会显示 Worker 的 URL，类似：
```
https://nav-website-sync.your-subdomain.workers.dev
```

## 🔧 配置前端

在 `.env` 或 `vite.config.js` 中配置 API 地址：

```js
// vite.config.js
export default define({
  VITE_SYNC_API: 'https://nav-website-sync.your-subdomain.workers.dev'
})
```

或者创建 `.env` 文件：

```
VITE_SYNC_API=https://nav-website-sync.your-subdomain.workers.dev
```

## 📡 API 接口

### 1. 读取云端数据

```
GET /api/sync/read?userId=YOUR_USER_ID
```

### 2. 保存数据到云端

```
POST /api/sync/save
Authorization: Bearer YOUR_USER_ID
Content-Type: application/json

{
  "favorites": ["url1", "url2"],
  "order": { "category1": [1, 2, 3] },
  "visits": { "url1": "2024-01-01T00:00:00.000Z" },
  "clicks": { "url1": 10 }
}
```

### 3. 智能合并

```
POST /api/sync/merge
Authorization: Bearer YOUR_USER_ID
Content-Type: application/json

{
  "favorites": ["url1", "url2"],
  "order": { "category1": [1, 2, 3] },
  "timestamp": 1704067200000
}
```

## 🔐 用户 ID 设置

前端会自动生成设备 ID，或你可以在设置中自定义同步密码。

生成的 ID 格式：`device_xxxxxxxxxxxxx`

保存到：`localStorage.getItem('syncAuthToken')`
