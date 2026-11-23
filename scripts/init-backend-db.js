import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=['"]?([^'"\r\n]+)['"]?/);
const dbUrl = match ? match[1] : process.env.DATABASE_URL;

const sql = neon(dbUrl);

console.log('Applying db/schema.sql to Neon database...');
const schemaSql = fs.readFileSync('db/schema.sql', 'utf8');

const statements = schemaSql
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of statements) {
  await sql.query(stmt);
}
console.log('✅ db/schema.sql applied successfully!');

console.log('Applying db/seed.sql to Neon database...');
const seedSql = fs.readFileSync('db/seed.sql', 'utf8');
const seedStatements = seedSql
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const stmt of seedStatements) {
  await sql.query(stmt);
}
console.log('✅ db/seed.sql applied successfully!');

const userCount = await sql`SELECT count(*) FROM users`;
console.log('User count in users table:', userCount[0].count);
