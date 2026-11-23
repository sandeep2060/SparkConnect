-- ===============================================================================
-- SparkConnect Database Seed Script
-- Platform: Neon Lakebase Postgres
-- Safe for execution via: psql $DATABASE_URL -f db/seed.sql
-- ===============================================================================

BEGIN;

-- 0. Clean slate with cascading truncate
TRUNCATE users, verifications, reveal_requests, chats, 
         messages, blocks, reports, audit_logs CASCADE;

-- ===============================================================================
-- 1. ADMIN USER
-- ===============================================================================
INSERT INTO users (
  id,
  email,
  password_hash,
  dob,
  role,
  status,
  mode,
  display_name,
  pseudonym,
  bio,
  avatar_url,
  hide_photo,
  gender,
  interested_in,
  intents,
  interests,
  relationship_style,
  city,
  location_lat,
  location_lng,
  last_active,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@sparkconnect.dev',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1990-01-01',
  'admin',
  'verified',
  'public',
  'SparkConnect Admin',
  'Admin',
  'Lead platform administrator ensuring safety, integrity, and trust across SparkConnect.',
  'https://picsum.photos/seed/admin/400/400',
  false,
  'non-binary',
  ARRAY['man', 'woman', 'non-binary'],
  ARRAY['friends'],
  ARRAY['tech', 'moderation', 'safety'],
  'monogamous',
  'San Francisco',
  37.7749,
  -122.4194,
  NOW(),
  NOW() - INTERVAL '30 days'
);

-- ===============================================================================
-- 2. 15 DEMO USERS (5 Public Verified, 5 Stranger Verified, 5 Pending)
-- All demo user passwords hash to "Demo123!" using the specified bcrypt hash:
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ===============================================================================

-- --- 2.1 Five Public Mode Users (Verified) ---
INSERT INTO users (
  id, email, password_hash, dob, role, status, mode, display_name, pseudonym,
  bio, avatar_url, hide_photo, gender, interested_in, intents, interests,
  relationship_style, city, location_lat, location_lng, last_active, created_at
) VALUES
(
  '11111111-1111-1111-1111-000000000001',
  'maya.lin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1998-04-12',
  'user',
  'verified',
  'public',
  'Maya Lin',
  NULL,
  'Documentary photographer and lover of third-wave espresso. Let’s find the best cliffside viewpoint in the city.',
  'https://picsum.photos/seed/maya_lin/400/400',
  false,
  'woman',
  ARRAY['man'],
  ARRAY['romance', 'friends'],
  ARRAY['hiking', 'photography', 'craft-coffee', 'pottery'],
  'monogamous',
  'San Francisco',
  37.7690,
  -122.4467,
  NOW() - INTERVAL '15 minutes',
  NOW() - INTERVAL '20 days'
),
(
  '11111111-1111-1111-1111-000000000002',
  'liam.chen@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1995-09-22',
  'user',
  'verified',
  'public',
  'Liam Chen',
  NULL,
  'Architectural woodworker who spends weekends bouldering or listening to vinyl. Big fan of witty banter.',
  'https://picsum.photos/seed/liam_chen/400/400',
  false,
  'man',
  ARRAY['woman'],
  ARRAY['romance', 'casual'],
  ARRAY['bouldering', 'sourdough', 'indie-rock', 'cycling'],
  'monogamous',
  'Seattle',
  47.6062,
  -122.3321,
  NOW() - INTERVAL '40 minutes',
  NOW() - INTERVAL '18 days'
),
(
  '11111111-1111-1111-1111-000000000003',
  'zoe.martinez@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1993-02-14',
  'user',
  'verified',
  'public',
  'Zoe Martinez',
  NULL,
  'Curator navigating ethical non-monogamy and bold art spaces. Looking for curious minds and spontaneous night owls.',
  'https://picsum.photos/seed/zoe_martinez/400/400',
  false,
  'woman',
  ARRAY['man', 'woman', 'non-binary'],
  ARRAY['casual', 'exploring'],
  ARRAY['contemporary-art', 'vintage-fashion', 'mezcal', 'salsa'],
  'enm',
  'Los Angeles',
  34.0522,
  -118.2437,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '15 days'
),
(
  '11111111-1111-1111-1111-000000000004',
  'alex.rivera@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '2002-11-03',
  'user',
  'verified',
  'public',
  'Alex Rivera',
  NULL,
  'Game audio engineer and houseplant enthusiast. Always up for rooftop stargazing or discovering a cozy tea house.',
  'https://picsum.photos/seed/alex_rivera/400/400',
  false,
  'non-binary',
  ARRAY['non-binary', 'woman'],
  ARRAY['friends', 'exploring'],
  ARRAY['synthwave', 'board-games', 'botany', 'sci-fi'],
  'exploring',
  'New York',
  40.7128,
  -74.0060,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '12 days'
),
(
  '11111111-1111-1111-1111-000000000005',
  'marcus.vance@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1989-06-18',
  'user',
  'verified',
  'public',
  'Marcus Vance',
  NULL,
  'Product designer with a penchant for marathon running and smoky Texas briskets. Honest communication above all.',
  'https://picsum.photos/seed/marcus_vance/400/400',
  false,
  'man',
  ARRAY['woman'],
  ARRAY['romance', 'friends'],
  ARRAY['trail-running', 'bbq', 'live-music', 'podcasts'],
  'monogamous',
  'Austin',
  30.2672,
  -97.7431,
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '10 days'
);

