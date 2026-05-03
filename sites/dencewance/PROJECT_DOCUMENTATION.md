# BJMC News Portal - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features Implemented](#features-implemented)
5. [File Structure](#file-structure)
6. [Code Explanation](#code-explanation)
7. [Deployment Status](#deployment-status)
8. [Pending Tasks](#pending-tasks)
9. [Step-by-Step Setup Guide](#step-by-step-setup-guide)

---

## 🎯 Project Overview

**Project Name:** BJMC News Portal  
**Type:** Multi-language News Website with Admin Panel  
**Languages:** English & Hindi (Auto-detect + Manual Switch)  
**Special Features:** 
- Advanced Translation Tool (Text + OCR for Images)
- Admin CRUD Operations
- Mobile Responsive Design
- Modern UI with Animations

---

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 - UI Library
- **Vite** 6.3.6 - Build Tool & Dev Server
- **CSS3** - Advanced styling (Gradients, Animations, Glassmorphism)
- **Tesseract.js** 5.x - OCR (Optical Character Recognition)
- **MyMemory Translation API** - Text Translation (Free, No API Key)

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **SQLite3** - Database (⚠️ Must migrate to PostgreSQL for production)
- **bcryptjs** - Password Hashing
- **jsonwebtoken** - Authentication
- **cors** - Cross-Origin Resource Sharing

### Deployment
- **Vercel** - Hosting Platform (Frontend + Backend)
- **Vercel Postgres** - Recommended Database (Pending Setup)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React App (Multi-language UI)                     │     │
│  │  - Auto Language Detection                         │     │
│  │  - Translation Tool (Text + Image OCR)             │     │
│  │  - Admin Panel (Login Required)                    │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Requests
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              VERCEL FRONTEND DEPLOYMENT                      │
│  URL: https://codespaces-react-rho-ashen.vercel.app        │
│  - Static Files (HTML, JS, CSS)                             │
│  - Environment: VITE_API_URL                                │
└──────────────────────────┬──────────────────────────────────┘
                           │ API Calls
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              VERCEL BACKEND DEPLOYMENT                       │
│  URL: https://server-tan-iota-18.vercel.app                │
│  - Express.js Serverless Functions                          │
│  - JWT Authentication Middleware                            │
│  - REST API Endpoints                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Database Queries
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PENDING SETUP)                    │
│  ⚠️ Current: SQLite (Local Only)                            │
│  ✅ Required: Vercel Postgres / Supabase / PlanetScale      │
│  Tables: users, news, categories, site_settings             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features Implemented

### 0. **Latest Updates (Feb 2026)**
- **Primary Admin Only Login**: Only user with id=1 can log in.
- **Role-Based User Management**: Roles `admin` / `editor` / `author`.
- **User Status**: `active` / `inactive` with login blocking for inactive accounts.
- **Last Login Tracking**: `last_login` stored on successful login.
- **Full User CRUD API**: Create/update/delete users with admin-only permissions.

**Files:**
- `server/src/db.js` (schema + migrations + primary admin enforcement)
- `server/src/index.js` (auth + user management endpoints)
- `src/App.jsx` (UI + state for user management)
- `src/App.css` (user management styling)

### 1. **Multi-Language System**
- **Auto-Detection:** Detects browser language (Hindi/English)
- **Manual Override:** Language switcher buttons (हि/EN)
- **Coverage:** 60+ translation keys covering entire UI
- **Persistence:** Language preference saved in localStorage

**Files:**
- `src/translations.js` - Translation dictionaries
- `src/App.jsx` - Language state management

### 2. **Advanced Translation Tool**
- **Text Translation:** Hindi ↔ English
- **Image OCR:** Extract text from images using Tesseract.js
- **Auto-Detect:** Automatic language detection
- **Swap Languages:** Quick language switch
- **Copy to Clipboard:** Copy translated text

**Files:**
- `src/utils/translator.js` - Translation API integration
- `src/components/TranslationTool.jsx` - UI Component
- `src/components/TranslationTool.css` - Styling

**API Used:** MyMemory Translation API (https://api.mymemory.translated.net/get)

### 3. **Admin Panel**
- **Authentication:** JWT-based login system
- **CRUD Operations:**
  - ✅ Create new news articles
  - ✅ Edit existing articles (✏️ button)
  - ✅ Delete articles (🗑️ button with confirmation)
  - ✅ Update site settings (name, subtitle, title, description)
- **Auto-Fill:** Publish time auto-fills with current time (12-hour format)
- **Date Format:** Hindi month names (जनवरी, फरवरी, etc.)

**Endpoints:**
- `POST /api/auth/login` - Admin login (primary admin only)
- `GET /api/profile` - Current admin profile (auth required)
- `PUT /api/profile` - Update profile (auth required)
- `POST /api/profile/avatar` - Upload profile avatar (auth required)
- `POST /api/admins` - Create user (admin only)
- `GET /api/admins` - List users (admin only)
- `PUT /api/admins/:id` - Update user (admin only)
- `PUT /api/admins/:id/password` - Change password (admin/self)
- `DELETE /api/admins/:id` - Delete user (admin only)
- `GET /api/news` - Fetch all news
- `POST /api/news` - Create news (auth required)
- `PUT /api/news/:id` - Update news (auth required)
- `DELETE /api/news/:id` - Delete news (auth required)
- `GET /api/settings` - Fetch site settings
- `PUT /api/settings` - Update settings (auth required)

### 4. **Modern UI Design**
- **Gradients:** Multi-color backgrounds
- **Animations:** Fade-in, slide-up effects
- **Glassmorphism:** Frosted glass effect on cards
- **Sticky Header:** Always visible navigation
- **Breaking News Ticker:** Auto-scrolling news
- **Hover Effects:** Scale, shadow, brightness changes

### 5. **Mobile Responsive**
- **Breakpoints:**
  - `<767px` - Tablet/Mobile (single column)
  - `<374px` - Small mobile devices
- **Optimizations:**
  - Reduced padding (4vw)
  - Single-column layouts
  - Smaller font sizes
  - Touch-friendly buttons

---

## 📁 File Structure

```
/workspaces/codespaces-react/
│
├── index.html                      # Main HTML file (includes Tesseract.js CDN)
├── package.json                    # Frontend dependencies
├── vite.config.js                  # Vite configuration
├── vercel.json                     # Frontend Vercel config
├── jsconfig.json                   # JavaScript config
│
├── docs/
│   ├── ALOK-DOCS.md               # Development notes
│   └── PROJECT_DOCUMENTATION.md    # This file
│
├── public/
│   ├── manifest.json              # PWA manifest
│   └── robots.txt                 # SEO robots file
│
├── src/
│   ├── index.jsx                  # React entry point
│   ├── index.css                  # Global styles
│   ├── App.jsx                    # Main App component (1342 lines)
│   ├── App.css                    # Main App styles (2270 lines)
│   ├── App.test.jsx               # Tests
│   ├── setupTests.js              # Test setup
│   ├── reportWebVitals.js         # Performance monitoring
│   │
│   ├── translations.js            # 🌐 Multi-language dictionaries
│   │
│   ├── utils/
│   │   ├── translator.js          # 🔧 Translation API & OCR functions
│   │   ├── readingTime.js         # Calculate reading time
│   │   └── slug.js                # Generate URL slugs
│   │
│   └── components/
│       ├── TranslationTool.jsx    # 🌐 Translation tool UI
│       └── TranslationTool.css    # Translation tool styles
│
├── server/
│   ├── package.json               # Backend dependencies
│   ├── vercel.json                # Backend Vercel config
│   │
│   └── src/
│       ├── index.js               # Express server (200+ lines)
│       ├── db.js                  # Database initialization
│       │
│       ├── middleware/
│       │   └── auth.js            # JWT authentication middleware
│       │
│       └── utils/
│           ├── readingTime.js     # Reading time calculation
│           └── slug.js            # Slug generation
│
└── .vercel/                       # Vercel deployment files (auto-generated)
```

---

## 💻 Code Explanation

### Key Files Deep Dive

#### 1. `src/translations.js` (Multi-Language System)
```javascript
// Structure:
export const translations = {
  en: {
    siteName: "BJMC News",
    // ... 60+ keys
  },
  hi: {
    siteName: "बीजेएमसी समाचार",
    // ... 60+ keys
  }
};

// Helper function to get translation
export const t = (key, lang = 'hi') => {
  return translations[lang]?.[key] || translations['hi']?.[key] || key;
};

// Auto-detect browser language
export const detectLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('hi') ? 'hi' : 'en';
};
```

**Purpose:** Provides complete translation system for bilingual support.

---

#### 2. `src/utils/translator.js` (Translation Engine)
```javascript
// Functions:

1. translateText(text, from, to)
   - Uses MyMemory Translation API
   - Returns translated text
   - Handles errors with fallback

2. autoTranslate(text)
   - Auto-detects language
   - Translates to opposite language
   - Hindi → English or English → Hindi

3. translateFromImage(imageFile)
   - Extracts text using Tesseract.js OCR
   - Detects language from extracted text
   - Translates to opposite language
   - Returns: { original, translated, fromLang, toLang }

4. detectLanguage(text)
   - Checks for Devanagari Unicode (\u0900-\u097F)
   - Returns 'hi' or 'en'
```

**API Endpoint:** `https://api.mymemory.translated.net/get?q={text}&langpair={from}|{to}`

---

#### 3. `src/App.jsx` (Main Component - 1342 lines)

**State Management:**
```javascript
// Language state (persisted in localStorage)
const [language, setLanguage] = useState(() => 
  localStorage.getItem('alok_language') || detectLanguage()
);

// Translation tool state
const [showTranslationTool, setShowTranslationTool] = useState(false);

// Admin authentication
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [token, setToken] = useState(localStorage.getItem('token'));

// News data
const [allNews, setAllNews] = useState([]);
const [categories, setCategories] = useState([]);

// Edit functionality
const [editingNews, setEditingNews] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);

// Site settings
const [siteSettings, setSiteSettings] = useState({});
const [showSettingsModal, setShowSettingsModal] = useState(false);
```

**Key Functions:**
```javascript
// Language switching
const handleLanguageChange = (newLang) => {
  setLanguage(newLang);
  localStorage.setItem('alok_language', newLang);
};

// News CRUD
const handleCreateNews = async (formData) => { /* POST /api/news */ };
const handleEditNews = (news) => { /* Open edit modal */ };
const handleSaveNews = async (formData) => { /* PUT /api/news/:id */ };
const handleDeleteNews = async (id) => { /* DELETE /api/news/:id */ };

// Site settings
const handleUpdateSettings = async (formData) => { /* PUT /api/settings */ };
```

**UI Components:**
- Header with language switcher (हि/EN) and translation tool button (🌐)
- Breaking news ticker
- News cards grid with category filtering
- Admin login modal
- News edit modal (create/update)
- Site settings modal
- Translation tool modal

---

#### 4. `server/src/index.js` (Backend API - 200+ lines)

**Endpoints:**

```javascript
// Public endpoints
GET  /api/news          // Fetch all news with categories
GET  /api/categories    // Fetch all categories
GET  /api/settings      // Fetch site settings

// Authentication
POST /api/register      // Create admin account (disabled in production)
POST /api/login         // Admin login (returns JWT token)

// Protected endpoints (require JWT token)
POST   /api/news        // Create new news article
PUT    /api/news/:id    // Update news article
DELETE /api/news/:id    // Delete news article
PUT    /api/settings    // Update site settings
POST   /api/upload-avatar // Upload profile picture
```

**Authentication Middleware:**
```javascript
// server/src/middleware/auth.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

#### 5. `server/src/db.js` (Database Schema)

**Tables:**

```sql
-- users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- news table
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category_id INTEGER,
  author TEXT,
  publish_date TEXT,
  is_breaking BOOLEAN DEFAULT 0,
  is_trending BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- site_settings table
CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT DEFAULT 'BJMC News',
  site_subtitle TEXT DEFAULT 'Latest News Updates',
  site_title TEXT DEFAULT 'BJMC News Portal',
  site_description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Categories (Pre-inserted):**
- राजनीति (Politics)
- खेल (Sports)
- मनोरंजन (Entertainment)
- तकनीक (Technology)
- व्यापार (Business)
- स्वास्थ्य (Health)
- शिक्षा (Education)
- अन्य (Others)

---

## 🚀 Deployment Status

### ✅ Completed

1. **Frontend Deployed to Vercel**
   - URL: https://codespaces-react-rho-ashen.vercel.app
   - Build: Vite static build
   - Status: LIVE ✅

2. **Backend Deployed to Vercel**
   - URL: https://server-tan-iota-18.vercel.app
   - Type: Serverless Functions
   - Status: LIVE ✅

3. **Git Repository**
   - All files committed
   - `.vercel` folders created
   - Project linked to Vercel account

### ❌ Pending Issues

1. **Database Migration (CRITICAL)**
   - Current: SQLite (local only, won't work on Vercel)
   - Required: PostgreSQL or similar cloud database
   - Reason: Vercel has read-only filesystem

2. **Environment Variables (REQUIRED)**
   - Frontend needs: `VITE_API_URL`
   - Backend needs: `DATABASE_URL`, `JWT_SECRET`

3. **CORS Configuration (REQUIRED)**
   - Backend must allow Vercel frontend domain

---

## 🔧 Pending Tasks

### Priority 1: Database Setup (Must Complete)

#### Option A: Vercel Postgres (Recommended)

**Steps:**
1. Go to Vercel Dashboard: https://vercel.com/preetam-yadavs-projects/server
2. Click **Storage** → **Create Database** → **Postgres**
3. Copy the connection string
4. Update `server/src/db.js`:

```javascript
// Replace SQLite with PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Update all db.run() to pool.query()
// Update all db.get() to pool.query()
// Update all db.all() to pool.query()

// Example migration:
// OLD: db.run("INSERT INTO news ...")
// NEW: await pool.query("INSERT INTO news ...")
```

5. Create tables manually or use migration script
6. Add environment variable in Vercel:
   - Variable: `DATABASE_URL`
   - Value: `[postgres connection string]`

#### Option B: Supabase (Free Alternative)

**Steps:**
1. Create account: https://supabase.com
2. Create new project
3. Copy PostgreSQL connection string
4. Same code changes as Option A
5. Add `DATABASE_URL` environment variable

#### Option C: PlanetScale (MySQL)

**Steps:**
1. Create account: https://planetscale.com
2. Create database
3. Install: `npm install mysql2` in server
4. Update `server/src/db.js` for MySQL syntax
5. Add `DATABASE_URL` environment variable

---

### Priority 2: Environment Variables

#### Frontend (codespaces-react project)

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/preetam-yadavs-projects/codespaces-react
2. Settings → Environment Variables
3. Add:
   ```
   Name: VITE_API_URL
   Value: https://server-tan-iota-18.vercel.app
   Environments: Production, Preview, Development
   ```
4. Redeploy: `vercel --prod`

**Or via CLI:**
```bash
cd /workspaces/codespaces-react
vercel env add VITE_API_URL production
# Enter: https://server-tan-iota-18.vercel.app
vercel --prod
```

#### Backend (server project)

**Add these variables:**
```
DATABASE_URL=[your postgres connection string]
JWT_SECRET=your-secret-key-min-32-characters
NODE_ENV=production
```

---

### Priority 3: CORS Update

**File:** `server/src/index.js`

**Current:**
```javascript
app.use(cors());
```

**Update to:**
```javascript
app.use(cors({
  origin: [
    'https://codespaces-react-rho-ashen.vercel.app',
    'https://codespaces-react-3yt9kjhkn-preetam-yadavs-projects.vercel.app',
    'http://localhost:5173' // for local development
  ],
  credentials: true
}));
```

**Commit and redeploy:**
```bash
cd /workspaces/codespaces-react
git add server/src/index.js
git commit -m "Update CORS for Vercel deployment"
cd server
vercel --prod
```

---

### Priority 4: Database Migration Script

**Create:** `server/migrate.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    // Create news table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        image_url TEXT,
        category_id INTEGER REFERENCES categories(id),
        author VARCHAR(255),
        publish_date VARCHAR(255),
        is_breaking BOOLEAN DEFAULT FALSE,
        is_trending BOOLEAN DEFAULT FALSE,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create site_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        site_name VARCHAR(255) DEFAULT 'BJMC News',
        site_subtitle VARCHAR(255) DEFAULT 'Latest News Updates',
        site_title VARCHAR(255) DEFAULT 'BJMC News Portal',
        site_description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default categories
    const categories = [
      { name: 'राजनीति', slug: 'politics' },
      { name: 'खेल', slug: 'sports' },
      { name: 'मनोरंजन', slug: 'entertainment' },
      { name: 'तकनीक', slug: 'technology' },
      { name: 'व्यापार', slug: 'business' },
      { name: 'स्वास्थ्य', slug: 'health' },
      { name: 'शिक्षा', slug: 'education' },
      { name: 'अन्य', slug: 'others' }
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
        [cat.name, cat.slug]
      );
    }

    // Insert default settings
    await pool.query(`
      INSERT INTO site_settings (site_name, site_subtitle, site_title, site_description)
      VALUES ('BJMC News', 'ताजा समाचार अपडेट', 'BJMC समाचार पोर्टल', 'भारतीय पत्रकारिता और जनसंचार संस्थान का आधिकारिक समाचार पोर्टल')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

**Run migration:**
```bash
cd /workspaces/codespaces-react/server
DATABASE_URL="your-postgres-url" node migrate.js
```

---

## 📖 Step-by-Step Setup Guide

### For Local Development

```bash
# 1. Clone repository
git clone [your-repo-url]
cd codespaces-react

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install
cd ..

# 4. Start backend (Terminal 1)
cd server
npm start
# Backend runs on: http://localhost:5000

# 5. Start frontend (Terminal 2)
npm run dev
# Frontend runs on: http://localhost:5173

# 6. Create admin account
# Use POST request to http://localhost:5000/api/register
# Body: { "username": "admin", "password": "yourpassword" }
```

### For Production Deployment

```bash
# 1. Ensure all code is committed
git add .
git commit -m "Ready for deployment"

# 2. Install Vercel CLI
npm install -g vercel

# 3. Login to Vercel
vercel login

# 4. Deploy frontend
cd /workspaces/codespaces-react
vercel --prod

# 5. Deploy backend
cd server
vercel --prod

# 6. Setup Database (Choose one):
# - Vercel Postgres (Recommended)
# - Supabase (Free)
# - PlanetScale (MySQL)

# 7. Add environment variables via Vercel Dashboard:
# Frontend: VITE_API_URL
# Backend: DATABASE_URL, JWT_SECRET

# 8. Run database migration
DATABASE_URL="your-url" node server/migrate.js

# 9. Update CORS in server/src/index.js

# 10. Redeploy both projects
cd /workspaces/codespaces-react
vercel --prod
cd server
vercel --prod

# 11. Test website
# Visit: https://codespaces-react-rho-ashen.vercel.app
```

---

## 🔐 Admin Credentials

**Default Admin:**
- Username: `admin`
- Password: `change-me-before-login` (Change after first login)

**Create New Admin:**
```bash
# Using curl
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newadmin","password":"securepassword"}'

# Or use Postman/Insomnia
```

---

## 🐛 Known Issues & Solutions

### Issue 1: White Page on Frontend
**Cause:** Compilation errors  
**Solution:** Check browser console for errors, run `npm run dev` to see build errors

### Issue 2: API Calls Failing
**Cause:** CORS or incorrect API URL  
**Solution:** 
- Check `VITE_API_URL` environment variable
- Verify CORS settings in backend
- Check browser Network tab for exact error

### Issue 3: Translation Tool Not Working
**Cause:** Tesseract.js CDN not loaded  
**Solution:** Check `index.html` has:
```html
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
```

### Issue 4: Database Connection Failed (Vercel)
**Cause:** SQLite doesn't work on Vercel  
**Solution:** Migrate to PostgreSQL (see Priority 1 in Pending Tasks)

### Issue 5: Images Not Uploading
**Cause:** Base64 storage or file size limits  
**Solution:** Consider using Cloudinary or AWS S3 for image hosting

---

## 📊 Performance Optimization Tips

1. **Image Optimization:**
   - Use WebP format
   - Compress images before upload
   - Consider CDN (Cloudinary, ImageKit)

2. **Code Splitting:**
   - Already configured with Vite
   - Lazy load TranslationTool component if needed

3. **Database Indexing:**
   ```sql
   CREATE INDEX idx_news_category ON news(category_id);
   CREATE INDEX idx_news_publish ON news(publish_date);
   CREATE INDEX idx_news_breaking ON news(is_breaking);
   ```

4. **Caching:**
   - Add Redis for frequently accessed data
   - Use Vercel Edge Caching

5. **Bundle Size:**
   - Current: ~500KB (reasonable)
   - Monitor with: `npm run build` and check `dist` folder

---

## 🌐 API Documentation

### Public Endpoints

#### GET /api/news
**Description:** Fetch all news articles with category information  
**Response:**
```json
[
  {
    "id": 1,
    "title": "समाचार शीर्षक",
    "description": "संक्षिप्त विवरण",
    "content": "पूर्ण सामग्री...",
    "image_url": "https://...",
    "category_id": 1,
    "category_name": "राजनीति",
    "author": "संवाददाता",
    "publish_date": "19 फरवरी 2026, शाम 5:30",
    "is_breaking": 1,
    "is_trending": 0,
    "views": 150,
    "created_at": "2026-02-19T12:00:00.000Z"
  }
]
```

#### GET /api/categories
**Description:** Fetch all categories  
**Response:**
```json
[
  { "id": 1, "name": "राजनीति", "slug": "politics" },
  { "id": 2, "name": "खेल", "slug": "sports" }
]
```

#### GET /api/settings
**Description:** Fetch site settings  
**Response:**
```json
{
  "site_name": "BJMC News",
  "site_subtitle": "ताजा समाचार अपडेट",
  "site_title": "BJMC समाचार पोर्टल",
  "site_description": "भारतीय पत्रकारिता..."
}
```

### Authentication Endpoints

#### POST /api/login
**Description:** Admin login  
**Request:**
```json
{
  "username": "admin",
  "password": "change-me-before-login"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

### Protected Endpoints (Require JWT Token)

**Header Required:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### POST /api/news
**Description:** Create new news article  
**Request:**
```json
{
  "title": "नया समाचार",
  "description": "संक्षिप्त विवरण",
  "content": "पूर्ण सामग्री",
  "image_url": "https://...",
  "category_id": 1,
  "author": "संवाददाता",
  "publish_date": "19 फरवरी 2026, शाम 5:30",
  "is_breaking": true,
  "is_trending": false
}
```

#### PUT /api/news/:id
**Description:** Update existing news article  
**Request:** Same as POST /api/news

#### DELETE /api/news/:id
**Description:** Delete news article  
**Response:**
```json
{
  "message": "News deleted successfully"
}
```

#### PUT /api/settings
**Description:** Update site settings  
**Request:**
```json
{
  "site_name": "BJMC News Portal",
  "site_subtitle": "Latest Updates",
  "site_title": "BJMC News",
  "site_description": "Official news portal..."
}
```

---

## 🎨 UI Components Reference

### Language Switcher
**Location:** Header  
**Buttons:** हि (Hindi) | EN (English)  
**Functionality:** Switches entire UI language instantly

### Translation Tool Button
**Location:** Header (🌐 icon)  
**Opens:** Translation tool modal  
**Modes:**
- Text Translation
- Image OCR + Translation

### News Cards
**Features:**
- Category badge
- Reading time
- View count
- Edit/Delete buttons (admin only)
- Hover effects

### Admin Modals
1. **Login Modal:** Username + Password
2. **Edit News Modal:** Full form with all fields
3. **Settings Modal:** Site configuration

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Comment system on news articles
- [ ] Social media sharing buttons
- [ ] Email newsletter subscription
- [ ] Push notifications for breaking news
- [ ] Advanced search with filters
- [ ] User profiles with avatars
- [ ] Bookmarks/Save for later
- [ ] Dark mode toggle
- [ ] RSS feed generation
- [ ] SEO optimization (meta tags)
- [ ] Analytics dashboard for admin
- [ ] Multi-file image upload
- [ ] Video news support
- [ ] Live news streaming
- [ ] Mobile app (React Native)

### Technical Improvements
- [ ] TypeScript migration
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker containerization
- [ ] Redis caching layer
- [ ] GraphQL API option
- [ ] WebSocket for real-time updates
- [ ] Service Worker for offline support
- [ ] PWA full implementation

---

## 📞 Support & Contact

**For Issues:**
- Check [Known Issues](#known-issues--solutions) section
- Review browser console for errors
- Check Vercel deployment logs
- Verify environment variables

**Development Notes:**
- All code comments in English for AI readability
- UI text in Hindi/English via translations.js
- Database queries use parameterized statements (SQL injection safe)
- JWT tokens expire in 7 days
- Images stored as base64 (consider external storage for production)

---

## 📝 Changelog

### Version 2.0 (Current - Feb 2026)
- ✅ Multi-language system (Hindi/English)
- ✅ Advanced translation tool with OCR
- ✅ Complete admin CRUD interface
- ✅ Vercel deployment (Frontend + Backend)
- ✅ Mobile responsive design
- ✅ Modern UI with animations
- ✅ Site settings management

### Version 1.0 (Initial)
- ✅ Basic news display
- ✅ Category filtering
- ✅ Admin login
- ✅ SQLite database
- ✅ Express backend

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev              # Start frontend dev server
cd server && npm start   # Start backend server

# Build
npm run build           # Build frontend for production
npm run preview         # Preview production build

# Deployment
vercel                  # Deploy to Vercel (interactive)
vercel --prod           # Deploy to production
vercel env ls           # List environment variables
vercel logs             # View deployment logs

# Database
node server/migrate.js  # Run database migration

# Testing
npm test                # Run tests
npm run lint            # Check code quality
```

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] Database migrated to PostgreSQL
- [ ] Environment variables set (VITE_API_URL, DATABASE_URL, JWT_SECRET)
- [ ] CORS updated with production URLs
- [ ] Admin password changed from default
- [ ] Sample data inserted
- [ ] All features tested on production
- [ ] Mobile responsiveness verified
- [ ] Translation tool working
- [ ] Images loading correctly
- [ ] API endpoints responding
- [ ] SSL certificate active (Vercel handles this)
- [ ] Custom domain configured (optional)
- [ ] Analytics setup (optional)
- [ ] Error monitoring enabled (optional)

---

## 🎓 Learning Resources

**React:**
- https://react.dev/learn
- https://react.dev/reference/react

**Vite:**
- https://vitejs.dev/guide/

**Express.js:**
- https://expressjs.com/en/starter/installing.html

**PostgreSQL:**
- https://www.postgresql.org/docs/

**Vercel:**
- https://vercel.com/docs

**Tesseract.js (OCR):**
- https://tesseract.projectnaptha.com/

---

**Document Created:** February 19, 2026  
**Last Updated:** February 19, 2026  
**Version:** 2.0  
**Author:** AI Development Team  
**Project Status:** Production Ready (Pending Database Migration)

---

*This documentation is AI-readable and human-readable. Any AI agent can understand the complete project structure, pending tasks, and implementation details from this document.*
