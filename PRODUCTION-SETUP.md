# ⚠️ PRODUCTION SETUP - READ FIRST!

## Issue: "Loading" Screen on Vercel/Netlify

### Root Cause
The frontend can't reach the backend API because `VITE_API_URL` is not configured properly in production.

---

## ✅ FIX: Set Environment Variables

### For Vercel Frontend Deployment
1. Go to: https://vercel.com/dashboard
2. Select project: **codespaces-react** (or your frontend project)
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - Name: `VITE_API_URL`
   - Value: Your backend API URL (see below)
   - Environments: Check all (Production, Preview, Development)
5. Click **Save**
6. Redeploy: Go to **Deployments** → Click current deployment → Click **Redeploy**

### For Netlify Frontend Deployment
1. Go to: https://app.netlify.com
2. Select your site
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Add new variable:
   - Key: `VITE_API_URL`
   - Value: Your backend API URL (see below)
5. Save and trigger a redeploy

---

## 🔗 Backend API URL

### If Backend is on Vercel
- The backend is in `/server` folder
- If you deploy it separately, use its Vercel URL
- Format: `https://your-backend-project-name.vercel.app`

### Current Fallback URL (Might be Wrong)
```
https://server-kappa-lac.vercel.app
```
**Check if this URL is working:**
```bash
curl https://server-kappa-lac.vercel.app/api/reels
```

If you get JSON data, use that URL!
If you get 404 or timeout → Update to your real backend URL

---

## 🚀 Quick Fix for Production

### Set VITE_API_URL to One of These:
1. **Your custom backend domain** (preferred)
   ```
   https://api.yourdomain.com
   ```

2. **Vercel backend project URL**
   ```
   https://backend-project-name.vercel.app
   ```

3. **Localhost for testing (DEV ONLY)**
   ```
   http://localhost:4000
   ```

---

## ✅ After Setting Environment Variables
1. Deploy/redeploy frontend
2. Check browser console (F12 → Console tab)
3. Look for API errors
4. Site should load with data within 10 seconds
5. If still stuck, check: Backend is running and API is accessible

---

## 📝 For Both Frontend AND Backend on Same Vercel
If you deploy frontend and backend to the same Vercel project:
- Frontend points to `/api/*` endpoints
- Backend `/server` handles those routes
- Set `VITE_API_URL` to the main project domain

---

## Debug Commands
```bash
# Check if backend API is reachable
curl -s https://YOUR-API-URL/api/reels | jq '.data | length'

# Check frontend build
npm run build

# Test locally
npm start  # Frontend on 3000
# In server folder: npm start  # Backend on 4000
```

---

**Status:** ✅ Fixed timeout handling | ⏳ Waiting for VITE_API_URL env variable
