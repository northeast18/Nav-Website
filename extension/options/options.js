// Options 页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  await checkLoginStatus()

  // 登录/注册切换
  document.getElementById('loginTab').addEventListener('click', () => {
    switchAuthMode('login')
  })

  document.getElementById('registerTab').addEventListener('click', () => {
    switchAuthMode('register')
  })

  // 登录表单
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleLogin()
  })

  // 注册表单
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleRegister()
  })

  // 保存设置
  document.getElementById('saveSettings').addEventListener('click', async () => {
    const defaultCategory = document.getElementById('defaultCategory').value
    await chrome.storage.local.set({ defaultCategory })
    showMessage('设置已保存！', 'success')
  })

  // 退出登录
  document.getElementById('logout').addEventListener('click', async () => {
    await chrome.storage.local.remove(['userToken', 'currentUser', 'apiUrl'])
    showMessage('已退出登录', 'info')
    await checkLoginStatus()
  })

  // 导入书签
  document.getElementById('importBookmarks').addEventListener('click', () => {
    chrome.tabs.create({ url: 'bookmarks/bookmarks.html' })
  })
})

// 切换登录/注册模式
function switchAuthMode(mode) {
  const loginTab = document.getElementById('loginTab')
  const registerTab = document.getElementById('registerTab')
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')
  const authError = document.getElementById('authError')

  // 隐藏错误信息
  authError.classList.add('hidden')

  if (mode === 'login') {
    loginTab.classList.add('active')
    registerTab.classList.remove('active')
    loginForm.classList.remove('hidden')
    registerForm.classList.add('hidden')
  } else {
    registerTab.classList.add('active')
    loginTab.classList.remove('active')
    registerForm.classList.remove('hidden')
    loginForm.classList.add('hidden')
  }
}

// 处理登录
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim()
  const password = document.getElementById('loginPassword').value
  const apiUrl = document.getElementById('apiUrl').value.trim()

  if (!username || !password) {
    showError('请输入用户名和密码')
    return
  }

  if (!apiUrl) {
    showError('请输入 API 地址')
    return
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      // 保存登录信息
      await chrome.storage.local.set({
        userToken: result.token,
        currentUser: { username: result.username, userId: result.userId },
        apiUrl: apiUrl
      })

      showMessage('登录成功！', 'success')
      await checkLoginStatus()
    } else {
      showError(result.error || '登录失败')
    }
  } catch (error) {
    showError('登录失败：' + error.message)
  }
}

// 处理注册
async function handleRegister() {
  const username = document.getElementById('registerUsername').value.trim()
  const password = document.getElementById('registerPassword').value
  const apiUrl = document.getElementById('apiUrlRegister').value.trim()

  if (!username || !password) {
    showError('请输入用户名和密码')
    return
  }

  if (username.length < 3) {
    showError('用户名至少需要 3 个字符')
    return
  }

  if (password.length < 6) {
    showError('密码至少需要 6 个字符')
    return
  }

  if (!apiUrl) {
    showError('请输入 API 地址')
    return
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      // 注册成功，自动登录
      await chrome.storage.local.set({
        userToken: result.token,
        currentUser: { username: result.username, userId: result.userId },
        apiUrl: apiUrl
      })

      showMessage('注册成功！', 'success')
      await checkLoginStatus()
    } else {
      showError(result.error || '注册失败')
    }
  } catch (error) {
    showError('注册失败：' + error.message)
  }
}

// 检查登录状态
async function checkLoginStatus() {
  const { userToken, currentUser } = await chrome.storage.local.get(['userToken', 'currentUser'])

  if (userToken && currentUser) {
    // 已登录
    document.getElementById('loginSection').classList.add('hidden')
    document.getElementById('userSection').classList.remove('hidden')
    document.getElementById('bookmarkSection').classList.remove('hidden')

    // 显示用户信息
    document.getElementById('userName').textContent = currentUser.username
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase()

    // 加载默认分类设置
    const { defaultCategory } = await chrome.storage.local.get(['defaultCategory'])
    if (defaultCategory) {
      document.getElementById('defaultCategory').value = defaultCategory
    }
  } else {
    // 未登录
    document.getElementById('loginSection').classList.remove('hidden')
    document.getElementById('userSection').classList.add('hidden')
    document.getElementById('bookmarkSection').classList.add('hidden')
  }
}

// 显示错误信息
function showError(message) {
  const errorEl = document.getElementById('authError')
  errorEl.textContent = message
  errorEl.classList.remove('hidden')
}

// 显示消息
function showMessage(message, type = 'info') {
  const errorEl = document.getElementById('authError')
  errorEl.textContent = message
  errorEl.className = `error-message ${type === 'success' ? 'success-message' : ''}`
  errorEl.classList.remove('hidden')

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      errorEl.classList.add('hidden')
    }, 3000)
  }
}
