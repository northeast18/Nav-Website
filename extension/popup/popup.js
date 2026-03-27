// Popup 脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  await checkLoginStatus()

  // 每次打开 popup 时，通知 background 更新分类信息
  chrome.runtime.sendMessage({ action: 'refreshCategories' })

  // 快速收藏（自动图标）
  document.getElementById('savePage').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

      if (!userToken || !currentUser) {
        showStatus('请先登录账号', 'error')
        setTimeout(() => chrome.runtime.openOptionsPage(), 1500)
        return
      }

      // 调用 background 的快速收藏
      chrome.runtime.sendMessage({
        action: 'quickSave',
        url: tab.url,
        title: tab.title
      })

      showStatus('收藏成功！', 'success')
      setTimeout(() => window.close(), 1500)
    } catch (error) {
      showStatus('收藏失败: ' + error.message, 'error')
    }
  })

  // 自定义收藏
  document.getElementById('customSave').addEventListener('click', async () => {
    const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

    if (!userToken || !currentUser) {
      showStatus('请先登录账号', 'error')
      setTimeout(() => chrome.runtime.openOptionsPage(), 1500)
      return
    }

    // 显示自定义表单
    document.getElementById('customSaveForm').classList.remove('hidden')
  })

  // 取消自定义收藏
  document.getElementById('cancelCustomSave').addEventListener('click', () => {
    document.getElementById('customSaveForm').classList.add('hidden')
    document.getElementById('customIconUrl').value = ''
  })

  // 执行自定义收藏
  document.getElementById('doCustomSave').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const customIconUrl = document.getElementById('customIconUrl').value.trim()

      // 调用 background 的自定义收藏
      chrome.runtime.sendMessage({
        action: 'customSave',
        url: tab.url,
        title: tab.title,
        iconUrl: customIconUrl
      })

      document.getElementById('customSaveForm').classList.add('hidden')
      document.getElementById('customIconUrl').value = ''

      showStatus('收藏成功！', 'success')
      setTimeout(() => window.close(), 1500)
    } catch (error) {
      showStatus('收藏失败: ' + error.message, 'error')
    }
  })

  // 导入书签
  document.getElementById('importBookmarks').addEventListener('click', async () => {
    const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

    if (!userToken || !currentUser) {
      showStatus('请先登录账号', 'error')
      setTimeout(() => chrome.runtime.openOptionsPage(), 1500)
      return
    }

    chrome.tabs.create({ url: 'bookmarks/bookmarks.html' })
    window.close()
  })

  // 打开设置
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['userToken', 'currentUser', 'apiUrl'])
    showStatus('已退出登录', 'info')
    await checkLoginStatus()
  })
})

// 检查登录状态
async function checkLoginStatus() {
  const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

  const statusEl = document.getElementById('status')
  const userActions = document.getElementById('userActions')

  if (userToken && currentUser) {
    statusEl.innerHTML = '<span class="success">✓ ' + currentUser.username + '</span>'
    userActions.classList.remove('hidden')
  } else {
    statusEl.innerHTML = '<span class="warning">⚠ 未登录</span>'
    userActions.classList.add('hidden')
  }
}

// 显示状态消息
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status')
  statusEl.innerHTML = '<span class="' + type + '">' + message + '</span>'

  setTimeout(() => {
    if (type === 'success') {
      statusEl.innerHTML = ''
    }
  }, 3000)
}
