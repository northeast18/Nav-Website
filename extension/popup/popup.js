// Popup 脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  await checkLoginStatus()

  // 收藏当前页面
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
})

// 检查登录状态
async function checkLoginStatus() {
  const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

  const statusEl = document.getElementById('status')

  if (userToken && currentUser) {
    statusEl.innerHTML = '<span class="success">✓ ' + currentUser.username + '</span>'
  } else {
    statusEl.innerHTML = '<span class="warning">⚠ 未登录</span>'
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
