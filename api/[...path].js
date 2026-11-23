/**
 * Unified Serverless API Router for SparkConnect (LoveBook)
 * Consolidates all backend endpoints into a single serverless function
 * to comply with Vercel Hobby plan limits (max 12 serverless functions).
 */

// Dynamic handler loaders from server/
const routeHandlers = {
  // Auth
  'auth/login': () => import('../server/auth/login.js'),
  'auth/logout': () => import('../server/auth/logout.js'),
  'auth/me': () => import('../server/auth/me.js'),
  'auth/signup': () => import('../server/auth/signup.js'),

  // Chats
  'chats': () => import('../server/chats/index.js'),
  'chats/start': () => import('../server/chats/start.js'),

  // Users
  'users': () => import('../server/users/index.js'),
  'users/me': () => import('../server/users/me.js'),
  'users/block': () => import('../server/users/block.js'),
  'users/reveal': () => import('../server/users/reveal.js'),

  // Safety
  'safety/report': () => import('../server/safety/report.js'),

  // Admin
  'admin/chat-log': () => import('../server/admin/chat-log.js'),
  'admin/reports': () => import('../server/admin/reports.js'),
  'admin/stats': () => import('../server/admin/stats.js'),
  'admin/users': () => import('../server/admin/users.js'),
  'admin/verify': () => import('../server/admin/verify.js'),
};

export default async function handler(req, res) {
  // Extract path from query params
  const { path } = req.query;
  const pathParts = Array.isArray(path) ? path : (path ? path.split('/') : []);
  const route = pathParts.join('/');

  // 1. Direct route match
  if (routeHandlers[route]) {
    try {
      const module = await routeHandlers[route]();
      return await module.default(req, res);
    } catch (err) {
      console.error(`Error executing handler for /api/${route}:`, err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  // 2. Parametric ID routes (e.g. /api/users/:id, /api/chats/:id, /api/admin/users/:id)
  if (pathParts.length === 2 && pathParts[0] === 'users') {
    req.query.id = pathParts[1];
    const module = await import('../server/users/[id].js');
    return await module.default(req, res);
  }

  if (pathParts.length === 2 && pathParts[0] === 'chats') {
    req.query.id = pathParts[1];
    const module = await import('../server/chats/[id].js');
    return await module.default(req, res);
  }

  if (pathParts.length === 3 && pathParts[0] === 'admin' && pathParts[1] === 'users') {
    req.query.id = pathParts[2];
    const module = await import('../server/admin/users/[id].js');
    return await module.default(req, res);
  }

  if (pathParts.length === 3 && pathParts[0] === 'admin' && pathParts[1] === 'chat-log') {
    req.query.chatId = pathParts[2];
    const module = await import('../server/admin/chat-log.js');
    return await module.default(req, res);
  }

  // Fallback for unknown /api/* endpoint
  return res.status(404).json({
    error: 'Not Found',
    message: `API endpoint /api/${route} does not exist.`,
  });
}
