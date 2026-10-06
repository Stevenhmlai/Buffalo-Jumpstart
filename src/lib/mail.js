const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Buffalo Jumpstart';
const REPLY_TO = process.env.MAIL_REPLY_TO || (GMAIL_USER ? GMAIL_USER.replace('@', '+jumpstart@') : undefined);

let transport = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '') },
  });
}

function baseUrl() {
  return (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}

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

async function send(to, subject, html) {
  if (!to) return false;
  if (!transport) {
    console.log(`[mail disabled] To: ${to} | ${subject}`);
    return false;
  }
  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_USER}>`,
      to,
      replyTo: REPLY_TO,
      subject,
      html: wrap(html),
    });
    return true;
  } catch (e) {
    console.error('Mail error', to, subject, e.message);
    return false;
  }
}

const mail = {
  baseUrl,
  esc,
  async newRegistrationAlert(adminEmails, u) {
    for (const to of adminEmails) {
      await send(to, `New Jumpstart registration: ${u.name}`,
        `<p>${esc(u.name)} (${esc(u.agent_code)}) has registered and is waiting for approval.</p>
         ${u.upline_not_found ? '<p><b>Note:</b> the upline code they entered is not in the portal.</p>' : ''}
         ${button(baseUrl() + '/admin/approvals', 'Review registration')}`);
    }
  },
  async approved(u) {
    await send(u.email, 'Your Buffalo Jumpstart access is approved',
      `<p>Hi ${esc(u.name)},</p>
       <p>Your registration has been approved. You can now log in with your agent code <b>${esc(u.agent_code)}</b> and the password you chose.</p>
       ${button(baseUrl() + '/login', 'Log in to Buffalo Jumpstart')}`);
  },
  async uplineNotified(upline, u) {
    await send(upline.email, `${u.name} has registered for Buffalo Jumpstart`,
      `<p>Hi ${esc(upline.name)},</p>
       <p>Your downline <b>${esc(u.name)}</b> (${esc(u.agent_code)}) has successfully registered for access to the Buffalo Jumpstart portal.</p>
       <p>You can follow their progress under "My group".</p>
       ${button(baseUrl() + '/team', 'View my group')}`);
  },
  async rejected(u, reason) {
    await send(u.email, 'Your Buffalo Jumpstart registration',
      `<p>Hi ${esc(u.name)},</p>
       <p>We were unable to approve your registration for the Buffalo Jumpstart portal.</p>
       ${reason ? `<p>Reason: ${esc(reason)}</p>` : ''}
       <p>If you think this is a mistake, please contact your upline or the agency.</p>`);
  },
  async passwordReset(u, token) {
    await send(u.email, 'Reset your Buffalo Jumpstart password',
      `<p>Hi ${esc(u.name)},</p>
       <p>We received a request to reset your password. This link works for 2 hours.</p>
       ${button(baseUrl() + '/reset/' + token, 'Set a new password')}
       <p>If you did not ask for this, you can ignore this email.</p>`);
  },
  async welcomeSetPassword(u, token) {
    await send(u.email, 'Your Buffalo Jumpstart account',
      `<p>Hi ${esc(u.name)},</p>
       <p>An account has been created for you on the Buffalo Jumpstart portal. Your login is your agent code <b>${esc(u.agent_code)}</b>.</p>
       <p>Please set your password (this link works for 7 days):</p>
       ${button(baseUrl() + '/reset/' + token, 'Set my password')}`);
  },
  async idleReminder(u, nextTitle) {
    await send(u.email, 'Continue your Buffalo Jumpstart training',
      `<p>Hi ${esc(u.name)},</p>
       <p>It has been a week since your last progress on Buffalo Jumpstart.${nextTitle ? ` Up next: <b>${esc(nextTitle)}</b>.` : ''}</p>
       ${button(baseUrl() + '/course', 'Continue training')}`);
  },
  async workshopReminder(u, batch, when) {
    await send(u.email, `Reminder: Jumpstart Workshop tomorrow`,
      `<p>Hi ${esc(u.name)},</p>
       <p>This is a reminder that your Jumpstart Workshop (Batch ${batch.number}) is tomorrow.</p>
       <p><b>${esc(when)}</b><br>${esc(batch.venue)}</p>
       <p>Remember to bring your phone: you'll check in by scanning a QR code while logged in to the portal.</p>`);
  },
  async zoomReminder(u, batch, z, when) {
    await send(u.email, `Reminder: Jumpstart Zoom session ${z.seq} tomorrow`,
      `<p>Hi ${esc(u.name)},</p>
       <p>Batch ${batch.number}'s Zoom session ${z.seq} is tomorrow: <b>${esc(when)}</b>.</p>
       <p>The Zoom link is in the portal. During the session you'll be given a 4-digit code to record your attendance.</p>
       ${button(baseUrl() + '/workshop', 'Open the portal')}`);
  },
};

module.exports = mail;
