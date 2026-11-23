import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=['"]?([^'"\r\n]+)['"]?/);
const dbUrl = match ? match[1] : process.env.DATABASE_URL;

const sql = neon(dbUrl);
const count = await sql`SELECT count(*) FROM users`;
console.log('Row count in users:', count);
