// Background Service Worker

// dashboardicons 图标映射表（仅用于精确匹配已知服务）
const DASHBOARD_ICON_MAP = {
  // 常用网站
  'github': 'github',
  'gitlab': 'gitlab',
  'bitbucket': 'bitbucket',
  'youtube': 'youtube',
  'twitter': 'twitter',
  'x.com': 'twitter',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'reddit': 'reddit',
  'discord': 'discord',
  'slack': 'slack',
  'notion': 'notion',
  'figma': 'figma',
  'spotify': 'spotify',
  'netflix': 'netflix',
  'amazon': 'amazon',
  'stackoverflow': 'stackoverflow',
  'medium': 'medium',
  'zhihu': 'zhihu',
  'bilibili': 'bilibili',
  'douyin': 'douyin',
  'juejin': 'juejin',

  // 云服务
  'cloudflare': 'cloudflare',
  'vercel': 'vercel',
  'heroku': 'heroku',
  'digitalocean': 'digitalocean',
  'aws': 'aws',
  'azure': 'azure',
  'google': 'google',
  'microsoft': 'microsoft',
  'apple': 'apple',

  // 开发工具
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'vuejs': 'vue-js',
  'reactjs': 'react',
  'nextjs': 'nextjs',
  'tailwindcss': 'tailwindcss',

  // AI 工具
  'deepseek': 'deepseek',
  'openai': 'openai',
  'anthropic': 'anthropic',
  'claude': 'claude',
  'chatgpt': 'chatgpt',
  'siliconflow': 'siliconflow',
  'perplexity': 'perplexity',
  'cursor': 'cursor',

  // 浏览器
  'brave': 'brave',
  'chrome': 'google-chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'microsoft-edge',

  // 密码管理
  '1password': '1password',
  'bitwarden': 'bitwarden',

  // 监控
  'sentry': 'sentry',
  'grafana': 'grafana',

  // CI/CD
  'jenkins': 'jenkins',
  'circleci': 'circleci',

  // 部署平台
  'render': 'render',
  'supabase': 'supabase',

  // 数据库
  'mongodb': 'mongodb',
  'redis': 'redis',
  'postgresql': 'postgresql',
  'mysql': 'mysql',

  // ORM
  'prisma': 'prisma',

  // 服务器
  'nginx': 'nginx',
  'apache': 'apache',

  // 自托管
  'portainer': 'portainer',
  'uptime-kuma': 'uptime-kuma',
  'dozzle': 'dozzle',
  'gotify': 'gotify',
  'searxng': 'searxng',
  'adguard': 'adguard',
  'stirling-pdf': 'stirling-pdf',

  // 下载
  'qbittorrent': 'qbittorrent',

  // 媒体
  'immich': 'immich',
  'jellyfin': 'jellyfin',
  'plex': 'plex',
  'emby': 'emby',

  // 文件管理
  'filebrowser': 'filebrowser',
  'it-tools': 'it-tools',
  'alist': 'alist',

  // 自动化
  'n8n': 'n8n',
  'homeassistant': 'home-assistant',

  // 网络
  'tailscale': 'tailscale',
}

/**
 * 从 URL 中提取域名
 */
function extractHostname(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch (e) {
    return ''
  }
}

/**
 * 查找 dashboardicons 图标
 */
function findDashboardIcon(url) {
  const hostname = extractHostname(url).toLowerCase()
  if (!hostname) return null

  // 1. 精确匹配完整域名
  if (DASHBOARD_ICON_MAP[hostname]) {
    return DASHBOARD_ICON_MAP[hostname]
  }

  // 2. 精确匹配主域名（如 huggingface.co -> huggingface）
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    const mainPart = parts[0]
    if (DASHBOARD_ICON_MAP[mainPart]) {
      return DASHBOARD_ICON_MAP[mainPart]
    }
  }

  // 3. 部分匹配，但要排除一些特殊情况（比如 gemini.google.com 不能匹配成 google）
  for (const [key, value] of Object.entries(DASHBOARD_ICON_MAP)) {
    if (hostname.includes(key) || key.includes(hostname)) {
      if (key === 'google' && hostname.includes('gemini')) {
        return 'gemini'
      }
      return value
    }
  }

  return null
}

