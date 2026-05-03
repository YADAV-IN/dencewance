# ALOK — BJMC UG News Platform

ALOK एक हाई-टेक, फ्यूचर-रेडी न्यूज़ वेबसाइट है जो BJMC UG स्टूडेंट के लिए डिज़ाइन की गई है। इसमें एडमिन पैनल, न्यूज CRUD, समरी, वीडियो सेक्शन, टाइमलाइन और डेटा-ड्रिवन फीचर्स शामिल हैं।

## Live URLs
- **Frontend:** https://codespaces-react-rho-ashen.vercel.app/
- **Backend API:** https://server-tan-iota-18.vercel.app
- **Health Check:** https://server-tan-iota-18.vercel.app/api/health

## Quick Start

### Frontend
```bash
npm install
npm start
```

### Backend
```bash
cd server
npm install
npm run dev
```

## Admin Setup (Primary Only)
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend environment variables.
- Note: Only primary admin (id=1) is allowed to log in.
- Rotate admin credentials after first successful login.

## Key Features
- 30+ field news creation system
- Role-based user management (Admin/Editor/Author)
- Hindi/English auto-detection + Translation Tool with OCR
- Responsive design (Mobile/Tablet/Desktop)
- Vercel serverless deployment
- Primary admin enforcement (id=1 permanent)

## Documentation
- **Full Report:** [FULL_PROJECT_REPORT.md](FULL_PROJECT_REPORT.md)
- **Deploy Guide:** [DEPLOY.md](DEPLOY.md)

## Deploy to Vercel
```bash
# Backend
cd server && vercel --prod

# Frontend
cd .. && vercel --prod
```

## Git Push (Codespaces)
```bash
cd /workspaces/codespaces-react && git add -A && git commit -m "message" && GH_TOKEN="" GITHUB_TOKEN="" git -c credential.helper='!gh auth git-credential' push https://github.com/YADAV-IN/alok-website.git main
```

## Tech Stack
- React 18 + Vite 6 | Express.js + SQLite3 | JWT Auth | Vercel Serverless

## Dev Notes
- Vite proxy `/api` and `/uploads` to `http://localhost:4000` in dev mode.
- Frontend `API_URL` hardcoded to backend Vercel URL for production.
- SQLite resets on Vercel cold start (demo only). Migrate to PostgreSQL for production.
