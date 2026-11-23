/**
 * Neon Postgres Client & Query Helper
 * Serverless-compatible via @neondatabase/serverless
 */
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString && process.env.NODE_ENV !== 'test') {
  console.warn('[DB] Warning: DATABASE_URL is not set.');
}

export const sql = neon(connectionString);

/**
 * Parameterized query helper
 * @param {string} text SQL statement with $1, $2 placeholders
 * @param {Array} params Values to bind
 */
export const query = async (text, params = []) => {
  if (sql.query) {
    return await sql.query(text, params);
  }
  return await sql(text, params);
};
