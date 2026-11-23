# SparkConnect (LoveBook) ✨

A mobile-first, fully responsive dating, friendship, and adult-partner discovery platform featuring **Dual-Mode Profiles** (Public & Stranger/Anonymous Mode), an **Admin Trust & Moderation Panel**, and real-time-feeling chat UI with **Safety Check-in Protocols**.

---

## 🌟 Key Features

### 1. Dual-Mode Discovery System
- **Public Profile Mode**: Verified photos, full name, open lifestyle badges, and verified shield for spontaneous connections.
- **Stranger / Anonymous Mode**: Algorithmic photo blur, mystery pseudonym, and lock gate. Photos and identity remain concealed until mutual reveal agreement.

### 2. Multi-Step Signup & Age Gate
- Enforces strict **18+ adult age verification**.
- 4-step wizard: Credentials & DOB verification $\rightarrow$ Mode selection $\rightarrow$ Intent selection $\rightarrow$ Interests selection.
- Verification Pending screen with simulated scanning radar and document upload flow.

### 3. Responsive Chat Experience
- Split view on desktop (`md:` breakpoint and up: 30% conversation list, 70% active thread).
- Full-screen thread on mobile devices with smooth transition.
- **Safety Check-in Protocol**: Discreetly notifies trusted emergency contacts with live meeting details, coordinates, and check-in timers.
- Integrated safety reporting modal.

### 4. Admin Control Panel (`/admin`)
- Accessible to users with `role === 'admin'`.
- Real-time telemetry dashboard with **Recharts** match & registration velocity chart.
- User directory with search, status filters, ban/unban, and verification controls.
- Full dossier view: compares government-issued photo ID side-by-side with live selfie.
- Trust & safety reports list with resolve/dismiss and chat transcript moderation.

---

## 🛠 Tech Stack

- **Framework**: React 18 / 19 + Vite
- **Styling**: Tailwind CSS v3 (mobile-first utilities, dark mode default, Inter typography)
- **Routing**: React Router v6 / v7 client-side routing
- **State Management**: Zustand (persisted auth, dual mode, theme)
- **Networking**: Axios client configured with base URL from `VITE_API_URL`
- **Icons**: Lucide React
- **Data Visualizations**: Recharts
- **No external UI component libraries** (pure Tailwind CSS components)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd LoveBook
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🔑 Demo Access & Testing

For fast evaluation, two pre-configured accounts are provided on the `/login` page:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Demo User** | `alex.rivera@sparkconnect.com` | `spark-secret-123` | Match Feed, Discover, Chat, Edit Profile |
| **Demo Admin** | `admin@sparkconnect.com` | `admin-master-key` | Full Admin Dashboard, ID Queue, Reports |

> 💡 **Tip:** You can also toggle between User and Admin roles on the fly using the **"Switch Demo Role"** button in the sidebar / bottom panel.

---

## ☁️ Deployment to Vercel

SparkConnect is pre-configured for zero-config Vercel deployment with client-side SPA routing (`vercel.json`).

### Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Deploy via Git Integration
1. Push your code to GitHub / GitLab / Bitbucket.
2. Import the repository in your Vercel Dashboard.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variable: `VITE_API_URL=https://your-backend-api.com`.
7. Click **Deploy**.

---

## 📂 Project Architecture

```
src/
├── api/              # Axios client and API modules (auth, users, chats, admin)
├── components/       # Reusable UI & domain components (Button, ProfileCard, ModeToggle, etc.)
├── features/         # Domain feature entry points (auth, profile, discovery, chat, admin)
├── hooks/            # Custom hooks (useMediaQuery, useDebounce)
├── layouts/          # PublicLayout, AppLayout, AdminLayout
├── pages/            # Route pages (Landing, Login, Signup, Discover, Chats, Admin, etc.)
├── store/            # Zustand stores (authStore, uiStore, profileStore)
├── utils/            # Mock dataset, helpers, constants
├── App.jsx           # Client-side router declarations
└── main.jsx          # App root initialization & BrowserRouter
```
