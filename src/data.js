// 导航网站数据 - 从 API 动态加载

import { getIconUrl } from './utils/icon'

/**
 * 从 D1 数据库加载导航网站数据
 * @returns {Promise<Array>} 分类数据列表
 */
export async function fetchNavItems(token = null) {
  try {
    const userToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : null)
    const headers = {}
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`
    }

    const apiPath = `${window.location.origin}/api/websites/read`
    console.log('正在加载导航数据:', apiPath)

    const response = await fetch(apiPath, {
      headers,
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    if (!Array.isArray(data.navItems)) {
      console.error('API 返回的数据格式不正确:', data)
      throw new Error('navItems 不是数组')
    }

    console.log(`✓ 成功加载 ${data.navItems.length} 个分类`, data.navItems)
    return data.navItems

  } catch (error) {
    console.error('❌ 加载导航数据失败:', error)

    // 返回空数据结构（降级处理）
    return getEmptyNavItems()
  }
}

/**
 * 获取示例数据结构（用于首次部署或模板）
 */
function getEmptyNavItems() {
  return [
    {
      category: 'AI工具',
      items: [
        {
          id: 1,
          name: 'DeepSeek',
          url: 'https://deepseek.com',
          desc: '国产 AI 搜索引擎',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 2,
          name: '硅基流动',
          url: 'https://siliconflow.cn',
          desc: 'AI 模型服务平台',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '云服务和服务器',
      items: [
        {
          id: 3,
          name: '阿里云',
          url: 'https://aliyun.com',
          desc: '云计算服务平台',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 4,
          name: '腾讯云',
          url: 'https://cloud.tencent.com',
          desc: '云服务提供商',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '互联网工具',
      items: [
        {
          id: 5,
          name: 'Gitee',
          url: 'https://gitee.com',
          desc: '国产代码托管平台',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 6,
          name: 'CSDN',
          url: 'https://csdn.net',
          desc: '开发者社区',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '娱乐',
      items: [
        {
          id: 7,
          name: '抖音',
          url: 'https://douyin.com',
          desc: '短视频平台',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 8,
          name: 'Bilibili',
          url: 'https://bilibili.com',
          desc: '弹幕视频网站',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '常用网站',
      items: [
        {
          id: 9,
          name: '百度',
          url: 'https://baidu.com',
          desc: '搜索引擎',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 10,
          name: '腾讯',
          url: 'https://qq.com',
          desc: '门户网站',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '邮箱和域名',
      items: [
        {
          id: 11,
          name: 'QQ邮箱',
          url: 'https://mail.qq.com',
          desc: 'QQ 邮箱',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        },
        {
          id: 12,
          name: '网易邮箱',
          url: 'https://mail.163.com',
          desc: '网易邮箱',
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }
      ]
    },
    {
      category: '我的服务',
      items: []  // 留空，个人数据
    },
    {
      category: '私密',
      items: []  // 留空，需要密码
    }
  ]
}

// ========== 搜索引擎配置 ==========
export const searchEngines = [
  {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico'
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico'
  },
  {
    name: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
  },
  {
    name: 'GitHub',
    url: 'https://github.com/search?q=',
    icon: 'https://github.com/favicon.ico',
    darkIcon: true
  },
  {
    name: '导航搜索',
    url: 'local://nav-search',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    isLocal: true  // 标记为本地搜索
  }
]

// ========== 友谊链接 ==========
/**
 * 从 D1 数据库加载友谊链接
 * @returns {Promise<Array>} 友谊链接列表
 */
export async function fetchFriendLinks() {
  try {
    const apiPath = `${window.location.origin}/api/websites/read`

    const response = await fetch(apiPath, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // 从分类中找到"友谊链接"分类
    if (!Array.isArray(data.navItems)) {
      return []
    }

    const friendCategory = data.navItems.find(cat => cat.category === '友谊链接')

    if (!friendCategory || !Array.isArray(friendCategory.items)) {
      return []
    }

    // 转换为友谊链接格式
    return friendCategory.items.map(item => ({
      id: item.id,
      name: item.name,
      url: item.url,
      desc: item.desc || '',
      icon: getIconUrl(item.url, item.iconUrl),
      category: '友谊链接'
    }))

  } catch (error) {
    console.error('❌ 加载友谊链接失败:', error)
    // 返回静态数据作为降级处理
    return [
      { name: 'GitHub', url: 'https://github.com', icon: getIconUrl('https://github.com') },
      { name: 'Vercel', url: 'https://vercel.com', icon: getIconUrl('https://vercel.com') },
      { name: 'Cloudflare', url: 'https://cloudflare.com', icon: getIconUrl('https://cloudflare.com') }
    ]
  }
}

// 保持向后兼容，静态数据作为降级使用
export const friendLinks = [
  { name: 'GitHub', url: 'https://github.com', icon: getIconUrl('https://github.com') },
  { name: 'Vercel', url: 'https://vercel.com', icon: getIconUrl('https://vercel.com') },
  { name: 'Cloudflare', url: 'https://cloudflare.com', icon: getIconUrl('https://cloudflare.com') }
]

// ========== 说明 ==========
// 原静态数据已迁移到 D1 数据库
// 使用以下命令迁移数据：
// curl -X POST http://localhost:8788/api/migrate \
//   -H "Authorization: Bearer your_password"
//
// 原 data.js.backup 包含原始静态数据
