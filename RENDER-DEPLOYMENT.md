# 🚀 Render.com Deployment Guide

## ✅ Completed Steps

1. ✅ **GitHub Push** - Code pushed to `https://github.com/YADAV-IN/dencewance`
2. ✅ **render.yaml Configured** - Backend और Frontend दोनों setup हैं
3. ✅ **Build Verified** - Frontend production build ✓

## 📋 Next Steps: Render Dashboard पर Deploy करना

### Option 1: Render Dashboard से Deploy (Easy)

1. **Render.com पर जाओ:** https://dashboard.render.com
2. **Login करो** अपने GitHub account से
3. **"New" → "BluePrint"** click करो
4. **यह URL paste करो:**
   ```
   https://github.com/YADAV-IN/dencewance
   ```
5. **"Connect Repository"** click करो
6. **"Deploy"** click करो

Render automatically करेगा:
- Backend (Node.js): Port 3001 पर
- Frontend (Static): Rendered
- Environment variables auto-configure होंगे

### 🔑 Required Environment Variables (Render Dashboard में set करने हैं)

**Backend के लिए:**
```
APPWRITE_API_KEY = [अपनी admin token डालो]
APPWRITE_STORAGE_BUCKET_ID = [optional]
```

**Frontend automatically populate होगा** Render के through!

## 📊 Service Details

| Service | Type | Port | URL |
|---------|------|------|-----|
| Backend | Node.js | 3001 | `https://alok-backend-xxxx.onrender.com` |
| Frontend | Static | - | `https://alok-frontend-xxxx.onrender.com` |

## ⚙️ Current Configuration

```yaml
# render.yaml में setup:
Backend:
  - rootDir: server
  - buildCommand: npm install
  - startCommand: npm start
  
Frontend:
  - rootDir: .
  - buildCommand: npm install && npm run build
  - publicPath: dist
```

## 🔗 Auto-Connection

Frontend automatically connect होगा:
- `VITE_API_URL` → Backend का Render URL
- `VITE_APPWRITE_ENDPOINT` → Appwrite Cloud
- `VITE_APPWRITE_PROJECT_ID` → Project ID

## ✨ Quick Deploy Link

**Render Dashboard:** https://dashboard.render.com

बस GitHub से connect करो और deploy करो! 🎉
