const https = require('https');
const API_KEY = 'rnd_SF4aHpzTwePzcC6SrXnxtNmuyi5F';

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.render.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
      });
    }).on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function triggerDeploy(serviceId, serviceName) {
  console.log(`Triggering deploy for ${serviceName}...`);
  const result = await makeRequest(`/v1/services/${serviceId}/deploys`, 'POST', { clearCache: 'clear' });
  console.log(`Result for ${serviceName}:`, result);
}

async function run() {
  await triggerDeploy('srv-d7sbjqosfn5c73c10tsg', 'dencewance');
  await triggerDeploy('srv-d7fjqpho3t8c73aevkng', 'alok-backend');
}
run();
