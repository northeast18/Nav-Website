-- 迁移脚本：支持多租户独立私有库与公共网站个性化覆盖

-- 1. 为 websites 表添加多租户字段
-- 注意：默认所有已有网站作为公共底座 (is_public = 1)
ALTER TABLE websites ADD COLUMN user_id INTEGER;
ALTER TABLE websites ADD COLUMN is_public INTEGER DEFAULT 1;

-- 2. 创建用户网站覆盖表（支持用户自定义修改或隐藏公共底座网站）
CREATE TABLE IF NOT EXISTS user_website_overrides (
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
  UNIQUE(user_id, website_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_is_public ON websites(is_public);
CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON user_website_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_website_id ON user_website_overrides(website_id);
