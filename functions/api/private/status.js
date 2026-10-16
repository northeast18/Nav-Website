/**
 * 查询当前用户是否已设置个人专属私密空间密码
 */

import {
  validateSession,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['GET', 'POST', 'OPTIONS'])
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

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ isLoggedIn: false, hasPassword: true })
  }

  const token = authHeader.substring(7)
  const session = await validateSession(env, token)

  if (!session) {
    return jsonResponse({ isLoggedIn: false, hasPassword: true })
  }

  try {
    const user = await env.DB.prepare(
      'SELECT id, username, private_password_hash FROM users WHERE id = ?'
    ).bind(session.userId).first()

    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404)
    }

    const hasPassword = !!(user.private_password_hash && user.private_password_hash.trim().length > 0)

    return jsonResponse({
      isLoggedIn: true,
      hasPassword,
      username: user.username
    })
  } catch (error) {
    console.error('获取私密密码状态失败:', error)
    return jsonResponse({ error: '获取私密密码状态失败' }, 500)
  }
}
