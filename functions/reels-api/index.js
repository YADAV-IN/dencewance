import axios from 'axios';

export default async ({ req, res }) => {
  try {
    // Render backend URL
    const backendUrl = 'https://alok-backend.onrender.com';
    const path = req.path?.replace('/functions/reels-api', '') || '/api/reels';
    const query = req.query ? new URLSearchParams(req.query).toString() : '';
    
    const url = `${backendUrl}${path}${query ? '?' + query : ''}`;
    
    // Forward request to Render backend
    const response = await axios({
      method: req.method,
      url,
      data: req.bodyText ? JSON.parse(req.bodyText) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    
    // Fallback response
    return res.status(500).json({
      error: 'Backend service unavailable',
      message: error.message
    });
  }
};
