import axios from 'axios';

const trimSlash = (value = '') => value.replace(/\/$/, '');

const resolveForwardPath = (req) => {
  const rawPath = (req?.path || '').trim();
  if (!rawPath) return '/api/health';

  const withoutFunctionPrefix = rawPath
    .replace(/^\/functions\/[^/]+/, '')
    .replace(/^\/v1\/functions\/[^/]+(?:\/executions)?/, '');

  if (!withoutFunctionPrefix || withoutFunctionPrefix === '/') return '/api/health';
  return withoutFunctionPrefix.startsWith('/') ? withoutFunctionPrefix : `/${withoutFunctionPrefix}`;
};

export default async ({ req, res }) => {
  try {
    const backendUrl = trimSlash(process.env.BACKEND_API_URL || '');
    if (!backendUrl) {
      return res.status(500).json({
        error: 'BACKEND_API_URL is missing',
        message: 'Set BACKEND_API_URL in Appwrite Function variables to your Appwrite backend site URL.'
      });
    }

    const path = resolveForwardPath(req);
    const query = req.query ? new URLSearchParams(req.query).toString() : '';

    const url = `${backendUrl}${path}${query ? '?' + query : ''}`;

    const response = await axios({
      method: req.method || 'GET',
      url,
      data: req.bodyText ? JSON.parse(req.bodyText) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers?.cookie && { 'Cookie': req.headers.cookie }),
        ...(req.headers?.authorization && { 'Authorization': req.headers.authorization })
      },
      timeout: 10000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);

    return res.status(500).json({
      error: 'Backend service unavailable',
      message: error.message
    });
  }
};
