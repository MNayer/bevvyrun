#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
HOST_PASSWORD="secret"

echo "Waiting for server..."
sleep 5

# 1. Login
echo "Testing Login..."
TOKEN_RESPONSE=$(curl -s -X POST $API_URL/login -H "Content-Type: application/json" -d "{\"password\": \"$HOST_PASSWORD\"}")
TOKEN=$(echo $TOKEN_RESPONSE | grep -oP '"token":"\K[^"]+')
if [ -z "$TOKEN" ]; then
    echo "Login Failed: $TOKEN_RESPONSE"
    exit 1
fi
echo "Login Scucess. Token: $TOKEN"

# 2. Settings (Default Template)
echo "Testing Settings..."
curl -s -X POST $API_URL/settings \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key": "email_template", "value": "Test Template {ORDER_AMOUNT}"}'
SETTINGS_VAL=$(curl -s -X GET $API_URL/settings/email_template -H "Authorization: $TOKEN" | grep -o "Test Template")
if [[ "$SETTINGS_VAL" == "Test Template" ]]; then echo "Settings Verification Passed"; else echo "Settings Failed"; exit 1; fi

# 3. Credits Logic
echo "Testing Credits Logic..."
# Insert Credit via SQLite directly
node server/db_helper.js "INSERT INTO user_credits (email, balance) VALUES ('credit@test.com', 5.00) ON CONFLICT(email) DO UPDATE SET balance=5.00;"

# Create Session
SESSION_ID=$(curl -s -X POST $API_URL/sessions -H "Content-Type: application/json" -d '{"name": "Credit Test"}' | grep -oP '"id":"\K[^"]+')

# Submit Order ($10)
ORDER_RESPONSE=$(curl -s -X POST $API_URL/sessions/$SESSION_ID/submit \
    -H "Content-Type: application/json" \
    -d '{"userName": "CreditUser", "userEmail": "credit@test.com", "items": [{"itemName": "Coffee", "price": 10.00}]}')

PAID_AMOUNT=$(echo $ORDER_RESPONSE | grep -oP '"paidAmount":\K[^,]+' |  awk '{print int($1)}') # simple int check
IS_PAID=$(echo $ORDER_RESPONSE | grep -oP '"isPaid":\K[^,}]+')

if [[ "$PAID_AMOUNT" == "5" && "$IS_PAID" == "0" ]]; then
    echo "Partial Payment Logic Verified (Paid: $PAID_AMOUNT, IsPaid: $IS_PAID)"
else
    echo "Partial Payment Failed. Response: $ORDER_RESPONSE"
    exit 1
fi

# 4. Host Actions (Mark Paid)
ORDER_ID=$(echo $ORDER_RESPONSE | grep -oP '"id":"\K[^"]+' | head -n 1)
echo "Marking Order $ORDER_ID as Paid..."
curl -s -X POST $API_URL/orders/$ORDER_ID/mark-paid \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"isPaid": true}'

# Check if paid
ORDER_DETAILS=$(curl -s $API_URL/sessions/$SESSION_ID)
IS_PAID_CHECK=$(echo $ORDER_DETAILS | grep -oP '"id":"'$ORDER_ID'".*?"isPaid":1')

if [ -n "$IS_PAID_CHECK" ]; then
    echo "Mark Paid Verified"
else
    echo "Mark Paid Failed"
    exit 1
fi

echo "ALL VERIFICATIONS PASSED"
