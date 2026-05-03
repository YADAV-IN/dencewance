import { initDb, getDb } from './src/db.js';

async function run() {
    await initDb();
    const db = await getDb();

    try {
        const now = new Date().toISOString();
        const result = await db.run(
            `INSERT INTO news
      (title, slug, excerpt, content, category, tags, cover_image_url, gallery_urls, video_url, audio_url, source, ai_summary,
       author_name, author_email, author_twitter, author_instagram, meta_description, meta_keywords, seo_title,
       location, coordinates, twitter_url, facebook_url, instagram_url, youtube_url,
       published_at, reading_time, is_featured, is_breaking, status, priority, language, expire_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                "Test Title",
                "test-slug",
                "Test Excerpt",
                "Test Content",
                "कैंपस",
                JSON.stringify([]),
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                now,
                5,
                0,
                0,
                "published",
                "normal",
                "hi",
                "",
                now,
                now,
            ]
        );
        console.log("Success!", result);
    } catch (err) {
        console.error("DB Error:", err);
    }
}

run();
