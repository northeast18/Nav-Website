import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword,
  authenticateRequest
} from '../_middleware.js'

// 更新网站信息（支持管理员更新公共底座 / 用户更新私有卡片或个性化覆盖公共卡片）
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

  if (!data.name || !data.url) {
    return jsonResponse({ error: '缺少必填字段: name, url' }, 400)
  }

  try {
    // 检查网站是否存在
    const existing = await env.DB.prepare('SELECT id, name, user_id, is_public FROM websites WHERE id = ?')
      .bind(data.id)
      .first()

    if (!existing) {
      return jsonResponse({ error: '网站不存在' }, 404)
    }

    // 1. 管理员操作：直接修改底层 websites 表（影响所有未个性化该条目的用户的公共底座）
    if (isAdmin) {
      const updates = []
      const values = []

      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
      if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url) }
      if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category) }
      if (data.desc !== undefined) { updates.push('desc = ?'); values.push(data.desc) }
      if (data.iconUrl !== undefined) { updates.push('icon_url = ?'); values.push(data.iconUrl) }
      if (data.lanUrl !== undefined) { updates.push('lan_url = ?'); values.push(data.lanUrl) }
      if (data.darkIcon !== undefined) { updates.push('dark_icon = ?'); values.push(data.darkIcon ? 1 : 0) }

      updates.push('updated_at = datetime("now", "localtime")')
      values.push(data.id)

      const sql = `UPDATE websites SET ${updates.join(', ')} WHERE id = ?`
      await env.DB.prepare(sql).bind(...values).run()

      return jsonResponse({
        success: true,
        message: `公共底座网站 "${data.name}" 已更新（全局生效）`
      })
    }

    // 2. 个人用户登录操作（无需任何二次密码）
    const isUserOwnCard = currentUser && existing.user_id === currentUser.id

    if (isUserOwnCard) {
      // 2.1 修改自己创建的私有卡片：直接更新属于该用户的 websites 记录
      const updates = []
      const values = []

      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
      if (data.url !== undefined) { updates.push('url = ?'); values.push(data.url) }
      if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category) }
      if (data.desc !== undefined) { updates.push('desc = ?'); values.push(data.desc) }
      if (data.iconUrl !== undefined) { updates.push('icon_url = ?'); values.push(data.iconUrl) }
      if (data.lanUrl !== undefined) { updates.push('lan_url = ?'); values.push(data.lanUrl) }
      if (data.darkIcon !== undefined) { updates.push('dark_icon = ?'); values.push(data.darkIcon ? 1 : 0) }

      updates.push('updated_at = datetime("now", "localtime")')
      values.push(data.id)
      values.push(currentUser.id)

      const sql = `UPDATE websites SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
      await env.DB.prepare(sql).bind(...values).run()

      return jsonResponse({
        success: true,
        message: `私有网站 "${data.name}" 已更新`
      })
    } else {
      // 2.2 修改公共网站：不改变公共底座，只记录为当前登录账号的个性化覆盖 (user_website_overrides)
      try {
        await env.DB.prepare(`
          INSERT INTO user_website_overrides (
            user_id, website_id, custom_name, custom_url, custom_category, custom_desc, custom_icon_url, custom_lan_url, custom_dark_icon, is_hidden, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now', 'localtime'))
          ON CONFLICT(user_id, website_id) DO UPDATE SET
            custom_name = excluded.custom_name,
            custom_url = excluded.custom_url,
            custom_category = excluded.custom_category,
            custom_desc = excluded.custom_desc,
            custom_icon_url = excluded.custom_icon_url,
            custom_lan_url = excluded.custom_lan_url,
            custom_dark_icon = excluded.custom_dark_icon,
            is_hidden = 0,
            updated_at = datetime('now', 'localtime')
        `).bind(
          currentUser.id,
          data.id,
          data.name,
          data.url,
          data.category || existing.category,
          data.desc !== undefined ? data.desc : (existing.desc || ''),
          data.iconUrl !== undefined ? data.iconUrl : (existing.icon_url || ''),
          data.lanUrl !== undefined ? data.lanUrl : (existing.lan_url || ''),
          data.darkIcon !== undefined ? (data.darkIcon ? 1 : 0) : (existing.dark_icon || 0)
        ).run()

        return jsonResponse({
          success: true,
          message: `网站 "${data.name}" 已在您的账户中保存修改（未修改全局公共底座）`
        })
      } catch (err) {
        console.error('保存个性化覆盖失败:', err)
        return jsonResponse({ error: '保存个性化修改失败: ' + err.message }, 500)
      }
    }

  } catch (error) {
    console.error('更新网站失败:', error)
    return jsonResponse({
      error: '更新失败',
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
