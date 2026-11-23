/**
 * GET /api
 * Root Health & Service Status Endpoint
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'ok',
    service: 'SparkConnect LoveBook Cloud API',
    database: 'Neon Lakebase Postgres',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
