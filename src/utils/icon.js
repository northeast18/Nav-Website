/**
 * 图标工具函数
 * 优先使用网站原生 favicon，解决无法访问 Google 的问题
 */

// dashboardicons 图标映射表（仅用于精确匹配已知服务）
const DASHBOARD_ICON_MAP = {
  // 常用网站
  'github': 'github',
  'gitlab': 'gitlab',
  'bitbucket': 'bitbucket',
  'youtube': 'youtube',
  'twitter': 'twitter',
  'x.com': 'twitter',
  'facebook': 'facebook',
  'instagram': 'instagram',
  'reddit': 'reddit',
  'discord': 'discord',
  'slack': 'slack',
  'notion': 'notion',
  'figma': 'figma',
  'spotify': 'spotify',
  'netflix': 'netflix',
  'amazon': 'amazon',
  'stackoverflow': 'stackoverflow',
  'medium': 'medium',
  'zhihu': 'zhihu',
  'bilibili': 'bilibili',
  'douyin': 'douyin',
  'juejin': 'juejin',

  // 云服务
  'cloudflare': 'cloudflare',
  'vercel': 'vercel',
  'heroku': 'heroku',
  'digitalocean': 'digitalocean',
  'aws': 'aws',
  'azure': 'azure',
  'google': 'google',
  'microsoft': 'microsoft',
  'apple': 'apple',

  // 开发工具
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'vuejs': 'vue-js',
  'reactjs': 'react',
  'nextjs': 'nextjs',
  'tailwindcss': 'tailwindcss',

  // AI 工具
  'deepseek': 'deepseek',
  'openai': 'openai',
  'anthropic': 'anthropic',
  'claude': 'claude',
  'chatgpt': 'chatgpt',
  'siliconflow': 'siliconflow',
  'perplexity': 'perplexity',
  'cursor': 'cursor',

  // 浏览器
  'brave': 'brave',
  'chrome': 'google-chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'microsoft-edge',

  // 密码管理
  '1password': '1password',
  'bitwarden': 'bitwarden',

  // 监控
  'sentry': 'sentry',
  'grafana': 'grafana',

  // CI/CD
  'jenkins': 'jenkins',
  'circleci': 'circleci',

  // 部署平台
  'render': 'render',
  'supabase': 'supabase',

  // 数据库
  'mongodb': 'mongodb',
  'redis': 'redis',
  'postgresql': 'postgresql',
  'mysql': 'mysql',

  // ORM
  'prisma': 'prisma',

  // 服务器
  'nginx': 'nginx',
  'apache': 'apache',

  // 自托管
  'portainer': 'portainer',
  'uptime-kuma': 'uptime-kuma',
  'dozzle': 'dozzle',
  'gotify': 'gotify',
  'searxng': 'searxng',
  'adguard': 'adguard',
  'stirling-pdf': 'stirling-pdf',

  // 下载
  'qbittorrent': 'qbittorrent',

  // 媒体
  'immich': 'immich',
  'jellyfin': 'jellyfin',
  'plex': 'plex',
  'emby': 'emby',

  // 文件管理
  'filebrowser': 'filebrowser',
  'it-tools': 'it-tools',
  'alist': 'alist',

  // 自动化
  'n8n': 'n8n',
  'homeassistant': 'home-assistant',

  // 网络
  'tailscale': 'tailscale',
}

/**
 * 从 URL 中提取域名
 */
function extractHostname(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch (e) {
    return ''
  }
}

/**
 * 查找 dashboardicons 图标
 */
function findDashboardIcon(url) {
  const hostname = extractHostname(url).toLowerCase()
  if (!hostname) return null

  // 1. 精确匹配完整域名
  if (DASHBOARD_ICON_MAP[hostname]) {
    return DASHBOARD_ICON_MAP[hostname]
  }

  // 2. 精确匹配主域名（如 huggingface.co -> huggingface）
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    const mainPart = parts[0]
    if (DASHBOARD_ICON_MAP[mainPart]) {
      return DASHBOARD_ICON_MAP[mainPart]
    }
  }

  // 3. 部分匹配，但要排除一些特殊情况（比如 gemini.google.com 不能匹配成 google）
  for (const [key, value] of Object.entries(DASHBOARD_ICON_MAP)) {
    if (hostname.includes(key) || key.includes(hostname)) {
      // 防止类似于 gemini.google.com 被硬生生匹配成 key='google' 的情况，
      // 只有在没有更具体子域名匹配的情况下才 fallback，这里严格限制一下
      if (key === 'google' && hostname.includes('gemini')) {
        return 'gemini'
      }
      return value
    }
  }

  return null
}

/**
 * 获取网站原生 favicon
 * 优先使用 /favicon.ico
 */
function getNativeFavicon(url) {
  const hostname = extractHostname(url)
  if (!hostname) return null

  // 优先使用网站的原生 favicon
  return `https://${hostname}/favicon.ico`
}

/**
 * 获取网站图标 URL
 * 优先级：
 * 1. 手动设置的 iconUrl
 * 2. dashboardicons.com 本地图标（仅针对已知服务）
 * 3. 网站原生 favicon（最重要！）
 * 4. unavatar.io（聚合多个源）
 * 5. DuckDuckGo（备用）
 * 
 * @param {string} url - 网站URL
 * @param {string} iconUrl - 手动设置的图标URL
 * @returns {string} 图标URL
 */
export function getIconUrl(url, iconUrl = '') {
  // 1. 优先用手动填的链接
  if (iconUrl) return iconUrl

  // 2. 尝试 dashboardicons 本地图标（仅针对有映射的）
  const dashboardIconName = findDashboardIcon(url)
  if (dashboardIconName) {
    return `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${dashboardIconName}.svg`
  }

  const hostname = extractHostname(url)
  if (!hostname) return ''

  // 判断是否是内网 IP 或 localhost
  const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)

  if (isLocal) {
    // 3a. 内网地址直接使用原生 favicon
    return `https://${hostname}/favicon.ico`
  } else {
    // 3b. 公网地址优先使用 favicon.im 获取图标
    return `https://favicon.im/${hostname}`
  }
}

/**
 * 获取 favicon URL（用于兼容性场景）
 */
export function getFaviconUrl(url) {
  return getNativeFavicon(url) || ''
}

/**
 * 检查图标是否可访问
 */
export async function checkIconAvailable(iconUrl) {
  try {
    const response = await fetch(iconUrl, { method: 'HEAD', mode: 'no-cors' })
    return response.ok || response.type === 'opaque'
  } catch (e) {
    return false
  }
}

/**
 * 获取图标 URL 列表（用于备用）
 */
export function getFallbackIconUrls(url) {
  const urls = []
  const hostname = extractHostname(url)

  if (hostname) {
    const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)

    if (isLocal) {
      urls.push(`https://${hostname}/favicon.ico`)
    } else {
      urls.push(`https://favicon.im/${hostname}`)
      urls.push(`https://icon.horse/icon/${hostname}`)
      urls.push(`https://${hostname}/favicon.ico`)
      urls.push(`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`)
    }
  }

  return urls
}
