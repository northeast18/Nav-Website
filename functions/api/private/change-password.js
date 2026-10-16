/**
 * 用户修改个人专属私密空间密码
 */

import {
  verifyPassword,
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
  const isLocked = await checkRateLimit(env, clientIp, 'change-private-password')
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
    const { oldPassword, newPassword } = await request.json()

    if (!newPassword || newPassword.trim().length < 4) {
      return jsonResponse({ error: '新私密密码至少需要 4 个字符' }, 400)
    }

    const user = await env.DB.prepare(
      'SELECT id, username, private_password_hash FROM users WHERE id = ?'
    ).bind(session.userId).first()

    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404)
    }

    // 如果原先已有私密密码，需验证旧密码
    if (user.private_password_hash) {
      if (!oldPassword) {
        return jsonResponse({ error: '请输入当前旧私密密码' }, 400)
      }

      const isValid = await verifyPassword(oldPassword, user.private_password_hash)
      if (!isValid) {
        await recordFailedAttempt(env, clientIp, 'change-private-password')
        return jsonResponse({ error: '旧私密密码错误' }, 401)
      }
    }

    const newHashed = await hashPassword(newPassword.trim())

    await env.DB.prepare(
      'UPDATE users SET private_password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(newHashed, user.id).run()

    await clearFailedAttempts(env, clientIp, 'change-private-password')

    return jsonResponse({
      success: true,
      message: '个人私密密码已成功修改！'
    })
  } catch (error) {
    console.error('修改私密密码失败:', error)
    return jsonResponse({ error: '修改私密密码失败: ' + error.message }, 500)
  }
}
