# Render Backend Deployment Guide (हिंदी + English)

## Quick Summary
Upload error का root cause: Backend deployed नहीं है Render पर।
Solution: Backend को Render पर deploy करो और URL को `.env.production` में update करो।

## Step-by-Step Deployment

### Step 1: Render Dashboard पर जाओ
1. https://dashboard.render.com पर जाएं
2. अपने account में login करें

### Step 2: New Web Service बनाएं
1. **"New +"** button पर click करें
2. **"Web Service"** select करें
3. अपने GitHub repository को connect करें:
   - Repository: `YADAV-IN/alok-website`
   - Branch: `main`
4. **"Connect repository"** click करें

### Step 3: Service Configure करें
**Basic Settings:**
- **Name:** `alok-backend` (या कोई भी unique name)
- **Region:** Singapore (India के closest)
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables Add करें:**
नीचे दिए गए सभी variables add करें:

```
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5
APPWRITE_DB_ID=69d60fe8000c9bd92750
APPWRITE_API_KEY=your_appwrite_api_key
APPWRITE_STORAGE_BUCKET_ID=alok_media
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=3001
CORS_ORIGIN=*
R2_ACCOUNT_ID=71646351db10db7a03b0fe0b2efa0cbe
R2_ACCESS_KEY_ID=c244c8f8a700287c233f07fc27cda204
R2_SECRET_ACCESS_KEY=1469802eef581863ac4e46a65cdaf0159dba82b3a5a09282f47ebe152fd4b300
R2_BUCKET_NAME=videostories
ADMIN_EMAIL=vipno1official@gmail.com
ADMIN_PASSWORD=preetam6388
```

**Note:** `APPWRITE_API_KEY` और `JWT_SECRET` को change कर लें production के लिए।

### Step 4: Deploy करें
1. **"Create Web Service"** button पर click करें
2. Deployment start हो जाएगी
3. Build logs check करें - green tick आना चाहिए
4. Deployment complete होने का wait करें

### Step 5: Backend URL Copy करें
1. Service deploy होने के बाद, ऊपर URL दिखेगा
2. URL कुछ ऐसा होगा: `https://alok-backend-xxxx.onrender.com`
3. इस URL को copy कर लें

### Step 6: Frontend Environment Variables Update करें

**File 1: `.env.production` (root directory में)**
```env
# Production Environment Configuration
# Appwrite Configuration (Backend)
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5
VITE_APPWRITE_PROJECT_NAME=PREETAM

# API URL - Your Render Backend URL (यहाँ अपना URL डालें)
VITE_API_URL=https://alok-backend-xxxx.onrender.com
```

**File 2: `sites/dencewance/.env.production`**
```env
# Production Environment Configuration
# Backend API URL - Your Render Backend URL (यहाँ अपना URL डालें)
VITE_API_URL=https://alok-backend-xxxx.onrender.com
```

### Step 7: Frontend Deploy करें
1. Changes को commit और push करें:
   ```bash
   git add .env.production sites/dencewance/.env.production
   git commit -m "Fix: Configure VITE_API_URL for Render backend"
   git push
   ```
2. Render automatically deploy कर देगा (अगर auto-deploy on है)
3. या manually deploy करें Render dashboard से

### Step 8: Test करें
1. Browser cache clear करें (Ctrl+Shift+Delete)
2. Website पर जाएं
3. Login करें
4. Video या PYQ upload करके test करें
5. Console (F12) में logs check करें

## Testing Backend Health

Backend deploy होने के बाद, health check करें:

```bash
# अपने URL के साथ test करें
curl https://alok-backend-xxxx.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "time": "2026-05-08T10:00:00.000Z",
  "vercel": false,
  "dbReady": true,
  "config": {
    "appwrite": true,
    "jwt": true,
    "r2": true
  }
}
```

## Troubleshooting

### 1. Build Failed
अगर build fail हो रही है:
- Render logs check करें
- `server/package.json` सही है confirm करें
- Dependencies install हो रही हैं check करें

### 2. Service Crashing
अगर service start होकर crash हो रही है:
- Environment variables सही हैं check करें
- `APPWRITE_API_KEY` और `JWT_SECRET` set हैं confirm करें
- Render logs में error messages देखें

### 3. CORS Errors
अगर CORS errors आ रहे हैं:
- Backend code में CORS already configured है
- `CORS_ORIGIN=*` set है confirm करें
- Frontend URL से request जा रही है check करें

### 4. Upload Still Failing
अगर upload अभी भी fail हो रहा है:
1. Browser console में error check करें
2. Network tab में request details देखें
3. Backend logs check करें Render dashboard में
4. `VITE_API_URL` सही set है confirm करें

## Important Notes

- **Render Free Plan:** Service 15 minutes inactive होने के बाद sleep mode में चला जाता है
- **First Request:** Sleep mode से wake होने में 30-60 seconds लग सकते हैं
- **Database:** SQLite cold start पर reset हो सकता है (demo के लिए ठीक है)
- **Production:** PostgreSQL use करें production के लिए

## Summary

✅ **What I Fixed:**
- Updated `.env.production` files structure
- Created deployment guide
- Server code is ready for deployment

⏳ **What You Need to Do:**
1. Deploy backend to Render (follow steps above)
2. Copy the backend URL
3. Update `VITE_API_URL` in both `.env.production` files
4. Deploy frontend changes
5. Test uploads

**After deployment:**
- ✅ Video uploads will work
- ✅ PYQ uploads will work
- ✅ No more network errors
- ✅ No more unauthorized errors

## Need Help?

अगर किसी step में problem हो तो:
1. Render dashboard में logs check करें
2. Environment variables double-check करें
3. Health endpoint test करें
4. Browser console में errors देखें