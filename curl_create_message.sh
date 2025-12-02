#!/bin/bash

# curl command to create a message via POST endpoint with JWT authentication

# User credentials
USERNAME="admin"
PASSWORD="password123"

# Base URL
BASE_URL="http://localhost:8000"

# Message data
MESSAGE="This is a test message via curl"
ROOM_ID=5

echo "Step 1: Getting JWT token from /auth/login/"
echo "=============================================="

# Get JWT token
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }")

echo "Token Response: $TOKEN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  exit 1
fi

echo "Access Token: $ACCESS_TOKEN"
echo ""

echo "Step 2: Creating message with JWT token"
echo "========================================"

# Execute curl request with JWT token
curl -X POST "$BASE_URL/messages/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"message\": \"$MESSAGE\",
    \"room_id\": $ROOM_ID
  }" \
  -v

echo ""
echo "Message creation request completed!"
