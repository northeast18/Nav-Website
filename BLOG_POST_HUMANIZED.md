# 从 GitHub 敏感到云端数据库：我是如何重构个人导航网站的

## 写在前面

说实话，我一开始没想重构。

原本那个导航网站写得好好的，数据直接塞在 `data.js` 里，本地一跑，完事儿。但后来问题来了——我想在多设备间同步收藏夹，还想加上分类管理和拖拽排序。

那时候我就在想，要不把数据迁到云端？但转念一想，GitHub 仓库放个人数据不安全，硬编码密码更别提了。

于是就有了这次重构。折腾下来，效果还挺让我惊喜的，今天分享给大家。

---

## 为什么我要重构？

### 数据与代码混在一起

原来的导航网站数据直接写在 `data.js`：

```javascript
export const navItems = [
  {
    category: '云服务',
    items: [
      { name: 'Vercel', url: 'https://vercel.com', desc: '部署平台' },
      // ...几十个网站
    ]
  },
  // ...更多分类
]
```

问题很明显：每次添加网站都要改代码，GitHub 仓库包含个人数据不敢公开分享，想在其他设备用得手动同步。

### 功能受限

我想加这些功能：拖拽排序（网站卡片、分类标签都要能拖）、分类管理（创建、重命名、删除）、多设备数据同步、访问统计和最近访问记录。

但这些功能都需要持久化存储，localStorage 太局限，我要的是真正的云端数据库。

---

## 解决方案：Cloudflare D1 + Pages Functions

### 为什么选 Cloudflare

我选了 **Cloudflare D1**（SQLite 数据库）+ **Pages Functions**（Serverless API）。

D1 每天有 500 万次读取的免费额度，个人项目绰绰有余。Cloudflare 的边缘节点遍布全球，速度快，而且不用自己搭服务器，数据库自动扩容。最重要的是，私密密码存在 Cloudflare Secrets，不会进代码仓库。

### 架构变化

**之前：** 前端 (Vue 3) → data.js (静态数据)

**现在：** 前端 (Vue 3) → Cloudflare Pages Functions (API) → D1 数据库

---

## 核心功能实现

### 数据迁移脚本

我写了个迁移脚本，把原来的静态数据一键导入 D1：

```javascript
// functions/api/migrate.js
export async function onRequest(context) {
  const { request, env } = context

  // 读取原 data.js 的数据
  const staticData = await import('../../../src/data.backup.js')

  // 批量插入数据库
  for (const category of staticData.navItems) {
    for (const item of category.items) {
      await env.DB.prepare(`
        INSERT INTO websites (name, url, category, desc, icon_url)
        VALUES (?, ?, ?, ?, ?)
      `).bind(item.name, item.url, category.category, item.desc || '', item.iconUrl || '').run()
    }
  }

  return jsonResponse({ success: true, count: insertedCount })
}
```

一条命令搞定：

```bash
curl -X POST https://your-site.pages.dev/api/migrate \
  -H "Authorization: Bearer YOUR_PASSWORD"
```

### 分类管理系统

最近刚加的功能，我觉得挺实用。

前端界面上，编辑模式下每个分类按钮都有编辑和删除图标，挺直观的。你可以创建新分类、重命名现有分类，或者删除分类（删除时有选项，可以把该分类下的网站移动到其他分类，避免误删）。

API 也很简单：

```bash
# 创建新分类
curl -X POST /api/categories/create \
  -H "Authorization: Bearer PASSWORD" \
  -d '{"name":"新分类"}'

# 重命名分类
curl -X PUT /api/categories/rename \
  -H "Authorization: Bearer PASSWORD" \
  -d '{"oldName":"旧名称","newName":"新名称"}'

# 删除分类
curl -X DELETE /api/categories/delete \
  -H "Authorization: Bearer PASSWORD" \
  -d '{"name":"要删除的分类","moveTo":"目标分类"}'
```

### 拖拽排序（这次修了好久）

网站卡片拖拽用的 `vuedraggable`，成熟方案，问题不大。

分类标签拖拽就踩了不少坑。