-- --- 2.2 Five Stranger Mode Users (Verified, Pseudonyms, Hidden Photos) ---
INSERT INTO users (
  id, email, password_hash, dob, role, status, mode, display_name, pseudonym,
  bio, avatar_url, hide_photo, gender, interested_in, intents, interests,
  relationship_style, city, location_lat, location_lng, last_active, created_at
) VALUES
(
  '22222222-2222-2222-2222-000000000006',
  'midnight.owl@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1996-01-29',
  'user',
  'verified',
  'stranger',
  NULL,
  'MidnightOwl',
  'Quiet presence exploring discreet chemistry after twilight. In stranger mode—request a reveal when trust is earned.',
  NULL,
  true,
  'man',
  ARRAY['woman'],
  ARRAY['casual', 'exploring'],
  ARRAY['jazz', 'speakeasies', 'late-night-drives', 'philosophy'],
  'enm',
  'Chicago',
  41.8781,
  -87.6298,
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '14 days'
),
(
  '22222222-2222-2222-2222-000000000007',
  'velvet.shadow@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1997-07-15',
  'user',
  'verified',
  'stranger',
  NULL,
  'VelvetShadow',
  'Mysterious soul drawn to deep conversations without premature visual judgements. Stranger mode active.',
  NULL,
  true,
  'woman',
  ARRAY['man', 'woman'],
  ARRAY['romance', 'exploring'],
  ARRAY['poetry', 'dark-chocolate', 'astronomy', 'film-noir'],
  'exploring',
  'San Francisco',
  37.7833,
  -122.4167,
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '16 days'
),
(
  '22222222-2222-2222-2222-000000000008',
  'neon.phantom@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1991-12-05',
  'user',
  'verified',
  'stranger',
  NULL,
  'NeonPhantom',
  'Electronic music producer keeping identity anonymous until we vibe. Tell me your three favorite underground tracks.',
  NULL,
  true,
  'non-binary',
  ARRAY['man', 'woman', 'non-binary'],
  ARRAY['casual', 'friends'],
  ARRAY['techno', 'modular-synths', 'cyberpunk', 'mixology'],
  'enm',
  'Denver',
  39.7392,
  -104.9903,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '11 days'
),
(
  '22222222-2222-2222-2222-000000000009',
  'cosmic.rogue@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1986-03-10',
  'user',
  'verified',
  'stranger',
  NULL,
  'CosmicRogue',
  'Ocean lover who values intellect and wit above all else. Mystery first, revelation when sparks fly.',
  NULL,
  true,
  'man',
  ARRAY['woman'],
  ARRAY['romance', 'casual'],
  ARRAY['astrophotography', 'sailing', 'wine-tasting', 'history'],
  'monogamous',
  'Boston',
  42.3601,
  -71.0589,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '9 days'
),
(
  '22222222-2222-2222-2222-000000000010',
  'silver.siren@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1994-08-25',
  'user',
  'verified',
  'stranger',
  NULL,
  'SilverSiren',
  'Sun-drenched adventurer seeking private, magnetic connections away from the public gaze.',
  NULL,
  true,
  'woman',
  ARRAY['man'],
  ARRAY['exploring', 'casual'],
  ARRAY['scuba-diving', 'tango', 'fine-dining', 'travel'],
  'enm',
  'Miami',
  25.7617,
  -80.1918,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '8 days'
);

