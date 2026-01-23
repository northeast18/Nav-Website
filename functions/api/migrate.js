// 数据迁移 API
// 注意：此 API 已废弃，请使用 /migrate.html 页面进行迁移

export async function onRequest(context) {
  return new Response(JSON.stringify({
    success: false,
    error: '此 API 已废弃',
    message: '请访问 /migrate.html 使用迁移工具'
  }), {
    status: 410,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
