import { neon } from '@neondatabase/serverless';
import fs from 'fs';

// Load .env
if (!process.env.DATABASE_URL) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.warn(e.message);
  }
}

const sql = neon(process.env.DATABASE_URL);

async function addSocialTables() {
  console.log('🚀 Creating `friendships` and `blocks` tables in Neon Postgres...\n');

  try {
    // 1. Friendships / Friend Requests table
    console.log('[1/2] Creating `friendships` table...');
    await sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        receiver_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(sender_id, receiver_id)
      );
    `;

    // 2. Blocks table
    console.log('[2/2] Creating `blocks` table...');
    await sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        blocker_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        blocked_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );
    `;

    // Performance Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(sender_id, receiver_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blocks_users ON blocks(blocker_id, blocked_id);`;

    console.log('✅ Tables `friendships` and `blocks` successfully created and indexed!\n');

    // 3. Seed sample data
    console.log('🌱 Seeding initial friendship & block data...');

    // Sample friends: user_1 (Elena) is friends with current_user
    await sql`
      INSERT INTO friendships (sender_id, receiver_id, status, created_at, updated_at)
      VALUES 
        ('current_user', 'user_1', 'accepted', NOW() - INTERVAL '3 days', NOW()),
        ('user_3', 'current_user', 'pending', NOW() - INTERVAL '1 hour', NOW()),
        ('current_user', 'user_5', 'pending', NOW() - INTERVAL '4 hours', NOW())
      ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = EXCLUDED.status;
    `;

    // Sample block: user_4 (Damian) is blocked by current_user
    await sql`
      INSERT INTO blocks (blocker_id, blocked_id, reason, created_at)
      VALUES 
        ('current_user', 'user_4', 'Unsolicited photo and inappropriate communication', NOW() - INTERVAL '2 days')
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
    `;

    const fCount = await sql`SELECT count(*) FROM friendships;`;
    const bCount = await sql`SELECT count(*) FROM blocks;`;
    console.log(`📊 Total Friendships / Requests in DB: ${fCount[0].count}`);
    console.log(`📊 Total Blocks in DB: ${bCount[0].count}`);

    console.log('\n🎉 ALL SOCIAL TABLES PROVISIONED AND SEEDED IN NEON POSTGRES!\n');
  } catch (err) {
    console.error('Error creating social tables:', err);
    process.exit(1);
  }
}

addSocialTables();
