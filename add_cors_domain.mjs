const endpoint = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5';
const domain = process.env.APPWRITE_DOMAIN || 'https://dencewance.onrender.com';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_7c2acfcb480f77876d630afe55d7c66136f1836f123d2825a5d0e12fee34372f3e788789845fd9a630cf4ea85b9179bd148f72d7f0c251c97d1814c1a01685a32cbcadc11ed1831d2e182eed3cee30972d3fe0168e311ad756bacb2a366dab06e5e89cf6845f1c1e1673f7664c146a2ee8cac3d91c1fecb4c0e2bf7f1e6bca4f';

async function main() {
  const response = await fetch(`${endpoint}/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'X-Appwrite-Key': apiKey,
      'X-Appwrite-Project': projectId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain }),
  });

  const bodyText = await response.text();
  let payload = bodyText;
  try {
    payload = JSON.parse(bodyText);
  } catch {}

  if (!response.ok) {
    console.error('Failed to add Appwrite CORS domain');
    console.error('Status:', response.status);
    console.error('Response:', payload);
    process.exit(1);
  }

  console.log('Added Appwrite domain:', domain);
  console.log('Response:', payload);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
