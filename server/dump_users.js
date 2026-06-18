import 'dotenv/config';
import { Admin, UserProfile } from './src/db.js';

async function dump() {
  try {
    const admins = await Admin.find({});
    console.log("=== ADMINS ===");
    console.log(JSON.stringify(admins, null, 2));

    const profiles = await UserProfile.find({});
    console.log("=== PROFILES ===");
    console.log(JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
dump();
