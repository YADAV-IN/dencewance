const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const versionFilePath = path.resolve('src/version.json');
  const packageJsonPath = path.resolve('package.json');

  let version = '1.0.0';
  let gitCommitCount = 0;
  let gitHash = '';

  try {
    // Run git fetch unshallow if shallow clone is detected (fixes Render shallow clones returning 1)
    try {
      if (execSync('git rev-parse --is-shallow-repository').toString().trim() === 'true') {
        execSync('git fetch --unshallow');
      }
    } catch(e) {}

    // Get git commit count
    gitCommitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
    // Standard professional version format (Sequential 1.0.1, 1.0.2...)
    version = `1.0.${gitCommitCount}`;
  } catch (e) {
    console.warn('⚠️ Fallback to package.json.');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.version) {
          version = packageJson.version;
        }
      } catch (err) {}
    }
  }
  // Create src directory if it doesn't exist
  const srcDir = path.dirname(versionFilePath);
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Write generated version to version.json for the frontend
  const versionData = {
    version,
    buildTime: new Date().toISOString(),
    gitHash: gitHash || 'deploy-build'
  };

  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
  console.log(`🚀 Version automatically updated: ${version} (${gitHash || 'deploy-build'})`);

  // Optionally update package.json version to keep it synced
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.version !== version) {
        packageJson.version = version;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      }
    } catch (err) {}
  }
} catch (globalErr) {
  console.warn('⚠️ Version generator script failed, using fallback configuration to prevent build failure:', globalErr);
  
  // Safe fallback to prevent import errors in frontend
  try {
    const fallbackPath = path.resolve('src/version.json');
    const fallbackDir = path.dirname(fallbackPath);
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    fs.writeFileSync(fallbackPath, JSON.stringify({
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      gitHash: 'fallback'
    }, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write fallback version.json:', e);
  }
  
  // Exit with status 0 so Render build does NOT fail
  process.exit(0);
}
