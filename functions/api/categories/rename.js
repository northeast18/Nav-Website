import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
} from '../_middleware.js'

// 重命名分类
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'PUT') {
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
    const { oldName, newName } = await request.json()

    if (!oldName || !newName) {
      return jsonResponse({ error: '缺少必填字段: oldName, newName' }, 400)
    }

    if (oldName === newName) {
      return jsonResponse({ error: '新旧分类名称相同' }, 400)
    }

    // 检查新分类名是否已存在
    const existingCategory = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM websites WHERE category = ?'
    ).bind(newName).first()

    if (existingCategory.count > 0) {
      return jsonResponse({ error: '目标分类名称已存在' }, 409)
    }

    // 更新所有该分类下的网站
    const result = await env.DB.prepare(
      'UPDATE websites SET category = ? WHERE category = ?'
    ).bind(newName, oldName).run()

    return jsonResponse({
      success: true,
      message: `已将「${oldName}」重命名为「${newName}」`,
      updatedCount: result.meta.changes
    })

  } catch (error) {
    console.error('重命名分类失败:', error)
    return jsonResponse({
      error: '重命名失败',
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