-- --- 2.3 Five Pending Verification Users (status='pending') ---
INSERT INTO users (
  id, email, password_hash, dob, role, status, mode, display_name, pseudonym,
  bio, avatar_url, hide_photo, gender, interested_in, intents, interests,
  relationship_style, city, location_lat, location_lng, last_active, created_at
) VALUES
(
  '33333333-3333-3333-3333-000000000011',
  'chloe.bennett@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '2004-05-19',
  'user',
  'pending',
  'public',
  'Chloe Bennett',
  NULL,
  'Junior pastry chef seeking someone who loves spontaneous weekend road trips and sweet treats.',
  'https://picsum.photos/seed/chloe_bennett/400/400',
  false,
  'woman',
  ARRAY['man'],
  ARRAY['romance', 'friends'],
  ARRAY['baking', 'ceramics', 'thrift-shopping'],
  'monogamous',
  'Portland',
  45.5152,
  -122.6784,
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '4 days'
),
(
  '33333333-3333-3333-3333-000000000012',
  'david.kim@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1992-10-11',
  'user',
  'pending',
  'public',
  'David Kim',
  NULL,
  'Catching waves at dawn and writing software by day. Verification pending.',
  'https://picsum.photos/seed/david_kim/400/400',
  false,
  'man',
  ARRAY['woman'],
  ARRAY['friends', 'casual'],
  ARRAY['surfing', 'k-bbq', 'craft-beer'],
  'exploring',
  'San Diego',
  32.7157,
  -117.1611,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '3 days'
),
(
  '33333333-3333-3333-3333-000000000013',
  'shadow.dancer@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '2001-04-03',
  'user',
  'pending',
  'stranger',
  NULL,
  'ShadowDancer',
  'Acrobat and performance artist. Step into my shadow realm if you can keep up with the rhythm.',
  NULL,
  true,
  'woman',
  ARRAY['man', 'non-binary'],
  ARRAY['casual', 'exploring'],
  ARRAY['contemporary-dance', 'aerial-silks', 'tattoos'],
  'enm',
  'Las Vegas',
  36.1699,
  -115.1398,
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '2 days'
),
(
  '33333333-3333-3333-3333-000000000014',
  'jordan.taylor@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1999-01-17',
  'user',
  'pending',
  'public',
  'Jordan Taylor',
  NULL,
  'Community organizer with a passion for retro soul music and cruelty-free cooking.',
  'https://picsum.photos/seed/jordan_taylor/400/400',
  false,
  'non-binary',
  ARRAY['man', 'woman', 'non-binary'],
  ARRAY['exploring', 'friends'],
  ARRAY['vintage-vinyl', 'vegan-cooking', 'roller-skating'],
  'monogamous',
  'Atlanta',
  33.7490,
  -84.3880,
  NOW() - INTERVAL '18 hours',
  NOW() - INTERVAL '2 days'
),
(
  '33333333-3333-3333-3333-000000000015',
  'samuel.ross@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1984-08-30',
  'user',
  'pending',
  'public',
  'Samuel Ross',
  NULL,
  'Architectural restorer seeking a grounded, meaningful connection for long walks and deep conversations.',
  'https://picsum.photos/seed/samuel_ross/400/400',
  false,
  'man',
  ARRAY['woman'],
  ARRAY['romance'],
  ARRAY['woodworking', 'classic-cars', 'fly-fishing', 'golf'],
  'monogamous',
  'Dallas',
  32.7767,
  -96.7970,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '5 days'
);

