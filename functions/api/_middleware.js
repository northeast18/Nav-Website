/**
 * 公共鉴权中间件 - 安全升级（P0）
 *
 * 功能：
 * 1. PBKDF2 密码哈希
 * 2. 会话管理（创建、验证、撤销）
 * 3. 请求鉴权中间件
 * 4. 统一响应格式
 */

// ============================================================================
// 密码哈希 - PBKDF2
// ============================================================================

/**
 * 使用 PBKDF2 哈希密码
 * @param {string} password - 明文密码
 * @param {Uint8Array|null} salt - 盐值（可选，null 时自动生成）
 * @returns {Promise<string>} 格式：saltHex:hashHex
 */
export async function hashPassword(password, salt = null) {
  // 生成随机 salt（16 字节）
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16))
  }

  // 将密码编码
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // 使用 PBKDF2 派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 100,000 次迭代（2024年推荐值）
  const iterations = 100000
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  // 返回格式：salt:hash（都使用 hex 编码）
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')

  return `${saltHex}:${hashHex}`
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} storedHash - 存储的哈希（格式：saltHex:hashHex）
 * @returns {Promise<boolean>} 是否匹配
 */
export async function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':')

    // 如果没有 salt，说明是旧格式（SHA-256）
    if (!saltHex || !hashHex) {
      // 旧格式验证
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return computedHash === storedHash
    }

    // 新格式验证（PBKDF2）
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
    const computedHash = await hashPassword(password, salt)
    return computedHash === storedHash
  } catch (error) {
    console.error('密码验证错误:', error)
    return false
  }
}

/**
 * 检查是否为旧格式哈希（SHA-256）
 * @param {string} hash - 存储的哈希
 * @returns {boolean} 是否为旧格式
 */
export function isOldHashFormat(hash) {
  return !hash.includes(':')
}

// ============================================================================
// 旧版密码哈希（用于迁移）
// ============================================================================

/**
 * 旧版密码哈希（SHA-256，仅用于兼容）
 * @deprecated 仅用于迁移期间验证旧密码
 */
export async function hashPasswordOld(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================================
// Token 和会话管理
// ============================================================================

/**
 * 生成安全随机会话令牌（32 字节 = 256 位）
 * @returns {Promise<string>} 64 字符的 hex 字符串
 */
export async function generateSessionToken() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 计算令牌哈希（用于存储）
 * @param {string} token - 明文令牌
 * @returns {Promise<string>} SHA-256 哈希
 */
export async function hashToken(token) {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 创建会话
 * @param {object} env - Cloudflare 环境对象
 * @param {number} userId - 用户 ID
 * @param {number} days - 有效天数（默认 30 天）
 * @returns {Promise<string>} 明文会话令牌
 */
export async function createSession(env, userId, days = 30) {
  const token = await generateSessionToken()
  const tokenHash = await hashToken(token)

  // 计算过期时间
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  // 存储会话
  await env.DB.prepare(`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, tokenHash, expiresAt.toISOString()).run()

  console.log(`✓ 为用户 ${userId} 创建会话，过期时间：${expiresAt.toISOString()}`)

  return token
}

/**
 * 验证会话并返回用户信息
 * @param {object} env - Cloudflare 环境对象
 * @param {string} token - 明文会话令牌
 * @returns {Promise<object|null>} 用户信息或 null
 */
export async function validateSession(env, token) {
  try {
    const tokenHash = await hashToken(token)

    const session = await env.DB.prepare(`
      SELECT s.user_id, s.expires_at, u.id, u.username
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ?
        AND s.expires_at > datetime('now')
      ORDER BY s.last_used_at DESC
      LIMIT 1
    `).bind(tokenHash).first()

    if (!session) {
      return null
    }

    // 更新最后使用时间
    await env.DB.prepare(`
      UPDATE sessions SET last_used_at = datetime('now')
      WHERE token_hash = ?
    `).bind(tokenHash).run()

    return {
      id: session.id,
      userId: session.user_id,
      username: session.username,
      expiresAt: session.expires_at
    }
  } catch (error) {
    console.error('会话验证错误:', error)
    return null
  }
}

/**
 * 撤销会话（登出）
 * @param {object} env - Cloudflare 环境对象
 * @param {string} token - 明文会话令牌
 * @returns {Promise<boolean>} 是否成功
 */
export async function revokeSession(env, token) {
  try {
    const tokenHash = await hashToken(token)

    const result = await env.DB.prepare(`
      DELETE FROM sessions WHERE token_hash = ?
    `).bind(tokenHash).run()

    return result.success && (result.meta.changes || 0) > 0
  } catch (error) {
    console.error('撤销会话错误:', error)
    return false
  }
}

/**
 * 撤销用户的所有会话
 * @param {object} env - Cloudflare 环境对象
 * @param {number} userId - 用户 ID
 * @returns {Promise<boolean>} 是否成功
 */
export async function revokeAllUserSessions(env, userId) {
  try {
    await env.DB.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `).bind(userId).run()

    return true
  } catch (error) {
    console.error('撤销所有会话错误:', error)
    return false
  }
}

/**
 * 清理过期会话
 * @param {object} env - Cloudflare 环境对象
 * @returns {Promise<number>} 清理的会话数
 */
export async function cleanExpiredSessions(env) {
  try {
    const result = await env.DB.prepare(`
      DELETE FROM sessions WHERE expires_at <= datetime('now')
    `).run()

    const count = result.meta.changes || 0
    if (count > 0) {
      console.log(`✓ 清理了 ${count} 个过期会话`)
    }

    return count
  } catch (error) {
    console.error('清理过期会话错误:', error)
    return 0
  }
}

// ============================================================================
// 防暴力破解 (Rate Limiting)
// ============================================================================

/**
 * 获取客户端真实 IP
 * @param {Request} request - HTTP 请求对象
 * @returns {string} IP 地址
 */
export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         'unknown-ip'
}

