/**
 * 添加新网站到 D1 数据库（多租户支持）
 *
 * 逻辑：
 * - 用户登录添加：绑定到该用户的私有库 (user_id = user.id, is_public = 0)，仅自己可见
 * - 管理员添加：添加到全站公共底座 (user_id = NULL, is_public = 1)，所有用户可见
 */

import {
  authenticateRequest,
  unauthorizedResponse,
  jsonResponse,
  corsOptionsResponse,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getAdminPassword
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // 检查频率限制 (防止暴力破解)
  const clientIp = getClientIp(request)
  const isLocked = await checkRateLimit(env, clientIp, 'admin')
  if (isLocked) {
    return jsonResponse({
      error: '尝试次数过多，请15分钟后再试',
      locked: true
    }, 429)
  }

  // 鉴权检查 (兼容 Admin 密码和 User Token)
  const authHeader = request.headers.get('Authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  let isAdmin = false
  let currentUser = null

  const correctAdminPassword = await getAdminPassword(env)
  if (token === correctAdminPassword) {
    isAdmin = true
  } else if (token) {
    currentUser = await authenticateRequest(request, env)
  }

  if (!isAdmin && !currentUser) {
    await recordFailedAttempt(env, clientIp, 'admin')
    return unauthorizedResponse('您需要提供正确的管理员密码或登录账号后才能添加网站')
  }

  // 鉴权成功，清除失败记录
  await clearFailedAttempts(env, clientIp, 'admin')

  // 验证数据
  const data = await request.json()

  if (!data.name || !data.url || !data.category) {
    return jsonResponse({ error: '缺少必填字段: name, url, category' }, 400)
  }

  // 图标补全
  let iconUrl = data.iconUrl || ''
  if (!iconUrl && data.url) {
    try {
      const hostname = new URL(data.url.startsWith('http') ? data.url : 'https://' + data.url).hostname.replace(/^www\./, '')
      if (hostname) {
        iconUrl = `/api/icon?domain=${hostname}`
      }
    } catch (e) {
      // ignore
    }
  }

  // 租户归属设定：已登录用户添加为私有网站(is_public=0)，管理员添加为公共底座网站(is_public=1)
  let targetUserId = currentUser ? currentUser.id : null
  let isPublic = isAdmin ? 1 : 0

  // 私密或我的服务分类属于个人专属，永远不能作为全局公共底座 (is_public=0)
  if (data.category === '私密' || data.category === '我的服务') {
    isPublic = 0
    if (!targetUserId) {
      try {
        const firstUser = await env.DB.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').first()
        if (firstUser) targetUserId = firstUser.id
      } catch (e) {
        // ignore
      }
    }
  }

  try {
    let result
    try {
      result = await env.DB.prepare(`
        INSERT INTO websites (user_id, is_public, name, url, category, desc, icon_url, lan_url, dark_icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        targetUserId,
        isPublic,
        data.name,
        data.url,
        data.category,
        data.desc || '',
        iconUrl,
        data.lanUrl || '',
        data.darkIcon ? 1 : 0
      ).run()
    } catch (schemaErr) {
      // 兼容尚未执行新迁移的情况
      console.warn('插入新字段失败，降级执行旧结构插入:', schemaErr.message)
      result = await env.DB.prepare(`
        INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.name,
        data.url,
        data.category,
        data.desc || '',
        iconUrl,
        data.lanUrl || '',
        data.darkIcon ? 1 : 0
      ).run()
    }

    const lastId = result.meta.last_row_id

    return jsonResponse({
      success: true,
      id: lastId,
      isPublic: isPublic === 1,
      message: isAdmin
        ? `公共网站 "${data.name}" 已添加到「${data.category}」`
        : `私有网站 "${data.name}" 已添加到您的个人「${data.category}」分类`
    })

  } catch (error) {
    console.error('添加网站失败:', error)

    if (error.message.includes('UNIQUE')) {
      return jsonResponse({ error: '该网址已存在' }, 409)
    }

    return jsonResponse({
      error: '添加失败',
      message: error.message
    }, 500)
  }
}
