import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const versionFilePath = path.resolve('src/version.json');
const packageJsonPath = path.resolve('package.json');

let version = '1.0.0';
let gitCommitCount = 0;
let gitHash = '';

try {
  // Get git commit count
  gitCommitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
  gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  // Standard professional version: 1.0.[commitCount]
  // We start from 1.0.0 and count upward based on commits
  version = `1.0.${gitCommitCount}`;
} catch (e) {
  console.warn('⚠️ Git is not available or has no commits. Falling back to local tracking.');
  // Fallback: Read package.json version
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.version) {
        version = packageJson.version;
      }
    } catch (err) {}
  }
}

// Write generated version to version.json for the frontend to consume
const versionData = {
  version,
  buildTime: new Date().toISOString(),
  gitHash: gitHash || 'dev-build'
};

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
console.log(`🚀 Version automatically updated: ${version} (${gitHash || 'dev-build'})`);

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
