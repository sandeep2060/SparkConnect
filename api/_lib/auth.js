/**
 * Authentication Middleware & JWT Helpers
 * Signs, sets httpOnly cookies, verifies tokens, and protects routes
 */
import jwt from 'jsonwebtoken';
import { stringifySetCookie, parseCookie } from 'cookie';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_sparkconnect_998877';

/**
 * Sign a JWT valid for 7 days
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Set httpOnly auth cookie on HTTP response
 */
export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStr = stringifySetCookie({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });
  res.setHeader('Set-Cookie', cookieStr);
}

/**
 * Clear the auth cookie on logout
 */
export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStr = stringifySetCookie({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookieStr);
}

/**
 * Extract token from Cookie header or Authorization Bearer header
 */
export function getTokenFromRequest(req) {
  // 1. Check Bearer Authorization header
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Check req.cookies object if parsed by serverless runtime
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // 3. Parse raw Cookie header
  const rawCookie = req.headers?.cookie;
  if (rawCookie) {
    try {
      const parsed = parseCookie(rawCookie);
      if (parsed.token) {
        return parsed.token;
      }
    } catch {
      // Fallback regex parsing
      const match = rawCookie.match(/token=([^;]+)/);
      if (match) return match[1];
    }
  }

  return null;
}

/**
 * requireAuth middleware
 * Returns user if authenticated, throws Error or returns null
 */
export async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    throw error;
  }

  // Fetch fresh user from DB
  const users = await query(
    `SELECT id, email, role, status, mode, pseudonym, display_name, bio, avatar_url, 
            hide_photo, gender, interested_in, intents, interests, relationship_style, 
            city, location_lat, location_lng, dob, last_active, created_at
     FROM users
     WHERE id = $1`,
    [decoded.id]
  );

  if (!users || users.length === 0) {
    const error = new Error('User account not found');
    error.statusCode = 401;
    throw error;
  }

  const user = users[0];

  if (user.status === 'banned') {
    const error = new Error('This account has been banned');
    error.statusCode = 403;
    throw error;
  }

  // Update last_active in background
  query(`UPDATE users SET last_active = now() WHERE id = $1`, [user.id]).catch(() => {});

  req.user = user;
  return user;
}

/**
 * requireAdmin middleware
 * Ensures user is authenticated and possesses admin role
 */
export async function requireAdmin(req) {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    const error = new Error('Access forbidden: Admin privileges required');
    error.statusCode = 403;
    throw error;
  }
  return user;
}
