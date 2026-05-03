# Backend Database Migration Guide

## 🎯 Purpose
यह guide SQLite से PostgreSQL migration के लिए step-by-step instructions provide करता है। Vercel पर SQLite काम नहीं करता क्योंकि filesystem read-only है।

---

## 📋 Prerequisites

- Vercel account with backend deployed
- Database service account (Vercel Postgres / Supabase / PlanetScale)
- Terminal access

---

## 🚀 Option 1: Vercel Postgres (Recommended)

### Step 1: Create Database

1. **Vercel Dashboard में जाएं:**
   ```
   https://vercel.com/preetam-yadavs-projects/server
   ```

2. **Storage Tab खोलें:**
   - Click on **Storage** in left sidebar
   - Click **Create Database**
   - Select **Postgres**

3. **Database Configure करें:**
   - Database Name: `bjmc-news-db`
   - Region: Select closest to your users
   - Click **Create**

4. **Connection String Copy करें:**
   ```
   postgres://username:password@host:5432/database?sslmode=require
   ```

### Step 2: Install PostgreSQL Package

```bash
cd /workspaces/codespaces-react/server
npm install pg
```

### Step 3: Update Database Connection

**File:** `server/src/db.js`

**Replace entire file with:**

```javascript
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Initialize database tables
async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
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
        `INSERT INTO categories (name, slug) 
         VALUES ($1, $2) 
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug]
      );
    }

    // Insert default site settings
    const settingsCheck = await pool.query('SELECT COUNT(*) FROM site_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO site_settings 
        (site_name, site_subtitle, site_title, site_description)
        VALUES ($1, $2, $3, $4)
      `, [
        'BJMC News',
        'ताजा समाचार अपडेट',
        'BJMC समाचार पोर्टल',
        'भारतीय पत्रकारिता और जनसंचार संस्थान का आधिकारिक समाचार पोर्टल'
      ]);
    }

    // Create default admin user
    const userCheck = await pool.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
    if (parseInt(userCheck.rows[0].count) === 0) {
      const hashedPassword = await bcrypt.hash('change-me-before-login', 10);
      await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        ['admin', hashedPassword]
      );
      console.log('✅ Default admin user created (username: admin, password: change-me-before-login)');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Initialize on module load
initDatabase();

// Export pool for queries
module.exports = pool;
```

### Step 4: Update API Routes

**File:** `server/src/index.js`

**Find and replace these sections:**

**1. Get all news (around line 40):**

```javascript
// OLD (SQLite):
app.get('/api/news', (req, res) => {
  db.all(`
    SELECT news.*, categories.name as category_name 
    FROM news 
    LEFT JOIN categories ON news.category_id = categories.id
    ORDER BY news.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// NEW (PostgreSQL):
app.get('/api/news', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT news.*, categories.name as category_name 
      FROM news 
      LEFT JOIN categories ON news.category_id = categories.id
      ORDER BY news.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**2. Get categories (around line 55):**

```javascript
// OLD:
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// NEW:
app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**3. Create news (around line 65):**

```javascript
// OLD:
app.post('/api/news', authMiddleware, (req, res) => {
  const { title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending } = req.body;
  
  db.run(`
    INSERT INTO news (title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description, content, image_url, category_id, author, publish_date, is_breaking || 0, is_trending || 0],
  function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'News created successfully' });
  });
});

// NEW:
app.post('/api/news', authMiddleware, async (req, res) => {
  try {
    const { title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending } = req.body;
    
    const result = await db.query(`
      INSERT INTO news (title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [title, description, content, image_url, category_id, author, publish_date, is_breaking || false, is_trending || false]);
    
    res.json({ id: result.rows[0].id, message: 'News created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**4. Update news (around line 85):**

```javascript
// OLD:
app.put('/api/news/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending } = req.body;
  
  db.run(`
    UPDATE news 
    SET title = ?, description = ?, content = ?, image_url = ?, category_id = ?, 
        author = ?, publish_date = ?, is_breaking = ?, is_trending = ?
    WHERE id = ?
  `, [title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending, id],
  function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'News updated successfully' });
  });
});

// NEW:
app.put('/api/news/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending } = req.body;
    
    await db.query(`
      UPDATE news 
      SET title = $1, description = $2, content = $3, image_url = $4, category_id = $5, 
          author = $6, publish_date = $7, is_breaking = $8, is_trending = $9
      WHERE id = $10
    `, [title, description, content, image_url, category_id, author, publish_date, is_breaking, is_trending, id]);
    
    res.json({ message: 'News updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**5. Delete news (around line 105):**

```javascript
// OLD:
app.delete('/api/news/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM news WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'News deleted successfully' });
  });
});

// NEW:
app.delete('/api/news/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM news WHERE id = $1', [id]);
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**6. User registration (around line 115):**

```javascript
// OLD:
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
    [username, hashedPassword], 
    function(err) {
      if (err) return res.status(400).json({ error: 'Username already exists' });
      res.json({ id: this.lastID, username });
    }
  );
});

// NEW:
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    
    res.json({ id: result.rows[0].id, username });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});
```

**7. User login (around line 130):**

```javascript
// OLD:
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
  });
});

// NEW:
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**8. Get settings (around line 150):**

```javascript
// OLD:
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// NEW:
app.get('/api/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**9. Update settings (around line 160):**

```javascript
// OLD:
app.put('/api/settings', authMiddleware, (req, res) => {
  const { site_name, site_subtitle, site_title, site_description } = req.body;
  
  db.run(`
    UPDATE site_settings 
    SET site_name = ?, site_subtitle = ?, site_title = ?, site_description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, [site_name, site_subtitle, site_title, site_description],
  function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Settings updated successfully' });
  });
});

// NEW:
app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { site_name, site_subtitle, site_title, site_description } = req.body;
    
    await db.query(`
      UPDATE site_settings 
      SET site_name = $1, site_subtitle = $2, site_title = $3, site_description = $4, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [site_name, site_subtitle, site_title, site_description]);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**10. Upload avatar (around line 180):**

```javascript
// OLD:
app.post('/api/upload-avatar', authMiddleware, (req, res) => {
  const { avatar } = req.body;
  const userId = req.user.id;
  
  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Avatar updated successfully', avatar });
  });
});

