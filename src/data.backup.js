export const navItems = [
  {
    category: '我的服务',
  items: [
    {
      id: 1,
      name: 'Homepage',
      desc: '私有服务导航',
      url: 'http://localhost:3000', 
      iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/homepage.png' 
    },
    {
      id: 2,
      name: 'Vaultwarden',
      desc: '密码管理',
      url: 'https://pass.jishu.de5.net',
      lanUrl: 'http://localhost:8080',
      iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/vaultwarden.png',
      darkIcon: true
    },
    {
      id: 3,
      name: 'Joplin',
      desc: '笔记服务',
      url: 'https://joplin.jishu.de5.net', 
      iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/joplin.png'     
    },
    {
      id: 4,
      name: 'immich',
      url: 'https://image.jishu.de5.net',
      lanUrl: 'http://localhost:12580',
      desc: '相册备份',
      iconUrl: '/immich.png' // ✅ 直接本地图片
    },
    {
      id: 5,
      name: 'Portainer',
      url: 'https://localhost:9443/',
      desc: 'docker管理',
      iconUrl: '/portainer.png' // ✅ 直接本地图片
    },
    {
      id: 6,
      name: 'Uptime-Kuma',
      url: 'https://uptime.jishu.de5.net',
      lanUrl: 'http://localhost:3001',
      desc: '服务器监控',
      iconUrl: '/uptime-kuma.png' // ✅ 直接本地图片
    },
    {
      id: 7,
      name: 'Gotify',
      url: 'https://gotify.jishu.de5.net',
      lanUrl: 'http://localhost:8084',
      desc: '消息推送',
      iconUrl: '/gotify.png' // ✅ 直接本地图片
    },
    {
      id: 8,
      name: 'SearXNG',
      url: 'https://serch.jishu.de5.net',
      lanUrl: 'http://localhost:38080',
      desc: '私人搜索引擎',
      iconUrl: '/searxng.png' // ✅ 直接本地图片
    },
    {
      id: 9,
      name: 'IT-tools',
      url: 'https://tools.jishu.de5.net',
      lanUrl: 'http://localhost:8081',
      desc: 'IT 工具箱',
      iconUrl: '/it-tools.png' // ✅ 直接本地图片
    },
    {
      id: 10,
      name: 'HivisionIDPhotos',
      url: 'https://photo.jishu.de5.net',
      lanUrl: 'http://localhost:7860',
      desc: 'Ai 证件照生成',
      iconUrl: '/hivision-idphotos.png' // ✅ 直接本地图片
    },
    {
      id: 11,
      name: 'OpenList',
      url: 'https://alist.jishu.de5.net',
      lanUrl: 'http://localhost:5244',
      desc: '网盘列表',
      iconUrl: '/openlist.png' // ✅ 直接本地图片
    },
    {
      id: 12,
      name: 'Dozzle',
      url: 'https://gotify.jishu.de5.net',
      lanUrl: 'http://localhost:8084',
      desc: '容器日志',
      iconUrl: '/dozzle.png' // ✅ 直接本地图片
    },
    {
      id: 13,
      name: 'File Browser',      
      url: 'http://localhost:8082',
      desc: '文件浏览器',
      iconUrl: '/filebrowser.png' 
    },
    {
      id: 14,
      name: 'Stirling PDF',      
      url: 'http://localhost:8083',
      desc: 'PDF 工具',
      iconUrl: '/stirling-pdf.png' 
    },
    {
      id: 15,
      name: 'ChangeDetection',      
      url: 'http://localhost:5000',
      desc: '网页变化监测',
      iconUrl: '/changedetection.png' 
    },
    {
      id: 17,
      name: 'qBittorrent',      
      url: 'http://localhost:8085',
      desc: 'BT下载',
      iconUrl: '/qbittorrent.png' 
    },
    {
      id: 18,
      name: 'Notion 博客',      
      url: 'https://blog.jishu.de5.net/',
      desc: 'Notion 博客',
      iconUrl: '/notion.png'
    },
    {
      id: 19,
      name: 'ImgHub',      
      url: 'https://image.xiaoxiao19.dpdns.org/',
      desc: '个人图床',
      iconUrl: '/img-hub.png' 
    },
    {
      id: 20,
      name: '订阅管理',      
      url: 'https://tz.xiaoxiao19.dpdns.org/',
      desc: '通知提醒',
      iconUrl: '/icon.png' 
    },

  ]
  },
  {    
    category: '云服务和服务器',
    items: [
      {
        id: 1,
        name: 'Cloudflare',
        url: 'https://dash.cloudflare.com',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/cloudflare.png',
        desc: 'CDN 和 DNS 服务'
      },
      {
        id: 2,
        name: 'Vercel',
        url: 'https://vercel.com',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/vercel-light.png',        
        desc: '前端部署平台',
        darkIcon: true 
      },
      {
        id: 3,
        name: 'GitHub',
        url: 'https://github.com',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/github-light.png', 
        desc: '代码托管'
      },
      {
        id: 4,
        name: 'Docker Hub',
        url: 'https://hub.docker.com',
         iconUrl: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png',
  // 这个图标本来是蓝的，加上这个让它变成纯白，非常有质感
         darkIcon: true ,
        desc: '容器镜像仓库'
      },
      {
        id: 5,
        name: 'Railway',
        url: 'https://railway.com/',
        icon: 'link',
        desc: '云主机服务'
      },
      {
        id: 6,
        name: 'KataBump',
        url: 'https://dashboard.katabump.com/dashboard',
        icon: 'link',
        desc: '云主机'
      },
      {
        id: 7,
        name: 'Koyeb',
        url: 'https://www.koyeb.com/',
        icon: 'link',
        desc: '云主机'
      },      
      {
        id: 9,
        name: 'Wispbyte',
        url: 'https://wispbyte.com/',
        icon: 'link',
        desc: '云主机'
      },
      {
        id: 8,
        name: ' Oracle Cloud ',
        url: 'https://cloud.oracle.com/',
        icon: 'cloud',
        desc: '云服务'
      },
      {
        id: 10,
        name: 'claw cloud',
        url: 'https://us-east-1.run.claw.cloud/',
        icon: 'cloud',
        desc: '云服务',
        darkIcon: true
      },
      {
        id: 12,
        name: 'Render',
        url: 'https://dashboard.render.com/',
        icon: 'link',
        desc: '云服务',
        darkIcon: true
      }

    ]
  },
  {
    category: '开发工具',
    items: [
      {
        id: 1,
        name: 'VS Code',
        url: 'https://code.visualstudio.com',
        desc: '代码编辑器',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/vscode.png'
      },
      {
        id: 2,
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/stackoverflow.png',
        desc: '技术问答'
      },
      {
        id: 3,
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        icon: 'book',
        desc: 'Web 开发文档'
      },
      {
        id: 4,
        name: 'Vue.js',
        url: 'https://vuejs.org',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/vue-js.png',
        desc: '渐进式框架'
      },
      {
        id: 5,
        name: 'Tailwind CSS',
        url: 'https://tailwindcss.com',
        icon: 'wind',
        desc: 'CSS 框架'
      },
      {
        id: 6,
        name: 'UptimeRobot',
        url: 'https://uptimerobot.com/',
        icon: 'link',
        desc: '自动保活网站'
      },
      {
        id: 7,
        name: ' Resend邮件',
        url: 'https://resend.com/domains/',
        icon: 'link',
        desc: '邮件转发'
      },

    ]
  },
  {
    category: '邮箱和域名',
    items: [
      {
        id: 1,
        name: 'Cloud Mail',
        url: 'https://mail.jishux.dpdns.org/',
        iconUrl: '/mail.png',
        desc: '邮箱'
      },
      {
        id: 2,
        name: '163网易免费邮',
        url: 'https://mail.163.com/',
        icon: 'mlink',
        desc: '邮箱'
      },
      {
        id: 3,
        name: ' Gmail',
        url: 'https://mail.google.com/mail/u/0/#inbox',
        icon: 'link',
        desc: '搜索引擎'
      },
      {
        id: 4,
        name: 'QQ邮箱',
        url: 'https://mail.qq.com/',
        icon: 'link',
        desc: '邮箱'
      },
      {
        id: 5,
        name: 'DNSHE',
        url: 'https://my.dnshe.com/',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 7,
        name: 'EU.org',
        url: 'https://nic.eu.org/arf/en/contact/create/',
        icon: 'link',
        desc: '域名管理'
      },      
      {
        id: 8,
        name: 'nic.ua域名',
        url: 'https://nic.ua/en/my/domains',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 6,
        name: 'dpdns域名',
        url: 'https://dash.domain.digitalplat.org/',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 9,
        name: 'idc.lc域名',
        url: 'https://www.idc.lc/',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 11,
        name: ' L53域名',
        url: 'https://customer.l53.net/',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 10,
        name: '9v4域名',
        url: 'https://store.9v4.com/order/',
        icon: 'link',
        desc: '域名管理'
      },
      {
        id: 12,
        name: 'Indevs',
        url: 'https://domain.stackryze.com/',
        icon: 'link',
        desc: '域名管理'
      },
    ]
  },
  {
    category: 'AI工具',
    items: [
      {
        id: 1,
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        desc: 'AI 助手',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/chatgpt.png'        
      },
      {
        id: 2,
        name: 'Claude',
        url: 'https://claude.ai',
        iconUrl: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/claude-ai.svg',
        desc: 'AI 对话'
      },
      {
        id: 3,
        name: 'Midjourney',
        url: 'https://www.midjourney.com',
        icon: 'sparkles',
        desc: 'AI 绘画'
      },
      {
        id: 4,
        name: 'Hugging Face',
        url: 'https://huggingface.co',
        icon: 'smile',
        desc: 'AI 模型平台'
      },
      {
        id: 5,
        name: '智谱AI开放平台',
        url: 'https://open.bigmodel.cn/',
        icon: 'link',
        desc: 'AI开放平台'
      },
      {
        id: 6,
        name: '硅基流动',
        url: 'https://account.siliconflow.cn/',
        icon: 'link',
        desc: 'AI开放平台'
      },
      {
        id: 6,
        name: 'DeepSeek',
        url: 'https://www.deepseek.com/',
        icon: 'link',
        desc: 'AI开放平台'
      },
      {
        id: 7,
        name: 'Chatbox AI',
        url: 'https://chatboxai.app/',
        icon: 'link',
        desc: 'AI开放平台'
      },
      {
        id: 8,
        name: 'Google AI Studio',
        url: 'https://aistudio.google.com/',
        icon: 'search',
        desc: 'Ai工具'
      },
      {
        id: 9,
        name: 'Felo',
        url: 'https://felo.ai/search',
        icon: 'link',
        desc: 'AI智能搜索'
      },
      {
        id: 10,
        name: 'Gemini',
        url: 'https://business.gemini.google/',
        icon: 'search',
        desc: 'Ai工具'
      }
    ]
  },
  {
    category: '常用网站',
    items: [
      {
        id: 1,
        name: '阿虚同学的储物间',
        url: 'https://axutongxue.net/',
        icon: 'link',
        desc: '常用网站'        
      },
      {
        id: 2,
        name: '零度博客',
        url: 'https://www.freedidi.com/',
        icon: 'link',
        desc: '常用网站'
      },
      {
        id: 3,
        name: 'NodeLoc ',
        url: 'https://www.nodeloc.com/',
        icon: 'link',
        desc: '互联网社区'
      },
      {
        id: 4,
        name: '老王导航',
        url: 'https://nav.eooce.com/',
        icon: 'link',
        desc: '常用网站'
      },
      {
        id: 5,
        name: 'HelloGitHub',
        url: 'https://github.com/521xueweihan/HelloGitHub',
        icon: 'github',
        desc: '代码托管'
      },
      {
        id: 6,
        name: 'GitHub中文排行榜',
        url: 'https://github.com/GrowingGit/GitHub-Chinese-Top-Charts',
        icon: 'link',
        desc: 'itHub中文排行榜'
      },
      {
        id: 7,
        name: 'GitHub 中文社区',
        url: 'https://www.github-zh.com/top-china',
        icon: 'github',
        desc: 'GitHub 中文社区',
        darkIcon: true
      },
      
      {
        id: 8,
        name: 'Greasy Fork ',
        url: 'https://greasyfork.org/zh-CN',
        icon: 'link',
        desc: '常用网站'
      },
      {
        id: 9,
        name: 'dashboardicons',
        url: 'https://dashboardicons.com/',
        icon: 'link',
        desc: '软件图标搜索'
      },
      {
        id: 10,
        name: 'Font Awesome',
        url: 'https://fontawesome.com',
        icon: 'link',
        desc: '图标库'
      },

    ]
  },
  {
    category: '互联网工具',
    items: [
      {
        id: 1,
        name: 'WHOER',
        url: 'https://whoer.com/zh/',
        icon: 'link',
        desc: 'IP归属地查询'       
      },
      {
        id: 2,
        name: ' 站长工具',
        url: 'https://ping.chinaz.com/',
        icon: 'link',
        desc: 'dns查询'
      },
      {
        id: 3,
        name: 'Ping0.cc',
        url: 'https://ping0.cc/',
        icon: 'link',
        desc: 'IP纯净查询'
      },
      {
        id: 4,
        name: 'IP111',
        url: 'https://www.ip111.cn/',
        icon: 'link',
        desc: '全方位查询自己的IP地址'
      },
      {
        id: 5,
        name: 'IPLark - IP纯净类型',
        url: 'https://iplark.com/',
        icon: 'link',
        desc: 'IP纯净类型'
      },
      {
        id: 6,
        name: 'IP Address Lookup',
        url: 'https://ip.sb/',
        icon: 'link',
        desc: 'IPv4 / IPv6'
      },
      {
        id: 8,
        name: 'Google测速',
        url: 'https://fiber.google.com/speedtest/',
        icon: 'search',
        desc: 'Google测速'
      },
      {
        id: 7,
        name: 'Scamalytics',
        url: 'https://scamalytics.com/',
        icon: 'link',
        desc: '检测欺诈IP'
      },
      {
        id: 9,
        name: 'ipdata',
        url: 'https://ipdata.co/',
        icon: 'link',
        desc: '常用网站'
      }
    ]
  },
  {
    category: '娱乐',
    items: [
      {
        id: 18,
        name: 'YouTube',
        url: 'https://www.youtube.com',
        icon: 'play',
        desc: '视频平台'
      },
      {
        id: 19,
        name: 'Netflix',
        url: 'https://www.netflix.com',
        icon: 'film',
        desc: '流媒体'
      },
      {
        id: 20,
        name: 'Spotify',
        url: 'https://open.spotify.com',
        icon: 'music',
        desc: '音乐平台'
      },
      {
        id: 21,
        name: 'Bilibili',
        url: 'https://www.bilibili.com',
        icon: 'tv',
        desc: '视频网站'
      }
    ]
  },
  {
    category: '私密',
    items: [
      // 在这里添加你不想公开的网址
      // 示例：
      // {
      //   id: 1,
      //   name: '私密服务',
      //   url: 'http://localhost:8080',
      //   desc: '不公开的服务',
      //   iconUrl: '/icon.png'
      // }
     {
      id: 1,
      name: 'cfnew1',
      url: 'https://xx.xiaoxiao19.dpdns.org/sub',
      desc: '节点订阅xiaoxiao',
      iconUrl: '/icon.png'
     },
     {
      id: 2,
      name: 'cfnew2',
      url: 'https://xxx.jishux.dpdns.org/sub',
      desc: '节点订阅jishux',
      icon: 'link'
     },
     {
      id: 3,
      name: 'edgetunnel',
      url: 'https://tun.jishux.dpdns.org/admin',
      desc: '节点订阅',
      icon: 'link'
     },
     {
      id: 4,
      name: 'am-cf-tunnel',
      url: 'https://sub.jishux.dpdns.org/',
      desc: '数字套利',
      icon: 'link'
     },
    ]
  }
]

export const searchEngines = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'search' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'search' },
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'search' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', icon: 'github' },
  { id: 'searxng', name: 'SearXNG', url: 'https://serch.jishu.de5.net/search?q=', icon: 'search' }
]

export const friendLinks = [
  {
    name: 'NodeSeek',
    url: 'https://www.nodeseek.com',
    iconUrl: 'https://www.nodeseek.com/static/image/favicon.png'
  },
  {
    name: 'Linux Do',
    url: 'https://linux.do',
    // 如果没有 iconUrl，会自动用 Google 获取
  },
  {
    name: 'NodeLoc',
    url: 'https://www.nodeloc.com/'
  }
]