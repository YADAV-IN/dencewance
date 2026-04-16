import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
let redisClient = null;

if (REDIS_URL) {
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));
  redisClient.connect().catch(console.error);
} else {
  console.log('No REDIS_URL found in .env, skipping Redis caching (working normally).');
}

export const cacheRoute = (ttlSeconds = 60, prefix = 'api') => {
  return async (req, res, next) => {
    if (!redisClient || !redisClient.isOpen) return next();

    const key = `cache:${prefix}:${req.originalUrl}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`[Redis HIT] ${key}`);
        const parsed = JSON.parse(cachedData);
        return res.json(parsed);
      }
    } catch (error) {
      console.error('Redis GET Error:', error);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch(err => {
          console.error('Redis SET Error:', err);
        });
      }
      return originalJson(body);
    };
    next();
  };
};

export const clearCache = async (prefix) => {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    const keys = await redisClient.keys(`cache:${prefix}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Redis INVALIDATED] keys starting with cache:${prefix}:*`);
    }
  } catch (error) {
    console.error('Redis CLEAR Error:', error);
  }
};
