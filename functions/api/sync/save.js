// Cloudflare Pages Functions - 保存数据到云端
export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  // 获取用户 ID
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  try {
    const data = await request.json()
    const timestamp = Date.now()

    // 验证数据格式
    if (!data.favorites || !Array.isArray(data.favorites)) {
      return jsonResponse({ error: '数据格式错误' }, 400)
    }

    // 保存数据到 KV
    await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(data.favorites))
    await env.NAV_KV.put(`order:${userId}`, JSON.stringify(data.order || {}))
    await env.NAV_KV.put(`categoryOrder:${userId}`, JSON.stringify(data.categoryOrder || []))
    await env.NAV_KV.put(`visits:${userId}`, JSON.stringify(data.visits || {}))
    await env.NAV_KV.put(`clicks:${userId}`, JSON.stringify(data.clicks || {}))
    await env.NAV_KV.put(`timestamp:${userId}`, timestamp.toString())

    return jsonResponse({
      success: true,
      timestamp
    })
  } catch (error) {
    return jsonResponse({ error: '保存失败: ' + error.message }, 500)
  }
}

function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
