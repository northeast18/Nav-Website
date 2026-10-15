-- 导航网站 D1 数据库 Schema

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,  -- 用户名（唯一）
  password_hash TEXT NOT NULL,    -- 密码哈希（PBKDF2 格式：saltHex:hashHex）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建会话表（安全升级 P0）
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- token 的 SHA-256 哈希
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建网站表
CREATE TABLE IF NOT EXISTS websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,              -- 所属用户ID (NULL 代表系统公共数据)
  is_public INTEGER DEFAULT 1,  -- 是否公共可见 (1: 公共网站, 0: 个人私有)
  name TEXT NOT NULL,           -- 网站名称
  url TEXT NOT NULL,            -- 网站链接
  category TEXT NOT NULL,       -- 分类
  desc TEXT,                    -- 描述
  icon_url TEXT,                -- 图标URL
  lan_url TEXT,                 -- 内网地址（可选）
  dark_icon INTEGER DEFAULT 0,  -- 是否深色图标
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建用户网站覆盖表（支持用户自定义修改或隐藏公共底座网站，不影响全局公共底座）
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_is_public ON websites(is_public);
CREATE INDEX IF NOT EXISTS idx_websites_category ON websites(category);
CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON user_website_overrides(user_id, website_id);
CREATE INDEX IF NOT EXISTS idx_name ON websites(name);
CREATE INDEX IF NOT EXISTS idx_url ON websites(url);

-- 创建 rate_limits 表以防止密码暴力破解
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'login', 'private', 'admin'
  failed_attempts INTEGER DEFAULT 1,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ip_address, action)
);

-- 创建 rate_limits 表的相关索引
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action ON rate_limits(ip_address, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_locked_until ON rate_limits(locked_until);