// NEW:
app.post('/api/upload-avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;
    
    await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId]);
    res.json({ message: 'Avatar updated successfully', avatar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 5: Update CORS

**File:** `server/src/index.js`

**Find:**
```javascript
app.use(cors());
```

**Replace with:**
```javascript
app.use(cors({
  origin: [
    'https://codespaces-react-rho-ashen.vercel.app',
    'https://codespaces-react-3yt9kjhkn-preetam-yadavs-projects.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 6: Add Environment Variables to Vercel

**Backend Project:**

1. Go to: https://vercel.com/preetam-yadavs-projects/server
2. Settings → Environment Variables
3. Add these variables:

```
Name: DATABASE_URL
Value: [Your Vercel Postgres connection string]
Environments: ✅ Production, ✅ Preview, ✅ Development

Name: JWT_SECRET
Value: bjmc-news-super-secret-key-2026-secure
Environments: ✅ Production, ✅ Preview, ✅ Development

Name: NODE_ENV
Value: production
Environments: ✅ Production
```

### Step 7: Deploy Backend

```bash
cd /workspaces/codespaces-react/server
git add .
git commit -m "Migrate to PostgreSQL"
vercel --prod
```

### Step 8: Add Frontend Environment Variable

**Frontend Project:**

1. Go to: https://vercel.com/preetam-yadavs-projects/codespaces-react
2. Settings → Environment Variables
3. Add:

```
Name: VITE_API_URL
Value: https://server-tan-iota-18.vercel.app
Environments: ✅ Production, ✅ Preview, ✅ Development
```

4. Redeploy frontend:
```bash
cd /workspaces/codespaces-react
vercel --prod
```

### Step 9: Test Everything

Visit: https://codespaces-react-rho-ashen.vercel.app

Test:
- ✅ News loading
- ✅ Language switching
- ✅ Translation tool
- ✅ Admin login (username: admin, password: change-me-before-login)
- ✅ Create news
- ✅ Edit news
- ✅ Delete news
- ✅ Update settings

---

## 🚀 Option 2: Supabase (Free Alternative)

### Step 1: Create Supabase Project

1. Visit: https://supabase.com
2. Sign up / Login
3. Click **New Project**
4. Fill details:
   - Name: `bjmc-news`
   - Database Password: (save this!)
   - Region: Select closest

5. Wait for project creation (~2 minutes)

### Step 2: Get Connection String

1. Go to **Settings** → **Database**
2. Under **Connection String**, select **URI**
3. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 3: Same as Vercel Postgres

Follow **Step 2 to Step 9** from Option 1, but use Supabase connection string instead.

---

## 🚀 Option 3: PlanetScale (MySQL)

### Step 1: Create Account

1. Visit: https://planetscale.com
2. Sign up / Login
3. Click **New Database**
4. Name: `bjmc-news`
5. Region: Select closest

### Step 2: Get Connection String

1. Click **Connect**
2. Select **Node.js**
3. Copy connection details

### Step 3: Install MySQL Driver

```bash
cd /workspaces/codespaces-react/server
npm uninstall pg
npm install mysql2
```

### Step 4: Update db.js for MySQL

**File:** `server/src/db.js`

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true }
});

// Initialize database (MySQL syntax)
async function initDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Create tables with AUTO_INCREMENT instead of SERIAL
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // ... similar for other tables
    // Use AUTO_INCREMENT instead of SERIAL
    // Use INT instead of SERIAL
    // Use TINYINT(1) instead of BOOLEAN
    
  } finally {
    connection.release();
  }
}

initDatabase();

module.exports = pool;
```

### Step 5: Update API Routes for MySQL

In `server/src/index.js`, use `pool.execute()` instead of `pool.query()`:

```javascript
// Example:
const [rows] = await db.execute('SELECT * FROM news');
res.json(rows);
```

---

## 🔍 Troubleshooting

### Error: "Connection timeout"
**Solution:** Check if database is running, verify connection string, check firewall rules

### Error: "SSL required"
**Solution:** Add `ssl: { rejectUnauthorized: false }` to connection config

### Error: "Column not found"
**Solution:** Run migration script to create tables

### Error: "CORS error"
**Solution:** Verify CORS settings in backend, check if frontend URL is whitelisted

### Error: "Environment variable not found"
**Solution:** Add variables in Vercel dashboard, redeploy project

---

## 📊 Database Indexes (Performance)

After migration, add these indexes:

```sql
CREATE INDEX idx_news_category ON news(category_id);
CREATE INDEX idx_news_breaking ON news(is_breaking);
CREATE INDEX idx_news_trending ON news(is_trending);
CREATE INDEX idx_news_publish ON news(publish_date);
CREATE INDEX idx_news_created ON news(created_at DESC);
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable SSL for database connection
- [ ] Don't expose database credentials in code
- [ ] Use environment variables for secrets
- [ ] Enable Vercel Web Application Firewall (WAF)
- [ ] Add rate limiting (optional)
- [ ] Sanitize user inputs

---

## ✅ Verification Steps

After completing migration:

```bash
# Test database connection
curl https://server-tan-iota-18.vercel.app/api/categories

# Test news endpoint
curl https://server-tan-iota-18.vercel.app/api/news

# Test settings
curl https://server-tan-iota-18.vercel.app/api/settings

# Test login
curl -X POST https://server-tan-iota-18.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change-me-before-login"}'
```

Expected responses: JSON data, no errors

---

**Migration Time:** ~30 minutes  
**Difficulty:** Medium  
**Risk:** Low (test thoroughly before going live)

**Created:** February 19, 2026  
**Last Updated:** February 19, 2026
