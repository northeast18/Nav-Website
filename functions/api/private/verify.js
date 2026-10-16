import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getPrivatePassword,
  validateSession,
  verifyPassword
} from '../_middleware.js'

// 私密分类密码验证 API
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { password } = await request.json()

    if (!password) {
      return jsonResponse({ error: '缺少密码' }, 400)
    }

    // 检查频率限制 (防止暴力破解)
    const clientIp = getClientIp(request)
    const isLocked = await checkRateLimit(env, clientIp, 'private')
    if (isLocked) {
      return jsonResponse({
        error: '密码尝试次数过多，请15分钟后再试',
        locked: true
      }, 429)
    }

    // 1. 优先使用用户会话验证专属私密密码
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const session = await validateSession(env, token)
        if (session) {
          const user = await env.DB.prepare(
            'SELECT id, username, private_password_hash FROM users WHERE id = ?'
          ).bind(session.userId).first()

          if (user) {
            if (!user.private_password_hash) {
              return jsonResponse({
                error: '当前账号尚未设置私密密码',
                needSetup: true
              }, 400)
            }

            const isValid = await verifyPassword(password, user.private_password_hash)
            if (isValid) {
              await clearFailedAttempts(env, clientIp, 'private')
              return jsonResponse({ success: true, isUserPersonal: true })
            } else {
              await recordFailedAttempt(env, clientIp, 'private')
              return jsonResponse({ error: '私密密码错误' }, 401)
            }
          }
        }
      } catch (e) {
        console.warn('验证用户私密密码失败，降级回退:', e.message)
      }
    }

    // 2. 未登录或会话不可用时，使用全局隐私密码
    const correctPassword = await getPrivatePassword(env)

    if (!correctPassword) {
      return jsonResponse({ error: '服务器配置错误：密码未设置' }, 500)
    }

    // 验证密码
    if (password === correctPassword) {
      await clearFailedAttempts(env, clientIp, 'private')
      return jsonResponse({ success: true, isGlobal: true })
    } else {
      await recordFailedAttempt(env, clientIp, 'private')
      return jsonResponse({ error: '密码错误' }, 401)
    }

  } catch (error) {
    console.error('密码验证失败:', error)
    return jsonResponse({ error: '服务器错误' }, 500)
  }
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
