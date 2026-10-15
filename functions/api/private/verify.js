import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getPrivatePassword
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

    // 读取正确密码（优先 KV，回退环境变量）
    const correctPassword = await getPrivatePassword(env)

    if (!correctPassword) {
      return jsonResponse({ error: '服务器配置错误：密码未设置' }, 500)
    }

    // 验证密码
    if (password === correctPassword) {
      // 密码验证成功，清除失败记录
      await clearFailedAttempts(env, clientIp, 'private')
      return jsonResponse({ success: true })
    } else {
      // 密码验证失败，记录失败尝试
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
