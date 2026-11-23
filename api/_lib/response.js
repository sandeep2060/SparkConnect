/**
 * Standard API Response & CORS Helpers
 * Strict response structure: { ok: true, data } or { ok: false, error }
 */

export const applyCors = (req, res) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || process.env.VITE_API_URL || '*';
  const requestOrigin = req.headers?.origin;

  // If specific origin configured, match or fallback
  if (allowedOrigin === '*' || !allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Preflight handled
  }
  return false;
};

export const ok = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({ ok: true, data });
};

export const fail = (res, code = 500, message = 'Internal Server Error') => {
  return res.status(code).json({ ok: false, error: message });
};