/**
 * 检查 IP 是否被锁定
 * @param {object} env - Cloudflare 环境对象
 * @param {string} ip - 客户端 IP
 * @param {string} action - 操作类型 ('login', 'private', 'admin')
 * @returns {Promise<boolean>} 是否被锁定
 */
export async function checkRateLimit(env, ip, action) {
  try {
    const record = await env.DB.prepare(`
      SELECT locked_until FROM rate_limits 
      WHERE ip_address = ? AND action = ?
    `).bind(ip, action).first()

    if (!record || !record.locked_until) return false

    // 如果锁定时间大于当前时间，则说明还在锁定中
    return new Date(record.locked_until) > new Date()
  } catch (error) {
    console.error(`检查频率限制错误 (${ip}, ${action}):`, error)
    return false // 发生错误时放行，避免阻断正常使用
  }
}

/**
 * 记录失败尝试并检查是否需要锁定
 * @param {object} env - Cloudflare 环境对象
 * @param {string} ip - 客户端 IP
 * @param {string} action - 操作类型 ('login', 'private', 'admin')
 * @param {number} maxAttempts - 最大失败次数 (默认 5)
 * @param {number} lockMinutes - 锁定分钟数 (默认 15)
 * @returns {Promise<void>}
 */
export async function recordFailedAttempt(env, ip, action, maxAttempts = 5, lockMinutes = 15) {
  try {
    // 获取当前记录
    const record = await env.DB.prepare(`
      SELECT failed_attempts, locked_until FROM rate_limits 
      WHERE ip_address = ? AND action = ?
    `).bind(ip, action).first()

    const now = new Date()

    if (!record) {
      // 首次失败
      await env.DB.prepare(`
        INSERT INTO rate_limits (ip_address, action, failed_attempts)
        VALUES (?, ?, 1)
      `).bind(ip, action).run()
      return
    }

    // 如果之前被锁定且已过期，重置为1次失败
    if (record.locked_until && new Date(record.locked_until) <= now) {
      await env.DB.prepare(`
        UPDATE rate_limits 
        SET failed_attempts = 1, locked_until = NULL, updated_at = datetime('now')
        WHERE ip_address = ? AND action = ?
      `).bind(ip, action).run()
      return
    }

    // 增加失败次数
    const newAttempts = record.failed_attempts + 1
    
    // 判断是否需要锁定
    if (newAttempts >= maxAttempts) {
      const lockUntil = new Date(now.getTime() + lockMinutes * 60000)
      await env.DB.prepare(`
        UPDATE rate_limits 
        SET failed_attempts = ?, locked_until = ?, updated_at = datetime('now')
        WHERE ip_address = ? AND action = ?
      `).bind(newAttempts, lockUntil.toISOString(), ip, action).run()
      console.log(`[RateLimit] IP ${ip} 被锁定 (${action}) until ${lockUntil.toISOString()}`)
    } else {
      await env.DB.prepare(`
        UPDATE rate_limits 
        SET failed_attempts = ?, updated_at = datetime('now')
        WHERE ip_address = ? AND action = ?
      `).bind(newAttempts, ip, action).run()
    }
  } catch (error) {
    console.error(`记录失败尝试错误 (${ip}, ${action}):`, error)
  }
}

