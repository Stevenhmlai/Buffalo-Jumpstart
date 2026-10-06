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
| `ADMIN_CODE` | your adviser code (first admin account) |
| `ADMIN_PASSWORD` | a temporary password for that first login |
| `ADMIN_NAME` | your name |
| `ADMIN_EMAIL` | your email |
| `GMAIL_CLIENT_ID` | from the Google OAuth client (see *Email* below) |
| `GMAIL_CLIENT_SECRET` | from the Google OAuth client |

4. App service → **Settings → Networking → Generate Domain**. Copy it into `BASE_URL`.
5. Log in with `ADMIN_CODE` / `ADMIN_PASSWORD`, then change the password under **Account**. You can remove `ADMIN_PASSWORD` from the variables afterwards (the admin is only created once).

The database tables and the 10 videos are created automatically on first start.

### Email (Gmail API)
Railway's Hobby plan blocks SMTP, so the portal sends email through the Gmail API over HTTPS.

1. Go to console.cloud.google.com → create a project (e.g. "Buffalo Jumpstart").
2. **APIs & Services → Library** → enable **Gmail API**.
3. **OAuth consent screen** (Google Auth Platform) → External → app name "Buffalo Jumpstart", support email = the agency Gmail. Under **Audience**, click **Publish app** (In production). In "Testing" mode Google expires the connection every 7 days.
4. **Clients → Create client** → Web application → Authorised redirect URI: `BASE_URL/admin/email/callback` (e.g. `https://buffalo-jumpstart-production.up.railway.app/admin/email/callback`).
5. Copy the client ID and secret into `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` on Railway.
6. In the portal: **Admin → Settings → Email → Connect Gmail**, sign in as the agency Gmail, choose *Advanced → Go to Buffalo Jumpstart* on the "unverified app" warning, and allow sending. Then click **Send me a test email**.

If email isn't connected the portal still works; admins see a warning whenever an email could not be sent, and the last error is shown under Settings → Email. (`GMAIL_USER` + `GMAIL_APP_PASSWORD` SMTP still works as a fallback locally or on Railway Pro.)

### Backups
Postgres service → **Backups** tab → enable scheduled daily backups (if your Railway plan includes it). Admins can also download all records to Excel at any time from *Admin → Advisers*.

## How it works (summary)
- **Registration**: `/register` → admin approves in *Admin → Approvals* → member and upline are emailed.
- **Course**: welcome video (required) → Modules 1–8 in order. Reaching the end of a video unlocks its quiz; 100% is needed to unlock the next module. Until a quiz is approved, watching the video is enough.
- **Completion**: congratulations video (once added in *Videos & quizzes*) → certificate PDF + "next steps" text (*Settings*).
- **Batches**: *Admin → Batches* → create a batch (number, workshop time, venue) and fill in the 4 Zoom sessions. Project the QR screen at the workshop; show each Zoom session's 4-digit code near the end of the session.
- **Reminders**: daily at 9am Malaysia time — 7-day inactivity, workshop tomorrow, Zoom tomorrow.

## Local development
```
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/jumpstart ADMIN_CODE=ADMIN1 ADMIN_PASSWORD=changeme npm start
```
