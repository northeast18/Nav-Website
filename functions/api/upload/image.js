import { getAdminPassword } from '../_middleware.js'

// 上传图片到 R2 (兼容 PicList 命名格式)
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
  const correctPassword = await getAdminPassword(env)
  if (!correctPassword || adminPassword !== correctPassword) {
    return jsonResponse({ error: '管理员密码错误' }, 401)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return jsonResponse({ error: '未找到文件' }, 400)
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return jsonResponse({ error: '只能上传图片文件' }, 400)
    }

    // 验证文件大小 (限制 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return jsonResponse({ error: '图片大小不能超过 2MB' }, 400)
    }

    // 读取文件内容以计算 MD5
    const arrayBuffer = await file.arrayBuffer()
    
    // 计算 MD5
    // 注意：Cloudflare Workers 环境支持 crypto.subtle.digest('MD5', ...)
    const hashBuffer = await crypto.subtle.digest('MD5', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 生成时间路径 {year}/{month}
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')

    // 获取扩展名
    const originalName = file.name || 'image.png'
    const ext = originalName.split('.').pop().toLowerCase()

    // 组合最终 Key: {year}/{month}/{md5}.{extName}
    const key = `${year}/${month}/${hashHex}.${ext}`

    // 上传到 R2
    // 注意：这里我们使用 arrayBuffer 而不是 file.stream()，因为上面已经读取过了
    await env.NAV_IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: originalName,
        uploadedBy: 'Nav-Website'
      }
    })

    // 返回访问 URL
    // 前端显示的路径 /api/img/2024/05/abc...def.png
    const url = `/api/img/${key}`

    return jsonResponse({
      success: true,
      url: url,
      message: '上传成功'
    })

  } catch (error) {
    console.error('上传图片失败:', error)
    return jsonResponse({
      error: '上传失败',
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
