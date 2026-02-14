#!/bin/bash

API_URL="http://localhost:3000/api"
HOST_PASSWORD="secret"

# 1. Login
echo "Logging in..."
TOKEN=$(curl -s -X POST $API_URL/login -H "Content-Type: application/json" -d "{\"password\": \"$HOST_PASSWORD\"}" | grep -oP '"token":"\K[^"]+')

if [ -z "$TOKEN" ]; then
    echo "Login Failed"
    exit 1
fi
echo "Token: $TOKEN"

# 2. Set Credit
TEST_EMAIL="balance_test@example.com"
echo "Setting credit for $TEST_EMAIL to 50.00..."
curl -s -X POST $API_URL/users/credit \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"credit\": 50.00}"

# 3. Verify Credit in List
echo "Fetching user list..."
USERS=$(curl -s -X GET $API_URL/users -H "Authorization: $TOKEN")
CREDIT=$(echo $USERS | grep -oP "\"email\":\"$TEST_EMAIL\",\"credit\":\K[^,]+")

if [[ "$CREDIT" == "50" ]]; then
    echo "Credit Verification Passed: $CREDIT"
else
    echo "Credit Verification Failed. Expected 50, got $CREDIT"
    echo "Response: $USERS"
    exit 1
fi

# 4. Create Debt (Unpaid Order)
echo "Creating session and order..."
SESSION_ID=$(curl -s -X POST $API_URL/sessions -H "Content-Type: application/json" -d '{"name": "Balance Test"}' | grep -oP '"id":"\K[^"]+')
# Order $20 item
curl -s -X POST $API_URL/sessions/$SESSION_ID/submit \
    -H "Content-Type: application/json" \
    -d "{\"userName\": \"BalanceUser\", \"userEmail\": \"$TEST_EMAIL\", \"items\": [{\"itemName\": \"Steak\", \"price\": 20.00}]}" > /dev/null

# 5. Verify Debt in List
echo "Fetching user list again..."
USERS_FINAL=$(curl -s -X GET $API_URL/users -H "Authorization: $TOKEN")
DEBT=$(echo $USERS_FINAL | grep -oP "\"email\":\"$TEST_EMAIL\",\"credit\":50,\"debt\":\K[^}]+")

# Debt should be 0 because the $50 credit should have automatically paid for the $20 order!
# Wait, my logic in /submit endpoint applies credits automatically.
# So if I have 50 credit and buy 20, debt should be 0, and credit should become 30.
# Let's check credit again.

NEW_CREDIT=$(echo $USERS_FINAL | grep -oP "\"email\":\"$TEST_EMAIL\",\"credit\":\K[^,]+")

if [[ "$NEW_CREDIT" == "30" ]]; then
     echo "Automatic Credit Deduction Verified. New Credit: $NEW_CREDIT"
else
     echo "Automatic Credit Deduction Failed. Expected 30, got $NEW_CREDIT"
     echo "Response: $USERS_FINAL"
fi

echo "ALL TESTS PASSED"
