# 🚀 Backend Implementation - Advanced News Portal

## 📊 Database Schema Updates

### **News Table - Complete Schema**

```sql
CREATE TABLE news (
  -- Core Fields
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT,
  
  -- Media Fields
  cover_image_url TEXT,
  gallery_urls TEXT,              -- ✨ NEW: Comma-separated image URLs
  video_url TEXT,
  audio_url TEXT,                 -- ✨ NEW: Audio/podcast URL
  
  -- Author Fields
  author_name TEXT,               -- ✨ NEW: Author name
  author_email TEXT,              -- ✨ NEW: Author email
  author_twitter TEXT,            -- ✨ NEW: Twitter handle
  author_instagram TEXT,          -- ✨ NEW: Instagram handle
  source TEXT,
  
  -- SEO Fields
  seo_title TEXT,                 -- ✨ NEW: SEO optimized title
  meta_description TEXT,          -- ✨ NEW: Meta description
  meta_keywords TEXT,             -- ✨ NEW: Keywords for SEO
  ai_summary TEXT,
  
  -- Location Fields
  location TEXT,                  -- ✨ NEW: City/location
  coordinates TEXT,               -- ✨ NEW: GPS coordinates
  
  -- Social Media Fields
  twitter_url TEXT,               -- ✨ NEW: Twitter post URL
  facebook_url TEXT,              -- ✨ NEW: Facebook post URL
  instagram_url TEXT,             -- ✨ NEW: Instagram post URL
  youtube_url TEXT,               -- ✨ NEW: YouTube video URL
  
  -- Publishing Fields
  published_at TEXT NOT NULL,
  status TEXT DEFAULT 'published', -- ✨ NEW: draft/published/scheduled/archived
  priority TEXT DEFAULT 'normal',  -- ✨ NEW: low/normal/high/urgent
  language TEXT DEFAULT 'hi',      -- ✨ NEW: hi/en
  expire_at TEXT,                  -- ✨ NEW: Content expiration date
  
  -- Metadata
  reading_time INTEGER DEFAULT 3,
  is_featured INTEGER DEFAULT 0,
  is_breaking INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 🔄 Automatic Migrations

The system automatically adds new columns if they don't exist. Located in: `server/src/db.js`

```javascript
// Migration code runs on server start
const newColumns = [
  { name: 'gallery_urls', type: 'TEXT', default: null },
  { name: 'audio_url', type: 'TEXT', default: null },
  { name: 'author_name', type: 'TEXT', default: null },
  { name: 'author_email', type: 'TEXT', default: null },
  { name: 'author_twitter', type: 'TEXT', default: null },
  { name: 'author_instagram', type: 'TEXT', default: null },
  { name: 'meta_description', type: 'TEXT', default: null },
  { name: 'meta_keywords', type: 'TEXT', default: null },
  { name: 'seo_title', type: 'TEXT', default: null },
  { name: 'location', type: 'TEXT', default: null },
  { name: 'coordinates', type: 'TEXT', default: null },
  { name: 'twitter_url', type: 'TEXT', default: null },
  { name: 'facebook_url', type: 'TEXT', default: null },
  { name: 'instagram_url', type: 'TEXT', default: null },
  { name: 'youtube_url', type: 'TEXT', default: null },
  { name: 'status', type: 'TEXT', default: 'published' },
  { name: 'priority', type: 'TEXT', default: 'normal' },
  { name: 'language', type: 'TEXT', default: 'hi' },
  { name: 'expire_at', type: 'TEXT', default: null }
];
```

**Console Output on Migration:**
```
✅ Added gallery_urls column to news table
✅ Added audio_url column to news table
✅ Added author_name column to news table
... (all columns)
```

---

## 📡 API Endpoints

### **POST /api/news** - Create News

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  // Basic Info
  "title": "Breaking News Title",
  "excerpt": "Short description",
  "content": "Full article content",
  "category": "कैंपस",
  "tags": ["tag1", "tag2"],
  
  // Media
  "cover_image_url": "https://example.com/image.jpg",
  "gallery_urls": "https://img1.jpg, https://img2.jpg, https://img3.jpg",
  "video_url": "https://youtube.com/watch?v=xxxxx",
  "audio_url": "https://example.com/podcast.mp3",
  
  // Author
  "author_name": "ALOK Team",
  "author_email": "author@alok.com",
  "author_twitter": "@alok_news",
  "author_instagram": "@alok_official",
  "source": "ALOK News",
  
  // SEO
  "seo_title": "Optimized Title for Search Engines",
  "meta_description": "Description for Google search results",
  "meta_keywords": "keyword1, keyword2, keyword3",
  "ai_summary": "AI-generated summary",
  
  // Location
  "location": "नई दिल्ली, भारत",
  "coordinates": "28.6139, 77.2090",
  
  // Social Media
  "twitter_url": "https://twitter.com/user/status/123456",
  "facebook_url": "https://facebook.com/post/123456",
  "instagram_url": "https://instagram.com/p/ABC123",
  "youtube_url": "https://youtube.com/watch?v=xyz123",
  
  // Publishing
  "published_at": "2026-02-21T10:30:00.000Z",
  "status": "published",  // draft, published, scheduled, archived
  "priority": "urgent",   // low, normal, high, urgent
  "language": "hi",       // hi, en
  "expire_at": "2026-03-21T10:30:00.000Z",
  "is_featured": true,
  "is_breaking": true
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "Breaking News Title",
    "slug": "breaking-news-title",
    "gallery_urls": "https://img1.jpg, https://img2.jpg",
    "audio_url": "https://example.com/podcast.mp3",
    "author_name": "ALOK Team",
    "status": "published",
    "priority": "urgent",
    // ... all other fields
    "created_at": "2026-02-21T10:30:00.000Z",
    "updated_at": "2026-02-21T10:30:00.000Z"
  }
}
```

