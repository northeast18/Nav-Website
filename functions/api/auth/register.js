// 用户注册 API
export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { username, password } = await request.json()

    // 验证输入
    if (!username || !password) {
      return jsonResponse({ error: '用户名和密码不能为空' }, 400)
    }

    if (username.length < 3) {
      return jsonResponse({ error: '用户名至少需要 3 个字符' }, 400)
    }

    if (password.length < 6) {
      return jsonResponse({ error: '密码至少需要 6 个字符' }, 400)
    }

    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first()

    if (existingUser) {
      return jsonResponse({ error: '用户名已存在' }, 409)
    }

    // 生成密码哈希（使用简单的 SHA-256，生产环境建议使用 bcrypt）
    const passwordHash = await hashPassword(password)

    // 创建用户
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(username, passwordHash).run()

    if (result.success) {
      const userId = result.meta.last_row_id
      // 使用与登录相同的 token 格式
      const token = `user_${userId}`

      return jsonResponse({
        success: true,
        message: '注册成功',
        token: token,
        userId: userId,
        username: username
      })
    } else {
      return jsonResponse({ error: '注册失败' }, 500)
    }

  } catch (error) {
    console.error('注册错误:', error)
    return jsonResponse({ error: '注册失败: ' + error.message }, 500)
  }
}

// 简单的密码哈希函数（SHA-256）
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
