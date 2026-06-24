const https = require('https');
const options = {
  hostname: 'api.render.com',
  path: '/v1/services/srv-cupe7u2j1k6c738t19n0/logs?limit=50',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer rnd_SF4aHpzTwePzcC6SrXnxtNmuyi5F',
    'Accept': 'application/json'
  }
};
https.get(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
