// Cloudflare Worker for Nav-Website Cloud Sync
// 提供收藏和拖拽排序的跨设备同步功能

import { Router } from 'itty-router'

const router = Router()

// CORS 预检
router.options('*', () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
})

// 读取数据
router.get('/api/sync/read', async (request, env) => {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  try {
    const favorites = await env.NAV_KV.get(`favorites:${userId}`, 'json')
    const order = await env.NAV_KV.get(`order:${userId}`, 'json')
    const visits = await env.NAV_KV.get(`visits:${userId}`, 'json')
    const clicks = await env.NAV_KV.get(`clicks:${userId}`, 'json')
    const timestamp = await env.NAV_KV.get(`timestamp:${userId}`)

    return jsonResponse({
      favorites: favorites || [],
      order: order || {},
      visits: visits || {},
      clicks: clicks || {},
      timestamp: timestamp ? parseInt(timestamp) : null
    })
  } catch (error) {
    return jsonResponse({ error: '读取失败: ' + error.message }, 500)
  }
})

// 保存数据
router.post('/api/sync/save', async (request, env) => {
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

    // 保存数据
    await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(data.favorites))
    await env.NAV_KV.put(`order:${userId}`, JSON.stringify(data.order || {}))
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
})

// 合并数据（智能同步）
router.post('/api/sync/merge', async (request, env) => {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return jsonResponse({ error: '未授权' }, 401)
  }

  try {
    const localData = await request.json()
    const cloudTimestamp = await env.NAV_KV.get(`timestamp:${userId}`)

    // 如果云端没有数据，直接保存本地数据
    if (!cloudTimestamp) {
      const timestamp = Date.now()
      await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${userId}`, timestamp.toString())

      return jsonResponse({
        action: 'saved',
        message: '已保存到云端',
        timestamp
      })
    }

    // 时间戳比较：使用最新的数据
    if (localData.timestamp && localData.timestamp > parseInt(cloudTimestamp)) {
      // 本地数据更新
      await env.NAV_KV.put(`favorites:${userId}`, JSON.stringify(localData.favorites || []))
      await env.NAV_KV.put(`order:${userId}`, JSON.stringify(localData.order || {}))
      await env.NAV_KV.put(`visits:${userId}`, JSON.stringify(localData.visits || {}))
      await env.NAV_KV.put(`clicks:${userId}`, JSON.stringify(localData.clicks || {}))
      await env.NAV_KV.put(`timestamp:${userId}`, localData.timestamp.toString())

      return jsonResponse({
        action: 'uploaded',
        message: '本地数据已上传到云端'
      })
    } else {
      // 云端数据更新，返回云端数据
      const favorites = await env.NAV_KV.get(`favorites:${userId}`, 'json')
      const order = await env.NAV_KV.get(`order:${userId}`, 'json')
      const visits = await env.NAV_KV.get(`visits:${userId}`, 'json')
      const clicks = await env.NAV_KV.get(`clicks:${userId}`, 'json')

      return jsonResponse({
        action: 'downloaded',
        message: '云端数据已下载',
        data: {
          favorites: favorites || [],
          order: order || {},
          visits: visits || {},
          clicks: clicks || {}
        },
        timestamp: parseInt(cloudTimestamp)
      })
    }
  } catch (error) {
    return jsonResponse({ error: '同步失败: ' + error.message }, 500)
  }
})

// 获取用户 ID（从请求头或查询参数）
function getUserIdFromRequest(request) {
  // 方法 1：从 Authorization 头获取
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 方法 2：从查询参数获取
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

export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
}
