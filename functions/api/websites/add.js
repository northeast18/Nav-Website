// 添加新网站到 D1 数据库
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

  // 验证数据
  const data = await request.json()

  if (!data.name || !data.url || !data.category) {
    return jsonResponse({ error: '缺少必填字段: name, url, category' }, 400)
  }

  try {
    // 插入数据并获取结果
    const result = await env.DB.prepare(`
      INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.url,
      data.category,
      data.desc || '',
      data.iconUrl || '',
      data.lanUrl || '',
      data.darkIcon ? 1 : 0
    ).run()

    // 获取新插入的 ID（从结果中获取）
    const lastId = result.meta.last_row_id

    return jsonResponse({
      success: true,
      id: lastId,
      message: `网站 "${data.name}" 已添加到「${data.category}」`
    })

  } catch (error) {
    console.error('添加网站失败:', error)

    // 检查是否是唯一约束错误
    if (error.message.includes('UNIQUE')) {
      return jsonResponse({ error: '该网址已存在' }, 409)
    }

    return jsonResponse({
      error: '添加失败',
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