---

### **PUT /api/news/:id** - Update News

**Authentication:** Required (JWT Token)

**Request Body:** Same as POST (all fields optional, only changed fields needed)

**Example:**
```json
{
  "status": "archived",
  "priority": "low",
  "expire_at": "2026-02-22T00:00:00.000Z"
}
```

---

### **GET /api/news** - Get All News

**Query Parameters:**
- `category` - Filter by category
- `status` - Filter by status (published/draft/archived)
- `priority` - Filter by priority (urgent/high/normal/low)
- `language` - Filter by language (hi/en)
- `is_breaking` - Filter breaking news (1/0)
- `is_featured` - Filter featured news (1/0)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "News Title",
      "gallery_urls": "img1.jpg, img2.jpg",
      "audio_url": "podcast.mp3",
      "author_name": "ALOK Team",
      "author_twitter": "@alok_news",
      "meta_description": "SEO description",
      "location": "नई दिल्ली",
      "coordinates": "28.6139, 77.2090",
      "twitter_url": "https://twitter.com/...",
      "status": "published",
      "priority": "high",
      "language": "hi",
      // ... all fields
    }
  ]
}
```

---

### **GET /api/news/:slug** - Get Single News

**Response:** Same structure as above (single object)

---

### **DELETE /api/news/:id** - Delete News

**Authentication:** Required (JWT Token)

---

## 🔐 Authentication

**POST /api/auth/login**
```json
{
  "email": "admin@example.com",
  "password": "change-me-before-login"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "admin": {
    "id": 1,
    "name": "ALOK एडमिन",
    "email": "admin@example.com"
  }
}
```

---

## 💾 Data Storage Examples

### **Gallery Images (Multiple)**
Stored as comma-separated string:
```
"https://img1.jpg, https://img2.jpg, https://img3.jpg"
```

Frontend can split:
```javascript
const images = gallery_urls.split(',').map(url => url.trim());
```

### **Social Media URLs**
Each platform has its own field:
- `twitter_url` - Link to Twitter post
- `facebook_url` - Link to Facebook post
- `instagram_url` - Link to Instagram post
- `youtube_url` - Link to YouTube video

### **Status Workflow**
```
draft → published → archived
      ↓
   scheduled (with published_at future date)
```

### **Priority Levels**
```
low → normal → high → urgent
```

---

## 🎯 Default Values

When creating news without these fields:
- `status` = `'published'`
- `priority` = `'normal'`
- `language` = `'hi'`
- `is_featured` = `0`
- `is_breaking` = `0`
- `reading_time` = calculated from content
- `views` = `0`

---

## 🔍 Example Usage

### Create News with All Fields:
```javascript
const response = await fetch('http://localhost:3001/api/news', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'BJMC में नया कोर्स शुरू',
    excerpt: 'डिजिटल मीडिया में नया डिप्लोमा',
    content: 'पूरी खबर यहाँ...',
    category: 'शिक्षा',
    gallery_urls: 'img1.jpg, img2.jpg, img3.jpg',
    audio_url: 'podcast.mp3',
    author_name: 'प्रीतम शर्मा',
    author_twitter: '@preetam',
    meta_description: 'BJMC नया कोर्स - डिजिटल मीडिया डिप्लोमा',
    location: 'दिल्ली विश्वविद्यालय',
    twitter_url: 'https://twitter.com/post/123',
    status: 'published',
    priority: 'high',
    language: 'hi',
    is_breaking: true
  })
});
```

---

## ✅ All Features Implemented

- ✅ Multiple image gallery support
- ✅ Audio/podcast URLs
- ✅ Complete author information
- ✅ Full SEO capabilities
- ✅ Location and GPS coordinates
- ✅ Social media integration (4 platforms)
- ✅ Advanced publishing workflow
- ✅ Priority-based content
- ✅ Multilingual support
- ✅ Content expiration
- ✅ Automatic migrations
- ✅ Breaking news system
- ✅ Featured content system

---

## 🚀 Server Start Command

```bash
cd /workspaces/codespaces-react
npm start
```

**Expected Output:**
```
🚀 Server starting...
✅ Database initialized
✅ Added gallery_urls column to news table
✅ Added audio_url column to news table
✅ Added author_name column to news table
... (all migrations)
🎉 Server running on http://localhost:3001
```

---

## 📁 Files Modified

1. **server/src/db.js** - Database schema + migrations
2. **server/src/index.js** - API routes (POST, PUT)
3. **src/App.jsx** - Frontend forms (create + edit)
4. **src/App.css** - Form styling

---

**🎉 Backend is COMPLETE and PRODUCTION READY!**
