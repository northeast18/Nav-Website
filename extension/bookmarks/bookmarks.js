// 书签导入脚本

let allBookmarks = []

document.addEventListener('DOMContentLoaded', async () => {
  await loadBookmarks()
  setupEventListeners()
})

// 加载所有书签
async function loadBookmarks() {
  try {
    const bookmarkTree = await chrome.bookmarks.getTree()
    allBookmarks = bookmarkTree[0].children || []

    document.getElementById('loading').classList.add('hidden')
    renderBookmarksTree(allBookmarks, document.getElementById('bookmarksTree'))
  } catch (error) {
    document.getElementById('loading').textContent = '加载书签失败: ' + error.message
  }
}

// 渲染书签树
function renderBookmarksTree(nodes, container, level = 0) {
  nodes.forEach(node => {
    const item = document.createElement('div')
    item.className = `bookmark-item level-${level}`

    if (node.children && node.children.length > 0) {
      // 文件夹
      item.innerHTML = `
        <label class="folder-label">
          <input type="checkbox" class="folder-checkbox" data-id="${node.id}">
          <span class="folder-icon">📁</span>
          <span class="folder-name">${node.title || '未命名文件夹'}</span>
        </label>
        <div class="folder-children"></div>
      `

      container.appendChild(item)

      // 递归渲染子项
      const childrenContainer = item.querySelector('.folder-children')
      renderBookmarksTree(node.children, childrenContainer, level + 1)

      // 文件夹点击事件
      const folderCheckbox = item.querySelector('.folder-checkbox')
      folderCheckbox.addEventListener('change', (e) => {
        toggleFolderChildren(item, e.target.checked)
        updateSelectedCount()
      })

    } else if (node.url) {
      // 书签
      try {
        const hostname = new URL(node.url).hostname
        item.innerHTML = `
          <label class="bookmark-label">
            <input type="checkbox" class="bookmark-checkbox" data-url="${node.url}" data-title="${node.title || hostname}">
            <img class="favicon" src="https://www.google.com/s2/favicons?domain=${hostname}&sz=32" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23999%22><path d=%22M5 5v14h14V5H5zm12 12H7V7h10v10z%22/></svg>'">
            <span class="bookmark-title">${node.title || hostname}</span>
            <span class="bookmark-url">${hostname}</span>
          </label>
        `
      } catch (error) {
        // URL 解析失败，跳过
        return
      }

      container.appendChild(item)

      // 书签点击事件
      const checkbox = item.querySelector('.bookmark-checkbox')
      checkbox.addEventListener('change', updateSelectedCount)
    }
  })
}

// 文件夹全选/取消子项
function toggleFolderChildren(folderItem, checked) {
  const childCheckboxes = folderItem.querySelectorAll('.bookmark-checkbox, .folder-checkbox')
  childCheckboxes.forEach(cb => {
    cb.checked = checked
    cb.indeterminate = false
  })
}

// 更新选中计数
function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked')
  const count = checkboxes.length

  document.getElementById('selectedCount').textContent = count
  document.getElementById('importCount').textContent = count

  // 更新导入按钮状态
  const importBtn = document.getElementById('importSelected')
  importBtn.disabled = count === 0
}

// 设置事件监听器
function setupEventListeners() {
  // 全选
  document.getElementById('selectAll').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox')
    checkboxes.forEach(cb => cb.checked = true)
    updateSelectedCount()
  })

  // 取消全选
  document.getElementById('deselectAll').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach(cb => {
      cb.checked = false
      cb.indeterminate = false
    })
    updateSelectedCount()
  })

  // 导入选中
  document.getElementById('importSelected').addEventListener('click', importSelectedBookmarks)

  // 取消
  document.getElementById('cancel').addEventListener('click', () => {
    window.close()
  })
}

// 导入选中的书签
async function importSelectedBookmarks() {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked')

  if (checkboxes.length === 0) {
    return
  }

  // 显示进度条
  showProgress()

  try {
    // 获取配置（优先使用已登录的 userToken，兼容旧版 syncId）
    const { syncId, userToken, apiUrl } = await chrome.storage.local.get(['syncId', 'userToken', 'apiUrl'])
    const authToken = userToken || syncId

    if (!authToken) {
      throw new Error('未登录账号，请先在扩展设置中登录')
    }

    // 构造书签数据
    const bookmarks = Array.from(checkboxes).map(cb => {
      const url = cb.dataset.url
      const hostname = new URL(url).hostname

      return {
        id: generateId(),
        name: cb.dataset.title || hostname,
        url: url,
        desc: '',
        iconUrl: `/api/icon?domain=${hostname}`,
        category: '常用网站'
      }
    })

    // 调用 API 保存
    const apiEndpoint = (apiUrl || 'http://localhost:5173/api/sync/save')

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        favorites: bookmarks,
        append: true
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '导入失败')
    }

    hideProgress()
    showResult(`✓ 成功导入 ${bookmarks.length} 个书签！`, 'success')

    // 3秒后关闭窗口
    setTimeout(() => window.close(), 3000)

  } catch (error) {
    hideProgress()
    showResult(`导入失败：${error.message}`, 'error')
  }
}

// 显示进度条
function showProgress() {
  const progress = document.getElementById('progress')
  progress.classList.remove('hidden')

  const progressFill = progress.querySelector('.progress-fill')
  progressFill.style.width = '0%'

  // 动画
  setTimeout(() => {
    progressFill.style.width = '100%'
  }, 100)
}

// 隐藏进度条
function hideProgress() {
  const progress = document.getElementById('progress')
  progress.classList.add('hidden')
}

// 显示结果
function showResult(message, type) {
  const resultEl = document.getElementById('result')
  resultEl.textContent = message
  resultEl.className = `result ${type}`
  resultEl.classList.remove('hidden')
}

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
