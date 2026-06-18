import fs from 'fs';
import path from 'path';

const srcReels = 'C:/Users/vipno/.gemini/antigravity/scratch/global_status_data.json';
const srcNews = 'C:/Users/vipno/.gemini/antigravity/scratch/news_data.json';

const destReels = './data/reels_fallback.json';
const destNews = './data/news_fallback.json';
const destAdmins = './data/admins_fallback.json';

try {
  // Copy Reels
  if (fs.existsSync(srcReels)) {
    const raw = fs.readFileSync(srcReels, 'utf8');
    const json = JSON.parse(raw);
    const list = json.data || json;
    fs.writeFileSync(destReels, JSON.stringify(list, null, 2), 'utf8');
    console.log('Reels fallback copied.');
  }

  // Copy News
  if (fs.existsSync(srcNews)) {
    const raw = fs.readFileSync(srcNews, 'utf8');
    const json = JSON.parse(raw);
    const list = json.data || json;
    fs.writeFileSync(destNews, JSON.stringify(list, null, 2), 'utf8');
    console.log('News fallback copied.');
  }

  // Create Admins Fallback
  const admins = [
    {
      "name": "Preetam Singh Yadav ",
      "email": "vipno1official@gmail.com",
      "password_hash": "$2a$10$WLOxEmru4/v2RFpMp1XyBuB.lwFbBIu/ikRFb.Ulct9/b9B5Ffj7q",
      "role": "superadmin",
      "status": "active",
      "bio": "Admin of DenceWance",
      "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80",
      "last_login": "2026-05-24T04:25:00.553+00:00",
      "is_active": true,
      "followers": 0,
      "following": 0,
      "posts": 0,
      "created_at": "2026-04-08T14:18:43.289+00:00",
      "updated_at": "2026-05-24T04:25:00.553+00:00",
      "id": "69d663c300013ae31bb4",
      "_id": "69d663c300013ae31bb4"
    }
  ];
  fs.writeFileSync(destAdmins, JSON.stringify(admins, null, 2), 'utf8');
  console.log('Admins fallback created.');

} catch (err) {
  console.error(err);
}
