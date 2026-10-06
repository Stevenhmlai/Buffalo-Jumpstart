# Buffalo Jumpstart

Training portal for Buffalo Investment Agency: sequential training videos with quizzes, certificate, workshop QR check-in, Zoom attendance, upline group view and admin tools.

Built with Node.js (Express), PostgreSQL and server-rendered pages. Hosted on Railway.

## Deploy on Railway

1. **New project** → *Deploy from GitHub repo* → choose this repository.
2. In the same project: **+ New → Database → PostgreSQL**. Put it (and the app) in the **Southeast Asia (Singapore)** region under each service's *Settings → Region*.
3. Open the app service → **Variables** and add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference to the database) |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | any long random text (40+ characters) |
| `BASE_URL` | the app's public address, e.g. `https://buffalo-jumpstart.up.railway.app` |
| `ADMIN_CODE` | your agent code (first admin account) |
| `ADMIN_PASSWORD` | a temporary password for that first login |
| `ADMIN_NAME` | your name |
| `ADMIN_EMAIL` | your email |
| `GMAIL_USER` | `buffaloinvestmentagency@gmail.com` |
| `GMAIL_APP_PASSWORD` | the 16-character Gmail app password |

4. App service → **Settings → Networking → Generate Domain**. Copy it into `BASE_URL`.
5. Log in with `ADMIN_CODE` / `ADMIN_PASSWORD`, then change the password under **Account**. You can remove `ADMIN_PASSWORD` from the variables afterwards (the admin is only created once).

The database tables and the 10 videos are created automatically on first start.

### Gmail app password
Google Account → **Security** → turn on **2-Step Verification** → search "App passwords" → create one named "Jumpstart" → paste the 16 characters into `GMAIL_APP_PASSWORD`. If Gmail is not set up, the portal still works; emails are just skipped (and logged).

### Backups
Postgres service → **Backups** tab → enable scheduled daily backups (if your Railway plan includes it). Admins can also download all records to Excel at any time from *Admin → Agents*.

## How it works (summary)
- **Registration**: `/register` → admin approves in *Admin → Approvals* → member and upline are emailed.
- **Course**: welcome video (optional) → Modules 1–8 in order. Reaching the end of a video unlocks its quiz; 100% is needed to unlock the next module. Until a quiz is approved, watching the video is enough.
- **Completion**: congratulations video (once added in *Videos & quizzes*) → certificate PDF + "next steps" text (*Settings*).
- **Batches**: *Admin → Batches* → create a batch (number, workshop time, venue) and fill in the 4 Zoom sessions. Project the QR screen at the workshop; show each Zoom session's 4-digit code near the end of the session.
- **Reminders**: daily at 9am Malaysia time — 7-day inactivity, workshop tomorrow, Zoom tomorrow.

## Local development
```
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/jumpstart ADMIN_CODE=ADMIN1 ADMIN_PASSWORD=changeme npm start
```
