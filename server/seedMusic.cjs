const mongoose = require('mongoose');
require('./src/db');
const tracks = [
  { title: 'Desi Hip Hop', artist: 'Divine Vibes', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', duration: 180, category: 'Indian', trending: true },
  { title: 'Bollywood Mashup', artist: 'DJ Raj', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover_url: 'https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=300', duration: 210, category: 'Indian', trending: true },
  { title: 'Punjabi Dhol Beat', artist: 'Singh Beats', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover_url: 'https://images.unsplash.com/photo-1587324438673-56c80b2a2aa4?w=300', duration: 150, category: 'Indian', trending: false },
  { title: 'Global Pop Hit', artist: 'Ariana V', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', duration: 195, category: 'Global', trending: true },
  { title: 'Latin Salsa Dance', artist: 'Los Hermanos', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', cover_url: 'https://images.unsplash.com/photo-1543615468-1936c58bb03b?w=300', duration: 200, category: 'Latin', trending: false },
  { title: 'K-Pop Dynamite', artist: 'Seoul Stars', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', cover_url: 'https://images.unsplash.com/photo-1621688636756-3b324021dd98?w=300', duration: 175, category: 'K-Pop', trending: true },
  { title: 'Lo-Fi Chillhop', artist: 'Chill Guy', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', cover_url: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f576f3?w=300', duration: 240, category: 'Chill', trending: false },
  { title: 'Epic Orchestral', artist: 'Hans M', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', cover_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300', duration: 300, category: 'Cinematic', trending: true }
];

mongoose.connection.once('open', async () => {
  const MusicTrack = mongoose.model('MusicTrack');
  await MusicTrack.deleteMany({});
  await MusicTrack.insertMany(tracks);
  console.log('Music Library Seeded!');
  process.exit(0);
});
