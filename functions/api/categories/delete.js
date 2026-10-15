import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword,
  authenticateRequest
} from '../_middleware.js'

// 删除分类（已登录用户免密删除个人分类，管理员删除全局公共分类）
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'DELETE') {
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
    const { name, moveTo } = await request.json()

    if (!name) {
      return jsonResponse({ error: '缺少分类名称' }, 400)
    }

    // 1. 管理员操作：删除全局公共分类
    if (isAdmin) {
      const countResult = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM websites WHERE category = ? AND name != '__placeholder__'"
      ).bind(name).first()

      const websiteCount = countResult ? countResult.count : 0

      if (websiteCount > 0 && !moveTo) {
        return jsonResponse({
          error: '分类下有网站，需要指定目标分类',
          websiteCount,
          requireMoveTo: true
        }, 400)
      }

      if (websiteCount > 0 && moveTo) {
        await env.DB.prepare('UPDATE websites SET category = ? WHERE category = ?').bind(moveTo, name).run()
      } else if (!moveTo) {
        await env.DB.prepare('DELETE FROM websites WHERE category = ?').bind(name).run()
      }

      return jsonResponse({
        success: true,
        message: moveTo ? `已将全局「${name}」分类下的网站移动到「${moveTo}」` : `已彻底删除全局分类「${name}」`
      })
    }

    // 2. 个人用户操作（免密）：操作属于该用户的网站分类
    const countResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM websites WHERE category = ? AND user_id = ? AND name != '__placeholder__'"
    ).bind(name, currentUser.id).first()

    const websiteCount = countResult ? countResult.count : 0

    if (websiteCount > 0 && !moveTo) {
      return jsonResponse({
        error: '分类下有您的自建网站，请指定移动到的目标分类',
        websiteCount,
        requireMoveTo: true
      }, 400)
    }

    if (websiteCount > 0 && moveTo) {
      await env.DB.prepare(
        'UPDATE websites SET category = ? WHERE category = ? AND user_id = ?'
      ).bind(moveTo, name, currentUser.id).run()
    } else if (!moveTo) {
      await env.DB.prepare(
        'DELETE FROM websites WHERE category = ? AND user_id = ?'
      ).bind(name, currentUser.id).run()
    }

    return jsonResponse({
      success: true,
      message: moveTo ? `已将「${name}」下的网站移动到「${moveTo}」` : `已删除分类「${name}」`
    })

  } catch (error) {
    console.error('删除分类失败:', error)
    return jsonResponse({
      error: '删除失败',
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
