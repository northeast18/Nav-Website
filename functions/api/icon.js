/**
 * Cloudflare Pages Function: /api/icon
 * 
 * 作用：服务端代抓并持久化缓存网站图标
 * 解决国内移动端/无代理环境下无法访问 Google Favicon 及境外图标源的问题
 * 
 * 流程：
 * 1. 解析请求中的 domain 或 url 参数
 * 2. 检查 Cloudflare R2 (env.NAV_IMAGES) 中是否已有 icons/${domain}.png
 *    - 如果有，直接返回并设置强缓存 (30天)
 * 3. 如果没有，服务端在不受国内网络限制的 Cloudflare 边缘网络抓取图标：
 *    - Google S2 Favicon 服务 (128x128 高清)
 *    - DuckDuckGo Favicon 服务
 *    - 网站原生 /favicon.ico
 *    - Icon Horse 服务
 * 4. 成功获取后，异步存入 R2 实现永久缓存，同时流式返回给客户端
 * 5. 若全部失败，返回精美 SVG 地球占位符，避免前端死链报错
 */

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`

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

async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ...(options.headers || {})
      }
    })
    clearTimeout(timeoutId)
    return response
  } catch (e) {
    clearTimeout(timeoutId)
    return null
  }
}

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const reqUrl = new URL(request.url)
  const domainParam = reqUrl.searchParams.get('domain')
  const urlParam = reqUrl.searchParams.get('url')
  const refresh = reqUrl.searchParams.get('refresh') === '1'

  const hostname = extractHostname(domainParam || urlParam)

  if (!hostname) {
    return new Response(DEFAULT_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  const r2Key = `icons/${hostname}.png`

  // 1. 如果不是强制刷新，且已绑定 R2，优先从 R2 缓存读取
  if (!refresh && env.NAV_IMAGES) {
    try {
      const cached = await env.NAV_IMAGES.get(r2Key)
      if (cached) {
        const headers = new Headers()
        cached.writeHttpMetadata(headers)
        headers.set('etag', cached.httpEtag)
        headers.set('Cache-Control', 'public, max-age=2592000, immutable') // 缓存30天
        headers.set('Access-Control-Allow-Origin': '*')
        return new Response(cached.body, { headers })
      }
    } catch (e) {
      console.warn(`[Icon] R2 读取失败 (${hostname}):`, e.message)
    }
  }

  // 2. 服务端在不受限的海外网络抓取图标
  const candidateSources = [
    // 优先：Google Favicon 128px（高清稳定）
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
    // 备选 1：DuckDuckGo 图标服务
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    // 备选 2：网站原生 /favicon.ico
    `https://${hostname}/favicon.ico`,
    // 备选 3：Icon Horse
    `https://icon.horse/icon/${hostname}`
  ]

  let imageBuffer = null
  let contentType = 'image/png'

  for (const src of candidateSources) {
    const res = await fetchWithTimeout(src, {}, 3500)
    if (res && res.ok) {
      const cType = res.headers.get('content-type') || ''
      // 必须是图片格式且状态码正常
      if (cType.includes('image') || cType.includes('icon') || cType.includes('octet-stream')) {
        const buf = await res.arrayBuffer()
        // 过滤空响应或过小（< 40 字节多为损坏数据）
        if (buf && buf.byteLength > 40) {
          imageBuffer = buf
          contentType = cType.includes('image') ? cType : 'image/png'
          break
        }
      }
    }
  }

  // 3. 如果成功抓取到图片，保存至 R2 并返回
  if (imageBuffer) {
    if (env.NAV_IMAGES) {
      try {
        await env.NAV_IMAGES.put(r2Key, imageBuffer, {
          httpMetadata: {
            contentType: contentType
          },
          customMetadata: {
            domain: hostname,
            updatedAt: new Date().toISOString()
          }
        })
      } catch (e) {
        console.warn(`[Icon] R2 写入缓存失败 (${hostname}):`, e.message)
      }
    }

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  // 4. 全部失败，返回默认 SVG
  return new Response(DEFAULT_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
