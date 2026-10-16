/**
 * 设置用户专属私密空间密码
 */

import {
  hashPassword,
  validateSession,
  jsonResponse,
  corsOptionsResponse,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const clientIp = getClientIp(request)
  const isLocked = await checkRateLimit(env, clientIp, 'set-private-password')
  if (isLocked) {
    return jsonResponse({
      error: '操作过于频繁，请15分钟后再试',
      locked: true
    }, 429)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '请先登录账号' }, 401)
  }

  const token = authHeader.substring(7)
  const session = await validateSession(env, token)

  if (!session) {
    return jsonResponse({ error: '登录会话已失效，请重新登录' }, 401)
  }

  try {
    const { password } = await request.json()

    if (!password || password.trim().length < 4) {
      return jsonResponse({ error: '私密空间密码至少需要 4 个字符' }, 400)
    }

    // 确保 users 表具备 private_password_hash 字段
    try {
      const tableInfo = await env.DB.prepare('PRAGMA table_info(users)').all()
      const columns = (tableInfo.results || []).map(c => c.name)
      if (!columns.includes('private_password_hash')) {
        await env.DB.prepare('ALTER TABLE users ADD COLUMN private_password_hash TEXT').run()
      }
    } catch (e) {
      // ignore
    }

    const hashed = await hashPassword(password.trim())

    await env.DB.prepare(
      'UPDATE users SET private_password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(hashed, session.userId).run()

    await clearFailedAttempts(env, clientIp, 'set-private-password')

    return jsonResponse({
      success: true,
      message: '专属私密密码已成功设置！'
    })
  } catch (error) {
    console.error('设置私密密码失败:', error)
    return jsonResponse({ error: '设置私密密码失败: ' + error.message }, 500)
  }
}