一开始用的是 `draggable="isCategoryEditModeActive"`，结果死活不触发 `dragstart` 事件。调试了半天才发现，没有冒号 `:` 绑定的是字符串字面量，不是布尔值！

改成 `:draggable="isCategoryEditModeActive"` 就好了。

然后还有个问题，分类按钮里嵌套了编辑/删除按钮，这些内部按钮会干扰拖拽事件。最后加了 `@mousedown.stop` 和 `pointer-events: auto` 才解决。

现在的效果：点击"三横线"图标进入编辑模式，拖拽分类按钮可以调整顺序（支持全局拖拽，可跨越任意距离），目标位置有紫色边框高亮，放松鼠标自动保存到 localStorage。

### 多设备同步

基于同步 ID 的方案。不同设备用同一个同步 ID，数据就自动同步了。

```javascript
const syncAuthToken = ref(localStorage.getItem('syncAuthToken') || generateDeviceId())

// 上传到云端
const syncToCloud = async () => {
  await fetch('/api/sync/save', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${syncAuthToken.value}` },
    body: JSON.stringify({
      favorites: [...favorites.value],
      order: customOrder.value,
      categoryOrder: categoryOrder.value
    })
  })
}
```

---

## 遇到的坑

### 拖拽事件不触发

按住分类按钮拖动，没有任何反应。

查了半天才发现，`draggable="isCategoryEditModeActive"` 绑定的是字符串 `"false"`，不是布尔值。HTML5 的 `draggable` 属性只要有值就是可拖拽的，不管值是什么。

改成 `:draggable="isCategoryEditModeActive"` 就好了。

### 内部按钮干扰拖拽

拖拽时有时能触发，有时不能。

原因是分类按钮里嵌套的编辑/删除按钮拦截了鼠标事件。最后加了 `@mousedown.stop` 阻止事件冒泡，加上 `pointer-events: auto` 才解决。

### 分类删除逻辑

删除有网站的分类时怎么办？我给了两个选择：直接删除（会同时删除该分类下的所有网站），或者移动到其他分类（更安全）。前端会提示用户选择。

---

## 部署到 Cloudflare Pages

部署步骤不复杂：

1. 创建 D1 数据库：`wrangler d1 create nav-website --production`
2. 执行 SQL 建表：`wrangler d1 execute nav-website --file=schema.sql`
3. 在 Cloudflare Pages 控制台连接 GitHub 仓库，设置构建命令 `npm run build`，输出目录 `dist`
4. 配置环境变量 `DB_ID` 和 `PRIVATE_PASSWORD`
5. 推送代码，Cloudflare 会自动部署

---

## 项目的收获

重构后，GitHub 仓库只包含代码，个人数据都在数据库里。这样即使仓库公开，也不会泄露隐私。

Serverless 真香。不用自己搭服务器，不用管扩容，Cloudflare 全包了。开发效率提升不少。

拖拽排序功能我修了好久，但确实好用。看着分类标签顺滑地移动，挺有成就感的。

---

## 开源分享

项目已经开源在 GitHub：[northeast18/Nav-Website](https://github.com/northeast18/Nav-Website)

包含完整的前端代码（Vue 3 + Tailwind CSS）、Cloudflare Pages Functions API、数据库 schema 和迁移脚本、浏览器扩展（Chrome/Edge），还有部署文档。

如果你也在做个人导航站，或许能给你一些参考。

---

## 下一步

几个想法：导入浏览器书签（现在是手动添加）、标签系统（一个网站可以属于多个分类）、搜索历史记录、更多主题配色。

如果有好的建议，欢迎在 GitHub Issues 里提。

---

这次重构花了一周多时间，中间踩了不少坑，但效果是值得的。现在我的导航网站数据安全了，功能也更强大了，还能在多设备间无缝同步。

如果你也在做类似的项目，希望这篇文章能给你一些帮助。有问题随时在 GitHub 上交流。

**项目地址**：https://github.com/northeast18/Nav-Website

---

*发布时间：2026年1月23日*
*技术栈：Vue 3 + Cloudflare D1 + Pages Functions*
*许可证：MIT*
