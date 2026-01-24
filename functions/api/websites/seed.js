// 初始化示例数据到 D1 数据库
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

  // 验证管理员密码
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: '需要管理员密码' }, 401)
  }

  const adminPassword = authHeader.replace('Bearer ', '')
  if (adminPassword !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: '管理员密码错误' }, 401)
  }

  try {
    // 检查是否已经有数据
    const existingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM websites')
      .first()

    if (existingCount.count > 0) {
      return jsonResponse({
        success: false,
        message: '数据库已有数据，跳过初始化'
      })
    }

    // 示例数据
    const sampleData = [
      { name: 'DeepSeek', url: 'https://deepseek.com', category: 'AI工具', desc: '国产 AI 搜索引擎' },
      { name: '硅基流动', url: 'https://siliconflow.cn', category: 'AI工具', desc: 'AI 模型服务平台' },
      { name: '阿里云', url: 'https://aliyun.com', category: '云服务和服务器', desc: '云计算服务平台' },
      { name: '腾讯云', url: 'https://cloud.tencent.com', category: '云服务和服务器', desc: '云服务提供商' },
      { name: 'Gitee', url: 'https://gitee.com', category: '互联网工具', desc: '国产代码托管平台' },
      { name: 'CSDN', url: 'https://csdn.net', category: '互联网工具', desc: '开发者社区' },
      { name: '抖音', url: 'https://douyin.com', category: '娱乐', desc: '短视频平台' },
      { name: 'Bilibili', url: 'https://bilibili.com', category: '娱乐', desc: '弹幕视频网站' },
      { name: '百度', url: 'https://baidu.com', category: '常用网站', desc: '搜索引擎' },
      { name: '腾讯', url: 'https://qq.com', category: '常用网站', desc: '门户网站' },
      { name: 'QQ邮箱', url: 'https://mail.qq.com', category: '邮箱和域名', desc: 'QQ 邮箱' },
      { name: '网易邮箱', url: 'https://mail.163.com', category: '邮箱和域名', desc: '网易邮箱' }
    ]

    // 批量插入
    let inserted = 0
    for (const item of sampleData) {
      try {
        await env.DB.prepare(`
          INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.name,
          item.url,
          item.category,
          item.desc || '',
          '',
          '',
          0
        ).run()
        inserted++
      } catch (error) {
        console.error(`插入 "${item.name}" 失败:`, error)
      }
    }

    return jsonResponse({
      success: true,
      message: `✅ 已初始化 ${inserted} 条示例数据`,
      inserted
    })

  } catch (error) {
    console.error('初始化数据失败:', error)
    return jsonResponse({
      error: '初始化失败',
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
