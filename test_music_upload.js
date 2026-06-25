import fs from 'fs';

(async () => {
  const form = new FormData();
  form.append('title', 'Test Music');
  form.append('artist', 'Test Artist');
  form.append('developer_secret', 'DENCEWANCE_DEV_2026');
  
  fs.writeFileSync('test.mp3', 'fake audio data');
  const blob = new Blob([fs.readFileSync('test.mp3')], { type: 'audio/mp3' });
  form.append('audio', blob, 'test.mp3');

  try {
    const res = await fetch('http://localhost:4000/api/music', {
      method: 'POST',
      body: form
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
})();
