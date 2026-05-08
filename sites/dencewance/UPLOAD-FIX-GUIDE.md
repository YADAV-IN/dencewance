# Video Upload Fix Guide

## Problem
Video upload was not working on the site because the backend API URL (`VITE_API_URL`) was not configured in the production environment.

## Root Cause
1. **Missing API URL**: The `.env.production` file had an empty `VITE_API_URL`, so the frontend couldn't connect to the backend
2. **Upload Logic**: The code was trying direct Appwrite upload first, which may fail due to permission/CORS issues

## Solution Applied

### 1. Updated Upload Logic (`src/utils/appwriteClient.js`)
- Now uses backend API as the primary upload method when `VITE_API_URL` is configured
- Falls back to direct Appwrite upload if backend fails
- Provides better error messages to help debug issues

### 2. What You Need to Do

#### Step 1: Configure Backend API URL
Edit `sites/dencewance/.env.production` and set your backend URL:

```env
# Production Environment Configuration
# Backend API URL - Set this to your deployed backend URL
# If using Vercel deployment, use your Vercel backend URL
# Example: https://api.modebook.app or https://your-project.vercel.app
VITE_API_URL=https://your-backend-url.com
```

**Where to get the URL:**
- If your backend is deployed on Vercel: Use your Vercel project URL (e.g., `https://your-project-name.vercel.app`)
- If your backend is on Render/Railway: Use the provided URL
- If your backend is on a custom domain: Use that domain

#### Step 2: Deploy the Changes
After updating the `.env.production` file:

```bash
# If using Vercel
vercel --prod

# Or push to your repository if using CI/CD
git add sites/dencewance/.env.production sites/dencewance/src/utils/appwriteClient.js
git commit -m "Fix: Configure VITE_API_URL and improve upload logic"
git push
```

#### Step 3: Verify Appwrite Bucket Permissions (if direct upload is needed)
If you want direct Appwrite upload to work as a fallback:

1. Go to your Appwrite Console
2. Navigate to Storage → Buckets
3. Select the `alok_media` bucket
4. Go to Permissions tab
5. Add a new permission:
   - Role: Any
   - Permissions: Create, Read, Update, Delete

**Note:** Backend upload is recommended as it's more secure and reliable.

## Testing the Fix

1. **Login to your site** as an admin
2. **Open browser console** (F12) to see upload logs
3. **Try uploading a video** through the Profile Dashboard
4. **Check console logs** for messages like:
   - `Uploading via backend API: https://your-url.com/api/uploads/media`
   - `Backend upload success! URL: ...`

## Troubleshooting

### Upload still failing?

1. **Check if VITE_API_URL is set correctly:**
   - Open browser console
   - Type: `import.meta.env.VITE_API_URL`
   - It should show your backend URL

2. **Test backend connectivity:**
   ```bash
   curl https://your-backend-url.com/api/health
   ```
   Should return: `{"status":"ok",...}`

3. **Check CORS configuration:**
   - Backend should allow requests from your frontend domain
   - The server already has CORS configured, but verify in production

4. **Check authentication:**
   - Make sure you're logged in (token should be in localStorage)
   - Token should be valid (not expired)

5. **Check file size:**
   - Backend limit: 200MB
   - If file is too large, consider using the R2 direct upload method

## Alternative: Use R2 Direct Upload

If you have Cloudflare R2 configured, you can use the signed upload endpoint:

```javascript
// In your component, use the sign endpoint instead
const signResponse = await fetch(`${API_URL}/api/uploads/sign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: file.name, contentType: file.type })
});
const { uploadUrl, publicUrl } = await signResponse.json();

// Then upload directly to R2
await uploadFileWithProgress(uploadUrl, file, onProgress);
// Use publicUrl as the file URL
```

## Summary

✅ **Fixed**: Upload logic now prioritizes backend API upload  
✅ **Fixed**: Better error messages and logging  
✅ **Fixed**: Fallback to direct Appwrite if backend fails  
⚠️ **Required**: Set `VITE_API_URL` in `.env.production` to your backend URL  
⚠️ **Optional**: Configure Appwrite bucket permissions for direct upload fallback

After setting `VITE_API_URL` and deploying, video uploads should work correctly.