# CampusLink — Pre-Launch Checklist

Everything below is written for you to actually run through, in order. Each section builds on the last.

## 1. First-time setup

```bash
# Backend
cd backend/server
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev

# Frontend (separate terminal)
cd frontend/client
cp .env.example .env        # default localhost:5000 is fine for local dev
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 2. Give yourself admin access

```bash
cd backend/server
npm run make-admin your-email@example.com
```

You must register that account first — the script promotes an existing user, it doesn't create one.

## 3. Automated checks (run these before anything else)

```bash
cd backend/server && npm test          # 53 tests, all should pass
cd frontend/client && npx eslint src   # 0 errors, 0 warnings
cd frontend/client && npm run build    # should complete with no errors
```

If any of these fail after you've made your own changes, fix that before testing manually — it's faster to catch here than by clicking around.

## 4. Manual walkthrough (two accounts needed for most of this)

Register two accounts (A and B) and go through this in order — each step builds on state from the last:

- [ ] **Auth** — register (check server console for the verification email link), log out, log in, "Remember me", log out, "Forgot password" → check server console for the reset link (no SMTP needed locally) → reset → log in with new password → from Settings, change your password while logged in
- [ ] **Profile** — edit bio/university/department/skills, upload an avatar, confirm it shows in the navbar
- [ ] **Feed** — create a post with an image, one with a poll, one tagged as an Event/Question/Announcement; filter the feed by category; vote on the poll from account B; like/comment/reply/edit/delete a comment
- [ ] **Friends** — A sends a request to B, B accepts, confirm both see each other under Friends, remove the friendship
- [ ] **Chat (direct)** — A and B message each other, confirm the typing indicator and online dot both work (needs both browser tabs open at once)
- [ ] **Chat (group)** — A creates a group chat with 2+ friends, everyone sees messages arrive live; the creator leaves and ownership hands off automatically to another member
- [ ] **Notifications** — confirm A gets notified when B likes/comments/friend-requests/messages
- [ ] **Search** — search for account B by name and by skill
- [ ] **Groups & Clubs, Teams, Discussions** — create a study group and a club, join one from account B, post in its discussion board; create a Team with a member cap and confirm it blocks joining once full; start a course discussion, reply from account B
- [ ] **Academics** — create an event, RSVP; upload a note with a file attachment; add an assignment and mark it done; publish a project
- [ ] **Confessions & Polls** — post an anonymous confession with a poll attached; confirm account B can never see who posted it, but A can still delete their own
- [ ] **Lost & Found** — report a lost item with a photo, mark it resolved
- [ ] **Settings** — toggle notification/auto-play preferences, change profile visibility
- [ ] **Admin** — log in as the admin account, check the Overview stats match what you just created, ban/unban account B, resolve a test report, then (on a throwaway third test account) try Delete User and confirm any groups/teams that account created hand off ownership cleanly instead of breaking

## 5. Before pushing to GitHub

- [ ] Confirm `.env` is NOT tracked: `git status` should never show it. If it's already been committed in a previous push, **rotate your MongoDB password and JWT_SECRET** — removing the file later doesn't erase it from history.
- [ ] Double check `.env.example` has placeholder values only, no real credentials.
- [ ] Skim `DEPLOYMENT.md` if you're deploying — it covers Render + Vercel + the SMTP setup for real emails.

## 6. Known, intentional limitations (not bugs)

- File uploads (avatars, post images/videos, note attachments) won't survive a restart on Render's free tier — see `DEPLOYMENT.md` for the fix (persistent disk or Cloudinary).
- Without `SMTP_*` env vars set, password reset and verification emails print to the server console instead of sending — this is by design for local dev, not a bug.
- Comment replies are one level deep by design (no reply-to-a-reply chains) — matches how most social platforms actually do it.
- Confessions are truly anonymous — even admins can't see who posted one through the app. The author is only kept internally for abuse handling and is never returned by any API response.
- Group chat, Study Groups, and Teams all require members to already be friends before being added — this isn't a bug, it mirrors the same trust boundary as 1-on-1 chat.