-- ===============================================================================
-- 3. VERIFICATION DOCUMENTS (For Pending Users 11-15)
-- ===============================================================================
INSERT INTO verifications (
  id, user_id, id_doc_url, selfie_url, status, created_at
) VALUES
(
  '44444444-4444-4444-4444-000000000001',
  '33333333-3333-3333-3333-000000000011',
  'https://picsum.photos/seed/id-1/600/400',
  'https://picsum.photos/seed/selfie-1/400/400',
  'pending',
  NOW() - INTERVAL '4 days'
),
(
  '44444444-4444-4444-4444-000000000002',
  '33333333-3333-3333-3333-000000000012',
  'https://picsum.photos/seed/id-2/600/400',
  'https://picsum.photos/seed/selfie-2/400/400',
  'pending',
  NOW() - INTERVAL '3 days'
),
(
  '44444444-4444-4444-4444-000000000003',
  '33333333-3333-3333-3333-000000000013',
  'https://picsum.photos/seed/id-3/600/400',
  'https://picsum.photos/seed/selfie-3/400/400',
  'pending',
  NOW() - INTERVAL '2 days'
),
(
  '44444444-4444-4444-4444-000000000004',
  '33333333-3333-3333-3333-000000000014',
  'https://picsum.photos/seed/id-4/600/400',
  'https://picsum.photos/seed/selfie-4/400/400',
  'pending',
  NOW() - INTERVAL '2 days'
),
(
  '44444444-4444-4444-4444-000000000005',
  '33333333-3333-3333-3333-000000000015',
  'https://picsum.photos/seed/id-5/600/400',
  'https://picsum.photos/seed/selfie-5/400/400',
  'pending',
  NOW() - INTERVAL '1 day'
);

-- ===============================================================================
-- 4. REVEAL REQUESTS (Public Users to Stranger Users + Mutual Pair)
-- ===============================================================================
INSERT INTO reveal_requests (
  id, from_user, to_user, status, created_at
) VALUES
-- 1. Maya Lin -> VelvetShadow (Approved reveal)
(
  '55555555-5555-5555-5555-000000000001',
  '11111111-1111-1111-1111-000000000001',
  '22222222-2222-2222-2222-000000000007',
  'approved',
  NOW() - INTERVAL '3 days'
),
-- 2. Liam Chen -> MidnightOwl (Pending reveal request)
(
  '55555555-5555-5555-5555-000000000002',
  '11111111-1111-1111-1111-000000000002',
  '22222222-2222-2222-2222-000000000006',
  'pending',
  NOW() - INTERVAL '1 day'
),
-- 3. Zoe Martinez -> NeonPhantom (Approved reveal)
(
  '55555555-5555-5555-5555-000000000003',
  '11111111-1111-1111-1111-000000000003',
  '22222222-2222-2222-2222-000000000008',
  'approved',
  NOW() - INTERVAL '5 days'
),
-- 4. VelvetShadow -> CosmicRogue (Approved reveal supporting Chat 3)
(
  '55555555-5555-5555-5555-000000000004',
  '22222222-2222-2222-2222-000000000007',
  '22222222-2222-2222-2222-000000000009',
  'approved',
  NOW() - INTERVAL '2 days'
);

-- ===============================================================================
-- 5. CHATS (Enforcing user_a < user_b schema constraint)
-- ===============================================================================
INSERT INTO chats (
  id, user_a, user_b, created_at, last_message_at
) VALUES
-- Chat 1: Public (Maya Lin) < Public (Liam Chen)
(
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000001',
  '11111111-1111-1111-1111-000000000002',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '30 hours'
),
-- Chat 2: Public (Marcus Vance) < Stranger (MidnightOwl)
(
  '66666666-6666-6666-6666-000000000002',
  '11111111-1111-1111-1111-000000000005',
  '22222222-2222-2222-2222-000000000006',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '58 hours'
),
-- Chat 3: Stranger (VelvetShadow) < Stranger (CosmicRogue)
(
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  '22222222-2222-2222-2222-000000000009',
  NOW() - INTERVAL '24 hours',
  NOW() - INTERVAL '6 hours'
),
-- Chat 4: Public (Zoe Martinez) < Public (Alex Rivera)
(
  '66666666-6666-6666-6666-000000000004',
  '11111111-1111-1111-1111-000000000003',
  '11111111-1111-1111-1111-000000000004',
  NOW() - INTERVAL '28 hours',
  NOW() - INTERVAL '5 hours'
);

-- ===============================================================================
-- 6. MESSAGES (Realistic timelines across the last 7 days)
-- ===============================================================================

