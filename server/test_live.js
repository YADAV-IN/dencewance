import jwt from 'jsonwebtoken';

async function test() {
  try {
    const token = jwt.sign({ adminId: '123' }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '7d' });
    const res = await fetch('https://server-kappa-lac.vercel.app/api/uploads/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: 'test.mp4', contentType: 'video/mp4' })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON:", json);
  } catch (err) { console.error(err) }
}
test();
