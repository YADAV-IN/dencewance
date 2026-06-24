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

async function checkDeploys(serviceId, serviceName) {
  console.log(`Checking deploys for ${serviceName}...`);
  const deploys = await makeRequest(`/v1/services/${serviceId}/deploys?limit=2`);
  if (Array.isArray(deploys)) {
    deploys.forEach(d => {
      console.log(`Deploy ID: ${d.deploy.id}, Status: ${d.deploy.status}, Created: ${d.deploy.createdAt}, Finished: ${d.deploy.finishedAt}`);
    });
  } else {
    console.log(deploys);
  }
}

async function run() {
  await checkDeploys('srv-d7sbjqosfn5c73c10tsg', 'dencewance');
  await checkDeploys('srv-d7fjqpho3t8c73aevkng', 'alok-backend');
}
run();