/**
 * 获取网站原生 favicon
 * 优先使用 /favicon.ico
 */
function getNativeFavicon(url) {
  const hostname = extractHostname(url)
  if (!hostname) return null

  // 优先使用网站的原生 favicon
  return `https://${hostname}/favicon.ico`
}

/**
 * 获取网站图标 URL
 */
function getIconUrl(url, iconUrl = '') {
  // 1. 优先用手动填的链接
  if (iconUrl) return iconUrl

  // 2. 尝试 dashboardicons 本地图标
  const dashboardIconName = findDashboardIcon(url)
  if (dashboardIconName) {
    return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${dashboardIconName}.svg`
  }

  const hostname = extractHostname(url)
  if (!hostname) return ''

  // 判断是否是内网 IP 或 localhost
  const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)

  if (isLocal) {
    // 3a. 内网地址直接使用原生 favicon
    return `https://${hostname}/favicon.ico`
  } else {
    // 3b. 公网地址优先使用国内稳定的 api.iowen.cn 代理服务获取图标，避免跨域或被墙问题
    return `https://api.iowen.cn/favicon/${hostname}.png`
  }
}

// 获取动态分类列表并更新右键菜单
async function updateContextMenus() {
  const { apiUrl } = await chrome.storage.local.get(['apiUrl'])
  let categories = [
    { id: 'AI工具', name: 'AI工具' },
    { id: '云服务和服务器', name: '云服务和服务器' },
    { id: '互联网工具', name: '互联网工具' },
    { id: '娱乐', name: '娱乐' },
    { id: '常用网站', name: '常用网站' },
    { id: '邮箱和域名', name: '邮箱和域名' },
    { id: '我的服务', name: '我的服务' },
    { id: '私密', name: '私密' },
    { id: '友情链接', name: '友情链接 ⭐' }
  ]

  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/api/websites/read`)
      if (response.ok) {
        const data = await response.json()
        if (data.navItems && data.navItems.length > 0) {
          categories = data.navItems.map(group => ({
            id: group.category,
            name: group.category === '友情链接' ? '友情链接 ⭐' : group.category
          }))
        }
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 重新创建菜单
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'saveToNav',
      title: '📌 收藏到导航网站',
      contexts: ['page', 'link']
    })

    chrome.contextMenus.create({
      id: 'quickSave',
      parentId: 'saveToNav',
      title: '⚡ 快速收藏（默认分类）',
      contexts: ['page', 'link']
    })

    chrome.contextMenus.create({
      id: 'separator',
      parentId: 'saveToNav',
      type: 'separator',
      contexts: ['page', 'link']
    })

    categories.forEach(category => {
      chrome.contextMenus.create({
        id: 'category-' + category.id,
        parentId: 'saveToNav',
        title: category.name,
        contexts: ['page', 'link']
      })
    })
  })
}

// 扩展安装和启动时初始化
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus()
  console.log('导航网站收藏助手已安装')
})

chrome.runtime.onStartup.addListener(() => {
  updateContextMenus()
})

// 当 API URL 变动时更新菜单
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.apiUrl) {
    updateContextMenus()
  }
})

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 快速收藏
  if (info.menuItemId === 'quickSave') {
    let url = info.linkUrl || tab.url
    let title = info.linkUrl ? info.linkText : tab.title
    await quickSave(url, title, tab)
    return
  }

  // 分类收藏
  if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('category-')) {
    const category = info.menuItemId.replace('category-', '')
    let url = info.linkUrl || tab.url
    let title = info.linkUrl ? info.linkText : tab.title
    await saveToCategory(url, title, category, tab)
    return
  }
})

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickSave') {
    quickSave(request.url, request.title, sender.tab)
    return true
  }
  if (request.action === 'customSave') {
    customSave(request.url, request.title, request.iconUrl, sender.tab)
    return true
  }
  if (request.action === 'refreshCategories') {
    updateContextMenus().then(() => sendResponse({ success: true }))
    return true
  }
  return false
})

// 快速收藏
async function quickSave(url, title, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl, defaultCategory } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl',
      'defaultCategory'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 提取图标 - 使用最新的复合策略获取图标
    const iconUrl = getIconUrl(url)

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: defaultCategory || '私密'
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + favorite.category + '」'
      // 尝试在页面内显示提示
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => {
          // 如果注入失败（例如在 chrome:// 页面），回退到系统通知
          showNotification('收藏成功', msg)
        })
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('快速收藏失败:', error)
    // 错误提示也尝试在页面显示
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 自定义图标收藏
async function customSave(url, title, customIconUrl, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl, defaultCategory } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl',
      'defaultCategory'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 使用自定义图标或自动获取
    let iconUrl = customIconUrl
    if (!iconUrl) {
      // 自动获取图标 - 使用最新的复合策略
      iconUrl = getIconUrl(url)
    }

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: defaultCategory || '私密'
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + favorite.category + '」'
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => showNotification('收藏成功', msg))
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('自定义收藏失败:', error)
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 保存到指定分类
async function saveToCategory(url, title, category, tab) {
  try {
    // 检查是否已登录
    const { userToken, currentUser, apiUrl } = await chrome.storage.local.get([
      'userToken',
      'currentUser',
      'apiUrl'
    ])

    if (!userToken || !currentUser) {
      showNotification('请先登录', '请在扩展设置中登录账号', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    if (!apiUrl) {
      showNotification('请先配置 API 地址', '请在扩展设置中配置 API 地址', () => {
        chrome.runtime.openOptionsPage()
      })
      return
    }

    // 提取图标 - 使用最新的复合策略获取图标
    const iconUrl = getIconUrl(url)

    // 构造收藏数据
    const favorite = {
      name: title || new URL(url).hostname,
      url: url,
      desc: '',
      iconUrl: iconUrl,
      category: category
    }

    // 调用添加网站 API
    const response = await fetch(apiUrl + '/api/websites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify(favorite)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      const msg = '"' + favorite.name + '" 已保存到「' + category + '」'
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: showInPageToast,
          args: [msg, 'success']
        }).catch(() => showNotification('收藏成功', msg))
      } else {
        showNotification('收藏成功', msg)
      }
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('分类收藏失败:', error)
    if (tab && tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showInPageToast,
        args: ['收藏失败: ' + error.message, 'error']
      }).catch(() => showNotification('收藏失败', error.message))
    } else {
      showNotification('收藏失败', error.message)
    }
  }
}

// 页面内提示函数（将被注入到页面执行）
function showInPageToast(message, type) {
  // 移除可能存在的旧提示
  const existing = document.getElementById('nav-helper-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'nav-helper-toast'
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    transition: all 0.3s ease;
    opacity: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(4px);
  `

  const icon = type === 'success' ? '✓' : '✕'
  toast.innerHTML = `<span style="font-size: 16px">${icon}</span> <span>${message}</span>`

  document.body.appendChild(toast)

  // 动画显示
  requestAnimationFrame(() => {
    toast.style.top = '40px'
    toast.style.opacity = '1'
  })

  // 自动消失
  setTimeout(() => {
    toast.style.top = '20px'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// 显示通知
function showNotification(title, message, callback) {
  const options = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message
  }

  if (callback) {
    options.requireInteraction = true
  }

  chrome.notifications.create(options, (notificationId) => {
    if (callback) {
      chrome.notifications.onButtonClicked.addListener((id) => {
        if (id === notificationId) {
          callback()
        }
      })
    }
  })
}
