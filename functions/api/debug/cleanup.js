// 清理重复数据 - 保留每个 URL 的第一条记录
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 读取所有数据
    const result = await env.DB.prepare('SELECT * FROM websites ORDER BY id').all()

    if (!result.results) {
      return jsonResponse({ error: '无法读取数据' }, 500)
    }

    const beforeCount = result.results.length

    // 找出重复的 URL，保留 ID 最小的
    const urlMap = new Map()
    const idsToDelete = []

    result.results.forEach(row => {
      if (urlMap.has(row.url)) {
        // 已经有这个 URL 了，标记删除当前的
        idsToDelete.push(row.id)
      } else {
        // 第一次遇到这个 URL，保留
        urlMap.set(row.url, row.id)
      }
    })

    // 删除重复的记录
    let deletedCount = 0
    for (const id of idsToDelete) {
      await env.DB.prepare('DELETE FROM websites WHERE id = ?').bind(id).run()
      deletedCount++
    }

    // 获取剩余记录数
    const afterResult = await env.DB.prepare('SELECT COUNT(*) as count FROM websites').first()
    const afterCount = afterResult.count

    return jsonResponse({
      success: true,
      beforeCount,
      deletedCount,
      afterCount
    })

  } catch (error) {
    console.error('清理重复数据失败:', error)
    return jsonResponse({
      error: '清理失败',
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