-- --- Chat 1: Maya Lin <-> Liam Chen (8 messages, flirty exchange) ---
INSERT INTO messages (id, chat_id, sender_id, body, read_at, created_at) VALUES
(
  '77777777-7777-7777-7777-000000000001',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000001',
  'Hey Liam! I saw your bouldering photo. Is that at Bishop or Castle Rock?',
  NOW() - INTERVAL '47 hours',
  NOW() - INTERVAL '48 hours'
),
(
  '77777777-7777-7777-7777-000000000002',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000002',
  'Good eye! That was Bishop last November. The highballs there are wild. Do you climb too?',
  NOW() - INTERVAL '45 hours',
  NOW() - INTERVAL '46 hours'
),
(
  '77777777-7777-7777-7777-000000000003',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000001',
  'Mostly top-rope in the gym, but I love taking photography trips out to the crag.',
  NOW() - INTERVAL '43 hours',
  NOW() - INTERVAL '44 hours'
),
(
  '77777777-7777-7777-7777-000000000004',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000002',
  'A climber who takes high-res action shots? You might be the most valuable person at the crag haha.',
  NOW() - INTERVAL '41 hours',
  NOW() - INTERVAL '42 hours'
),
(
  '77777777-7777-7777-7777-000000000005',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000001',
  'Haha only if you don’t mind carrying my camera backpack up the approach!',
  NOW() - INTERVAL '37 hours',
  NOW() - INTERVAL '38 hours'
),
(
  '77777777-7777-7777-7777-000000000006',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000002',
  'Deal. Light cardio for extra beta. Are you free this weekend for espresso and trip planning?',
  NOW() - INTERVAL '34 hours',
  NOW() - INTERVAL '35 hours'
),
(
  '77777777-7777-7777-7777-000000000007',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000001',
  'I know a quiet spot in Hayes Valley with killer pour-overs. Let’s do Sunday morning?',
  NOW() - INTERVAL '31 hours',
  NOW() - INTERVAL '32 hours'
),
(
  '77777777-7777-7777-7777-000000000008',
  '66666666-6666-6666-6666-000000000001',
  '11111111-1111-1111-1111-000000000002',
  'Sunday morning it is. I’ll bring the guidebooks and good energy. 😊',
  NOW() - INTERVAL '29 hours',
  NOW() - INTERVAL '30 hours'
);

-- --- Chat 2: Marcus Vance <-> MidnightOwl (6 messages, cautious, no reveal) ---
INSERT INTO messages (id, chat_id, sender_id, body, read_at, created_at) VALUES
(
  '77777777-7777-7777-7777-000000000009',
  '66666666-6666-6666-6666-000000000002',
  '11111111-1111-1111-1111-000000000005',
  'Hey MidnightOwl, intriguing pseudonym. What drew you into stranger mode?',
  NOW() - INTERVAL '71 hours',
  NOW() - INTERVAL '72 hours'
),
(
  '77777777-7777-7777-7777-000000000010',
  '66666666-6666-6666-6666-000000000002',
  '22222222-2222-2222-2222-000000000006',
  'Hey Marcus. Too many apps turn into instant superficial swiping. I prefer seeing if words connect before faces.',
  NOW() - INTERVAL '69 hours',
  NOW() - INTERVAL '70 hours'
),
(
  '77777777-7777-7777-7777-000000000011',
  '66666666-6666-6666-6666-000000000002',
  '11111111-1111-1111-1111-000000000005',
  'Respect that. Most people don’t have the patience for real conversation anymore.',
  NOW() - INTERVAL '67 hours',
  NOW() - INTERVAL '68 hours'
),
(
  '77777777-7777-7777-7777-000000000012',
  '66666666-6666-6666-6666-000000000002',
  '22222222-2222-2222-2222-000000000006',
  'Exactly. The silence and anonymity give you room to actually think about what you want.',
  NOW() - INTERVAL '64 hours',
  NOW() - INTERVAL '65 hours'
),
(
  '77777777-7777-7777-7777-000000000013',
  '66666666-6666-6666-6666-000000000002',
  '11111111-1111-1111-1111-000000000005',
  'Fair enough. What kind of vinyl are you listening to tonight, Owl?',
  NOW() - INTERVAL '59 hours',
  NOW() - INTERVAL '60 hours'
),
(
  '77777777-7777-7777-7777-000000000014',
  '66666666-6666-6666-6666-000000000002',
  '22222222-2222-2222-2222-000000000006',
  'Coltrane’s "Blue Train". Late night jazz never lies. What’s spinning on your side?',
  NOW() - INTERVAL '57 hours',
  NOW() - INTERVAL '58 hours'
);

