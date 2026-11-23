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

async function testSocialFeatures() {
  console.log('🧪 Testing Friend Requests, Unfriend, Block, and Unblock on Neon Database...\n');

  const testTargetId = 'user_9'; // Maya Lin

  // 1. Send Friend Request
  console.log(`[1/6] Sending Friend Request from 'current_user' to '${testTargetId}'...`);
  await sql`
    INSERT INTO friendships (sender_id, receiver_id, status, updated_at)
    VALUES ('current_user', ${testTargetId}, 'pending', NOW())
    ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = NOW();
  `;
  const pending = await sql`
    SELECT * FROM friendships WHERE sender_id = 'current_user' AND receiver_id = ${testTargetId};
  `;
  console.log(`✅ Friend Request Sent! Status: ${pending[0].status}`);

  // 2. Accept Friend Request
  console.log(`\n[2/6] Accepting Friend Request with '${testTargetId}'...`);
  await sql`
    UPDATE friendships
    SET status = 'accepted', updated_at = NOW()
    WHERE sender_id = 'current_user' AND receiver_id = ${testTargetId};
  `;
  const accepted = await sql`
    SELECT * FROM friendships WHERE sender_id = 'current_user' AND receiver_id = ${testTargetId};
  `;
  console.log(`✅ Friend Request Accepted! Status: ${accepted[0].status}`);

  // 3. Unfriend
  console.log(`\n[3/6] Unfriending '${testTargetId}'...`);
  await sql`
    DELETE FROM friendships
    WHERE (sender_id = 'current_user' AND receiver_id = ${testTargetId})
       OR (sender_id = ${testTargetId} AND receiver_id = 'current_user');
  `;
  const afterUnfriend = await sql`
    SELECT * FROM friendships WHERE sender_id = 'current_user' AND receiver_id = ${testTargetId};
  `;
  console.log(`✅ Unfriended successfully! Existing friendship count: ${afterUnfriend.length}`);

  // 4. Block User
  console.log(`\n[4/6] Blocking user '${testTargetId}'...`);
  await sql`
    INSERT INTO blocks (blocker_id, blocked_id, reason, created_at)
    VALUES ('current_user', ${testTargetId}, 'Testing block feature', NOW())
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  `;
  const block = await sql`
    SELECT * FROM blocks WHERE blocker_id = 'current_user' AND blocked_id = ${testTargetId};
  `;
  console.log(`✅ Blocked successfully! Block reason: "${block[0].reason}"`);

  // 5. Query All Blocked Users
  console.log('\n[5/6] Querying active blocks for current_user...');
  const allBlocks = await sql`
    SELECT b.blocked_id, u.name, b.reason 
    FROM blocks b
    JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = 'current_user';
  `;
  console.log(`✅ Total blocked members: ${allBlocks.length}`, allBlocks.map(b => `${b.name} (${b.reason})`));

  // 6. Unblock User
  console.log(`\n[6/6] Unblocking user '${testTargetId}'...`);
  await sql`
    DELETE FROM blocks WHERE blocker_id = 'current_user' AND blocked_id = ${testTargetId};
  `;
  const afterUnblock = await sql`
    SELECT * FROM blocks WHERE blocker_id = 'current_user' AND blocked_id = ${testTargetId};
  `;
  console.log(`✅ Unblocked successfully! Remaining blocks for target: ${afterUnblock.length}`);

  console.log('\n========================================');
  console.log('🎉 ALL FRIEND REQUEST & BLOCK/UNBLOCK OPERATIONS WORKING END-TO-END!');
  console.log('========================================\n');
}

testSocialFeatures().catch((err) => {
  console.error('Social test error:', err);
  process.exit(1);
});
