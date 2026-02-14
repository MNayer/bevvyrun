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

# 2. Setup: Create Session and Order
echo "Creating session..."
SESSION_ID=$(curl -s -X POST $API_URL/sessions -H "Content-Type: application/json" -d '{"name": "Delete Test"}' | grep -oP '"id":"\K[^"]+')

echo "Submitting order..."
ORDER_RESPONSE=$(curl -s -X POST $API_URL/sessions/$SESSION_ID/submit \
    -H "Content-Type: application/json" \
    -d '{"userName": "DeleteMe", "userEmail": "delete@test.com", "items": [{"itemName": "Trash", "price": 5.00}]}')
ORDER_ID=$(echo $ORDER_RESPONSE | grep -oP '"id":"\K[^"]+')

# 3. Verify Order Exists
ORDER_CHECK=$(curl -s $API_URL/sessions/$SESSION_ID | grep "$ORDER_ID")
if [ -z "$ORDER_CHECK" ]; then echo "Setup Failed: Order not created"; exit 1; fi

# 4. Delete Order
echo "Deleting Order $ORDER_ID..."
DELETE_RES=$(curl -s -X DELETE $API_URL/orders/$ORDER_ID -H "Authorization: $TOKEN")

# 5. Verify Order Gone
ORDER_GONE=$(curl -s $API_URL/sessions/$SESSION_ID | grep "$ORDER_ID")
if [ -z "$ORDER_GONE" ]; then
    echo "Order Deletion Verified"
else
    echo "Order Deletion Failed: Order still exists"
    exit 1
fi

# 6. Setup: Create User Credit
echo "Setting credit for delete@test.com..."
curl -s -X POST $API_URL/users/credit \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"delete@test.com\", \"credit\": 100.00}"

# 7. Verify User Exists
USER_CHECK=$(curl -s -X GET $API_URL/users -H "Authorization: $TOKEN" | grep "delete@test.com")
if [ -z "$USER_CHECK" ]; then echo "Setup Failed: User credit not set"; exit 1; fi

# 8. Delete User
echo "Deleting User delete@test.com..."
curl -s -X DELETE $API_URL/users/delete@test.com -H "Authorization: $TOKEN"

# 9. Verify User Gone (or credit gone)
USER_GONE=$(curl -s -X GET $API_URL/users -H "Authorization: $TOKEN" | grep "delete@test.com" | grep "\"credit\":100")
if [ -z "$USER_GONE" ]; then
    echo "User Deletion Verified"
else
    echo "User Deletion Failed: User still has credit"
     exit 1
fi

echo "ALL DELETION TESTS PASSED"