-- --- Chat 3: VelvetShadow <-> CosmicRogue (10 messages, approved reveal, playful) ---
INSERT INTO messages (id, chat_id, sender_id, body, read_at, created_at) VALUES
(
  '77777777-7777-7777-7777-000000000015',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  'So the masks are officially off. What do you think of the face behind the shadow?',
  NOW() - INTERVAL '23 hours',
  NOW() - INTERVAL '24 hours'
),
(
  '77777777-7777-7777-7777-000000000016',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000009',
  'Honestly? Even better than the mystery. Your portrait has a magnetic intensity.',
  NOW() - INTERVAL '22 hours',
  NOW() - INTERVAL '23 hours'
),
(
  '77777777-7777-7777-7777-000000000017',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  'Flattery will get you everywhere, Rogue. You’re quite the distinguished captain yourself.',
  NOW() - INTERVAL '21 hours',
  NOW() - INTERVAL '22 hours'
),
(
  '77777777-7777-7777-7777-000000000018',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000009',
  'Captain? I like the sound of that. Care to set sail under the stars sometime soon?',
  NOW() - INTERVAL '19 hours',
  NOW() - INTERVAL '20 hours'
),
(
  '77777777-7777-7777-7777-000000000019',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  'Only if you promise you know how to navigate the bay after dark.',
  NOW() - INTERVAL '17 hours',
  NOW() - INTERVAL '18 hours'
),
(
  '77777777-7777-7777-7777-000000000020',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000009',
  'Ten years sailing coastal waters. Plus, I navigationally steer by your eyes now.',
  NOW() - INTERVAL '15 hours',
  NOW() - INTERVAL '16 hours'
),
(
  '77777777-7777-7777-7777-000000000021',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  'Smooth... suspiciously smooth. Who taught you that line?',
  NOW() - INTERVAL '13 hours',
  NOW() - INTERVAL '14 hours'
),
(
  '77777777-7777-7777-7777-000000000022',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000009',
  'Pure inspiration in the moment. I only speak truth when mutual reveals are this rewarding.',
  NOW() - INTERVAL '11 hours',
  NOW() - INTERVAL '12 hours'
),
(
  '77777777-7777-7777-7777-000000000023',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000007',
  'Alright sailor, meet me at Pier 14 tomorrow at 8 PM. Bring something sparkling.',
  NOW() - INTERVAL '7 hours',
  NOW() - INTERVAL '8 hours'
),
(
  '77777777-7777-7777-7777-000000000024',
  '66666666-6666-6666-6666-000000000003',
  '22222222-2222-2222-2222-000000000009',
  'Chilled champagne and warm deck jackets ready. See you at eight, Velvet.',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '6 hours'
);

-- --- Chat 4: Zoe Martinez <-> Alex Rivera (3 messages, last one unread) ---
INSERT INTO messages (id, chat_id, sender_id, body, read_at, created_at) VALUES
(
  '77777777-7777-7777-7777-000000000025',
  '66666666-6666-6666-6666-000000000004',
  '11111111-1111-1111-1111-000000000003',
  'Hey Alex! Loved your synthwave tag. Do you produce your own tracks or just curate?',
  NOW() - INTERVAL '26 hours',
  NOW() - INTERVAL '28 hours'
),
(
  '77777777-7777-7777-7777-000000000026',
  '66666666-6666-6666-6666-000000000004',
  '11111111-1111-1111-1111-000000000003',
  'I host gallery openings in LA and we’re always looking for experimental ambient soundscapes.',
  NOW() - INTERVAL '22 hours',
  NOW() - INTERVAL '24 hours'
),
(
  '77777777-7777-7777-7777-000000000027',
  '66666666-6666-6666-6666-000000000004',
  '11111111-1111-1111-1111-000000000003',
  'Let me know if you ever visit the West Coast! Would love to show you our current installation.',
  NULL, -- Unread message!
  NOW() - INTERVAL '5 hours'
);

-- ===============================================================================
-- 7. REPORTS (2 Open Reports)
-- ===============================================================================
INSERT INTO reports (
  id, reporter_id, reported_id, reason, details, status, created_at
) VALUES
(
  '88888888-8888-8888-8888-000000000001',
  '11111111-1111-1111-1111-000000000001', -- Maya Lin
  '33333333-3333-3333-3333-000000000015', -- Samuel Ross
  'Harassment / Inappropriate Communication',
  'Sent unsolicited messages with inappropriate sexual undertones despite my profile clearly stating romance and friends only.',
  'open',
  NOW() - INTERVAL '12 hours'
),
(
  '88888888-8888-8888-8888-000000000002',
  '11111111-1111-1111-1111-000000000005', -- Marcus Vance
  '33333333-3333-3333-3333-000000000012', -- David Kim
  'Suspicious / Fake Profile',
  'Profile pictures appear to be watermarked commercial stock surf photography and geographic location fluctuates rapidly.',
  'open',
  NOW() - INTERVAL '8 hours'
);

