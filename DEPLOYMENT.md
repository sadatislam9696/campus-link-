# Deploying CampusLink

This covers the same stack your README already names: **MongoDB Atlas + Render (backend) + Vercel (frontend)**.

Deploy in this order — the backend needs to exist first so you have a URL to give the frontend, then you circle back and give the backend the frontend's URL.

## 1. MongoDB Atlas

You're likely already using this for local dev. For production:
- Create a separate database user with a strong, unique password (don't reuse the one from your local `.env`).
- Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) since Render's IPs aren't static on the free plan — or use Atlas's "Allow access from anywhere" option.
- Copy the connection string; you'll paste it into Render as `MONGO_URI`.

## 2. Backend → Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo.
3. A `render.yaml` blueprint is included at the repo root — Render will detect it and pre-fill most settings (root dir `backend/server`, build `npm install`, start `npm start`).
4. Set these environment variables in the Render dashboard (they're marked `sync: false` in the blueprint, meaning Render won't set them for you):
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string (don't reuse the one from `.env.example`)
   - `CLIENT_URL` — leave a placeholder for now (e.g. `http://localhost:5173`); you'll update this in step 4
5. Deploy. Note the resulting URL, e.g. `https://campuslink-api.onrender.com`.

**⚠️ File uploads on Render's free plan don't persist.** Avatars and post images are saved to disk at `backend/server/src/uploads/`, and Render's free tier has an *ephemeral* filesystem — uploaded files disappear on every restart/redeploy. For a real deployment, either:
- Attach a [Render persistent disk](https://render.com/docs/disks) (paid), or
- Swap the `multer` disk storage for cloud storage (e.g. Cloudinary, which your README already lists under "Future" — this is the recommended long-term fix).

This doesn't block getting the app running, but avatars/post images will vanish on the free tier until one of the above is done.

## 3. Frontend → Vercel

1. In Vercel: **New Project**, import the same repo.
2. Set **Root Directory** to `frontend/client`.
3. Framework preset: Vite (should auto-detect).
4. Add an environment variable:
   - `VITE_API_URL` — the Render URL from step 2 (e.g. `https://campuslink-api.onrender.com`, **no trailing slash, no `/api`**)
5. Deploy. A `vercel.json` is included so client-side routes (`/dashboard`, `/profile/:username`, etc.) work on refresh instead of 404ing.
6. Note the resulting URL, e.g. `https://campuslink.vercel.app`.

## 4. Close the loop

Go back to Render and update `CLIENT_URL` to your actual Vercel URL from step 3, then redeploy the backend. This is what the backend uses for CORS (both REST and Socket.io) — until it's set correctly, requests from your deployed frontend will be blocked.

## 5. Post-deploy checklist

- [ ] Visit the Vercel URL, register an account, confirm the feed loads (no CORS errors in the browser console)
- [ ] `npm run make-admin your-email@example.com` — run this **against your Render deployment's database** (i.e. with `MONGO_URI` pointed at the same Atlas cluster) to get admin access
- [ ] Send a test message between two accounts to confirm Socket.io connects (check the Network tab for a `wss://` connection, not just `https://`)
- [ ] Confirm HTTPS is active on both URLs (Render and Vercel both provide this automatically — no extra setup needed)

## 6. Password reset emails

"Forgot password" works locally without any setup — if `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` aren't set, the reset link is printed to the server console instead of emailed, so you can test the full flow by watching the logs. For production, set those three (plus `SMTP_PORT` and `SMTP_FROM`) as Render environment variables using any SMTP provider (Gmail app password, SendGrid, Mailgun, etc.) so real emails actually go out. See `EMAIL_SETUP.md` for a full walkthrough, including a `npm run test-email` script to verify your credentials work before relying on them.

## Local development

Nothing above changes local dev — `npm run dev` in both `backend/server` and `frontend/client` continues to work against `http://localhost:5000` / `http://localhost:5173` by default, since both `.env.example` files fall back to those values when unset.
