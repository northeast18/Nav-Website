// 数据迁移脚本：将 data.backup.js 数据导入到 D1 数据库
import { navItems } from '../src/data.backup.js'

/**
 * 迁移数据到 D1 数据库
 * @param {object} env - Cloudflare 环境变量
 * @returns {object} 迁移结果
 */
export async function migrateToD1(env) {
  const db = env.DB  // D1 数据库绑定

  if (!db) {
    throw new Error('D1 数据库未绑定')
  }

  let migrated = 0
  let skipped = 0
  const errors = []

  console.log('开始数据迁移...')

  for (const category of navItems) {
    for (const item of category.items) {
      try {
        // 检查是否已存在（根据 URL）
        const existing = await db.prepare(
          'SELECT id FROM websites WHERE url = ?'
        ).bind(item.url).first()

        if (existing) {
          console.log(`跳过已存在的网站: ${item.name}`)
          skipped++
          continue
        }

        // 插入数据
        await db.prepare(`
          INSERT INTO websites (name, url, category, desc, icon_url, lan_url, dark_icon)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.name,
          item.url,
          item.category,
          item.desc || '',
          item.iconUrl || '',
          item.lanUrl || '',
          item.darkIcon ? 1 : 0
        ).run()

        migrated++
        console.log(`✓ 迁移成功: ${item.name}`)

      } catch (error) {
        const errorMsg = `迁移失败: ${item.name} - ${error.message}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }
  }

  // 统计总数
  const countResult = await db.prepare('SELECT COUNT(*) as total FROM websites').first()
  const total = countResult ? countResult.total : 0

  const result = {
    success: true,
    migrated,
    skipped,
    total,
    errors: errors.length > 0 ? errors : undefined
  }

  console.log('迁移完成:', result)
  return result
}
