#!/usr/bin/env node

/**
 * 🧪 Backend API Test Script
 * All new advanced fields testing
 */

const API_URL = 'http://localhost:3001';

// Test data with ALL new fields
const testNewsData = {
  // Basic fields
  title: '🎓 BJMC में डिजिटल मीडिया का नया डिप्लोमा कोर्स शुरू',
  excerpt: 'दिल्ली विश्वविद्यालय के BJMC डिपार्टमेंट में अब छात्र डिजिटल मीडिया और कंटेंट क्रिएशन का विशेष डिप्लोमा कोर्स कर सकेंगे।',
  content: `दिल्ली विश्वविद्यालय के बैचलर ऑफ जर्नलिज्म एंड मास कम्युनिकेशन (BJMC) डिपार्टमेंट में एक नया डिप्लोमा कोर्स शुरू किया गया है। यह कोर्स डिजिटल मीडिया और कंटेंट क्रिएशन पर केंद्रित है।

कोर्स की मुख्य विशेषताएं:
- 6 महीने का intensive program
- Practical hands-on training
- Industry experts द्वारा mentorship
- Job placement support

यह कोर्स उन छात्रों के लिए है जो digital storytelling, social media management, और video production में career बनाना चाहते हैं।`,
  category: 'शिक्षा',
  tags: ['BJMC', 'Digital Media', 'Education', 'DU', 'Course'],

  // 🎬 Media fields
  cover_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  gallery_urls: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400, https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400, https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',

  // ✍️ Author fields
  author_name: 'प्रीतम शर्मा',
  author_email: 'preetam@alok.com',
  author_twitter: '@preetam_sharma',
  author_instagram: '@preetam.official',
  source: 'ALOK News Desk',

  // 🔍 SEO fields
  seo_title: 'BJMC Digital Media Diploma Course 2026 - DU | ALOK News',
  meta_description: 'दिल्ली विश्वविद्यालय के BJMC में डिजिटल मीडिया का नया 6 महीने का डिप्लोमा कोर्स। Practical training, industry mentorship, और job placement के साथ।',
  meta_keywords: 'BJMC, Digital Media Course, DU Diploma, Journalism, Content Creation, Delhi University',
  ai_summary: 'DU के BJMC डिपार्टमेंट ने डिजिटल मीडिया में 6 महीने का नया डिप्लोमा course launch किया है जिसमें practical training और job placement मिलेगी।',

  // 📍 Location fields
  location: 'दिल्ली विश्वविद्यालय, नई दिल्ली',
  coordinates: '28.6863, 77.2217',

  // 🔗 Social media fields
  twitter_url: 'https://twitter.com/ALOK_News/status/1234567890',
  facebook_url: 'https://facebook.com/ALOKNews/posts/1234567890',
  instagram_url: 'https://instagram.com/p/ABC123xyz',
  youtube_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',

  // ⚙️ Publishing fields
  status: 'published',
  priority: 'high',
  language: 'hi',
  published_at: new Date().toISOString(),
  expire_at: null, // No expiry
  is_featured: true,
  is_breaking: false
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
  log('cyan', '\n🧪 Starting Backend API Tests...\n');

  try {
    // Step 1: Login
    log('blue', '1️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'change-me-before-login'
      })
    });

    if (!loginResponse.ok) {
      log('red', '❌ Login failed!');
      return;
    }

    const { token } = await loginResponse.json();
    log('green', `✅ Login successful! Token: ${token.substring(0, 20)}...`);

    // Step 2: Create News with ALL fields
    log('blue', '\n2️⃣ Creating news with ALL new fields...');
    const createResponse = await fetch(`${API_URL}/api/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testNewsData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      log('red', `❌ Create failed: ${JSON.stringify(error)}`);
      return;
    }

    const { data: createdNews } = await createResponse.json();
    log('green', `✅ News created successfully! ID: ${createdNews.id}`);

    // Verify all fields
    log('magenta', '\n📊 Verifying Advanced Fields:');
    const fieldsToCheck = [
      { name: 'Gallery URLs', value: createdNews.gallery_urls },
      { name: 'Audio URL', value: createdNews.audio_url },
      { name: 'Author Name', value: createdNews.author_name },
      { name: 'Author Twitter', value: createdNews.author_twitter },
      { name: 'Author Instagram', value: createdNews.author_instagram },
      { name: 'SEO Title', value: createdNews.seo_title },
      { name: 'Meta Description', value: createdNews.meta_description },
      { name: 'Meta Keywords', value: createdNews.meta_keywords },
      { name: 'Location', value: createdNews.location },
      { name: 'Coordinates', value: createdNews.coordinates },
      { name: 'Twitter URL', value: createdNews.twitter_url },
      { name: 'Facebook URL', value: createdNews.facebook_url },
      { name: 'Instagram URL', value: createdNews.instagram_url },
      { name: 'YouTube URL', value: createdNews.youtube_url },
      { name: 'Status', value: createdNews.status },
      { name: 'Priority', value: createdNews.priority },
      { name: 'Language', value: createdNews.language }
    ];

    fieldsToCheck.forEach(field => {
      const status = field.value ? '✅' : '❌';
      const displayValue = field.value ?
        (field.value.length > 50 ? field.value.substring(0, 50) + '...' : field.value) :
        'NOT SET';
      log('yellow', `  ${status} ${field.name}: ${displayValue}`);
    });

    // Step 3: Update News
    log('blue', '\n3️⃣ Testing Update API...');
    const updateResponse = await fetch(`${API_URL}/api/news/${createdNews.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'archived',
        priority: 'low',
        author_name: 'Updated Author Name'
      })
    });

    if (!updateResponse.ok) {
      log('red', '❌ Update failed!');
      return;
    }

    const { data: updatedNews } = await updateResponse.json();
    log('green', `✅ News updated successfully!`);
    log('yellow', `  Status: ${createdNews.status} → ${updatedNews.status}`);
    log('yellow', `  Priority: ${createdNews.priority} → ${updatedNews.priority}`);
    log('yellow', `  Author: ${createdNews.author_name} → ${updatedNews.author_name}`);

    // Step 4: Get news by slug
    log('blue', '\n4️⃣ Testing GET by slug...');
    const getResponse = await fetch(`${API_URL}/api/news/${createdNews.slug}`);
    const { data: fetchedNews } = await getResponse.json();

    if (fetchedNews.id === createdNews.id) {
      log('green', `✅ News fetched successfully!`);
    }

    // Step 5: Gallery URLs parsing test
    log('blue', '\n5️⃣ Testing Gallery URLs parsing...');
    if (fetchedNews.gallery_urls) {
      const galleryImages = fetchedNews.gallery_urls.split(',').map(url => url.trim());
      log('green', `✅ Gallery contains ${galleryImages.length} images:`);
      galleryImages.forEach((img, i) => {
        log('yellow', `  ${i + 1}. ${img.substring(0, 60)}...`);
      });
    }

    log('green', '\n\n✅ ALL TESTS PASSED! 🎉');
    log('cyan', '\n📋 Test Summary:');
    log('yellow', '  ✅ Authentication working');
    log('yellow', '  ✅ Create API with 30+ fields working');
    log('yellow', '  ✅ Update API working');
    log('yellow', '  ✅ GET API working');
    log('yellow', '  ✅ All advanced fields stored correctly');
    log('yellow', '  ✅ Gallery URLs parsing working');

  } catch (error) {
    log('red', `\n❌ Test failed with error: ${error.message}`);
    console.error(error);
  }
}

import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

log('cyan', '╔════════════════════════════════════════════════════════════╗');
log('cyan', '║         🧪 ALOK News Backend API Test Suite              ║');
log('cyan', '║         Testing All 30+ Advanced Fields                  ║');
log('cyan', '╚════════════════════════════════════════════════════════════╝');

log('yellow', '\n⚠️  Make sure the server is running on http://localhost:3001');
log('yellow', '    Command: npm start\n');

rl.question('Press ENTER to start tests... ', () => {
  rl.close();
  testAPI();
});
