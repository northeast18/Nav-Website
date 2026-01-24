// 批量导入网站
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

  if (!data.websites || !Array.isArray(data.websites)) {
    return jsonResponse({ error: '缺少必填字段: websites (数组)' }, 400)
  }

  if (data.websites.length === 0) {
    return jsonResponse({ error: '网站列表不能为空' }, 400)
  }

  try {
    let imported = 0
    let failed = 0
    const errors = []

    // 批量插入
    for (const website of data.websites) {
      try {
        // 验证必填字段
        if (!website.name || !website.url || !website.category) {
          errors.push({
            name: website.name || 'Unknown',
            error: '缺少必填字段 (name, url, category)'
          })
          failed++
          continue
        }

        // 检查是否已存在
        const existing = await env.DB.prepare('SELECT id FROM websites WHERE url = ?')
          .bind(website.url)
          .first()

        if (existing) {
          errors.push({
            name: website.name,
            error: '网址已存在'
          })
          failed++
          continue
        }

        // 插入数据
        await env.DB.prepare(`
          INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          website.name,
          website.url,
          website.category,
          website.desc || '',
          website.iconUrl || '',
          website.lanUrl || '',
          website.darkIcon ? 1 : 0
        ).run()

        imported++

      } catch (error) {
        errors.push({
          name: website.name || 'Unknown',
          error: error.message
        })
        failed++
      }
    }

    return jsonResponse({
      success: true,
      imported,
      failed,
      errors,
      message: `导入完成：成功 ${imported} 个，失败 ${failed} 个`
    })

  } catch (error) {
    console.error('批量导入失败:', error)
    return jsonResponse({
      error: '批量导入失败',
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
