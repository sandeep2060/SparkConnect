# SparkConnect Backend API — Architecture & Deployment Guide

> **Runtime:** Node.js 20 (Vercel Serverless Functions)  
> **Database:** Neon Lakebase Postgres via `@neondatabase/serverless`  
> **Auth:** JWT (`jsonwebtoken`) + `bcryptjs` password hashing + httpOnly cookies  
> **Validation:** `zod` schemas  
> **File Uploads:** Cloudinary free tier unsigned uploads  
> **Notifications:** Resend email notifications  

---

## 1. Database Initialization & Seeding

### 1.1 Run Schema Initialization
Ensure your `DATABASE_URL` is set in your environment, then execute:

```bash
# Using standard psql
psql "$DATABASE_URL" -f db/schema.sql

# Or using Neon CLI
neon sql < db/schema.sql
```

The schema creates tables with UUID keys (`gen_random_uuid()`):
- `users`: Core profile data, age, 18+ enforcement, public vs stranger mode.
- `verifications`: Admin queue for government ID doc and selfie review.
- `reveal_requests`: Mutual identity reveals for stranger mode.
- `chats`: Enforces `user_a < user_b` to eliminate duplicate conversations.
- `messages`: Chat message records with 2000 character limits and read receipts.
- `blocks`: Bidirectional interaction blocks (disables feed visibility & messaging).
- `reports`: Moderation reports with audit linking and Resend email alerts.
- `audit_logs`: Legally compliant administrative audit logging.

### 1.2 Seed Initial Admin & Test Users
Execute `db/seed.sql`:

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

#### Pre-seeded Admin Credentials:
- **Email:** `admin@sparkconnect.app`
- **Password:** `Admin123!`
- **Bcrypt Hash (10 rounds):** `$2b$10$AxnbIUHh4nC4S111R9oubeU5RKBt0qpExrZ4MFVTp5Ufb9vNyP82a`
- **Role:** `admin`
- **Status:** `verified`

---

## 2. Environment Variables

Create `.env` (or set in Vercel Project Settings):

```ini
DATABASE_URL=postgres://neondb_owner:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_UPLOAD_PRESET=sparkconnect_unsigned_preset
RESEND_API_KEY=re_your_resend_api_key
ADMIN_EMAIL=admin@sparkconnect.app
FRONTEND_ORIGIN=https://your-app.vercel.app
CRON_SECRET=optional_random_cron_secret
```

---

## 3. Deploying to Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Link & Deploy
```bash
vercel link
vercel env pull .env.local
vercel --prod
```

