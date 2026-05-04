#!/bin/bash

# PYQ Upload Test Script with Fresh Token
API_URL="http://localhost:4000"
ADMIN_EMAIL="vipno1official@gmail.com"
ADMIN_PASSWORD="preetam6388"

echo "🧪 Testing PYQ Upload System..."
echo "================================"

# Step 1: Check if backend is running
echo -e "\n📡 Step 1: Testing backend connection..."
HEALTH=$(curl -s "$API_URL/api/health")
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Step 2: Login to get fresh token
echo -e "\n🔐 Step 2: Getting fresh admin token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful, token obtained"
echo "   Token: ${ADMIN_TOKEN:0:50}..."

# Step 3: Create a test PDF file
echo -e "\n📄 Step 3: Creating test PDF file..."
TEST_PDF="/tmp/test_pyq.pdf"
printf '%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PYQ Document) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\n0000000333 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n435\n%%%%EOF\n' > "$TEST_PDF"
echo "✅ Test PDF created"

# Step 4: Test file upload
echo -e "\n📤 Step 4: Testing file upload to backend..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/api/uploads/media" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "media=@$TEST_PDF")

echo "Upload Response: $UPLOAD_RESPONSE"

# Extract file URL from response
FILE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$FILE_URL" ]; then
    # Try alternate response format
    FILE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$FILE_URL" ]; then
    echo "❌ File upload failed - no URL returned"
    echo "Response was: $UPLOAD_RESPONSE"
    exit 1
fi

echo "✅ File uploaded successfully"
echo "   File URL: $FILE_URL"

# Step 5: Test PYQ document creation
echo -e "\n📝 Step 5: Creating PYQ document..."

PYQ_PAYLOAD="{
  \"dept\": \"CSE\",
  \"course\": \"CSE101\",
  \"subject\": \"Programming\",
  \"fileName\": \"test_pyq_sample.pdf\",
  \"fileType\": \"application/pdf\",
  \"fileId\": \"$FILE_URL\",
  \"uploaderId\": \"test-admin\",
  \"cover_url\": null
}"

echo "Payload: $PYQ_PAYLOAD"

PYQ_RESPONSE=$(curl -s -X POST "$API_URL/api/pyq" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$PYQ_PAYLOAD")

echo "PYQ Response: $PYQ_RESPONSE"

if [[ $PYQ_RESPONSE == *"success"* ]] || [[ $PYQ_RESPONSE == *"\$id"* ]]; then
    echo "✅ PYQ document created successfully"
else
    echo "❌ PYQ document creation failed"
    exit 1
fi

# Step 6: Verify document retrieval
echo -e "\n✅ Step 6: Verifying document retrieval..."
LIST_RESPONSE=$(curl -s "$API_URL/api/pyq")

if [[ $LIST_RESPONSE == *"data"* ]]; then
    DOC_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"dept"' | wc -l)
    echo "✅ Retrieved $DOC_COUNT PYQ documents"
    echo "Latest document (first 300 chars):"
    echo "$LIST_RESPONSE" | head -c 300
    echo ""
else
    echo "❌ Failed to retrieve documents"
    exit 1
fi

echo -e "\n✅ PYQ UPLOAD TEST PASSED! System is working correctly.\n"

# Cleanup
rm -f "$TEST_PDF"
