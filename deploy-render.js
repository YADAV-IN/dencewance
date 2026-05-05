#!/usr/bin/env node

/**
 * 🚀 Render Deployment Helper
 * 
 * Usage:
 *   node deploy-render.js <RENDER_API_KEY>
 * 
 * Steps:
 * 1. Get API key from https://dashboard.render.com/account/api-keys
 * 2. Run: node deploy-render.js your-api-key-here
 */

// Support API key passed as argv[2] or via environment variable RENDER_API_KEY
const API_KEY = process.argv[2] || process.env.RENDER_API_KEY;

if (!API_KEY) {
  console.log(`
🚀 Render Deployment Helper
============================

यह script Render पर automatically deploy करेगा।

📋 Step 1: API Key Generate करो
  👉 https://dashboard.render.com/account/api-keys
  
📋 Step 2: Copy करो अपना API Key

📋 Step 3: Run करो:
  node deploy-render.js <YOUR-API-KEY>

उदाहरण:
  node deploy-render.js rnd_abc123xyz789

---

Alternatively, Render Dashboard से manually deploy करो:
  👉 https://dashboard.render.com
  → New → Blueprint → Select Repository → Deploy

  `);
  process.exit(0);
}

console.log('🚀 Deploying to Render...');
console.log('⏳ This may take a few minutes...\n');

// Render API endpoint for deployment
const RENDER_API_URL = 'https://api.render.com/v1';

async function deployToRender() {
  try {
    console.log('📡 Connecting to Render API...');
    
    // Get services
    const response = await fetch(`${RENDER_API_URL}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw { response: { status: response.status, data: await response.json() } };
    }

    const services = await response.json();
    
    if (!services || services.length === 0) {
      console.log('⚠️  No services found. Make sure to:');
      console.log('  1. Create Blueprint in Render Dashboard');
      console.log('  2. Connect your GitHub repo');
      console.log('  3. Then run this script\n');
      process.exit(1);
    }

    console.log('✅ Found services:');
    services.forEach(s => {
      console.log(`   • ${s.name} (${s.type})`);
    });

    console.log('\n📤 Triggering deployments...');
    
    // Trigger deploy for each service
    for (const service of services) {
      try {
        const deployResponse = await fetch(
          `${RENDER_API_URL}/services/${service.id}/deploys`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (deployResponse.ok) {
          console.log(`✅ Deployed: ${service.name}`);
        } else {
          const err = await deployResponse.json();
          console.log(`⚠️  ${service.name}: ${err.message || 'Deploy failed'}`);
        }
      } catch (err) {
        console.log(`⚠️  ${service.name}: ${err.message}`);
      }
    }

    console.log('\n🎉 Deployment triggered!');
    console.log('📊 Check status at: https://dashboard.render.com');
    console.log('\n✨ Your services will be live shortly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.status === 401) {
      console.log('Invalid API Key!');
      console.log('Get a new one: https://dashboard.render.com/account/api-keys');
    }
    process.exit(1);
  }
}

deployToRender();
