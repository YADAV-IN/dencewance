# Render Upload Fix - Complete Guide (हिंदी + English)

## समस्या / Problem

Upload काम नहीं कर रहा है क्योंकि:
1. `VITE_API_URL` खाली है `.env.production`文件中
2. Backend URL configure नहीं है

Upload is not working because:
1. `VITE_API_URL` is empty in `.env.production` files
2. Backend URL is not configured

## समाधान / Solution

### Step 1: Find Your Render Backend URL

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your backend service** (usually named `alok-backend`)
3. **Copy the URL** - It will look like:
   ```
   https://alok-backend-xxxx.onrender.com
   ```

### Step 2: Update Environment Variables

Update BOTH `.env.production` files with your Render backend URL:

**File 1: `.env.production` (root)**
```env
# Production Environment Configuration
# Appwrite Configuration (Backend)
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=69d60fbe002bae1e32d5
VITE_APPWRITE_PROJECT_NAME=PREETAM

# API URL - Your Render Backend URL
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

**File 2: `sites/dencewance/.env.production`**
```env
# Production Environment Configuration
# Backend API URL - Your Render Backend URL
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
```

Replace `YOUR-BACKEND-URL` with your actual Render backend URL.

### Step 3: Deploy Frontend Changes

After updating the `.env.production` files:

**Option A: Deploy to Render**
1. Commit and push changes to GitHub:
   ```bash
   git add .env.production sites/dencewance/.env.production
   git commit -m "Fix: Configure VITE_API_URL for Render backend"
   git push
   ```
2. Render will auto-deploy if connected to GitHub

**Option B: Manual Deploy**
```bash
npm run build
# Upload dist/ folder to your hosting
```

### Step 4: Test the Fix

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Login to your site**
3. **Open browser console** (F12)
4. **Try uploading a video or PYQ**
5. **Check console logs** for success messages

## Testing Backend Connection

Test if your backend is accessible:

```bash
# Replace with your actual URL
curl https://YOUR-BACKEND-URL.onrender.com/api/health
```

Expected response:
```json
{"status":"ok",...}
```

## Troubleshooting

### 1. Backend Not Responding
If the health check fails:
- Check Render dashboard for errors
- Make sure backend service is running
- Check Render logs

### 2. CORS Errors
If you get CORS errors:
1. Go to Render Dashboard
2. Find your backend service
3. Check environment variables
4. Make sure `CORS_ORIGIN` is set to your frontend URL

### 3. Unauthorized Errors
If you get 401 errors:
- Make sure you're logged in
- Check if token is valid
- Try logging out and logging in again

### 4. Network Errors
If you get network errors:
- Verify backend URL is correct
- Check if backend service is running on Render
- Test with curl command above

## Render Configuration (render.yaml)

Your `render.yaml` is already configured correctly:
- Backend service: `alok-backend`
- Frontend service: `alok-frontend`
- Database: Appwrite Cloud
- Storage: Cloudflare R2

The only missing piece was the `VITE_API_URL` in the `.env.production` files.

## Summary

**Fixed:**
- ✅ Updated `.env.production` files structure
- ✅ Upload logic is already working correctly
- ✅ Error handling is in place

**You need to do:**
- ⏳ Get your Render backend URL from dashboard
- ⏳ Update `VITE_API_URL` in both `.env.production` files
- ⏳ Deploy changes to Render/GitHub

**After deployment:**
- ✅ Video uploads will work
- ✅ PYQ uploads will work
- ✅ No more network errors
- ✅ No more unauthorized errors

## Need Help?

If you still have issues after following these steps:
1. Check Render dashboard logs
2. Test backend health endpoint
3. Verify `VITE_API_URL` is set correctly in browser console:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)