import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword,
  authenticateRequest
} from '../_middleware.js'

// 删除网站（支持管理员删除公共底座 / 用户删除私有卡片或在自己账户中隐藏公共卡片）
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

  // 鉴权成功，清除失败记录
  await clearFailedAttempts(env, clientIp, 'admin')

  // 验证数据
  const data = await request.json()

  if (!data.id) {
    return jsonResponse({ error: '缺少必填字段: id' }, 400)
  }

  try {
    // 检查网站是否存在
    const existing = await env.DB.prepare('SELECT id, name, user_id, is_public FROM websites WHERE id = ?')
      .bind(data.id)
      .first()

    if (!existing) {
      return jsonResponse({ error: '网站不存在' }, 404)
    }

    const websiteName = existing.name

    // 1. 管理员操作：彻底从全站公共底座删除
    if (isAdmin) {
      await env.DB.prepare('DELETE FROM websites WHERE id = ?').bind(data.id).run()

      return jsonResponse({
        success: true,
        message: `公共底座网站 "${websiteName}" 已删除（全局生效）`
      })
    }

    // 2. 个人用户操作（无需二次管理员密码）
    const isUserOwnCard = currentUser && existing.user_id === currentUser.id

    if (isUserOwnCard) {
      // 2.1 用户自己添加的私有卡片：彻底从私有库删除
      await env.DB.prepare('DELETE FROM websites WHERE id = ? AND user_id = ?')
        .bind(data.id, currentUser.id)
        .run()

      return jsonResponse({
        success: true,
        message: `私有网站 "${websiteName}" 已删除`
      })
    } else {
      // 2.2 公共网站：在当前用户账号下标记为隐藏 (is_hidden = 1)，绝不影响公共底座和其他账号
      try {
        await env.DB.prepare(`
          INSERT INTO user_website_overrides (user_id, website_id, is_hidden, updated_at)
          VALUES (?, ?, 1, datetime('now', 'localtime'))
          ON CONFLICT(user_id, website_id) DO UPDATE SET
            is_hidden = 1,
            updated_at = datetime('now', 'localtime')
        `).bind(currentUser.id, data.id).run()

        return jsonResponse({
          success: true,
          message: `网站 "${websiteName}" 已从您的个人主页中移除（未影响全局底座）`
        })
      } catch (err) {
        console.error('隐藏公共网站失败:', err)
        return jsonResponse({ error: '移除失败: ' + err.message }, 500)
      }
    }

  } catch (error) {
    console.error('删除网站失败:', error)
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
