# ALOK — BJMC News Portal | Complete Project Report

**Date:** 21 February 2026  
**Version:** 2.0  
**Developer:** Preetam Yadav (YADAV-IN)  
**Status:** Deployed on Vercel (Frontend + Backend)

---

## 📋 Index

1. [Project Summary](#1-project-summary)
2. [Live URLs & Credentials](#2-live-urls--credentials)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Folder Structure](#5-folder-structure)
6. [Database Schema](#6-database-schema)
7. [API Endpoints (Complete)](#7-api-endpoints-complete)
8. [Frontend Features](#8-frontend-features)
9. [Admin Panel Features](#9-admin-panel-features)
10. [User Management System](#10-user-management-system)
11. [News Creation System (30+ Fields)](#11-news-creation-system-30-fields)
12. [Security & Auth](#12-security--auth)
13. [Deployment Details](#13-deployment-details)
14. [Known Limitations](#14-known-limitations)
15. [Future Roadmap](#15-future-roadmap)
16. [Session Work Log](#16-session-work-log)

---

## 1. Project Summary

ALOK एक हाई-टेक, फ्यूचर-रेडी न्यूज़ वेबसाइट है जो BJMC UG स्टूडेंट के लिए बनाई गई है। इसमें:
- मल्टी-लैंग्वेज सपोर्ट (हिंदी/English)
- Advanced Admin Panel with news CRUD
- Role-based User Management (Admin/Editor/Author)
- Primary Admin Only Login (id=1)
- Responsive Design (Mobile/Tablet/Desktop)
- Translation Tool with OCR
- 30+ field news creation form
- Vercel Serverless Deployment

---

## 2. Live URLs & Credentials

### URLs
| Service | URL |
|---------|-----|
| **Frontend** | https://codespaces-react-rho-ashen.vercel.app/ |
| **Backend API** | https://server-tan-iota-18.vercel.app |
| **Health Check** | https://server-tan-iota-18.vercel.app/api/health |
| **GitHub Repo** | https://github.com/YADAV-IN/alok-website |

### Login Credentials (Primary Admin Only)
| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `change-me-before-login` |
| Role | admin (Permanent, id=1) |

> ⚠️ Only the primary admin (id=1) can log in. Other users are managed by admin but cannot log in.

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI Library |
| Vite | 6.3.6 | Build Tool & Dev Server |
| CSS3 | - | Glassmorphism, Animations, Responsive |
| Tesseract.js | 5.x | OCR (Image to Text) |
| MyMemory API | - | Translation (Free, No Key) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.19.2 | Web Framework |
| SQLite3 | 5.1.7 | Database |
| bcryptjs | 2.4.3 | Password Hashing |
| jsonwebtoken | 9.0.2 | JWT Auth |
| multer | 1.4.5 | File Uploads |
| cors | 2.8.5 | Cross-Origin |
| dotenv | 16.4.5 | Environment Variables |

### Deployment
| Platform | Purpose |
|----------|---------|
| Vercel | Frontend (Static) + Backend (Serverless) |
| GitHub | Source Code Repository |

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  React App (Hindi/English UI)                  │     │
│  │  - Auto Language Detection                     │     │
│  │  - Translation Tool (Text + Image OCR)         │     │
│  │  - Admin Panel (Primary Admin Only)            │     │
│  │  - User Management (CRUD)                      │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS API Calls
                           ↓
┌─────────────────────────────────────────────────────────┐
│         VERCEL FRONTEND (Static Build)                  │
│  URL: codespaces-react-rho-ashen.vercel.app             │
│  Build: npm run build → dist/                           │
│  Config: vercel.json (rewrites → index.html)            │
└──────────────────────────┬──────────────────────────────┘
                           │ fetch() to API_URL
                           ↓
┌─────────────────────────────────────────────────────────┐
│         VERCEL BACKEND (Serverless @vercel/node)        │
│  URL: server-tan-iota-18.vercel.app                     │
│  Entry: src/index.js (export default app)               │
│  CORS: origin: true (all origins allowed)               │
│  Auth: JWT Bearer Token                                 │
└──────────────────────────┬──────────────────────────────┘
                           │ SQLite Queries
                           ↓
┌─────────────────────────────────────────────────────────┐
│              SQLite Database (/tmp/alok.db)              │
│  Tables: admins, news, site_settings                    │
│  ⚠️ Resets on cold start (Vercel limitation)            │
│  Primary admin re-created automatically on start        │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
/workspaces/codespaces-react/
├── index.html                    # HTML entry point
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite config + dev proxy
├── vercel.json                   # Frontend Vercel deploy config
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── index.jsx                 # React entry point
│   ├── App.jsx                   # Main app (1884 lines)
│   ├── App.css                   # All styles
│   ├── translations.js           # Hindi/English translation strings
│   ├── components/
│   │   ├── DesktopSidebar.jsx    # Desktop navigation sidebar
│   │   ├── MobileBottomNav.jsx   # Mobile bottom navigation
│   │   ├── TranslationTool.jsx   # Translation + OCR tool
│   │   └── TranslationTool.css   # Translation tool styles
│   ├── hooks/
│   │   └── useDevice.js          # Device detection hook
│   └── utils/
│       └── translator.js         # Translation utility
├── server/
│   ├── package.json              # Backend dependencies
│   ├── vercel.json               # Backend Vercel deploy config
│   ├── src/
│   │   ├── index.js              # Express server (639 lines)
│   │   ├── db.js                 # Database init + migrations (198 lines)
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT auth middleware
│   │   └── utils/
│   │       ├── slug.js           # URL slug generator
│   │       └── readingTime.js    # Reading time calculator
│   └── data/                     # SQLite DB storage (local only)
└── docs/                         # Additional documentation
```

---

## 6. Database Schema

### Table: `admins`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | INTEGER | AUTO_INCREMENT | Primary Key |
| name | TEXT | NOT NULL | User display name |
| email | TEXT | UNIQUE, NOT NULL | Login email |
| password_hash | TEXT | NOT NULL | bcrypt hashed password |
| role | TEXT | 'author' | admin / editor / author |
| status | TEXT | 'active' | active / inactive |
| bio | TEXT | NULL | User biography |
| avatar_url | TEXT | NULL | Avatar image path |
| last_login | TEXT | NULL | ISO timestamp of last login |
| created_at | TEXT | NOT NULL | Creation timestamp |
| updated_at | TEXT | NULL | Last update timestamp |

### Table: `news`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | INTEGER | AUTO_INCREMENT | Primary Key |
| title | TEXT | NOT NULL | News headline |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly slug |
| excerpt | TEXT | NOT NULL | Short summary |
| content | TEXT | NOT NULL | Full article body |
| category | TEXT | NOT NULL | Category (कैंपस, टेक, etc.) |
| tags | TEXT | NULL | JSON array of tags |
| cover_image_url | TEXT | NULL | Cover image URL |
| gallery_urls | TEXT | NULL | Gallery image URLs |
| video_url | TEXT | NULL | YouTube embed URL |
| audio_url | TEXT | NULL | Audio file URL |
| source | TEXT | NULL | News source |
| ai_summary | TEXT | NULL | AI-generated summary |
| author_name | TEXT | NULL | Author name |
| author_email | TEXT | NULL | Author email |
| author_twitter | TEXT | NULL | Author Twitter handle |
| author_instagram | TEXT | NULL | Author Instagram |
| meta_description | TEXT | NULL | SEO meta description |
| meta_keywords | TEXT | NULL | SEO keywords |
| seo_title | TEXT | NULL | SEO page title |
| location | TEXT | NULL | News location |
| coordinates | TEXT | NULL | GPS coordinates |
| twitter_url | TEXT | NULL | Related Twitter post |
| facebook_url | TEXT | NULL | Related Facebook post |
| instagram_url | TEXT | NULL | Related Instagram post |
| youtube_url | TEXT | NULL | Related YouTube video |
| published_at | TEXT | NOT NULL | Publish timestamp |
| reading_time | INTEGER | 3 | Estimated read time (min) |
| is_featured | INTEGER | 0 | Featured flag (0/1) |
| is_breaking | INTEGER | 0 | Breaking news flag (0/1) |
| status | TEXT | 'published' | published / draft / archived |
| priority | TEXT | 'normal' | normal / high / urgent |
| language | TEXT | 'hi' | Content language |
| expire_at | TEXT | NULL | Expiry timestamp |
| views | INTEGER | 0 | View count |
| created_at | TEXT | NOT NULL | Creation timestamp |
| updated_at | TEXT | NOT NULL | Last update timestamp |

### Table: `site_settings`
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | INTEGER | AUTO_INCREMENT | Primary Key |
| site_name | TEXT | 'ALOK' | Site name |
| site_subtitle | TEXT | 'बीजेएमसी न्यूज़' | Subtitle |
| site_title | TEXT | 'ALOK - बीजेएमसी न्यूज़' | Browser title |
| site_description | TEXT | '...' | Meta description |
| updated_at | TEXT | NOT NULL | Last update timestamp |

---

## 7. API Endpoints (Complete)

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login (primary admin only, id=1) |

**Login Request:**
```json
{
  "email": "admin@example.com",
  "password": "change-me-before-login"
}
```

**Login Response:**
```json
{
  "data": {
    "token": "eyJhbGc...",
    "profile": {
      "id": 1,
      "name": "ALOK एडमिन",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "bio": "...",
      "avatar_url": "",
      "last_login": "2026-02-21T..."
    }
  }
}
```

### User Management (Admin Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admins` | Yes | List all users (sorted by role) |
| POST | `/api/admins` | Yes | Create new user |
| PUT | `/api/admins/:id` | Yes | Update user (role, status, name, etc.) |
| DELETE | `/api/admins/:id` | Yes | Delete user (cannot delete id=1) |
| PUT | `/api/admins/:id/password` | Yes | Change user password |

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | Yes | Get current user profile |
| PUT | `/api/profile` | Yes | Update profile (name, email, bio) |
| POST | `/api/profile/avatar` | Yes | Upload avatar image |

### News CRUD
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/news` | No | List news (query: limit, category, q) |
| GET | `/api/news/:slug` | No | Get single news (increments views) |
| POST | `/api/news` | Yes | Create news (30+ fields) |
| PUT | `/api/news/:id` | Yes | Update news |
| DELETE | `/api/news/:id` | Yes | Delete news |

### File Uploads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/uploads/cover` | Yes | Upload cover image |

### Site Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | No | Get site settings |
| PUT | `/api/settings` | Yes | Update site settings |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |

---

## 8. Frontend Features

### Public Pages
1. **होम (Home)** — Featured news slider, breaking news banner, latest articles
2. **ट्रेंडिंग (Trending)** — News sorted by views (most popular)
3. **वीडियो (Video)** — News with YouTube video embeds
4. **फ़ोटो (Photos)** — News with cover images gallery
5. **कैटेगरी फ़िल्टर** — Filter by category (कैंपस, टेक, डेटा, इवेंट, etc.)

### UI Features
- **Responsive Design**: Mobile bottom nav, Desktop sidebar, Tablet adaptations
- **Auto Language Detection**: Detects browser language (Hindi/English)
- **Manual Language Switch**: User can override language
- **Translation Tool**: Text translation + Image OCR (Tesseract.js)
- **Glassmorphism UI**: Modern glass-effect cards and panels
- **Dark Theme**: Black/dark background with accent colors
- **Demo Mode**: Shows demo data when backend is unavailable
- **Status Indicator**: Shows online/offline/demo state

### Device Responsive Breakpoints
- **Mobile**: < 768px (Bottom navigation bar)
- **Tablet**: 768px - 1024px (Adjusted layout)
- **Desktop**: > 1024px (Sidebar navigation)

---

## 9. Admin Panel Features

### Access
- Click "एडमिन लॉगिन" to open login form
- Only primary admin (id=1) can login
- JWT token stored in localStorage (`alok_token`)

### Admin Dashboard Sections
1. **Profile Management** — Edit name, email, bio, upload avatar
2. **News Management** — Create/Edit/Delete news (30+ fields)
3. **User Management** — Add/Edit/Delete users with roles
4. **Site Settings** — Change site name, subtitle, title, description
5. **News Edit Modal** — Inline edit with all fields

### Login State Indicators
- 🟡 **Loading**: "लॉगिन हो रहा है..." (with 12s timeout)
- 🟢 **Success**: "लॉगिन सफल है।"
- 🔴 **Error**: Shows specific error message
- ⏰ **Timeout**: "सर्वर से जवाब नहीं मिला।"

---

## 10. User Management System

### Role Hierarchy
| Role | Icon | Permissions |
|------|------|-------------|
| Admin (👑) | Full access | Create/edit/delete users, all CRUD |
| Editor (✏️) | Content management | Edit content, manage own profile |
| Author (👤) | Content creation | Create content, manage own profile |

### User Management UI
- **Create User**: Form with name, email, password, role, bio
- **Edit User**: Inline edit form (role, status, name, email, bio)
- **Delete User**: With confirmation (cannot delete id=1)
- **Change Password**: Per-user password change
- **Status Toggle**: Active (🟢) / Inactive (🔴)
- **Primary Admin Badge**: "🔒 Permanent ID: 1" (visible only to primary admin)

### Protection Rules
- id=1 cannot be deleted
- id=1 credentials are force-reset on every server start
- Only id=1 can log in
- Only admin role can create/delete users
- Users cannot delete their own account

---

## 11. News Creation System (30+ Fields)

### Basic Fields
- Title, Excerpt, Content, Category

### Media Fields
- Cover Image URL, Gallery URLs, Video URL, Audio URL

### Author Fields
- Author Name, Email, Twitter, Instagram

### SEO Fields
- Meta Description, Meta Keywords, SEO Title

### Location Fields
- Location Name, GPS Coordinates

### Social Media Links
- Twitter URL, Facebook URL, Instagram URL, YouTube URL

### Publishing Controls
- Published At, Is Featured, Is Breaking
- Status (published/draft/archived)
- Priority (normal/high/urgent)
- Language (hi/en)
- Expire At

### Auto-Generated
- Slug (from title, Hindi support with transliteration)
- Reading Time (calculated from content length)
- Views (auto-incremented on read)

---

## 12. Security & Auth

### Authentication Flow
1. User submits email + password
2. Server checks if user exists AND id === 1
3. Server validates password with bcrypt.compare()
4. Server checks status === 'active'
5. Server generates JWT token (jsonwebtoken)
6. Token stored in localStorage
7. All protected requests include `Authorization: Bearer <token>`

### Security Features
- **bcrypt** password hashing (10 rounds)
- **JWT** token-based authentication
- **Primary admin enforcement**: Credentials force-updated on server start
- **CORS**: `origin: true` with credentials
- **Input validation** on all endpoints
- **Role-based access control** on destructive operations

---

## 13. Deployment Details

### Frontend (Vercel Static)
- **vercel.json**: `{ buildCommand: "npm run build", outputDirectory: "dist", framework: "vite" }`
- **Rewrites**: All routes → `/index.html` (SPA routing)
- **API_URL**: Hardcoded to `https://server-tan-iota-18.vercel.app`

### Backend (Vercel Serverless)
- **vercel.json**: `@vercel/node` build, routes to `src/index.js`
- **Export**: `export default app` (required for Vercel)
- **No `app.listen()`** on Vercel (detects `VERCEL=1` env)
- **Lazy DB Init**: Database initialized on first request (not blocking startup)
- **DB Path**: `/tmp/alok.db` on Vercel (only writable directory)
- **Upload Dir**: `/tmp/uploads` on Vercel
- **CORS Headers**: Set in both Express middleware and vercel.json routes

### Environment Variables (Backend)
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4000 | Server port (local only) |
| VERCEL | '1' | Auto-set by Vercel |
| DB_PATH | /tmp/alok.db | Database file path |
| UPLOAD_DIR | /tmp/uploads | Upload directory |
| ADMIN_EMAIL | admin@example.com | Primary admin email |
| ADMIN_PASSWORD | change-me-before-login | Primary admin password |
| ADMIN_NAME | ALOK एडमिन | Primary admin display name |
| JWT_SECRET | auto-generated | JWT signing secret |

### Git Push Command (from Codespaces)
```bash
cd /workspaces/codespaces-react && git add -A && git commit -m "your message" && GH_TOKEN="" GITHUB_TOKEN="" git -c credential.helper='!gh auth git-credential' push https://github.com/YADAV-IN/alok-website.git main
```

---

## 14. Known Limitations

### Vercel-Specific
| Limitation | Impact | Workaround |
|-----------|--------|------------|
| **SQLite resets on cold start** | All data lost when function sleeps/restarts | Migrate to PostgreSQL/Supabase |
| **No persistent file storage** | Uploaded images lost on restart | Use Cloudflare R2 / AWS S3 |
| **10s function timeout (Free)** | Long DB operations may fail | Optimize queries |
| **250MB function size limit** | Large dependencies may fail | Tree-shake unused modules |
| **/tmp is 512MB max** | Limited temp storage | External storage needed |

### Authentication
- Only id=1 can login (by design)
- No password reset flow
- No email verification
- No 2FA

---

## 15. Future Roadmap

### Phase 1: Database Migration (Priority: HIGH)
- [ ] Migrate SQLite → Vercel Postgres / Supabase
- [ ] Persistent data across cold starts
- [ ] Connection pooling for serverless

### Phase 2: Cloud Storage (Priority: HIGH)
- [ ] Cloudflare R2 for image/file uploads
- [ ] S3-compatible client integration
- [ ] CDN for media delivery

### Phase 3: VM Deployment (Priority: MEDIUM)
- [ ] Ubuntu 22.04 VPS with Nginx + PM2
- [ ] Domain: alokofficialnews.bypreetamdevloper
- [ ] SSL with Let's Encrypt
- [ ] PM2 process management
- [ ] SQLite persistent on disk

### Phase 4: Feature Enhancements
- [ ] Multi-user login (not just id=1)
- [ ] Password reset via email
- [ ] Comment system
- [ ] Analytics dashboard
- [ ] Push notifications
- [ ] PWA offline support

---

## 16. Session Work Log

### Session: 21 Feb 2026

| # | Task | Status | Details |
|---|------|--------|---------|
| 1 | Fix login not working | ✅ Done | API_URL was localhost, changed to backend URL |
| 2 | Implement role-based user management | ✅ Done | Admin/Editor/Author roles, full CRUD API + UI |
| 3 | Primary admin only login | ✅ Done | Restricted login to id=1, force-reset on startup |
| 4 | Login state indicator | ✅ Done | Loading/Success/Error states, 12s timeout |
| 5 | Permanent admin ID badge | ✅ Done | "🔒 Permanent ID: 1" visible only to primary admin |
| 6 | Fix CORS for Vercel | ✅ Done | `origin: true`, CORS headers in vercel.json |
| 7 | Fix API_URL for production | ✅ Done | Hardcoded backend Vercel URL |
| 8 | Fix Vercel backend crash (500) | ✅ Done | `export default app`, /tmp paths, lazy DB init, conditional listen |
| 9 | Fix git push from Codespaces | ✅ Done | Codespace token had wrong scope, used `gh auth git-credential` |
| 10 | Fix frontend vercel.json | ✅ Done | Simplified to rewrites-based config |
| 11 | Documentation | ✅ Done | This file |

### Files Modified This Session
| File | Changes |
|------|---------|
| `server/src/index.js` | CORS fix, primary-admin login, user CRUD, Vercel export, lazy DB init, /tmp paths |
| `server/src/db.js` | Role/status/last_login migrations, primary admin enforcement, /tmp DB path for Vercel |
| `src/App.jsx` | API_URL hardcoded, login state, user management UI, role badges |
| `src/App.css` | Login status styles, user management styles |
| `server/vercel.json` | CORS headers on routes |
| `vercel.json` | Simplified to rewrites config |

---

## Quick Reference Commands

### Local Development
```bash
# Frontend
cd /workspaces/codespaces-react
npm install
npm start          # http://localhost:3000

# Backend
cd /workspaces/codespaces-react/server
npm install
npm run dev        # http://localhost:4000
```

### Deploy to Vercel
```bash
# Backend
cd /workspaces/codespaces-react/server
vercel --prod

# Frontend
cd /workspaces/codespaces-react
vercel --prod
```

### Git Push (from Codespaces)
```bash
cd /workspaces/codespaces-react && git add -A && git commit -m "message" && GH_TOKEN="" GITHUB_TOKEN="" git -c credential.helper='!gh auth git-credential' push https://github.com/YADAV-IN/alok-website.git main
```

---

> **Document generated:** 21 Feb 2026 | **Total Lines of Code:** ~3000+ | **Total API Endpoints:** 14
