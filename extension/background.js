// Background Service Worker

// 分类列表（与网站分类保持一致）
const CATEGORIES = [
  { id: 'AI工具', name: 'AI工具' },
  { id: '云服务和服务器', name: '云服务和服务器' },
  { id: '互联网工具', name: '互联网工具' },
  { id: '娱乐', name: '娱乐' },
  { id: '常用网站', name: '常用网站' },
  { id: '邮箱和域名', name: '邮箱和域名' },
  { id: '我的服务', name: '我的服务' },
  { id: '私密', name: '私密' }
]

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  // 创建主菜单
  chrome.contextMenus.create({
    id: 'saveToNav',
    title: '📌 收藏到导航网站',
    contexts: ['page', 'link']
  })

  // 快速收藏
  chrome.contextMenus.create({
    id: 'quickSave',
    parentId: 'saveToNav',
    title: '⚡ 快速收藏（默认分类）',
    contexts: ['page', 'link']
  })

  // 分隔符
  chrome.contextMenus.create({
    id: 'separator',
    parentId: 'saveToNav',
    type: 'separator',
    contexts: ['page', 'link']
  })

  // 为每个分类创建子菜单
  CATEGORIES.forEach(category => {
    chrome.contextMenus.create({
      id: 'category-' + category.id,
      parentId: 'saveToNav',
      title: category.name,
      contexts: ['page', 'link']
    })
  })

  console.log('导航网站收藏助手已安装')
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

    // 提取图标
    const iconUrl = 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=128'

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
      showNotification('收藏成功', '"' + favorite.name + '" 已添加到导航')
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('快速收藏失败:', error)
    showNotification('收藏失败', error.message)
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

    // 提取图标
    const iconUrl = 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=128'

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
      showNotification('收藏成功', '"' + favorite.name + '" 已添加到「' + category + '」')
    } else {
      throw new Error(result.error || '收藏失败')
    }

  } catch (error) {
    console.error('分类收藏失败:', error)
    showNotification('收藏失败', error.message)
  }
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
