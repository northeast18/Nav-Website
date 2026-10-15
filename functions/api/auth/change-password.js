/**
 * 用户修改密码 API
 *
 * 功能：已登录用户通过旧密码验证后设置新密码
 * 安全：使用 PBKDF2 哈希，需要验证旧密码
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
  clearFailedAttempts,
  revokeAllUserSessions,
  createSession
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { oldPassword, newPassword } = await request.json()

    // 验证输入
    if (!oldPassword || !newPassword) {
      return jsonResponse({ error: '旧密码和新密码不能为空' }, 400)
    }

    if (newPassword.length < 6) {
      return jsonResponse({ error: '新密码至少需要 6 个字符' }, 400)
    }

    // 检查频率限制
    const clientIp = getClientIp(request)
    const isLocked = await checkRateLimit(env, clientIp, 'change-password')
    if (isLocked) {
      return jsonResponse({
        error: '操作过于频繁，请15分钟后再试',
        locked: true
      }, 429)
    }

    // 验证会话（需要已登录）
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '未授权，请先登录' }, 401)
    }

    const token = authHeader.substring(7)
    const session = await validateSession(env, token)

    if (!session) {
      return jsonResponse({ error: '会话已过期，请重新登录' }, 401)
    }

    // 查询用户当前密码哈希
    const user = await env.DB.prepare(
      'SELECT id, username, password_hash FROM users WHERE id = ?'
    ).bind(session.userId).first()

    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404)
    }

    // 验证旧密码
    const oldPasswordValid = await verifyPassword(oldPassword, user.password_hash)

    if (!oldPasswordValid) {
      await recordFailedAttempt(env, clientIp, 'change-password')
      return jsonResponse({ error: '旧密码错误' }, 401)
    }

    // 旧密码验证成功，清除失败记录
    await clearFailedAttempts(env, clientIp, 'change-password')

    // 生成新的 PBKDF2 哈希
    const newHash = await hashPassword(newPassword)

    // 更新数据库
    const updateResult = await env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(newHash, user.id).run()

    if (!updateResult.success) {
      return jsonResponse({ error: '密码更新失败' }, 500)
    }

    // 撤销所有旧会话
    await revokeAllUserSessions(env, user.id)

    // 创建新会话（30 天有效）
    const newToken = await createSession(env, user.id, 30)

    console.log(`✓ 用户 ${user.username} 密码修改成功`)

    return jsonResponse({
      success: true,
      message: '密码修改成功，已重新登录',
      token: newToken,
      userId: user.id,
      username: user.username
    })

  } catch (error) {
    console.error('修改密码错误:', error)
    return jsonResponse({ error: '修改密码失败: ' + error.message }, 500)
  }
}
