const http = require('http');
http.get('http://localhost:3004/api/reels', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 1000)));
});
