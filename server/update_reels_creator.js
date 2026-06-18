import 'dotenv/config';
import { Reel } from './src/db.js';

async function update() {
  try {
    const reels = await Reel.find({});
    console.log(`Found ${reels.length} reels. Syncing creator details to Preetam's ID...`);
    for (const reel of reels) {
      const reelId = reel.id || reel._id || reel.$id;
      if (reelId) {
        await Reel.findByIdAndUpdate(reelId, {
          creator_id: '69d663c300013ae31bb4',
          creator_name: 'Preetam Singh Yadav ',
          creator_handle: 'preetam',
          creator_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80'
        });
      }
    }
    console.log('Successfully synced all reels to the testing admin!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
update();
