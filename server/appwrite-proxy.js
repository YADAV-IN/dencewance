import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Appwrite config
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5';

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'appwrite-proxy' });
});

// Proxy all requests to Appwrite
app.all('/api/*', async (req, res) => {
  try {
    const path = req.path.replace('/api', ''); // Remove /api prefix
    const url = `${APPWRITE_ENDPOINT}${path}`;
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
    };

    // Forward auth headers if present
    if (req.headers['x-appwrite-key']) {
      options.headers['X-Appwrite-Key'] = req.headers['x-appwrite-key'];
    }
    if (req.headers['authorization']) {
      options.headers['Authorization'] = req.headers['authorization'];
    }

    if (req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    console.log(`[Proxy] ${req.method} ${path}`);
    
    const response = await fetch(url, options);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Appwrite Proxy running on port ${PORT}`);
  console.log(`📍 Forwarding to: ${APPWRITE_ENDPOINT}`);
});
