// Outgoing email.
//
// Primary route: the Gmail API over HTTPS. Railway's Hobby plan blocks SMTP, so a
// normal Gmail app-password connection times out there. The Gmail API is plain HTTPS
// and works on any plan. An admin connects the agency's Gmail account once under
// Admin → Settings → Email ("Connect Gmail"); the refresh token is kept in the
// settings table.
//
// Fallback route: SMTP with a Gmail app password (works locally, or on Railway Pro).
//
// Every send has a short timeout and returns true/false, so a page never hangs
// waiting on email and the admin is told honestly when an email did not go out.

const nodemailer = require('nodemailer');
const MailComposer = require('nodemailer/lib/mail-composer');

const FROM_NAME = process.env.MAIL_FROM_NAME || 'Buffalo Jumpstart';
const GMAIL_USER = process.env.GMAIL_USER;
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const TIMEOUT_MS = 15000;

let smtp = null;
if (GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  smtp = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
    connectionTimeout: TIMEOUT_MS, greetingTimeout: TIMEOUT_MS, socketTimeout: TIMEOUT_MS,
  });
}

function db() { return require('../db'); } // lazy: db.js requires nothing from here, but keep load order simple

function baseUrl() {
  return (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

// ---------- Gmail API ----------
function apiConfigured() { return !!(CLIENT_ID && CLIENT_SECRET); }
function redirectUri() { return baseUrl() + '/admin/email/callback'; }

function authUrl(state) {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: `openid email ${GMAIL_SCOPE}`,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
}

async function tokenRequest(params) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google token error: ${d.error || r.status}${d.error_description ? ' – ' + d.error_description : ''}`);
  return d;
}

// Called from the OAuth callback. Stores the refresh token and the connected address.
async function connect(code) {
  const d = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() });
  if (!d.refresh_token) throw new Error('Google did not return a refresh token. Remove the app under myaccount.google.com → Security → Third-party access, then connect again.');
  let email = '';
  if (d.id_token) {
    try { email = JSON.parse(Buffer.from(d.id_token.split('.')[1], 'base64url').toString()).email || ''; } catch (e) { /* ignore */ }
  }
  const { setSetting } = db();
  await setSetting('gmail_refresh_token', d.refresh_token);
  await setSetting('gmail_email', email);
  cachedToken = { value: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
  return email;
}

async function disconnect() {
  const { setSetting } = db();
  await setSetting('gmail_refresh_token', '');
  await setSetting('gmail_email', '');
  cachedToken = null;
}

async function status() {
  const { getSetting } = db();
  const email = (await getSetting('gmail_email')) || '';
  const connected = !!(await getSetting('gmail_refresh_token'));
  return {
    apiConfigured: apiConfigured(),
    connected: apiConfigured() && connected,
    email,
    smtp: !!smtp,
    redirectUri: redirectUri(),
    lastError: (await getSetting('mail_last_error')) || '',
  };
}

let cachedToken = null;
async function accessToken() {
  if (cachedToken && cachedToken.exp > Date.now()) return cachedToken.value;
  const { getSetting } = db();
  const refresh = await getSetting('gmail_refresh_token');
  if (!refresh) return null;
  const d = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refresh });
  cachedToken = { value: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
  return cachedToken.value;
}

async function sendViaApi(token, message) {
  const raw = (await new MailComposer(message).compile().build()).toString('base64url');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(`Gmail API ${r.status}: ${(d.error && d.error.message) || 'send failed'}`);
  }
}

// ---------- Message building ----------
function wrap(bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f6f2ea;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="font-weight:800;font-size:18px;color:#a3121b;margin-bottom:16px">Buffalo Jumpstart</div>
    <div style="background:#ffffff;border-radius:12px;padding:24px;font-size:15px;line-height:1.55">${bodyHtml}</div>
    <div style="font-size:12px;color:#6b6b6b;margin-top:16px">Buffalo Investment Agency</div>
  </div></body></html>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function button(url, label) {
  return `<p style="margin:24px 0"><a href="${url}" style="background:#a3121b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

async function recordError(text) {
  try { await db().setSetting('mail_last_error', text ? `${new Date().toISOString()} ${text}` : ''); } catch (e) { /* ignore */ }
}

// Returns true when the email was handed to Gmail, false otherwise. Never throws.
async function send(to, subject, html) {
  if (!to) return false;
  try {
    const token = apiConfigured() ? await accessToken() : null;
    const fromAddr = token ? ((await db().getSetting('gmail_email')) || GMAIL_USER) : GMAIL_USER;
    const replyTo = process.env.MAIL_REPLY_TO || undefined;
    const message = { from: `"${FROM_NAME}" <${fromAddr}>`, to, replyTo, subject, html: wrap(html) };
    if (token) {
      await sendViaApi(token, message);
    } else if (smtp) {
      await smtp.sendMail(message);
    } else {
      console.log(`[mail not set up] To: ${to} | ${subject}`);
      await recordError('Email is not connected. Go to Admin → Settings → Email.');
      return false;
    }
    await recordError('');
    return true;
  } catch (e) {
    console.error('Mail error', to, subject, e.message);
    await recordError(`${subject} → ${to}: ${e.message}`);
    return false;
  }
}

const mail = {
  baseUrl,
  esc,
  send,
  authUrl,
  connect,
  disconnect,
  status,
  apiConfigured,
  async newRegistrationAlert(adminEmails, u) {
    for (const to of adminEmails) {
      await send(to, `New Jumpstart registration: ${u.name}`,
        `<p>${esc(u.name)} (${esc(u.agent_code)}) has registered and is waiting for approval.</p>
         ${u.upline_not_found ? '<p><b>Note:</b> the upline code they entered is not in the portal.</p>' : ''}
         ${button(baseUrl() + '/admin/approvals', 'Review registration')}`);
    }
  },
  approved(u) {
    return send(u.email, 'Your Buffalo Jumpstart access is approved',
      `<p>Hi ${esc(u.name)},</p>
       <p>Your registration has been approved. You can now log in with your adviser code <b>${esc(u.agent_code)}</b> and the password you chose.</p>
       ${button(baseUrl() + '/login', 'Log in to Buffalo Jumpstart')}`);
  },
  uplineNotified(upline, u) {
    return send(upline.email, `${u.name} has registered for Buffalo Jumpstart`,
      `<p>Hi ${esc(upline.name)},</p>
       <p>Your downline <b>${esc(u.name)}</b> (${esc(u.agent_code)}) has successfully registered for access to the Buffalo Jumpstart portal.</p>
       <p>You can follow their progress under "My group".</p>
       ${button(baseUrl() + '/team', 'View my group')}`);
  },
  rejected(u, reason) {
    return send(u.email, 'Your Buffalo Jumpstart registration',
      `<p>Hi ${esc(u.name)},</p>
       <p>We were unable to approve your registration for the Buffalo Jumpstart portal.</p>
       ${reason ? `<p>Reason: ${esc(reason)}</p>` : ''}
       <p>If you think this is a mistake, please contact your upline or the agency.</p>`);
  },
  passwordReset(u, token) {
    return send(u.email, 'Reset your Buffalo Jumpstart password',
      `<p>Hi ${esc(u.name)},</p>
       <p>We received a request to reset your password. This link works for 2 hours.</p>
       ${button(baseUrl() + '/reset/' + token, 'Set a new password')}
       <p>If you did not ask for this, you can ignore this email.</p>`);
  },
  welcomeSetPassword(u, token) {
    return send(u.email, 'Your Buffalo Jumpstart account',
      `<p>Hi ${esc(u.name)},</p>
       <p>An account has been created for you on the Buffalo Jumpstart portal. Your login is your adviser code <b>${esc(u.agent_code)}</b>.</p>
       <p>Please set your password (this link works for 7 days):</p>
       ${button(baseUrl() + '/reset/' + token, 'Set my password')}`);
  },
  testEmail(to) {
    return send(to, 'Buffalo Jumpstart test email',
      `<p>This is a test email from the Buffalo Jumpstart portal.</p><p>If you can read this, email is working.</p>`);
  },
  idleReminder(u, nextTitle) {
    return send(u.email, 'Continue your Buffalo Jumpstart training',
      `<p>Hi ${esc(u.name)},</p>
       <p>It has been a week since your last progress on Buffalo Jumpstart.${nextTitle ? ` Up next: <b>${esc(nextTitle)}</b>.` : ''}</p>
       ${button(baseUrl() + '/course', 'Continue training')}`);
  },
  workshopReminder(u, batch, when) {
    return send(u.email, `Reminder: Jumpstart Workshop tomorrow`,
      `<p>Hi ${esc(u.name)},</p>
       <p>This is a reminder that your Jumpstart Workshop (Batch ${batch.number}) is tomorrow.</p>
       <p><b>${esc(when)}</b><br>${esc(batch.venue)}</p>
       <p>Remember to bring your phone: you'll check in by scanning a QR code while logged in to the portal.</p>`);
  },
  zoomReminder(u, batch, z, when) {
    return send(u.email, `Reminder: Jumpstart Zoom session ${z.seq} tomorrow`,
      `<p>Hi ${esc(u.name)},</p>
       <p>Batch ${batch.number}'s Zoom session ${z.seq} is tomorrow: <b>${esc(when)}</b>.</p>
       <p>The Zoom link is in the portal. During the session you'll be given a 4-digit code to record your attendance.</p>
       ${button(baseUrl() + '/workshop', 'Open the portal')}`);
  },
};

module.exports = mail;
