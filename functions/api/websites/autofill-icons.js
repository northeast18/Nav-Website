/**
 * 自动填充网站图标 API
 * 
 * 根据网址自动获取并填充图标链接，持久化存入 Cloudflare R2
 * 支持两种模式：
 * 1. 批量填充：为数据库中所有缺少图标或外部死链的网站自动抓取并存入 R2
 * 2. 单个填充：根据提供的 URL 自动获取图标
 */

import {
  authenticateRequest,
  unauthorizedResponse,
  jsonResponse,
  corsOptionsResponse
} from '../_middleware.js'

function extractHostname(input) {
  if (!input) return ''
  try {
    let raw = input.trim()
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'https://' + raw
    }
    const hostname = new URL(raw).hostname.toLowerCase()
    return hostname.replace(/^www\./, '')
  } catch (e) {
    return input.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase()
  }
}

async function getAutoIconUrl(url, env) {
  try {
    const hostname = extractHostname(url)
    if (!hostname) return ''

    const r2Key = `icons/${hostname}.png`

    // 如果绑定了 R2，优先检查或写入 R2
    if (env && env.NAV_IMAGES) {
      try {
        const existing = await env.NAV_IMAGES.get(r2Key)
        if (existing) {
          return `/api/img/${r2Key}`
        }

        // 尝试抓取候选源并直接写入 R2
        const sources = [
          `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
          `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
          `https://${hostname}/favicon.ico`,
          `https://icon.horse/icon/${hostname}`
        ]

        for (const source of sources) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3500)
            const res = await fetch(source, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: controller.signal
            })
            clearTimeout(timeoutId)

            if (res.ok) {
              const cType = res.headers.get('content-type') || ''
              if (cType.includes('image') || cType.includes('icon') || cType.includes('octet-stream')) {
                const buf = await res.arrayBuffer()
                if (buf && buf.byteLength > 40) {
                  await env.NAV_IMAGES.put(r2Key, buf, {
                    httpMetadata: { contentType: cType.includes('image') ? cType : 'image/png' },
                    customMetadata: { domain: hostname, updatedAt: new Date().toISOString() }
                  })
                  return `/api/img/${r2Key}`
                }
              }
            }
          } catch (e) {
            // 继续下一个候选源
          }
        }
      } catch (r2Err) {
        console.warn(`[AutoFill] R2 操作失败:`, r2Err.message)
      }
    }

    // 默认使用本地 /api/icon 服务端代抓与缓存
    return `/api/icon?domain=${hostname}`
  } catch (e) {
    return ''
  }
}

export async function onRequest(context) {
  const { request, env } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'GET', 'OPTIONS'])
  }

  try {
    // 验证会话（可选，如果不传则跳过验证）
    let user = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      user = await authenticateRequest(request, env)
      if (!user) {
        return unauthorizedResponse('需要登录')
      }
    }

    if (request.method === 'POST') {
      // 批量填充模式：为缺少图标或需要修复的网站填充图标
      return await handleBatchAutoFill(request, env)
    } else if (request.method === 'GET') {
      // 单个获取模式：根据 URL 获取图标
      return await handleSingleIcon(request, env)
    } else {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

  } catch (error) {
    console.error('自动填充图标失败:', error)
    return jsonResponse({
      error: '操作失败',
      message: error.message
    }, 500)
  }
}

// 批量自动填充
async function handleBatchAutoFill(request, env) {
  const data = await request.json().catch(() => ({}))

  const limit = data.limit || 150
  const dryRun = data.dryRun || false

  // 查询缺少图标或使用了境外易被阻断的第三方图标链接的网站
  const result = await env.DB.prepare(`
    SELECT id, url, name, icon_url FROM websites 
    WHERE icon_url IS NULL 
       OR icon_url = '' 
       OR icon_url LIKE '%google.com/s2/favicons%' 
       OR icon_url LIKE '%favicon.im%'
       OR icon_url LIKE '%api.iowen.cn%'
    LIMIT ?
  `).bind(limit).all()

  const websites = result.results || []

  if (websites.length === 0) {
    return jsonResponse({
      success: true,
      message: '没有需要填充或修复图标的网站',
      processed: 0
    })
  }

  if (dryRun) {
    const preview = await Promise.all(websites.map(async w => ({
      id: w.id,
      url: w.url,
      name: w.name,
      oldIconUrl: w.icon_url,
      autoIconUrl: await getAutoIconUrl(w.url, env)
    })))
    return jsonResponse({
      success: true,
      message: `发现 ${websites.length} 个网站需要填充图标（试运行模式）`,
      processed: 0,
      preview
    })
  }

  let updated = 0
  const errors = []

  for (const website of websites) {
    try {
      const iconUrl = await getAutoIconUrl(website.url, env)
      if (iconUrl) {
        await env.DB.prepare(`
          UPDATE websites SET icon_url = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(iconUrl, website.id).run()
        updated++
      }
    } catch (err) {
      errors.push({
        id: website.id,
        name: website.name,
        error: err.message
      })
    }
  }

  return jsonResponse({
    success: true,
    message: `成功为 ${updated} 个网站更新持久化图标`,
    processed: updated,
    errors: errors.length > 0 ? errors : undefined
  })
}

// 单个图标获取
async function handleSingleIcon(request, env) {
  const url = new URL(request.url).searchParams.get('url')

  if (!url) {
    return jsonResponse({ error: '缺少 URL 参数' }, 400)
  }

  const iconUrl = await getAutoIconUrl(url, env)

  if (!iconUrl) {
    return jsonResponse({ error: '无法从 URL 中提取域名' }, 400)
  }

  return jsonResponse({
    success: true,
    url: url,
    iconUrl: iconUrl
  })
}
