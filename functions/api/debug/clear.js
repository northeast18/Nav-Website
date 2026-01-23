// 清空数据库 - 危险操作，需要密码验证
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 验证密码
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '需要提供密码' }, 401)
    }

    const password = authHeader.replace('Bearer ', '')
    const correctPassword = env.PRIVATE_PASSWORD

    if (!correctPassword || password !== correctPassword) {
      return jsonResponse({ error: '密码错误' }, 401)
    }

    // 获取当前记录数
    const beforeResult = await env.DB.prepare('SELECT COUNT(*) as count FROM websites').first()
    const beforeCount = beforeResult.count

    // 清空表
    await env.DB.prepare('DELETE FROM websites').run()

    return jsonResponse({
      success: true,
      deletedCount: beforeCount
    })

  } catch (error) {
    console.error('清空数据库失败:', error)
    return jsonResponse({
      error: '清空失败',
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
