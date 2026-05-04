import { Client } from 'node-appwrite';

const apiKey = 'standard_7c2acfcb480f77876d630afe55d7c66136f1836f123d2825a5d0e12fee34372f3e788789845fd9a630cf4ea85b9179bd148f72d7f0c251c97d1814c1a01685a32cbcadc11ed1831d2e182eed3cee30972d3fe0168e311ad756bacb2a366dab06e5e89cf6845f1c1e1673f7664c146a2ee8cac3d91c1fecb4c0e2bf7f1e6bca4f';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69d60fbe002bae1e32d5')
  .setKey(apiKey);

// Note: Direct domain management via SDK may not be available
// We'll use a direct HTTP API call instead
const domain = 'https://alok-frontend-ig2e.onrender.com';
const endpoint = 'https://nyc.cloud.appwrite.io/v1';
const projectId = '69d60fbe002bae1e32d5';

try {
  const response = await fetch(`${endpoint}/projects/${projectId}`, {
    method: 'GET',
    headers: {
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('✅ Project Info:', {
    name: data.name,
    domains: data.domains || 'No domains set yet'
  });

  // Try to update domains
  const updateResponse = await fetch(`${endpoint}/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domain: domain,
    }),
  });

  if (updateResponse.ok) {
    console.log('✅ Domain added successfully:', domain);
  } else {
    console.log('⚠️ Response status:', updateResponse.status);
    const errorData = await updateResponse.json();
    console.log('Error details:', errorData);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
