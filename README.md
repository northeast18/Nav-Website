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

### 基础功能
- 🎨 Glassmorphism 毛玻璃 UI 设计
- 🔍 多搜索引擎支持（Google、Bing、Baidu、GitHub）
- 📂 分类导航（云服务、开发工具、设计、AI 工具、娱乐等）
- 📱 完全响应式设计，适配移动端
- ⚡ Vue 3 + Vite 快速构建
- 💾 Cloudflare D1 数据库 + KV 存储
- 🔌 浏览器扩展支持（Chrome/Edge）
- 🔐 私密分类密码保护（环境变量）
- 🚀 部署到 Cloudflare Pages

### 数据管理功能
- 🔄 **拖拽排序**：支持网站卡片拖拽自定义顺序
- 🏷️ **分类管理**：创建、重命名、删除分类
- 📋 **分类排序**：拖拽调整分类标签顺序
- ⭐ **收藏功能**：标记常用网站，快速访问
- 📊 **访问统计**：自动统计网站访问次数
- 🕐 **最近访问**：记录每个网站的访问时间
- ☁️ **云同步**：多设备数据同步（基于同步 ID）

### 开发工具（需密码验证）
- 🗑️ **清空数据库**：`/api/debug/clear` - 清空所有网站数据
- 🧹 **清理重复**：`/api/debug/cleanup` - 清理重复的 URL（保留最早的记录）
- 📥 **数据导入**：`/api/migrate` - 从静态数据迁移到数据库

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

### 网站数据 API
```
GET  /api/websites/read     → 读取所有网站数据（无需认证）
POST /api/websites/add      → 添加新网站（需要密码）
```

### 同步 API
```
POST /api/sync/save         → 保存收藏和排序数据到云端（需要同步 ID）
GET  /api/sync/read         → 从云端读取收藏和排序数据（需要同步 ID）
```

### 分类管理 API（需要密码）
```
POST /api/categories/create  → 创建新分类
PUT  /api/categories/rename  → 重命名分类
DELETE /api/categories/delete → 删除分类（可选移动网站到其他分类）
```

### 数据管理 API
```
POST /api/private/verify     → 验证私密分类密码
POST /api/migrate            → 从静态数据迁移到 D1 数据库（需要密码）
```

### 调试工具 API（需要密码）
```
POST /api/debug/clear        → 清空数据库（危险操作）
POST /api/debug/cleanup      → 清理重复的 URL（保留最早记录）
```

### 使用示例

#### 1. 创建新分类
```bash
curl -X POST https://your-project.pages.dev/api/categories/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSWORD" \
  -d '{"name":"新分类名称"}'
```

#### 2. 重命名分类
```bash
curl -X PUT https://your-project.pages.dev/api/categories/rename \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSWORD" \
  -d '{"oldName":"旧名称","newName":"新名称"}'
```

#### 3. 删除分类（并移动网站）
```bash
curl -X DELETE https://your-project.pages.dev/api/categories/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSWORD" \
  -d '{"name":"要删除的分类","moveTo":"目标分类"}'
```

#### 4. 清理重复数据
```bash
curl -X POST https://your-project.pages.dev/api/debug/cleanup \
  -H "Content-Type: application/json"
```

