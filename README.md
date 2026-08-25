# 🎓 CampusLink

**A full-stack university social networking platform** where students connect, collaborate, and stay on top of campus life — built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io for realtime features.

CampusLink started as a Facebook-style feed for a single university and grew into a complete social platform: friends and messaging, study groups and teams, anonymous confessions, a lost & found board, an admin panel, and a full academic toolkit (events, notes, assignments, project showcases, and course discussions).

---

## ✨ Features

### Authentication & Account
- Register / login with JWT sessions, "Remember me" (7-day vs 30-day tokens)
- Forgot / reset password via emailed, single-use, time-limited tokens
- Email verification on signup, with a resend option and an in-app banner for unverified accounts
- Change password while logged in
- Rate-limited auth endpoints and hashed passwords (bcrypt) throughout

### Profile & Settings
- Editable profile: bio, university, department, major, academic year, skills
- Avatar and cover photo upload
- Public profile pages (`/profile/:username`) with About, Posts, Friends, and Skills tabs
- Settings: notification preferences, auto-play videos, profile visibility (public/friends), **dark mode**
- Admin-assignable roles (`user` / `admin`)

### Feed & Posts
- Text posts with optional image, video, or document attachment (PDF/DOC/PPT/ZIP)
- Post categories (General / Event / Question / Announcement) with feed filtering
- Polls with live vote percentages
- Like, comment, and one-level comment replies, with comment edit/delete
- Emoji picker for posts and comments
- Post edit/delete (own posts), paginated feed with "Load More"
- Post reporting, routed to the admin review queue

### Friends & Social Graph
- Friend requests (send / accept / reject / cancel), friend suggestions based on university/department
- Friends list per profile, remove-friend support

### Realtime Messaging
- 1-on-1 chat and **group chat** (friends-only, so it mirrors the same trust boundary everywhere else)
- Typing indicators, online presence, read receipts
- Message edit and delete, synced live to the other participant(s) via Socket.io rooms
- Conversations list merges direct and group chats into a single inbox

### Notifications
- Realtime + persisted notifications for likes, comments, replies, friend requests/acceptances, and messages
- Unread badge in the navbar, mark-as-read / mark-all-as-read

### Communities
- **Study Groups & Clubs** — join/leave, member-only discussion boards
- **Teams** — project/competition-focused groups with a configurable member cap
- **Course Discussions** — course-code-tagged Q&A threads with replies

### Academic Toolkit
- **Events** — create, browse upcoming events, RSVP ("interested")
- **Notes** — share course notes with an optional file attachment
- **Assignments** — course-tagged deadlines with a personal "mark done" checklist
- **Projects & Research** — a showcase board with GitHub/demo links, tags, and likes

### Campus Life
- **Lost & Found** — report lost/found items with photos and a location, mark resolved
- **Confessions & Polls** — fully anonymous posts (the author is never exposed in any API response, even to admins) with optional attached polls

### Admin Panel
- Dashboard analytics (users, posts, comments, friendships, messages, pending reports)
- User management: search, ban/unban, delete (with full cascade cleanup — see below)
- Post moderation and report review queue

### Search
- Unified search across users (name, username, skills, department, university) and post content

### Platform / Engineering
- Global error handling middleware (no leaked stack traces — every error returns clean JSON)
- Security: Helmet, rate limiting, custom NoSQL-injection sanitization (hand-rolled to stay compatible with Express 5's read-only `req.query`), input validation via `express-validator`
- Cascading deletes: removing a user or a post cleans up its files, comments, memberships, and (for shared groups) hands off ownership instead of leaving orphaned data
- 60+ automated backend tests (Jest + Supertest, fully mocked — no live database required to run them)
- CI pipeline (GitHub Actions): backend tests + frontend lint/build on every push
- Code-split frontend bundle (admin, academics, and other less-common pages load on demand)

---

## 🛠 Tech Stack

**Frontend**
React 19 · React Router · Axios · Context API · Socket.io-client · Vite

**Backend**
Node.js · Express 5 · MongoDB + Mongoose · Socket.io · JWT · Bcrypt · Multer · Nodemailer · Helmet · express-rate-limit · express-validator

**Testing & Tooling**
Jest · Supertest · ESLint · GitHub Actions

**Deployment target**
MongoDB Atlas · Render (backend) · Vercel (frontend) — see [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 📁 Project Structure

```
CampusLink/
├── backend/server/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Route logic (20 controllers)
│   │   ├── middleware/      # Auth, validation, rate limiting, uploads, error handling
│   │   ├── models/          # Mongoose schemas (20 models)
│   │   ├── routes/          # Express routers
│   │   ├── socket/          # Socket.io server (chat, presence, group rooms)
│   │   ├── uploads/         # Avatar/post/note/cover file storage
│   │   └── utils/           # Token helpers, email sending, notification helper
│   ├── scripts/             # make-admin, test-email CLI utilities
│   ├── tests/                # Jest test suites
│   ├── app.js                # Express app (routes + middleware)
│   └── server.js             # Entry point (DB connect + Socket.io + listen)
│
└── frontend/client/
    └── src/
        ├── api/              # Axios instance with auth interceptor
        ├── components/       # Reusable UI (PostCard, Navbar, modals, etc.)
        ├── context/          # Auth, Socket, and Theme providers
        ├── layouts/          # MainLayout shell (navbar + sidebar)
        ├── pages/            # One folder per route/feature
        ├── routes/           # React Router configuration
        └── services/         # One file per API resource
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone and configure
```bash
git clone <your-repo-url>
cd CampusLink
```

### 2. Backend
```bash
cd backend/server
cp .env.example .env    # fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev              # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend/client
cp .env.example .env    # default localhost:5000 backend works out of the box
npm install
npm run dev              # http://localhost:5173
```

### 4. Give yourself admin access
```bash
cd backend/server
npm run make-admin your-email@example.com   # after registering that account in the app
```

### 5. (Optional) Real emails
Password reset and verification links print to the server console until real SMTP credentials are set — see [`EMAIL_SETUP.md`](./EMAIL_SETUP.md) for a Gmail walkthrough and a `npm run test-email` script to verify your setup.

---

## ✅ Testing

```bash
cd backend/server
npm test                 # Jest + Supertest, all mocked - no live DB needed
```

```bash
cd frontend/client
npx eslint src            # lint
npm run build              # production build check
```

See [`PRELAUNCH.md`](./PRELAUNCH.md) for a full manual QA checklist covering every feature end-to-end.

---

## 🌐 Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full MongoDB Atlas → Render → Vercel walkthrough, including environment variables and a post-deploy checklist.

---

## 🔒 Security Notes

- Never commit a real `.env` file — `.gitignore` already excludes it, and `.env.example` ships with placeholders only.
- If credentials are ever committed by mistake, rotate them (MongoDB password, `JWT_SECRET`) — removing the file later doesn't erase it from git history.
- Confessions are anonymous by design: the author is stored internally for abuse handling only and is never returned by any API response.

---

## 📄 License

This project was built as an academic Software Development Project. Add a license here if you intend to distribute it (MIT is a common choice for student projects).

---

## 🙌 Acknowledgements

Built as a CSE Software Development Project, inspired by the everyday needs of university student life — from sharing lecture notes to finding a lost water bottle.
