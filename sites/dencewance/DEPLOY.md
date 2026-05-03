# Vercel Deployment Guide for ALOK News (Current)

## 🚀 Quick Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy from project root:**
```bash
cd /workspaces/codespaces-react
vercel
```

4. **Follow the prompts:**
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No
   - What's your project name? alok-news (or any name)
   - In which directory is your code? ./
   - Want to override settings? No

5. **Deploy to production:**
```bash
vercel --prod
```

### Method 2: Using Vercel Dashboard

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Go to [vercel.com](https://vercel.com)**
   - Login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables (Important!)**
  Add in Vercel dashboard:
  ```
  VITE_API_URL=https://your-backend-url.vercel.app
  ```
  - If not set, frontend uses same-origin and expects a proxy or same host API.

5. **Click "Deploy"**

### Backend Deployment (Separate)

Your backend needs to be deployed separately:

1. **Create a new folder for backend:**
```bash
cd /workspaces/codespaces-react/server
```

2. **Add vercel.json for backend:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

3. **Deploy backend:**
```bash
vercel --prod
```

4. **Update frontend with backend URL**

### Post-Deployment Steps

1. **Update CORS in backend:**
   - Add your Vercel frontend URL to CORS origin

2. **Test the deployment:**
   - Open your Vercel URL
   - Check all features
   - Test API connections

3. **Set up custom domain (Optional):**
   - Go to Vercel dashboard
   - Project Settings > Domains
   - Add your custom domain

## 📝 Important Notes

- **Database**: SQLite does NOT persist on Vercel (serverless). This is ok only for temporary demo.
  - For real production, move DB to managed Postgres/MySQL.
  - Until then, prefer hosting backend on a VM (Ubuntu + PM2) and point `VITE_API_URL` there.

- **File Uploads**: Use external storage
  - Cloudinary
  - AWS S3 / Cloudflare R2
  - Vercel Blob

- **Environment Variables**: 
  - Set in Vercel dashboard
  - Never commit `.env` files

## 🔧 Troubleshooting

**Build fails?**
- Check Node version compatibility
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

**API not connecting?**
- Verify VITE_API_URL is set correctly
- Check CORS configuration
- Ensure backend is deployed

**Images not loading?**
- Use absolute URLs for images
- Check if images are in public folder
- Verify build includes all assets

## 📦 Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend environment variables set
- [ ] CORS configured correctly
- [ ] Database connected (if using external DB)
- [ ] All API endpoints working
- [ ] Translation tool tested
- [ ] Language switching works
- [ ] Admin panel accessible
- [ ] Image uploads functional
- [ ] Mobile responsive verified

## 🎉 Your Live URLs

After deployment, you'll get:
- Frontend: `https://alok-news.vercel.app`
- Backend: `https://alok-news-api.vercel.app`

Happy Deploying! 🚀
