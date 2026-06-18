const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

async function getCommitCount() {
  let count = 0;
  let gitHash = '';

  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch(e) {}

  // 1. Try local git first (works locally and if unshallow succeeds)
  try {
    if (execSync('git rev-parse --is-shallow-repository').toString().trim() === 'true') {
      execSync('git fetch --unshallow');
    }
    const localCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
    if (!isNaN(localCount) && localCount > 1) {
      return { count: localCount, hash: gitHash };
    }
  } catch(e) {}

  // 2. Fallback to GitHub API for shallow Render clones
  return new Promise((resolve) => {
    https.get('https://api.github.com/repos/YADAV-IN/dencewance/commits?per_page=1', { headers: { 'User-Agent': 'Node' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const link = res.headers.link;
          if (link) {
            const match = link.match(/&page=(\d+)>; rel="last"/);
            if (match && match[1]) {
              return resolve({ count: parseInt(match[1], 10), hash: gitHash || 'api-fallback' });
            }
          }
          const json = JSON.parse(data);
          if (Array.isArray(json)) {
            return resolve({ count: json.length, hash: gitHash || 'api-fallback' });
          }
        } catch(e) {}
        resolve({ count: 1, hash: gitHash || 'deploy-build' });
      });
    }).on('error', () => resolve({ count: 1, hash: gitHash || 'deploy-build' }));
  });
}

async function run() {
  try {
    const versionFilePath = path.resolve('src/version.json');
    const packageJsonPath = path.resolve('package.json');
    
    let version = '1.0.0';

    try {
      const { count, hash } = await getCommitCount();
      if (count > 0) {
        version = `1.0.${count}`;
      }
      
      const srcDir = path.dirname(versionFilePath);
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }

      const versionData = {
        version,
        buildTime: new Date().toISOString(),
        gitHash: hash
      };

      fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
      console.log(`✅ Version automatically updated: ${version} (${hash})`);

      // Keep package.json synced
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.version !== version) {
          packageJson.version = version;
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        }
      }
    } catch(e) {
      console.warn('⚠️ Fallback version logic triggered', e);
    }
  } catch (globalErr) {
    console.error('Failed version generator entirely:', globalErr);
    process.exit(0);
  }
}

run();
