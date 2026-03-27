import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
} from '../_middleware.js'

// 删除分类
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

  // 验证密码
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要密码验证' }, 401)
  }

  // 检查频率限制 (防止暴力破解)
  const clientIp = getClientIp(request)
  const isLocked = await checkRateLimit(env, clientIp, 'admin')
  if (isLocked) {
    return jsonResponse({
      error: '密码尝试次数过多，请15分钟后再试',
      locked: true
    }, 429)
  }

  const password = authHeader.replace('Bearer ', '')
  const correctPassword = env.ADMIN_PASSWORD

  if (!correctPassword || password !== correctPassword) {
    await recordFailedAttempt(env, clientIp, 'admin')
    return jsonResponse({ error: '管理员密码错误' }, 401)
  }

  // 密码验证成功，清除失败记录
  await clearFailedAttempts(env, clientIp, 'admin')

  try {
    const { name, moveTo } = await request.json()

    if (!name) {
      return jsonResponse({ error: '缺少分类名称' }, 400)
    }

    // 检查分类下有多少网站
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM websites WHERE category = ?'
    ).bind(name).first()

    const websiteCount = countResult.count

    if (websiteCount > 0 && !moveTo) {
      return jsonResponse({
        error: '分类下有网站，需要指定目标分类',
        websiteCount,
        requireMoveTo: true
      }, 400)
    }

    let deletedCount = 0

    if (websiteCount > 0 && moveTo) {
      // 将网站移动到其他分类
      const result = await env.DB.prepare(
        'UPDATE websites SET category = ? WHERE category = ?'
      ).bind(moveTo, name).run()

      deletedCount = result.meta.changes
    }

    // 删除分类下的所有网站（如果未移动，或者移动完成后确认删除）
    // 注意：这里实际上是删除该分类下的所有网站记录
    if (!moveTo) {
      const deleteResult = await env.DB.prepare(
        'DELETE FROM websites WHERE category = ?'
      ).bind(name).run()

      deletedCount = deleteResult.meta.changes
    }

    return jsonResponse({
      success: true,
      message: moveTo
        ? `已将 ${deletedCount} 个网站从「${name}」移动到「${moveTo}」`
        : `已删除分类「${name}」及其下的 ${deletedCount} 个网站`,
      deletedCount
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
