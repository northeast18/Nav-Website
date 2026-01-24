# 导航网站功能增强设计方案

**日期**: 2025-01-24
**作者**: Claude & User
**状态**: 已批准

---

## 1. 项目概述

为现有的 Vue.js 导航网站添加以下核心功能：
1. 网页卡片的完整 CRUD 管理（右键菜单）
2. 数据模板化（使用国产示例网站）
3. 浏览器书签智能导入
4. 搜索功能增强（GitHub + 导航内部搜索）

---

## 2. 功能模块设计

### 2.1 网页卡片管理系统

**功能范围**：
- ✅ 编辑：修改名称、URL、描述、内网地址、图标
- ✅ 删除：带确认对话框的删除功能
- ✅ 移动：将网站移动到其他分类

**技术实现**：
- 创建 `src/components/ContextMenu.vue` 组件
- 修改 `src/components/NavCard.vue` 添加右键菜单
- 新建 API 端点：
  - `PUT /api/websites/update` - 更新网站信息
  - `DELETE /api/websites/delete` - 删除网站
- 使用与分类管理相同的管理员密码验证

**UI/UX**：
- 右键点击卡片显示上下文菜单
- 编辑功能通过弹窗表单实现
- 删除前显示确认对话框
- 移动到其他分类通过子菜单选择

---

### 2.2 数据模板化系统

**示例数据（国产网站）**：

```javascript
{
  category: 'AI工具',
  items: [
    { name: 'DeepSeek', url: 'https://deepseek.com', desc: '国产 AI 搜索引擎' },
    { name: '硅基流动', url: 'https://siliconflow.cn', desc: 'AI 模型服务平台' }
  ]
},
{
  category: '云服务和服务器',
  items: [
    { name: '阿里云', url: 'https://aliyun.com', desc: '云计算服务平台' },
    { name: '腾讯云', url: 'https://cloud.tencent.com', desc: '云服务提供商' }
  ]
},
{
  category: '互联网工具',
  items: [
    { name: 'Gitee', url: 'https://gitee.com', desc: '国产代码托管平台' },
    { name: 'CSDN', url: 'https://csdn.net', desc: '开发者社区' }
  ]
},
{
  category: '娱乐',
  items: [
    { name: '抖音', url: 'https://douyin.com', desc: '短视频平台' },
    { name: 'Bilibili', url: 'https://bilibili.com', desc: '弹幕视频网站' }
  ]
},
{
  category: '常用网站',
  items: [
    { name: '百度', url: 'https://baidu.com', desc: '搜索引擎' },
    { name: '腾讯', url: 'https://qq.com', desc: '门户网站' }
  ]
},
{
  category: '邮箱和域名',
  items: [
    { name: 'QQ邮箱', url: 'https://mail.qq.com', desc: 'QQ 邮箱' },
    { name: '网易邮箱', url: 'https://mail.163.com', desc: '网易邮箱' }
  ]
},
{
  category: '我的服务',
  items: []  // 留空，个人数据
},
{
  category: '私密',
  items: []  // 留空，需要密码
}
```

**实现步骤**：
1. 修改 `src/data.js` 的 `getEmptyNavItems()` 函数
2. 创建 `functions/api/websites/seed.js` 初始化脚本
3. 更新 README.md 说明部署流程

---

### 2.3 书签导入系统

**功能流程**：

**阶段 1：文件上传**
- 文件选择器接受 `.html` 文件
- 支持主流浏览器书签格式（Chrome、Firefox、Edge、Safari）

**阶段 2：预览和选择**
- 解析 HTML 文件，提取书签树形结构
- 显示预览列表（名称、URL、原文件夹）
- 复选框让用户选择要导入的书签
- 批量操作：全选/取消全选

**阶段 3：分配分类**
- 为选中的书签指定目标分类
- 智能匹配：根据书签原文件夹名称自动推荐分类
- 批量导入 API

**技术实现**：
- 创建 `src/components/BookmarkImport.vue` 组件
- 创建 `POST /api/websites/batch-import` API
- 在顶部导航栏添加"导入书签"按钮
- 使用 DOMParser 解析浏览器书签 HTML

---

### 2.4 搜索功能增强

**新增搜索引擎**：
- GitHub：`https://github.com/search?q=`

