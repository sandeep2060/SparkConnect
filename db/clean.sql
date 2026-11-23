-- ===============================================================================
-- SparkConnect Clean Database Script
-- Purges all user, chat, verification, and audit bulk data while maintaining
-- a secured Admin account with bcrypt password hashing.
-- Safe for execution via: psql $DATABASE_URL -f db/clean.sql
-- ===============================================================================

BEGIN;

-- 1. Truncate all tables with cascading foreign keys
TRUNCATE users, verifications, reveal_requests, chats, 
         messages, blocks, reports, audit_logs,
         conversations, friendships, hotspots, safety_checkins, 
         sparkconnect_members, swipes CASCADE;

-- 2. Insert verified secured Admin account
INSERT INTO users (
  id,
  email,
  password_hash,
  dob,
  role,
  status,
  mode,
  display_name,
  name,
  username,
  pseudonym,
  bio,
  avatar_url,
  avatar,
  hide_photo,
  gender,
  verified,
  verification_status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@sparkconnect.dev',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Admin123!
  '1990-01-01',
  'admin',
  'verified',
  'public',
  'SparkConnect Admin',
  'SparkConnect Admin',
  'admin',
  'Admin',
  'Lead platform administrator ensuring safety, integrity, and trust across SparkConnect.',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  false,
  'Non-binary',
  true,
  'approved',
  NOW(),
  NOW()
);

COMMIT;

-- Admin Login: admin@sparkconnect.dev / Admin123!
