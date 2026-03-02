#!/bin/bash

# 测试防暴力破解机制 (基于本地 wrangler dev)

API_URL="http://localhost:8788/api"
TEST_USERNAME="test"
TEST_PASSWORD="wrongpassword"

echo "=========================================================="
echo "开始测试防暴力破解机制 (Rate Limiting)"
echo "=========================================================="

echo -e "\n[1] 测试密码错误 5 次..."
for i in {1..5}
do
  echo "第 $i 次尝试登录 (使用错误密码):"
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}" | grep -o '"error":"[^"]*"' || echo "Failed"
  sleep 1
done

echo -e "\n[2] 测试第 6 次尝试，应触发 429 锁定状态..."
echo "第 6 次尝试登录:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")

RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")

echo "HTTP 状态码: $HTTP_STATUS"
echo "响应内容: $RESPONSE"

if [ "$HTTP_STATUS" -eq 429 ]; then
  echo -e "\n✅ 成功：防暴力破解机制已生效！返回 429 Too Many Requests。"
else
  echo -e "\n❌ 失败：没有正确触发锁定限制。"
fi

echo "=========================================================="
echo "测试完成"
