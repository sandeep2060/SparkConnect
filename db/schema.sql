-- SparkConnect Database Schema for Neon Postgres
-- Runtime: Node.js 20 / Vercel Serverless Functions
-- Engine: Neon Lakebase Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS reveal_requests CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_number TEXT,
  password_hash TEXT NOT NULL,
  dob DATE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','banned')),
  mode TEXT DEFAULT 'public' CHECK (mode IN ('public','stranger')),
  pseudonym TEXT,                 -- used in stranger mode
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  hide_photo BOOLEAN DEFAULT false,
  gender TEXT,
  interested_in TEXT[],           -- array of genders
  intents TEXT[],                 -- ['romance','friends','casual','exploring']
  interests TEXT[],               -- ['hiking','gaming',...]
  relationship_style TEXT,        -- 'monogamous' | 'enm' | ...
  location_lat NUMERIC,
  location_lng NUMERIC,
  city TEXT,
  name VARCHAR(255),
  username VARCHAR(255),
  avatar TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  nature JSONB DEFAULT '["Friendly","Sensual"]'::jsonb,
  verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending',
  id_document_url TEXT,
  selfie_url TEXT,
  active_now BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  is_banned BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  location VARCHAR(255),
  distance NUMERIC DEFAULT 5,
  lat NUMERIC DEFAULT 37.7749,
  lng NUMERIC DEFAULT -122.4194,
  x NUMERIC DEFAULT 50,
  y NUMERIC DEFAULT 50,
  neighborhood VARCHAR(255),
  intent VARCHAR(100) DEFAULT 'Romance',
  age INTEGER,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_mode ON users(mode);
CREATE INDEX idx_users_last_active ON users(last_active DESC);

-- VERIFICATION DOCS (admin only)
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  id_doc_url TEXT,
  id_document_url TEXT,
  selfie_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id UUID REFERENCES users(id),
  review_note TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_verifications_status ON verifications(status);

-- REVEAL REQUESTS (stranger mode)
CREATE TABLE reveal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID REFERENCES users(id) ON DELETE CASCADE,
  requester_id VARCHAR(64),
  stranger_id VARCHAR(64),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user, to_user)
);
CREATE INDEX idx_reveal_pair ON reveal_requests(from_user, to_user);

-- CHATS
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES users(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 0,
  streak_updated_at TIMESTAMPTZ,
  streak_expires_at TIMESTAMPTZ,
  last_sender_id VARCHAR(64),
  user_a_last_sent TIMESTAMPTZ,
  user_b_last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  CHECK (user_a < user_b)          -- enforce ordering to prevent dupes
);
CREATE UNIQUE INDEX idx_chat_pair ON chats(user_a, user_b);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  conversation_id VARCHAR(64),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT CHECK (char_length(body) <= 2000),
  text TEXT,
  type VARCHAR(30) DEFAULT 'text',
  media_url TEXT,
  view_limit INTEGER DEFAULT 1,
  views_remaining INTEGER DEFAULT 1,
  views_consumed INTEGER DEFAULT 0,
  audio_duration INTEGER DEFAULT 0,
  disappearing VARCHAR(20) DEFAULT 'off',
  status VARCHAR(20) DEFAULT 'sent',
  seen_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at DESC);

-- BLOCKS
CREATE TABLE blocks (
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- REPORTS
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id VARCHAR(64),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  severity VARCHAR(20) DEFAULT 'medium',
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reports_status ON reports(status);

-- ADMIN AUDIT LOG (CRITICAL — legal protection)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,           -- 'view_chat','ban_user','verify_user'
  target_type TEXT,               -- 'user','chat','report'
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
