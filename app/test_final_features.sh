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

# 2. Setup: Create Session
echo "Creating session..."
SESSION_ID=$(curl -s -X POST $API_URL/sessions -H "Content-Type: application/json" -d '{"name": "Session Delete Test"}' | grep -oP '"id":"\K[^"]+')

# 3. Verify Session Exists
SESSION_CHECK=$(curl -s $API_URL/sessions/$SESSION_ID)
if [[ $SESSION_CHECK == *"Session Delete Test"* ]]; then
    echo "Session Created Verified"
else
    echo "Setup Failed: Session not created"
    exit 1
fi

# 4. Delete Session
echo "Deleting Session $SESSION_ID..."
DELETE_RES=$(curl -s -v -X DELETE $API_URL/sessions/$SESSION_ID -H "Authorization: $TOKEN")
echo "Delete Response: $DELETE_RES"

# 5. Verify Session Gone
SESSION_GONE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/sessions/$SESSION_ID)

if [ "$SESSION_GONE" == "404" ]; then
    echo "Session Deletion Verified (404)"
else
    echo "Session Deletion Failed: Response Code $SESSION_GONE"
    exit 1
fi

# 6. Verify Favicon
echo "Checking Favicon..."
if grep -q "data:image/svg+xml" index.html; then
    echo "Favicon Verified"
else 
    echo "Favicon Not Found"
    exit 1
fi

echo "ALL FINAL TESTS PASSED"
