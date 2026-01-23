// 用户登录 API
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

    // 查询用户
    const user = await env.DB.prepare(
      'SELECT id, username, password_hash FROM users WHERE username = ?'
    ).bind(username).first()

    if (!user) {
      return jsonResponse({ error: '用户名或密码错误' }, 401)
    }

    // 验证密码
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      return jsonResponse({ error: '用户名或密码错误' }, 401)
    }

    // 使用固定的用户 ID 作为 token（确保同一用户每次登录得到相同的 token）
    const token = `user_${user.id}`

    return jsonResponse({
      success: true,
      message: '登录成功',
      token: token,
      userId: user.id,
      username: user.username
    })

  } catch (error) {
    console.error('登录错误:', error)
    return jsonResponse({ error: '登录失败: ' + error.message }, 500)
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

// 生成简单的 token（用户 ID + 时间戳的哈希）
function generateToken(userId) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return `user_${userId}_${timestamp}_${random}`
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
