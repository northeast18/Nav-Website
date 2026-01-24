// 删除网站
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

  // 验证管理员密码
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要管理员密码' }, 401)
  }

  const adminPassword = authHeader.replace('Bearer ', '')
  if (adminPassword !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: '管理员密码错误' }, 401)
  }

  // 验证数据
  const data = await request.json()

  if (!data.id) {
    return jsonResponse({ error: '缺少必填字段: id' }, 400)
  }

  try {
    // 检查网站是否存在并获取名称
    const existing = await env.DB.prepare('SELECT name FROM websites WHERE id = ?')
      .bind(data.id)
      .first()

    if (!existing) {
      return jsonResponse({ error: '网站不存在' }, 404)
    }

    const websiteName = existing.name

    // 删除网站
    await env.DB.prepare('DELETE FROM websites WHERE id = ?')
      .bind(data.id)
      .run()

    return jsonResponse({
      success: true,
      message: `网站 "${websiteName}" 已删除`
    })

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
