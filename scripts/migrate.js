import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import { MOCK_USERS, CURRENT_MOCK_USER, ADMIN_MOCK_USER, MOCK_HOTSPOTS, MOCK_CHATS, MOCK_REPORTS } from '../src/utils/mockData.js';

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
    console.warn('Notice: .env file read:', e.message);
  }
}

const sql = neon(process.env.DATABASE_URL);

async function migrateAndSeed() {
  console.log('🚀 Starting Clean Neon Database Migration & Complete Seeding...\n');

  try {
    // 1. Drop existing tables if re-migrating cleanly
    console.log('🧹 Preparing clean tables...');
    await sql`DROP TABLE IF EXISTS safety_checkins CASCADE;`;
    await sql`DROP TABLE IF EXISTS verifications CASCADE;`;
    await sql`DROP TABLE IF EXISTS reports CASCADE;`;
    await sql`DROP TABLE IF EXISTS messages CASCADE;`;
    await sql`DROP TABLE IF EXISTS conversations CASCADE;`;
    await sql`DROP TABLE IF EXISTS reveal_requests CASCADE;`;
    await sql`DROP TABLE IF EXISTS swipes CASCADE;`;
    await sql`DROP TABLE IF EXISTS hotspots CASCADE;`;
    await sql`DROP TABLE IF EXISTS users CASCADE;`;

    // 2. Create tables
    console.log('[1/8] Creating `users` table...');
    await sql`
      CREATE TABLE users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        pseudonym VARCHAR(100),
        age INT NOT NULL,
        dob DATE,
        gender VARCHAR(50),
        nature JSONB DEFAULT '[]'::jsonb,
        bio TEXT,
        avatar TEXT,
        photos JSONB DEFAULT '[]'::jsonb,
        mode VARCHAR(20) DEFAULT 'public',
        hide_photo BOOLEAN DEFAULT FALSE,
        verified BOOLEAN DEFAULT FALSE,
        verification_status VARCHAR(20) DEFAULT 'pending',
        id_document_url TEXT,
        selfie_url TEXT,
        role VARCHAR(20) DEFAULT 'user',
        distance NUMERIC DEFAULT 5,
        location VARCHAR(255),
        lat NUMERIC DEFAULT 40.7128,
        lng NUMERIC DEFAULT -74.006,
        x NUMERIC DEFAULT 50,
        y NUMERIC DEFAULT 50,
        neighborhood VARCHAR(100),
        intent VARCHAR(50) DEFAULT 'Romance',
        relationship_style VARCHAR(50) DEFAULT 'Monogamous',
        interests JSONB DEFAULT '[]'::jsonb,
        active_now BOOLEAN DEFAULT TRUE,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_banned BOOLEAN DEFAULT FALSE,
        flagged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('[2/8] Creating `swipes` & `reveal_requests` tables...');
    await sql`
      CREATE TABLE swipes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        target_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL,
        is_match BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, target_user_id)
      );
    `;

    await sql`
      CREATE TABLE reveal_requests (
        id SERIAL PRIMARY KEY,
        requester_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        stranger_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'approved',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(requester_id, stranger_id)
      );
    `;

    console.log('[3/8] Creating `conversations` table...');
    await sql`
      CREATE TABLE conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_one_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        user_two_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        disappearing_setting VARCHAR(20) DEFAULT 'off',
        last_message_text TEXT,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unread_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('[4/8] Creating `messages` table...');
    await sql`
      CREATE TABLE messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) DEFAULT 'text',
        text TEXT,
        media_url TEXT,
        view_limit INT DEFAULT 1,
        views_remaining INT DEFAULT 1,
        views_consumed BOOLEAN DEFAULT FALSE,
        audio_duration VARCHAR(20),
        disappearing VARCHAR(20),
        status VARCHAR(20) DEFAULT 'delivered',
        seen_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('[5/8] Creating `hotspots` table...');
    await sql`
      CREATE TABLE hotspots (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        neighborhood VARCHAR(100),
        sparks_count INT DEFAULT 0,
        active_vibe TEXT,
        lat NUMERIC,
        lng NUMERIC,
        x NUMERIC,
        y NUMERIC,
        tags JSONB DEFAULT '[]'::jsonb,
        image TEXT,
        heat_level VARCHAR(20) DEFAULT 'high',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('[6/8] Creating `reports` table...');
    await sql`
      CREATE TABLE reports (
        id VARCHAR(64) PRIMARY KEY,
        reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        reported_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        severity VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('[7/8] Creating `verifications` table...');
    await sql`
      CREATE TABLE verifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        id_document_url TEXT NOT NULL,
        selfie_url TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        admin_notes TEXT
      );
    `;

    console.log('[8/8] Creating `safety_checkins` table...');
    await sql`
      CREATE TABLE safety_checkins (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(50),
        notes TEXT,
        lat NUMERIC,
        lng NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('⚡ Adding performance indexes...');
    await sql`CREATE INDEX idx_users_username ON users(username);`;
    await sql`CREATE INDEX idx_users_mode ON users(mode);`;
    await sql`CREATE INDEX idx_users_intent ON users(intent);`;
    await sql`CREATE INDEX idx_messages_conversation ON messages(conversation_id);`;
    await sql`CREATE INDEX idx_conversations_users ON conversations(user_one_id, user_two_id);`;

    console.log('✅ All 9 Tables & Indexes created successfully in Neon Postgres!\n');

    // 3. Seed Users
    console.log('🌱 Seeding members into `users` table...');
    const allUsersToSeed = [
      CURRENT_MOCK_USER,
      ADMIN_MOCK_USER,
      ...MOCK_USERS,
    ];

    let userSuccessCount = 0;
    for (const u of allUsersToSeed) {
      try {
        await sql`
          INSERT INTO users (
            id, name, username, email, pseudonym, age, dob, gender, nature, bio, avatar, photos,
            mode, hide_photo, verified, verification_status, id_document_url, selfie_url,
            role, distance, location, lat, lng, x, y, neighborhood, intent, relationship_style,
            interests, active_now, last_seen, is_banned, flagged, created_at
          ) VALUES (
            ${u.id}, ${u.name}, ${u.username || u.id}, ${u.email || `${u.id}@sparkconnect.com`},
            ${u.pseudonym || 'MysterySpark'}, ${u.age || 25}, ${u.dob ? new Date(u.dob) : new Date('1998-01-01')},
            ${u.gender || 'Prefer not to say'}, ${JSON.stringify(u.nature || [])}, ${u.bio || ''},
            ${u.avatar}, ${JSON.stringify(u.photos || [u.avatar])}, ${u.mode || 'public'},
            ${u.hidePhoto || false}, ${u.verified || false}, ${u.verificationStatus || 'approved'},
            ${u.idDocumentUrl || null}, ${u.selfieUrl || null}, ${u.role || 'user'},
            ${u.distance || 5}, ${u.location || 'New York, NY'}, ${u.lat || 40.7128}, ${u.lng || -74.006},
            ${u.x || 50}, ${u.y || 50}, ${u.neighborhood || u.location || 'Downtown'},
            ${u.intent || 'Romance'}, ${u.relationshipStyle || 'Monogamous'}, ${JSON.stringify(u.interests || [])},
            ${u.activeNow ?? true}, ${u.lastSeen ? new Date(u.lastSeen) : new Date()},
            ${u.isBanned || false}, ${u.flagged || false}, ${u.createdAt ? new Date(u.createdAt) : new Date()}
          );
        `;
        userSuccessCount++;
      } catch (err) {
        console.error(`Failed to insert user ${u.id}:`, err.message);
      }
    }
    console.log(`✅ Successfully seeded ${userSuccessCount} / ${allUsersToSeed.length} users into Neon Postgres.`);

    // 4. Seed Hotspots
    console.log('🌱 Seeding Hotspots into `hotspots` table...');
    for (const h of MOCK_HOTSPOTS) {
      await sql`
        INSERT INTO hotspots (
          id, name, category, neighborhood, sparks_count, active_vibe,
          lat, lng, x, y, tags, image, heat_level
        ) VALUES (
          ${h.id}, ${h.name}, ${h.category}, ${h.neighborhood}, ${h.sparksCount},
          ${h.activeVibe}, ${h.lat}, ${h.lng}, ${h.x}, ${h.y},
          ${JSON.stringify(h.tags || [])}, ${h.image}, ${h.heatLevel}
        );
      `;
    }
    console.log(`✅ Seeded ${MOCK_HOTSPOTS.length} hotspots.`);

    // 5. Seed Conversations & Messages
    console.log('🌱 Seeding Conversations and Messages...');
    let msgCount = 0;
    for (const chat of MOCK_CHATS) {
      await sql`
        INSERT INTO conversations (
          id, user_one_id, user_two_id, disappearing_setting, unread_count, created_at
        ) VALUES (
          ${chat.id}, 'current_user', ${chat.partner.id},
          ${chat.disappearingSetting || 'off'}, ${chat.unreadCount || 0}, NOW()
        );
      `;

      if (chat.messages && chat.messages.length > 0) {
        for (const msg of chat.messages) {
          await sql`
            INSERT INTO messages (
              id, conversation_id, sender_id, type, text, media_url,
              view_limit, views_remaining, audio_duration, status, created_at
            ) VALUES (
              ${msg.id}, ${chat.id}, ${msg.senderId}, ${msg.type || 'text'},
              ${msg.text || ''}, ${msg.mediaUrl || null}, ${msg.viewLimit || 1},
              ${msg.viewsRemaining || 1}, ${msg.audioDuration || null},
              ${msg.status || 'delivered'}, ${msg.timestamp ? new Date(msg.timestamp) : new Date()}
            );
          `;
          msgCount++;
        }
      }
    }
    console.log(`✅ Seeded ${MOCK_CHATS.length} conversations and ${msgCount} messages.`);

    // 6. Seed Reports
    console.log('🌱 Seeding Moderation Reports...');
    for (const rep of MOCK_REPORTS) {
      await sql`
        INSERT INTO reports (
          id, reporter_id, reported_user_id, reason, details, status, severity, created_at
        ) VALUES (
          ${rep.id}, ${rep.reporterId || 'current_user'}, ${rep.reportedUserId}, ${rep.reason},
          ${rep.details || ''}, ${rep.status || 'pending'}, 'normal',
          ${rep.timestamp ? new Date(rep.timestamp) : new Date()}
        );
      `;
    }
    console.log(`✅ Seeded ${MOCK_REPORTS.length} moderation reports.`);

    // 7. Seed Verifications
    console.log('🌱 Seeding Verification Queue...');
    await sql`
      INSERT INTO verifications (id, user_id, id_document_url, selfie_url, status, submitted_at)
      VALUES 
        ('verif_user_4', 'user_4', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', 'pending', NOW()),
        ('verif_user_8', 'user_8', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', 'pending', NOW());
    `;
    console.log(`✅ Seeded 2 verification audit records.`);

    // 8. Live Verification Counts
    console.log('\n--- Final Verification Summary ---');
    const [uCount, hCount, cCount, mCount, rCount, vCount] = await Promise.all([
      sql`SELECT count(*) FROM users;`,
      sql`SELECT count(*) FROM hotspots;`,
      sql`SELECT count(*) FROM conversations;`,
      sql`SELECT count(*) FROM messages;`,
      sql`SELECT count(*) FROM reports;`,
      sql`SELECT count(*) FROM verifications;`,
    ]);

    console.log(`📊 Users: ${uCount[0].count}`);
    console.log(`📊 Hotspots: ${hCount[0].count}`);
    console.log(`📊 Conversations: ${cCount[0].count}`);
    console.log(`📊 Messages: ${mCount[0].count}`);
    console.log(`📊 Reports: ${rCount[0].count}`);
    console.log(`📊 Verifications: ${vCount[0].count}`);

    console.log('\n✨ ALL DATABASE TABLES ARE LIVE, CONNECTED & POPULATED!\n');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateAndSeed();
