/**
 * 添加新网站到 D1 数据库（安全升级版）
 *
 * 安全改进：
 * - 添加会话鉴权检查
 */

import {
  authenticateRequest,
  unauthorizedResponse,
  jsonResponse,
  corsOptionsResponse,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
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

  // 鉴权检查 (兼容老的 Admin 密码和新的 User Token)
  const authHeader = request.headers.get('Authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  let isAuthenticated = false

  if (token === env.ADMIN_PASSWORD) {
    isAuthenticated = true
  } else if (token) {
    // 尝试作为用户 Session 验证
    const user = await authenticateRequest(request, env)
    if (user) {
      isAuthenticated = true
    }
  }

  if (!isAuthenticated) {
    await recordFailedAttempt(env, clientIp, 'admin')
    return unauthorizedResponse('您需要提供正确的管理员密码或登录后才能添加网站')
  }

  // 鉴权成功，清除失败记录
  await clearFailedAttempts(env, clientIp, 'admin')

  // 验证数据
  const data = await request.json()

  if (!data.name || !data.url || !data.category) {
    return jsonResponse({ error: '缺少必填字段: name, url, category' }, 400)
  }

  // 如果没有提供 iconUrl，自动使用服务端图标服务
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

  try {
    // 插入数据并获取结果
    const result = await env.DB.prepare(`
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

    // 获取新插入的 ID（从结果中获取）
    const lastId = result.meta.last_row_id

    return jsonResponse({
      success: true,
      id: lastId,
      message: `网站 "${data.name}" 已添加到「${data.category}」`
    })

  } catch (error) {
    console.error('添加网站失败:', error)

    // 检查是否是唯一约束错误
    if (error.message.includes('UNIQUE')) {
      return jsonResponse({ error: '该网址已存在' }, 409)
    }

    return jsonResponse({
      error: '添加失败',
      message: error.message
    }, 500)
  }
}
