// Cloudflare Pages Functions - 读取云端数据
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
    // 从 KV 读取数据
    const favorites = await env.NAV_KV.get(`favorites:${userId}`, 'json')
    const order = await env.NAV_KV.get(`order:${userId}`, 'json')
    const categoryOrder = await env.NAV_KV.get(`categoryOrder:${userId}`, 'json')
    const visits = await env.NAV_KV.get(`visits:${userId}`, 'json')
    const clicks = await env.NAV_KV.get(`clicks:${userId}`, 'json')
    const timestamp = await env.NAV_KV.get(`timestamp:${userId}`)

    return jsonResponse({
      favorites: favorites || [],
      order: order || {},
      categoryOrder: categoryOrder || [],
      visits: visits || {},
      clicks: clicks || {},
      timestamp: timestamp ? parseInt(timestamp) : null
    })
  } catch (error) {
    return jsonResponse({ error: '读取失败: ' + error.message }, 500)
  }
}

function getUserIdFromRequest(request) {
  // 从 Authorization 头获取
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从查询参数获取
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  if (userId) return userId

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
