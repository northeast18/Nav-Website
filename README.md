# Nav Start Page

一个轻量级、响应式的个人导航网站，基于 Vue 3 + Tailwind CSS 开发，采用 Glassmorphism 毛玻璃设计风格。

## ✨ 最新更新

### 🎉 架构升级 - 数据与代码完全分离

- ✅ **D1 数据库存储**：网站数据存储在 Cloudflare D1 数据库
- ✅ **KV 同步支持**：支持多设备数据同步
- ✅ **环境变量管理**：私密密码存储在 Cloudflare Secrets，不再硬编码
- ✅ **API 驱动架构**：前端通过 API 动态加载数据
- ✅ **浏览器扩展**：支持右键菜单直接收藏网站到云端
- ✅ **安全分享**：GitHub 仓库只包含代码，不包含个人数据

**详细部署指南请查看 [DEPLOYMENT.md](DEPLOYMENT.md)**

## 功能特性

- 🎨 Glassmorphism 毛玻璃 UI 设计
- 🔍 多搜索引擎支持（Google、Bing、Baidu、GitHub）
- 📂 分类导航（云服务、开发工具、设计、AI 工具、娱乐等）
- 📱 完全响应式设计，适配移动端
- ⚡ Vue 3 + Vite 快速构建
- 💾 Cloudflare D1 数据库 + KV 存储
- 🔌 浏览器扩展支持（Chrome/Edge）
- 🔐 私密分类密码保护（环境变量）
- 🚀 部署到 Cloudflare Pages

## 技术栈

### 前端
- Vue 3 (Composition API + Script Setup)
- Vite
- Tailwind CSS
- Lucide Vue Next (图标库)

### 后端/云服务
- Cloudflare Pages (托管)
- Cloudflare D1 (数据库)
- Cloudflare KV (键值存储)
- Cloudflare Pages Functions (API 端点)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## API 端点

部署后可用的 API 端点：

```
https://your-project.pages.dev/
├── api/websites/read      → 读取所有网站
├── api/websites/add       → 添加新网站
├── api/sync/save          → 保存收藏数据
├── api/sync/read          → 读取收藏数据
├── api/private/verify     → 验证私密密码
└── api/migrate            → 执行数据迁移
```

## 浏览器扩展

项目包含 Chrome/Edge 浏览器扩展，支持右键菜单直接收藏网站。

### 安装方法

1. 打开浏览器扩展管理页面
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `extension/` 文件夹
5. 配置同步 ID 和 API 地址

### 功能

- 🖱️ 右键菜单快速收藏（默认分类）
- 📂 直接选择分类收藏（9 个分类）
- 📋 导入浏览器书签
- 🔄 云端同步（基于同步 ID）

详见 [extension/README.md](extension/README.md)

## 部署到 Cloudflare Pages

⚠️ **重要**：请查看 [DEPLOYMENT.md](DEPLOYMENT.md) 获取完整的部署指南，包括：
- Cloudflare D1 数据库创建
- KV 命名空间配置
- 环境变量设置
- 数据迁移步骤
- 常见问题解决

## 项目结构

```
Nav-Website/
├── src/
│   ├── App.vue                    # 主应用
│   ├── data.js                   # API 数据加载
│   └── data.backup.js           # 原始静态数据备份
├── functions/
│   └── api/
│       ├── websites/              # 网站数据 API
│       │   ├── read.js
│       │   └── add.js
│       ├── sync/                  # 同步 API
│       ├── private/               # 私密验证
│       │   └── verify.js
│       └── migrate.js             # 数据迁移
├── scripts/
│   └── migrate-to-d1.js          # 迁移脚本
├── extension/                     # 浏览器扩展
│   ├── background.js
│   ├── popup/
│   ├── options/
│   └── bookmarks/
├── schema.sql                     # D1 数据库结构
├── wrangler.toml                 # Cloudflare 配置
├── DEPLOYMENT.md                 # 部署指南
└── README.md                     # 项目说明
```

## License

MIT

---

## 更新日志

### 2026-01-23 - 架构重大升级

#### 新增功能
- ✨ **数据与代码分离**：网站数据从 GitHub 代码迁移到 Cloudflare D1 数据库
- ✨ **API 驱动架构**：前端通过 REST API 动态加载数据
- ✨ **环境变量管理**：私密密码存储在 Cloudflare Secrets
- ✨ **浏览器扩展增强**：右键菜单支持直接选择分类收藏
- ✨ **数据迁移脚本**：一键迁移现有数据到 D1 数据库

#### 新增 API 端点
- `GET /api/websites/read` - 读取所有网站数据
- `POST /api/websites/add` - 添加新网站
- `POST /api/private/verify` - 验证私密密码
- `POST /api/migrate` - 执行数据迁移

#### 安全改进
- GitHub 仓库不再包含个人数据
- 密码不再硬编码在代码中
- 支持 Bearer Token 认证

#### 文件变更
- `src/data.js` - 从静态数据改为 API 加载器
- `src/App.vue` - 移除硬编码密码，改为 API 调用
- `src/data.backup.js` - 备份原始数据
- `functions/api/` - 新增所有 API 端点
- `extension/` - 浏览器扩展（含分类子菜单）
- `schema.sql` - D1 数据库结构
- `wrangler.toml` - Cloudflare 配置
- `.gitignore` - 保护敏感文件
- `DEPLOYMENT.md` - 完整部署指南
