import { validateSession } from '../_middleware.js'

// 从 D1 数据库读取网站数据（支持多租户与用户个性化覆盖）
export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 检查是否有登录 Token
    let currentUser = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        currentUser = await validateSession(env, token)
      } catch (e) {
        console.warn('验证用户会话失败:', e)
      }
    }

    let rows = []

    if (currentUser) {
      // 1. 已登录用户：
      // - 查询公共底座（排除“私密”和“我的服务”，因为它们是严格私有的个人库）
      // - 查询当前登录用户自建的私有网站（包括其自建的“私密”卡片）
      // - 兼容历史未绑定 user_id 的旧私密卡片：仅首个用户/管理员可见，新注册用户不可见
      // - 应用用户的个性化自定义覆盖 (user_website_overrides)
      try {
        const stmt = env.DB.prepare(`
          SELECT 
            w.id,
            COALESCE(o.custom_name, w.name) as name,
            COALESCE(o.custom_url, w.url) as url,
            COALESCE(o.custom_category, w.category) as category,
            COALESCE(o.custom_desc, w.desc) as desc,
            COALESCE(o.custom_icon_url, w.icon_url) as icon_url,
            COALESCE(o.custom_lan_url, w.lan_url) as lan_url,
            COALESCE(o.custom_dark_icon, w.dark_icon) as dark_icon,
            w.user_id,
            w.is_public,
            COALESCE(o.is_hidden, 0) as is_hidden,
            CASE WHEN w.user_id = ? THEN 1 ELSE 0 END as is_mine
          FROM websites w
          LEFT JOIN user_website_overrides o ON w.id = o.website_id AND o.user_id = ?
          WHERE (
            (w.is_public = 1 AND w.category NOT IN ('私密', '我的服务'))
            OR w.user_id = ?
            OR (w.user_id IS NULL AND w.category IN ('私密', '我的服务') AND ? = (SELECT id FROM users ORDER BY id ASC LIMIT 1))
          )
            AND COALESCE(o.is_hidden, 0) = 0
          ORDER BY category, name
        `).bind(currentUser.userId, currentUser.userId, currentUser.userId, currentUser.userId)

        const result = await stmt.all()
        rows = result.results || []
      } catch (err) {
        // 如果多租户表尚未迁移，安全降级回旧查询
        console.warn('多租户联合查询失败，降级执行基础查询:', err.message)
        const fallback = await env.DB.prepare('SELECT * FROM websites ORDER BY category, name').all()
        rows = fallback.results || []
      }
    } else {
      // 2. 未登录访客：只读取公共底座网站，严格排除私密卡片
      try {
        const stmt = env.DB.prepare(`
          SELECT * FROM websites
          WHERE (is_public = 1 OR user_id IS NULL)
            AND category NOT IN ('私密', '我的服务')
          ORDER BY category, name
        `)
        const result = await stmt.all()
        rows = result.results || []
      } catch (err) {
        const fallback = await env.DB.prepare("SELECT * FROM websites WHERE category NOT IN ('私密', '我的服务') ORDER BY category, name").all()
        rows = fallback.results || []
      }
    }

    // 按分类组织数据
    const categorized = {}

    rows.forEach(row => {
      const categoryName = row.category || '默认'
      if (!categorized[categoryName]) {
        categorized[categoryName] = {
          category: categoryName,
          items: []
        }
      }

      // 过滤掉占位符网站，仅仅让它维持分类的存在
      if (row.name !== '__placeholder__' && row.url !== '__placeholder__') {
        categorized[categoryName].items.push({
          id: row.id,
          name: row.name,
          url: row.url,
          desc: row.desc || '',
          iconUrl: row.icon_url || '',
          lanUrl: row.lan_url || null,
          darkIcon: row.dark_icon === 1,
          isMine: row.is_mine === 1 || (currentUser && row.user_id === currentUser.userId)
        })
      }
    })

    // 已登录用户保证包含“私密”分类对象（即使该用户刚注册，私密列表为空）
    if (currentUser && !categorized['私密']) {
      categorized['私密'] = {
        category: '私密',
        items: []
      }
    }

    // 转换为数组格式
    const navItems = Object.values(categorized)

    return jsonResponse({ navItems })

  } catch (error) {
    console.error('读取网站数据失败:', error)
    return jsonResponse({
      error: '读取数据失败',
      message: error.message
    }, 500)
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
