import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
} from '../_middleware.js'

// 创建新分类
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 验证密码
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要密码验证' }, 401)
  }

  // 检查频率限制 (防止暴力破解)
  const clientIp = getClientIp(request)
  const isLocked = await checkRateLimit(env, clientIp, 'admin')
  if (isLocked) {
    return jsonResponse({
      error: '密码尝试次数过多，请15分钟后再试',
      locked: true
    }, 429)
  }

  const password = authHeader.replace('Bearer ', '')
  const correctPassword = env.ADMIN_PASSWORD

  if (!correctPassword || password !== correctPassword) {
    await recordFailedAttempt(env, clientIp, 'admin')
    return jsonResponse({ error: '管理员密码错误' }, 401)
  }

  // 密码验证成功，清除失败记录
  await clearFailedAttempts(env, clientIp, 'admin')

  try {
    const { name } = await request.json()

    if (!name) {
      return jsonResponse({ error: '缺少分类名称' }, 400)
    }

    // 检查分类名是否已存在
    const existingCategory = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM websites WHERE category = ?'
    ).bind(name).first()

    if (existingCategory.count > 0) {
      return jsonResponse({ error: '该分类已存在' }, 409)
    }

    return jsonResponse({
      success: true,
      message: `分类「${name}」创建成功`,
      category: name
    })

  } catch (error) {
    console.error('创建分类失败:', error)
    return jsonResponse({
      error: '创建失败',
      message: error.message
    }, 500)
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
