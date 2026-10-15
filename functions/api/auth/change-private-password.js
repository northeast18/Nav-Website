/**
 * 修改隐私密码 API
 *
 * 功能：通过管理员密码验证后更新隐私分类密码
 * 隐私密码存储在 KV 中（如果从未修改过，则用 env.PRIVATE_PASSWORD 作为默认值）
 */

import {
  jsonResponse,
  corsOptionsResponse,
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
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
    const { adminPassword, newPassword } = await request.json()

    // 验证输入
    if (!adminPassword || !newPassword) {
      return jsonResponse({ error: '管理员密码和新隐私密码不能为空' }, 400)
    }

    if (newPassword.length < 4) {
      return jsonResponse({ error: '新密码至少需要 4 个字符' }, 400)
    }

    // 检查频率限制
    const clientIp = getClientIp(request)
    const isLocked = await checkRateLimit(env, clientIp, 'admin')
    if (isLocked) {
      return jsonResponse({
        error: '操作过于频繁，请15分钟后再试',
        locked: true
      }, 429)
    }

    // 获取当前管理员密码（优先从 KV 读取，否则用环境变量）
    let currentAdminPassword = null
    if (env.NAV_KV) {
      currentAdminPassword = await env.NAV_KV.get('admin_password')
    }
    if (!currentAdminPassword) {
      currentAdminPassword = env.ADMIN_PASSWORD
    }

    if (!currentAdminPassword) {
      return jsonResponse({ error: '服务器配置错误：管理员密码未设置' }, 500)
    }

    // 验证管理员密码
    if (adminPassword !== currentAdminPassword) {
      await recordFailedAttempt(env, clientIp, 'admin')
      return jsonResponse({ error: '管理员密码错误' }, 401)
    }

    // 管理员密码验证成功，清除失败记录
    await clearFailedAttempts(env, clientIp, 'admin')

    // 将新隐私密码保存到 KV
    if (env.NAV_KV) {
      await env.NAV_KV.put('private_password', newPassword)
    } else {
      return jsonResponse({ error: '服务器配置错误：KV 存储不可用' }, 500)
    }

    console.log(`✓ 隐私密码已修改（IP: ${clientIp}）`)

    return jsonResponse({
      success: true,
      message: '隐私密码修改成功'
    })

  } catch (error) {
    console.error('修改隐私密码错误:', error)
    return jsonResponse({ error: '修改失败: ' + error.message }, 500)
  }
}
