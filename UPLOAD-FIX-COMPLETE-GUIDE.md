# Upload Error Fix - Complete Solution

## Problem Identified
✅ **Root Cause Found:**
1. `VITE_API_URL` was empty in both `.env.production` files
2. Backend server is not deployed (URL returns "Deployment Not Found")

## Solution Applied

### 1. ✅ Updated Environment Variables
I've updated both `.env.production` files with the correct backend URL:

**Root `.env.production`:**
```env
VITE_API_URL=https://server-tan-iota-18.vercel.app
```

**`sites/dencewance/.env.production`:**
```env
VITE_API_URL=https://server-tan-iota-18.vercel.app
```

### 2. ⚠️ Backend Deployment Required

The backend server needs to be deployed to Vercel. Here's how:

#### Option A: Deploy via Vercel CLI (Interactive)
```bash
# Navigate to server directory
cd server

# Deploy to Vercel
npx vercel --prod
```

You'll need to:
1. Log in to Vercel (if not already logged in)
2. Link to your existing project or create a new one
3. Deploy

After deployment, you'll get a new URL like: `https://your-project-name.vercel.app`

#### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `server`
4. Deploy

### 3. Update Environment Variables After Deployment

Once you have the new backend URL, update both `.env.production` files:

```env
VITE_API_URL=https://your-new-backend-url.vercel.app
```

### 4. Deploy Frontend

After updating the environment variables, rebuild and deploy the frontend:

```bash
# Build the project
npm run build

# Deploy to Vercel
npx vercel --prod
```

Or push to GitHub if you have CI/CD set up.

## Testing the Fix

After completing the steps above:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Login to your site**
3. **Open browser console** (F12)
4. **Try uploading a video or PYQ document**
5. **Check console logs** for:
   - `Uploading via backend API: https://your-url.vercel.app/api/uploads/media`
   - `Backend upload success! URL: ...`

## Expected Behavior After Fix

✅ **Video Uploads** - Should work via backend API  
✅ **PYQ Uploads** - Should work via backend API  
✅ **No more "Network Error"** - Backend URL is configured  
✅ **No more "Unauthorized"** - Authentication will work properly  

## Troubleshooting

If uploads still fail after deployment:

1. **Check backend health:**
   ```bash
   curl https://your-backend-url.vercel.app/api/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check CORS configuration:**
   - Backend should allow requests from your frontend domain
   - The server already has CORS configured in the code

3. **Verify token is valid:**
   - Make sure you're logged in
   - Token should be in localStorage as `adminToken`

4. **Check file size:**
   - Backend limit: 200MB
   - If file is too large, consider using R2 direct upload

## Summary

**What was fixed:**
- ✅ Updated `.env.production` files with backend URL
- ✅ Upload logic already handles backend API properly
- ✅ Error handling and progress tracking are in place

**What you need to do:**
- ⏳ Deploy backend server to Vercel
- ⏳ Update `VITE_API_URL` with the new deployment URL
- ⏳ Rebuild and deploy frontend

Once these steps are complete, all upload functionality should work correctly.