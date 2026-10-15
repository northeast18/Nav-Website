import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword,
  authenticateRequest
} from '../_middleware.js'

// 重命名分类（已登录用户可免密重命名个人分类，管理员可重命名全局公共分类）
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

  // 鉴权检查 (兼容 Admin 密码和 User Token)
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要登录或提供管理员密码' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const clientIp = getClientIp(request)

  let isAdmin = false
  let currentUser = null

  const correctPassword = await getAdminPassword(env)
  if (token === correctPassword) {
    isAdmin = true
  } else {
    currentUser = await authenticateRequest(request, env)
  }

  if (!isAdmin && !currentUser) {
    await recordFailedAttempt(env, clientIp, 'admin')
    return jsonResponse({ error: '未授权：会话已过期或管理员密码错误' }, 401)
  }

  await clearFailedAttempts(env, clientIp, 'admin')

  try {
    const { oldName, newName } = await request.json()

    if (!oldName || !newName) {
      return jsonResponse({ error: '缺少必填字段: oldName, newName' }, 400)
    }

    if (oldName === newName) {
      return jsonResponse({ error: '新旧分类名称相同' }, 400)
    }

    // 1. 管理员操作：重命名全局分类
    if (isAdmin) {
      const result = await env.DB.prepare(
        'UPDATE websites SET category = ? WHERE category = ?'
      ).bind(newName, oldName).run()

      return jsonResponse({
        success: true,
        message: `全局分类「${oldName}」已重命名为「${newName}」`,
        updatedCount: result.meta ? result.meta.changes : 0
      })
    }

    // 2. 个人用户登录操作（免密）：更新该用户的私有网站和个性化覆盖记录
    let count = 0
    try {
      const res1 = await env.DB.prepare(
        'UPDATE websites SET category = ? WHERE category = ? AND user_id = ?'
      ).bind(newName, oldName, currentUser.id).run()
      count += (res1.meta ? res1.meta.changes : 0)

      const res2 = await env.DB.prepare(
        'UPDATE user_website_overrides SET custom_category = ? WHERE custom_category = ? AND user_id = ?'
      ).bind(newName, oldName, currentUser.id).run()
      count += (res2.meta ? res2.meta.changes : 0)
    } catch (e) {
      console.warn('更新分类失败:', e.message)
    }

    return jsonResponse({
      success: true,
      message: `已将您的「${oldName}」分类重命名为「${newName}」`,
      updatedCount: count
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