/**
 * 成功后清除失败记录
 * @param {object} env - Cloudflare 环境对象
 * @param {string} ip - 客户端 IP
 * @param {string} action - 操作类型 ('login', 'private', 'admin')
 * @returns {Promise<void>}
 */
export async function clearFailedAttempts(env, ip, action) {
  try {
    await env.DB.prepare(`
      DELETE FROM rate_limits 
      WHERE ip_address = ? AND action = ?
    `).bind(ip, action).run()
  } catch (error) {
    console.error(`清除失败记录错误 (${ip}, ${action}):`, error)
  }
}

// ============================================================================
// 请求鉴权
// ============================================================================

/**
 * 从请求中提取并验证会话
 * @param {Request} request - HTTP 请求对象
 * @param {object} env - Cloudflare 环境对象
 * @returns {Promise<object|null>} 用户信息或 null
 */
export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  return await validateSession(env, token)
}

/**
 * 从请求中提取 token（不验证）
 * @param {Request} request - HTTP 请求对象
 * @returns {string|null} token 或 null
 */
export function extractTokenFromRequest(request) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7)
}

// ============================================================================
// 响应格式
// ============================================================================

/**
 * 返回 JSON 响应
 * @param {object} data - 响应数据
 * @param {number} status - HTTP 状态码
 * @returns {Response} Response 对象
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

/**
 * 返回未授权响应
 * @param {string} message - 错误消息
 * @returns {Response} 401 Response 对象
 */
export function unauthorizedResponse(message = '未授权，请先登录') {
  return jsonResponse({ error: message }, 401)
}

/**
 * 返回禁止访问响应
 * @param {string} message - 错误消息
 * @returns {Response} 403 Response 对象
 */
export function forbiddenResponse(message = '权限不足') {
  return jsonResponse({ error: message }, 403)
}

/**
 * 返回错误响应
 * @param {string} message - 错误消息
 * @param {number} status - HTTP 状态码
 * @returns {Response} Response 对象
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status)
}

// ============================================================================
// CORS 处理
// ============================================================================

/**
 * 返回 CORS 预检响应
 * @param {string[]} methods - 允许的 HTTP 方法
 * @returns {Response} CORS 预检响应
 */
export function corsOptionsResponse(methods = ['GET', 'POST', 'OPTIONS']) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 小时
    }
  })
}

// ============================================================================
// 密码获取（支持 KV 动态修改）
// ============================================================================

/**
 * 获取管理员密码（优先从 KV 读取，否则用环境变量）
 * @param {object} env - Cloudflare 环境对象
 * @returns {Promise<string|null>} 管理员密码
 */
export async function getAdminPassword(env) {
  try {
    if (env.NAV_KV) {
      const kvPassword = await env.NAV_KV.get('admin_password')
      if (kvPassword) return kvPassword
    }
  } catch (e) {
    console.error('读取 KV 管理员密码失败:', e)
  }
  return env.ADMIN_PASSWORD || null
}

/**
 * 获取隐私密码（优先从 KV 读取，否则用环境变量）
 * @param {object} env - Cloudflare 环境对象
 * @returns {Promise<string|null>} 隐私密码
 */
export async function getPrivatePassword(env) {
  try {
    if (env.NAV_KV) {
      const kvPassword = await env.NAV_KV.get('private_password')
      if (kvPassword) return kvPassword
    }
  } catch (e) {
    console.error('读取 KV 隐私密码失败:', e)
  }
  return env.PRIVATE_PASSWORD || null
}
