const https = require('https');

const req = https.request('https://dencewance.onrender.com/api/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test' // test with invalid token first to see if it even reaches the route without crashing
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});
req.on('error', console.error);
req.write(JSON.stringify({ name: 'Test Name' }));
req.end();