#### 5. 清空数据库（危险！）
```bash
curl -X POST https://your-project.pages.dev/api/debug/clear \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PASSWORD"
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
│   ├── App.vue                    # 主应用（含分类管理和拖拽功能）
│   ├── data.js                   # API 数据加载器
│   ├── components/               # Vue 组件
│   │   ├── NavCard.vue          # 网站卡片组件
│   │   └── ThemeModal.vue       # 主题设置弹窗
│   └── composables/              # Vue 组合式函数
│       └── useTheme.js          # 主题管理
├── functions/
│   └── api/
│       ├── websites/              # 网站数据 API
│       │   ├── read.js          # 读取所有网站
│       │   └── add.js           # 添加新网站
│       ├── categories/            # 分类管理 API
│       │   ├── create.js        # 创建新分类
│       │   ├── rename.js        # 重命名分类
│       │   └── delete.js        # 删除分类
│       ├── sync/                  # 同步 API
│       │   ├── save.js          # 保存同步数据
│       │   └── read.js          # 读取同步数据
│       ├── private/               # 私密验证
│       │   └── verify.js        # 验证私密密码
│       ├── debug/                 # 调试工具
│       │   ├── clear.js         # 清空数据库
│       │   └── cleanup.js       # 清理重复数据
│       └── migrate.js             # 数据迁移
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

### 2026-01-24 - 网站卡片管理、书签导入与数据模板化

#### 新增功能
- ✨ **网站卡片右键菜单**：
  - 编辑网站（修改名称、URL、描述、图标等信息）
  - 移动网站到其他分类
  - 删除网站
  - 所有操作需要管理员密码验证

- ✨ **导航内部搜索**：
  - 在搜索引擎列表中新增"🔍 导航搜索"选项
  - 实时搜索所有分类的网站卡片
  - 支持按名称和描述搜索

- ✨ **书签批量导入**：
  - 支持从浏览器导出的 HTML 书签文件导入
  - 解析并预览书签列表
  - 选择要导入的书签
  - 分配到目标分类
  - 显示导入结果（成功/失败统计）

- ✨ **数据模板化**：
  - 使用国产示例网站（DeepSeek、硅基流动、抖音、Bilibili 等）
  - 新增数据初始化 API (`/api/websites/seed`)
  - 方便其他用户快速部署自己的导航网站

#### 新增 API 端点
- `PUT /api/websites/update` - 更新网站信息
- `DELETE /api/websites/delete` - 删除网站
- `POST /api/websites/batch-import` - 批量导入网站
- `POST /api/websites/seed` - 初始化示例数据

#### 新增组件
- `src/components/ContextMenu.vue` - 右键菜单组件
- `src/components/BookmarkImport.vue` - 书签导入组件

#### 使用说明
- **编辑网站**：右键点击网站卡片 → 编辑 → 输入管理员密码 → 修改信息
- **移动网站**：右键点击网站卡片 → 移动到... → 选择目标分类
- **删除网站**：右键点击网站卡片 → 删除 → 确认并输入密码
- **导入书签**：点击顶部绿色"书本"图标按钮 → 选择书签文件 → 勾选要导入的书签 → 选择分类 → 开始导入

### 2026-01-23 - 分类管理与拖拽排序功能

#### 新增功能
- ✨ **分类管理系统**：
  - 创建新分类（点击"新建"按钮）
  - 重命名分类（点击编辑图标）
  - 删除分类（点击删除图标，可选移动网站到其他分类）
  - 所有操作需要管理员密码验证

- ✨ **分类拖拽排序**：
  - 点击"三横线"图标进入编辑模式
  - 拖拽分类按钮调整顺序（支持全局拖拽，可跨越任意距离）
  - 拖拽时有清晰的视觉反馈（缩放、透明度、边框）
  - 放松鼠标自动保存顺序到 localStorage

- ✨ **调试工具 API**：
  - `/api/debug/clear` - 清空数据库（危险操作）
  - `/api/debug/cleanup` - 清理重复 URL（保留最早记录）

#### 技术改进
- 修复 `draggable` 属性绑定问题（使用 `:draggable` 而非 `draggable`）
- 优化拖拽事件处理，防止内部按钮干扰
- 改进拖拽视觉反馈（目标位置高亮、缩放效果）
- 添加详细的控制台日志便于调试

#### 新增 API 端点
- `POST /api/categories/create` - 创建新分类
- `PUT /api/categories/rename` - 重命名分类
- `DELETE /api/categories/delete` - 删除分类
- `POST /api/debug/clear` - 清空数据库
- `POST /api/debug/cleanup` - 清理重复数据

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
