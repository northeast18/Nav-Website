#!/bin/bash

# P0 安全升级测试脚本
# 用于验证数据库迁移和 API 功能是否正常

# 配置
API_BASE_URL="https://你的域名"  # 替换为你的实际域名
ADMIN_PASSWORD="你的管理员密码"  # 替换为你的管理员密码

echo "=========================================="
echo "  P0 安全升级测试脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local headers="$4"
  local data="$5"

  echo -n "测试: $name ... "

  local response
  if [ -z "$data" ]; then
    response=$(curl -s -X "$method" \
      "${API_BASE_URL}${endpoint}" \
      $headers \
      -w "\n%{http_code}")
  else
    response=$(curl -s -X "$method" \
      "${API_BASE_URL}${endpoint}" \
      $headers \
      -d "$data" \
      -w "\n%{http_code}")
  fi

  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)

  case $http_code in
    200|201)
      echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
      echo "  响应: $body" | head -c 100
      echo ""
      ;;
    401)
      echo -e "${YELLOW}⚠ UNAUTHORIZED${NC} (HTTP $http_code)"
      echo "  这可能是预期的（如果测试旧 token）"
      ;;
    404)
      echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
      echo "  接口不存在，请检查部署"
      ;;
    *)
      echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
      echo "  响应: $body" | head -c 100
      echo ""
      ;;
  esac

  echo ""
  sleep 1
}

# 1. 测试数据库迁移
echo "=========================================="
echo "1. 数据库迁移测试"
echo "=========================================="
echo ""

test_api \
  "数据库迁移" \
  "POST" \
  "/api/_migrate-security" \
  '-H "Content-Type: application/json" -H "Authorization: Bearer '"$ADMIN_PASSWORD"'"'

# 2. 测试注册新用户
echo "=========================================="
echo "2. 注册接口测试"
echo "=========================================="
echo ""

TIMESTAMP=$(date +%s)
TEST_USER="test_user_${TIMESTAMP}"

test_api \
  "注册新用户" \
  "POST" \
  "/api/auth/register" \
  '-H "Content-Type: application/json"' \
  '{"username": "'"$TEST_USER"'", "password": "test123456"}'

# 3. 测试登录
echo "=========================================="
echo "3. 登录接口测试"
echo "=========================================="
echo ""

LOGIN_RESPONSE=$(curl -s -X POST \
  "${API_BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "'"$TEST_USER"'", "password": "test123456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ 登录成功${NC}"
  echo "  Token: ${TOKEN:0:20}..."
  echo ""
else
  echo -e "${RED}✗ 登录失败${NC}"
  echo "  响应: $LOGIN_RESPONSE"
  echo ""
  exit 1
fi

# 4. 测试同步接口（验证 userId 参数已禁用）
echo "=========================================="
echo "4. 同步接口安全测试"
echo "=========================================="
echo ""

echo -n "测试: 旧 userId 参数应该失败 ... "
OLD_USER_ID_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${API_BASE_URL}/api/sync/read?userId=user_1")

OLD_USER_ID_CODE=$(echo "$OLD_USER_ID_RESPONSE" | tail -n1)

if [ "$OLD_USER_ID_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} (正确拒绝 userId 参数)"
else
  echo -e "${RED}✗ FAIL${NC} (仍然接受 userId 参数，存在安全风险！)"
fi
echo ""

echo -n "测试: 使用 Bearer token 应该成功 ... "
BEARER_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${API_BASE_URL}/api/sync/read" \
  -H "Authorization: Bearer $TOKEN")

BEARER_CODE=$(echo "$BEARER_RESPONSE" | tail -n1)

if [ "$BEARER_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${YELLOW}⚠ UNEXPECTED${NC} (HTTP $BEARER_CODE)"
fi
echo ""

# 5. 测试登出
echo "=========================================="
echo "5. 登出接口测试"
echo "=========================================="
echo ""

test_api \
  "登出" \
  "POST" \
  "/api/auth/logout" \
  '-H "Content-Type: application/json" -H "Authorization: Bearer '"$TOKEN"'"'

# 6. 测试写接口鉴权
echo "=========================================="
echo "6. 写接口鉴权测试"
echo "=========================================="
echo ""

echo -n "测试: 无 token 应该被拒绝 ... "
NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${API_BASE_URL}/api/websites/add" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","url":"https://test.com","category":"测试"}')

NO_AUTH_CODE=$(echo "$NO_AUTH_RESPONSE" | tail -n1)

if [ "$NO_AUTH_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} (正确拒绝未授权请求)"
else
  echo -e "${RED}✗ FAIL${NC} (写接口未受保护！)"
fi
echo ""

# 总结
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "如果所有测试都通过，说明 P0 安全升级部署成功！"
echo ""
echo "下一步："
echo "1. 通知所有用户重新登录"
echo "2. 监控 Cloudflare Logs 查看是否有错误"
echo "3. 测试前端功能是否正常"
echo ""
