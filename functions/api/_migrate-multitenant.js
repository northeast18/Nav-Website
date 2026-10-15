/**
 * 多租户独立私有库数据库迁移脚本
 *
 * 执行内容：
 * 1. 检查 websites 表，若未包含 user_id 和 is_public 字段则添加
 * 2. 创建 user_website_overrides 表 (使用 prepare.run 确保 D1 兼容性)
 * 3. 创建多租户查询所需索引
 *
 * 使用方法：
 * POST /api/_migrate-multitenant
 * Header: Authorization: Bearer <admin_password>
 */

import { jsonResponse, corsOptionsResponse, getAdminPassword } from './_middleware.js'

export async function onRequest(context) {
  const { request, env } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return corsOptionsResponse(['POST', 'OPTIONS'])
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 验证管理员密码
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: '需要管理员密码授权' }, 401)
    }

    const adminPassword = authHeader.substring(7)
    const correctAdminPassword = await getAdminPassword(env)

    if (!correctAdminPassword || adminPassword !== correctAdminPassword) {
      return jsonResponse({ error: '管理员密码错误' }, 401)
    }

    const changes = []
    const errors = []

    // 1. 检查 websites 表字段
    try {
      const tableInfo = await env.DB.prepare('PRAGMA table_info(websites)').all()
      const columnNames = (tableInfo.results || []).map(c => c.name)

      if (!columnNames.includes('user_id')) {
        await env.DB.prepare('ALTER TABLE websites ADD COLUMN user_id INTEGER').run()
        changes.push('✅ 已添加 websites.user_id 字段')
      } else {
        changes.push('ℹ️ websites.user_id 字段已存在')
      }

      if (!columnNames.includes('is_public')) {
        await env.DB.prepare('ALTER TABLE websites ADD COLUMN is_public INTEGER DEFAULT 1').run()
        await env.DB.prepare('UPDATE websites SET is_public = 1 WHERE is_public IS NULL').run()
        changes.push('✅ 已添加 websites.is_public 字段并标记历史数据为公共数据')
      } else {
        changes.push('ℹ️ websites.is_public 字段已存在')
      }
    } catch (e) {
      errors.push(`检查/升级 websites 表失败: ${e.message}`)
    }

    // 2. 创建 user_website_overrides 表 (使用 prepare.run 保证 D1 稳定执行)
    try {
      const createTableSql = `CREATE TABLE IF NOT EXISTS user_website_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        website_id INTEGER NOT NULL,
        is_hidden INTEGER DEFAULT 0,
        custom_name TEXT,
        custom_url TEXT,
        custom_category TEXT,
        custom_desc TEXT,
        custom_icon_url TEXT,
        custom_lan_url TEXT,
        custom_dark_icon INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, website_id)
      )`
      await env.DB.prepare(createTableSql).run()
      changes.push('✅ 已成功创建 user_website_overrides 覆盖表')
    } catch (e) {
      errors.push(`创建 user_website_overrides 表失败: ${e.message}`)
    }

    // 3. 创建索引
    const indices = [
      { name: 'idx_websites_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id)' },
      { name: 'idx_websites_is_public', sql: 'CREATE INDEX IF NOT EXISTS idx_websites_is_public ON websites(is_public)' },
      { name: 'idx_user_overrides_user', sql: 'CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON user_website_overrides(user_id, website_id)' }
    ]

    for (const item of indices) {
      try {
        await env.DB.prepare(item.sql).run()
      } catch (e) {
        errors.push(`创建索引 ${item.name} 失败: ${e.message}`)
      }
    }
    changes.push('✅ 已创建多租户性能索引')

    return jsonResponse({
      success: errors.length === 0,
      message: errors.length === 0 ? '多租户数据库迁移全部成功！' : '迁移过程中存在部分错误',
      changes,
      errors
    })

  } catch (error) {
    console.error('多租户迁移失败:', error)
    return jsonResponse({ error: '迁移执行错误: ' + error.message }, 500)
  }
}