### Serverless Routing in `vercel.json`
`vercel.json` contains:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/"
    }
  ]
}
```
This ensures all `/api/*` endpoints map directly to serverless functions in `api/`, while frontend routes route to the single-page application.

---

## 4. Testing Endpoints with cURL

Set base URL for testing:
```bash
BASE_URL="http://localhost:5173" # Or "https://your-app.vercel.app"
```

### 4.1 Authentication (`api/auth/`)

#### 1. Sign Up (18+ validation, password hashing, returns JWT & sets cookie)
```bash
curl -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "dob": "1998-05-15",
    "display_name": "Jordan Smith",
    "mode": "public",
    "gender": "non-binary",
    "city": "Austin",
    "intents": ["romance", "friends"],
    "interests": ["hiking", "music"]
  }'
```

#### 2. Log In
```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@sparkconnect.app",
    "password": "Admin123!"
  }'
```
> Save the returned `token` or use `-b cookies.txt` in subsequent requests.

#### 3. Get Current User (`/api/auth/me`)
```bash
curl -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer <TOKEN>" \
  -b cookies.txt
```

#### 4. Log Out (`/api/auth/logout`)
```bash
curl -X POST "$BASE_URL/api/auth/logout" \
  -b cookies.txt
```

---

### 4.2 Discovery & Users (`api/users/`)

#### 1. Discovery Feed (Filtered, Verification Gated, Stranger-Privacy Masked)
```bash
curl -X GET "$BASE_URL/api/users?minAge=21&maxAge=35&mode=all&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```
*Note: Stranger mode profiles have `display_name: null` and `avatar_url: null` unless a mutual reveal is approved.*

#### 2. Get User Detail by ID
```bash
curl -X GET "$BASE_URL/api/users/<USER_UUID>" \
  -H "Authorization: Bearer <TOKEN>"
```

#### 3. Update Own Profile (`/api/users/me`)
```bash
curl -X PATCH "$BASE_URL/api/users/me" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Documentary filmmaker and bouldering lover.",
    "city": "San Francisco",
    "interests": ["film", "climbing", "indie-rock"]
  }'
```

#### 4. Request Identity Reveal (`/api/users/reveal`)
```bash
# Send reveal request to stranger mode user
curl -X POST "$BASE_URL/api/users/reveal" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"to_user": "<STRANGER_USER_UUID>"}'

# List pending incoming & outgoing reveals
curl -X GET "$BASE_URL/api/users/reveal" \
  -H "Authorization: Bearer <TOKEN>"

# Approve an incoming reveal request
curl -X PATCH "$BASE_URL/api/users/reveal" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"request_id": "<REQUEST_UUID>", "status": "approved"}'
```

#### 5. Block / Unblock User (`/api/users/block`)
```bash
# Block user
curl -X POST "$BASE_URL/api/users/block" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"blocked_id": "<TARGET_USER_UUID>"}'

# List blocked users
curl -X GET "$BASE_URL/api/users/block" \
  -H "Authorization: Bearer <TOKEN>"

# Unblock user
curl -X DELETE "$BASE_URL/api/users/block" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"blocked_id": "<TARGET_USER_UUID>"}'
```

---

### 4.3 Chats & Messages (`api/chats/`)

#### 1. Start or Retrieve Conversation
```bash
curl -X POST "$BASE_URL/api/chats/start" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id": "<TARGET_USER_UUID>"}'
```

#### 2. List My Conversations
```bash
curl -X GET "$BASE_URL/api/chats" \
  -H "Authorization: Bearer <TOKEN>"
```

#### 3. View Messages & Mark Unread as Read
```bash
curl -X GET "$BASE_URL/api/chats/<CHAT_UUID>" \
  -H "Authorization: Bearer <TOKEN>"
```

#### 4. Send Message (Disallowed if blocked)
```bash
curl -X POST "$BASE_URL/api/chats/<CHAT_UUID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"body": "Hey there! Loved your profile."}'
```

---

### 4.4 Trust & Safety (`api/safety/`)

#### Report User (Stores report + sends Resend email alert)
```bash
curl -X POST "$BASE_URL/api/safety/report" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reported_id": "<TARGET_USER_UUID>",
    "reason": "Harassment or inappropriate messages",
    "details": "Sent unsolicited explicit messages after being told to stop."
  }'
```

---

### 4.5 Administration & Audit (`api/admin/`)

*All `/api/admin/*` endpoints strictly require `role = 'admin'`.*

#### 1. Platform Metrics
```bash
curl -X GET "$BASE_URL/api/admin/stats" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 2. Manage Users (Paginated & Searchable)
```bash
curl -X GET "$BASE_URL/api/admin/users?q=Marcus&status=verified&limit=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 3. Ban / Unban User (Logs to `audit_logs`)
```bash
curl -X PATCH "$BASE_URL/api/admin/users/<TARGET_USER_UUID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "banned",
    "reason": "Repeated safety violations"
  }'
```

#### 4. Review Verification Queue
```bash
# View pending ID docs queue
curl -X GET "$BASE_URL/api/admin/verify" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Approve ID verification (Promotes user to verified)
curl -X POST "$BASE_URL/api/admin/verify" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_UUID>",
    "status": "approved",
    "review_note": "Government passport and matching selfie confirmed."
  }'
```

#### 5. Review Reports
```bash
# List open reports
curl -X GET "$BASE_URL/api/admin/reports?status=open" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Resolve a report
curl -X PATCH "$BASE_URL/api/admin/reports/<REPORT_UUID>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "note": "User warned and offending message removed."
  }'
```

#### 6. Inspect Private Chat Log (Strict Legal Audit Protection)
```bash
curl -X GET "$BASE_URL/api/admin/chat-log/<CHAT_UUID>?reason=Investigation+of+safety+report+104" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
*Note: A descriptive `reason` parameter is strictly enforced. The attempt is recorded in `audit_logs` BEFORE any chat data is returned.*

---

### 4.6 Cron Maintenance (`api/_cron/`)

```bash
curl -X POST "$BASE_URL/api/_cron/cleanup" \
  -H "Authorization: Bearer <CRON_SECRET>"
```
Purges expired reveal requests and stale unverified accounts.