**导航内部搜索**：
- 在搜索引擎列表添加"🔍 导航搜索"选项
- 选中后，搜索框实时过滤所有分类的网址卡片
- 跨分类搜索，显示匹配结果
- 输入时立即显示结果（无需按回车）

**实现**：
- 修改 `src/data.js` 的 searchEngines 数组
- 修改 `src/App.vue` 的搜索逻辑
- 添加特殊的搜索引擎类型用于本地搜索

---

## 3. API 设计

### 3.1 更新网站
```
PUT /api/websites/update
Headers: Authorization: Bearer <admin_password>
Body: {
  id: number,
  name: string,
  url: string,
  desc: string,
  iconUrl: string,
  lanUrl: string,
  darkIcon: boolean,
  category: string  // 可选，用于同时移动到其他分类
}
Response: { success: boolean, message: string }
```

### 3.2 删除网站
```
DELETE /api/websites/delete
Headers: Authorization: Bearer <admin_password>
Body: { id: number }
Response: { success: boolean, message: string }
```

### 3.3 批量导入
```
POST /api/websites/batch-import
Body: {
  websites: [
    { name, url, desc, category, iconUrl, lanUrl, darkIcon }
  ]
}
Response: {
  success: boolean,
  imported: number,
  failed: number,
  errors: array
}
```

---

## 4. 数据流程

### 编辑网站流程
1. 用户右键点击卡片 → 选择"编辑"
2. 弹出编辑表单，预填充当前数据
3. 用户修改后提交 → PUT /api/websites/update
4. API 验证管理员密码 → 更新 D1 数据库
5. 前端重新加载数据 → 刷新显示

### 删除网站流程
1. 用户右键点击卡片 → 选择"删除"
2. 显示确认对话框
3. 确认后调用 DELETE /api/websites/delete
4. API 验证管理员密码 → 删除记录
5. 前端从列表中移除该卡片

### 书签导入流程
1. 用户上传 HTML 文件 → 前端解析
2. 显示预览列表 → 用户选择要导入的书签
3. 选择目标分类 → 调用批量导入 API
4. 显示导入结果（成功数、失败数）
5. 自动刷新导航数据

---

## 5. 错误处理

### 网络错误
- 显示友好的错误提示
- 控制台记录详细日志
- 关键操作失败时保持数据不变

### 权限验证
- 所有修改操作需要管理员密码
- 密码错误显示"密码错误，请重试"

### 操作反馈
- 成功：绿色提示框（2秒后消失）
- 失败：红色提示框，包含错误信息
- 长时间操作：显示加载动画

---

## 6. 兼容性保证

**现有功能不受影响**：
- ✅ 云同步功能继续工作
- ✅ 拖拽排序保持不变
- ✅ 私密分类密码验证
- ✅ 分类管理（重命名、删除、新建）
- ✅ 点击统计和访问历史
- ✅ 收藏功能

---

## 7. 实施优先级

### Phase 1: 搜索增强（快速实现）
- 添加 GitHub 搜索引擎
- 实现导航内部搜索功能
- 测试搜索功能

### Phase 2: 网页卡片管理
- 创建 ContextMenu 组件
- 修改 NavCard 添加右键菜单
- 创建 update、delete API
- 集成编辑和删除功能

### Phase 3: 数据模板化
- 修改 data.js 为示例数据
- 创建 seed.js 初始化脚本
- 更新文档

### Phase 4: 书签导入
- 创建 BookmarkImport 组件
- 实现 HTML 解析
- 创建批量导入 API
- 添加导入按钮

---

## 8. 技术要点

**安全性**：
- 参数化查询防止 SQL 注入
- CORS 配置保持一致
- 管理员密码验证

**性能优化**：
- 导航搜索使用前端过滤（无需 API 调用）
- 批量导入使用事务处理

**用户体验**：
- 所有操作有清晰的视觉反馈
- 友好的错误提示
- 加载状态明确

---

## 9. 文件清单

### 新建文件
- `src/components/ContextMenu.vue`
- `src/components/BookmarkImport.vue`
- `functions/api/websites/update.js`
- `functions/api/websites/delete.js`
- `functions/api/websites/batch-import.js`
- `functions/api/websites/seed.js`

### 修改文件
- `src/App.vue`
- `src/components/NavCard.vue`
- `src/data.js`
- `README.md`

---

**设计文档完成** ✅
