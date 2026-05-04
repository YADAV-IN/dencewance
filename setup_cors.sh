#!/bin/bash
set -e

DOMAIN="https://alok-frontend-ig2e.onrender.com"
PROJECT_ID="69d60fbe002bae1e32d5"
ENDPOINT="https://nyc.cloud.appwrite.io/v1"

# Server API key (better scope)
API_KEY="standard_7c2acfcb480f77876d630afe55d7c66136f1836f123d2825a5d0e12fee34372f3e788789845fd9a630cf4ea85b9179bd148f72d7f0c251c97d1814c1a01685a32cbcadc11ed1831d2e182eed3cee30972d3fe0168e311ad756bacb2a366dab06e5e89cf6845f1c1e1673f7664c146a2ee8cac3d91c1fecb4c0e2bf7f1e6bca4f"

echo "📡 Adding CORS domain: $DOMAIN"

# Try to update project with new domain
curl -s -X PATCH "$ENDPOINT/projects/$PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"$DOMAIN\"}" | jq . 2>/dev/null || echo "Note: Direct API may need admin key, but domain might still be queued for processing"

echo "✅ Domain add request sent!"
echo "⏳ Appwrite may take 1-2 minutes to process"
