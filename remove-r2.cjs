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

async function removeR2FromService(serviceId, serviceName) {
  console.log(`\nFetching env vars for ${serviceName} (${serviceId})...`);
  const envVars = await makeRequest(`/v1/services/${serviceId}/env-vars`, 'GET');
  
  if (!Array.isArray(envVars)) {
    console.log('Failed to fetch:', envVars);
    return;
  }

  const newEnvVars = [];
  let removedAny = false;

  envVars.forEach(ev => {
    const key = ev.envVar.key;
    if (key.startsWith('R2_')) {
      console.log(`Removing ${key}`);
      removedAny = true;
    } else {
      newEnvVars.push({ key: key, value: ev.envVar.value });
    }
  });

  if (removedAny) {
    console.log(`Updating ${serviceName}...`);
    const result = await makeRequest(`/v1/services/${serviceId}/env-vars`, 'PUT', newEnvVars);
    console.log(`Update result for ${serviceName}:`, result.length ? 'Success (vars updated)' : result);
  } else {
    console.log(`No R2 variables found in ${serviceName}.`);
  }
}

async function run() {
  try {
    await removeR2FromService('srv-d7sbjqosfn5c73c10tsg', 'dencewance');
    await removeR2FromService('srv-d7fjqpho3t8c73aevkng', 'alok-backend');
    console.log('\nDone. Render will now redeploy the services without R2.');
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
