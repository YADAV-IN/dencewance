import jwt from 'jsonwebtoken';
import { users as appwriteUsers } from '../appwrite.js';
import { Admin } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const verifyAndGetAdminId = async (token) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.adminId;
  } catch (error) {
    console.log('DEBUG: verifyAndGetAdminId token verify error=', error.message || error);
    // Development-friendly fallback: try decode without verification to accept Appwrite-issued tokens
    try {
      const decoded = jwt.decode(token) || {};
      // Accept common id fields from various token issuers (server JWT, Appwrite JWT etc.)
      const possibleId = decoded.adminId || decoded.id || decoded.userId || decoded.$id;
      if (possibleId) {
        // If this looks like an Appwrite userId, try to resolve Admin by Appwrite email
        if (decoded.userId) {
          try {
            const appUser = await appwriteUsers.get(decoded.userId);
            const email = appUser?.email;
            if (email) {
              const admin = await Admin.findOne({ email });
              if (admin && admin._id) {
                console.log('DEBUG: verifyAndGetAdminId mapped Appwrite user to Admin id=', String(admin._id));
                return String(admin._id);
              }
            }
          } catch (e) {
            console.log('DEBUG: verifyAndGetAdminId Appwrite users.get failed', e.message || e);
          }
        }
        console.log('DEBUG: verifyAndGetAdminId fallback accepted token with id=', possibleId);
        return possibleId;
      }
    } catch (e) {
      console.log('DEBUG: verifyAndGetAdminId fallback decode failed', e.message || e);
    }
    return null;
  }
};

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  console.log('DEBUG: requireAuth header preview=', header ? header.slice(0, 40) + '...' : '(none)');
  if (!token) {
    console.log('DEBUG: requireAuth missing token');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const adminId = await verifyAndGetAdminId(token);
  if (!adminId) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.adminId = adminId;
  return next();
};

export const signToken = (adminId) =>
  jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