-- ===============================================================================
-- 8. AUDIT LOGS (5 Past Admin Action Entries)
-- ===============================================================================
INSERT INTO audit_logs (
  id, admin_id, action, target_type, target_id, metadata, created_at
) VALUES
(
  '99999999-9999-9999-9999-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'verify_user',
  'user',
  '11111111-1111-1111-1111-000000000001',
  '{"decision": "approved", "review_note": "Verified California Real ID and biometric selfie match", "reviewer": "admin@sparkconnect.dev"}'::jsonb,
  NOW() - INTERVAL '6 days'
),
(
  '99999999-9999-9999-9999-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'verify_user',
  'user',
  '11111111-1111-1111-1111-000000000002',
  '{"decision": "approved", "review_note": "Verified Washington State Driver License and live selfie", "reviewer": "admin@sparkconnect.dev"}'::jsonb,
  NOW() - INTERVAL '5 days'
),
(
  '99999999-9999-9999-9999-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'view_chat',
  'chat',
  '66666666-6666-6666-6666-000000000001',
  '{"reason": "Random trust & safety audit check for newly matched accounts", "admin_email": "admin@sparkconnect.dev"}'::jsonb,
  NOW() - INTERVAL '2 days'
),
(
  '99999999-9999-9999-9999-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'update_user_status',
  'user',
  '22222222-2222-2222-2222-000000000006',
  '{"reason": "Cleared safety flags; verified stranger mode pseudonym compliance", "previous_status": "pending", "new_status": "verified"}'::jsonb,
  NOW() - INTERVAL '3 days'
),
(
  '99999999-9999-9999-9999-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'resolve_report',
  'report',
  '88888888-8888-8888-8888-000000000001',
  '{"action": "investigating", "note": "Assigned ticket to tier-2 moderation review", "admin_email": "admin@sparkconnect.dev"}'::jsonb,
  NOW() - INTERVAL '4 hours'
);

COMMIT;

-- ===============================================================================
-- LOGIN CREDENTIALS FOR TESTING
-- ===============================================================================
/*
================================================================================
SPARKCONNECT TEST CREDENTIALS
================================================================================

1. Administrator Account:
   Email:    admin@sparkconnect.dev
   Password: Admin123!
   Role:     admin
   Status:   verified

2. Public Mode Verified Users (Password: Demo123!):
   - maya.lin@example.com       (Female, 28, San Francisco, Romance/Friends, Monogamous)
   - liam.chen@example.com       (Male, 31, Seattle, Romance/Casual, Monogamous)
   - zoe.martinez@example.com    (Female, 33, Los Angeles, Casual/Exploring, ENM)
   - alex.rivera@example.com     (Non-binary, 24, New York, Friends/Exploring, Exploring)
   - marcus.vance@example.com    (Male, 37, Austin, Romance/Friends, Monogamous)

3. Stranger Mode Verified Users (Password: Demo123!):
   - midnight.owl@example.com    (Pseudonym: MidnightOwl, Male, 30, Chicago, ENM)
   - velvet.shadow@example.com   (Pseudonym: VelvetShadow, Female, 29, San Francisco, Exploring)
   - neon.phantom@example.com    (Pseudonym: NeonPhantom, Non-binary, 35, Denver, ENM)
   - cosmic.rogue@example.com    (Pseudonym: CosmicRogue, Male, 40, Boston, Monogamous)
   - silver.siren@example.com   (Pseudonym: SilverSiren, Female, 32, Miami, ENM)

4. Pending Verification Users (Password: Demo123!):
   - chloe.bennett@example.com  (Female, 22, Portland, ID Docs in queue)
   - david.kim@example.com      (Male, 34, San Diego, ID Docs in queue)
   - shadow.dancer@example.com  (Female, 25, Las Vegas, Stranger mode, ID Docs in queue)
   - jordan.taylor@example.com  (Non-binary, 27, Atlanta, ID Docs in queue)
   - samuel.ross@example.com    (Male, 42, Dallas, ID Docs in queue)

================================================================================
*/
