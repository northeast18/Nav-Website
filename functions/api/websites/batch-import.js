// 批量导入网站

// 自动获取图标 URL
function getAutoIconUrl(url) {
  if (!url) return ''
  try {
    const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, '')
    return hostname ? `/api/icon?domain=${hostname}` : ''
  } catch (e) {
    return ''
  }
}
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
    const errors = []

    const normalized = []
    const seenUrls = new Set()

    for (const website of data.websites) {
      const name = (website.name || '').trim()
      const url = (website.url || '').trim()
      const category = (website.category || '').trim()

      if (!name || !url || !category) {
        errors.push({
          name: website.name || 'Unknown',
          error: '缺少必填字段 (name, url, category)'
        })
        continue
      }

      if (seenUrls.has(url)) {
        errors.push({
          name,
          error: '网址重复（导入列表内）'
        })
        continue
      }

      seenUrls.add(url)
      normalized.push({
        ...website,
        name,
        url,
        category
      })
    }

    const existingUrls = new Set()
    const urlList = normalized.map(item => item.url)
    const checkChunkSize = 100

    for (let i = 0; i < urlList.length; i += checkChunkSize) {
      const chunk = urlList.slice(i, i + checkChunkSize)
      const placeholders = chunk.map(() => '?').join(',')
      const result = await env.DB.prepare(
        `SELECT url FROM websites WHERE url IN (${placeholders})`
      ).bind(...chunk).all()
      const rows = result.results || []
      rows.forEach(row => existingUrls.add(row.url))
    }

    const toInsert = []
    for (const website of normalized) {
      if (existingUrls.has(website.url)) {
        errors.push({
          name: website.name,
          error: '网址已存在'
        })
        continue
      }
      toInsert.push(website)
    }

    if (toInsert.length > 0) {
      const insertStmt = env.DB.prepare(`
        INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const batchSize = 50

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize)
        const statements = batch.map(website => insertStmt.bind(
          website.name,
          website.url,
          website.category,
          website.desc || '',
          website.iconUrl || getAutoIconUrl(website.url) || '',
          website.lanUrl || '',
          website.darkIcon ? 1 : 0
        ))

        try {
          await env.DB.batch(statements)
          imported += batch.length
        } catch (error) {
          for (const website of batch) {
            try {
              await insertStmt.bind(
                website.name,
                website.url,
                website.category,
                website.desc || '',
                website.iconUrl || getAutoIconUrl(website.url) || '',
                website.lanUrl || '',
                website.darkIcon ? 1 : 0
              ).run()
              imported++
            } catch (err) {
              errors.push({
                name: website.name || 'Unknown',
                error: err.message
              })
            }
          }
        }
      }
    }

    const failed = errors.length
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
