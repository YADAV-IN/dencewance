const https = require('https');
const API_KEY = 'rnd_SF4aHpzTwePzcC6SrXnxtNmuyi5F';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: path,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          reject(body);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    const services = await makeRequest('/v1/services');
    if (!Array.isArray(services)) {
        console.log('Services:', services);
        return;
    }
    for (const s of services) {
      console.log(`Service: ${s.service.name} (ID: ${s.service.id})`);
      const envVars = await makeRequest(`/v1/services/${s.service.id}/env-vars`);
      console.log('ENV VARS:');
      envVars.forEach(ev => {
        console.log(`${ev.envVar.key} = ${ev.envVar.value}`);
      });
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
