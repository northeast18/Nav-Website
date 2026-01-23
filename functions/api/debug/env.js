// 调试端点 - 检查环境变量和绑定
export async function onRequest(context) {
  const { env, request } = context

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      bindings: {
        DB: !!env.DB,
        NAV_KV: !!env.NAV_KV,
        PRIVATE_PASSWORD: !!env.PRIVATE_PASSWORD
      },
      testDB: null,
      testKV: null
    }

    // 测试 D1 数据库
    if (env.DB) {
      try {
        const testResult = await env.DB.prepare('SELECT COUNT(*) as count FROM websites').first()
        debugInfo.testDB = {
          status: 'ok',
          tableExists: true,
          count: testResult?.count || 0
        }
      } catch (error) {
        debugInfo.testDB = {
          status: 'error',
          message: error.message
        }
      }
    } else {
      debugInfo.testDB = {
        status: 'not_bound',
        message: 'D1 database not bound to Pages Functions'
      }
    }

    // 测试 KV
    if (env.NAV_KV) {
      try {
        await env.NAV_KV.put('test-key', 'test-value', { expirationTtl: 60 })
        const value = await env.NAV_KV.get('test-key')
        debugInfo.testKV = {
          status: 'ok',
          working: value === 'test-value'
        }
      } catch (error) {
        debugInfo.testKV = {
          status: 'error',
          message: error.message
        }
      }
    } else {
      debugInfo.testKV = {
        status: 'not_bound',
        message: 'KV namespace not bound to Pages Functions'
      }
    }

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Debug failed',
      message: error.message
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
