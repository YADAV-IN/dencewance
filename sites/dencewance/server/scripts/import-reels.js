import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const INPUT_FILE = process.env.LINKS_FILE || path.resolve(process.cwd(), 'data/reels-links.txt');

if (!ADMIN_TOKEN) {
  console.error('Missing ADMIN_TOKEN env var.');
  process.exit(1);
}

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

const raw = fs.readFileSync(INPUT_FILE, 'utf8');
const links = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

if (!links.length) {
  console.error('No links found in input file.');
  process.exit(1);
}

const chunkSize = 100;
let totalCreated = 0;
let totalDuplicate = 0;
let totalInvalid = 0;
let totalDead = 0;

for (let i = 0; i < links.length; i += chunkSize) {
  const chunk = links.slice(i, i + chunkSize);
  const response = await fetch(`${API_URL}/api/reels/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ links: chunk }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Import failed:', payload?.error || response.statusText);
    process.exit(1);
  }

  const created = payload?.data?.createdCount || 0;
  const duplicates = payload?.data?.skipped?.duplicates || 0;
  const invalid = payload?.data?.skipped?.invalid || 0;
  const dead = payload?.data?.skipped?.dead || 0;
  totalCreated += created;
  totalDuplicate += duplicates;
  totalInvalid += invalid;
  totalDead += dead;
  console.log(`Imported chunk ${Math.floor(i / chunkSize) + 1}: created=${created}, duplicate=${duplicates}, invalid=${invalid}, dead=${dead}`);
}

console.log(`Done. Total imported reels: ${totalCreated}`);
console.log(`Skipped duplicates: ${totalDuplicate}`);
console.log(`Skipped invalid links: ${totalInvalid}`);
console.log(`Skipped dead/unplayable links: ${totalDead}`);
