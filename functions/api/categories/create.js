import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword,
  authenticateRequest
} from '../_middleware.js'

// 创建新分类（已登录用户无需管理员密码直接创建私有分类，管理员可创建全局公共分类）
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

  // 鉴权检查 (兼容 Admin 密码和 User Token)
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要登录或提供管理员密码' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const clientIp = getClientIp(request)

  let isAdmin = false
  let currentUser = null

  const correctAdminPassword = await getAdminPassword(env)
  if (token === correctAdminPassword) {
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
    const { name } = await request.json()

    if (!name) {
      return jsonResponse({ error: '缺少分类名称' }, 400)
    }

    const targetUserId = currentUser ? currentUser.id : null
    const isPublic = isAdmin ? 1 : 0

    // 检查分类在该作用域下是否已存在
    const existingCategory = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM websites WHERE category = ? AND (user_id = ? OR (is_public = 1 AND ? = 1))'
    ).bind(name, targetUserId, isPublic).first()

    if (existingCategory && existingCategory.count > 0) {
      return jsonResponse({ error: '该分类已存在' }, 409)
    }

    // 插入占位符网站，确保分类可以通过 /api/websites/read 正常显示
    try {
      await env.DB.prepare(
        "INSERT INTO websites (user_id, is_public, name, url, category, desc, icon_url, dark_icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(targetUserId, isPublic, '__placeholder__', '__placeholder__', name, '', '', 0).run()
    } catch (e) {
      // 兼容旧表结构
      await env.DB.prepare(
        "INSERT INTO websites (name, url, category, desc, icon_url, dark_icon) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind('__placeholder__', '__placeholder__', name, '', '', 0).run()
    }

    return jsonResponse({
      success: true,
      message: isAdmin ? `全局公共分类「${name}」创建成功` : `个人分类「${name}」创建成功`,
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
