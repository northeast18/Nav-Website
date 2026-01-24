// 更新网站信息
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'PUT') {
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

  if (!data.name || !data.url) {
    return jsonResponse({ error: '缺少必填字段: name, url' }, 400)
  }

  try {
    // 检查网站是否存在
    const existing = await env.DB.prepare('SELECT id FROM websites WHERE id = ?')
      .bind(data.id)
      .first()

    if (!existing) {
      return jsonResponse({ error: '网站不存在' }, 404)
    }

    // 构建更新 SQL（动态生成 SET 子句）
    const updates = []
    const values = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.url !== undefined) {
      updates.push('url = ?')
      values.push(data.url)
    }
    if (data.category !== undefined) {
      updates.push('category = ?')
      values.push(data.category)
    }
    if (data.desc !== undefined) {
      updates.push('desc = ?')
      values.push(data.desc)
    }
    if (data.iconUrl !== undefined) {
      updates.push('icon_url = ?')
      values.push(data.iconUrl)
    }
    if (data.lanUrl !== undefined) {
      updates.push('lan_url = ?')
      values.push(data.lanUrl)
    }
    if (data.darkIcon !== undefined) {
      updates.push('dark_icon = ?')
      values.push(data.darkIcon ? 1 : 0)
    }

    // 添加更新时间
    updates.push('updated_at = datetime("now", "localtime")')

    // 添加 WHERE 条件的 id
    values.push(data.id)

    const sql = `UPDATE websites SET ${updates.join(', ')} WHERE id = ?`

    await env.DB.prepare(sql).bind(...values).run()

    return jsonResponse({
      success: true,
      message: `网站 "${data.name}" 已更新`
    })

  } catch (error) {
    console.error('更新网站失败:', error)
    return jsonResponse({
      error: '更新失败',
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
