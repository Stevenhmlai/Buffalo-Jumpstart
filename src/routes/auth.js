const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { one, all, q } = require('../db');
const { requireLogin } = require('../lib/auth');
const { normCode, randomToken, sha256 } = require('../lib/util');
const mail = require('../lib/mail');

const router = express.Router();

const limiter = (max) => rateLimit({
  windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).render('message', { title: 'Too many attempts', message: 'Please wait 15 minutes and try again.' }),
});

router.get('/', (req, res) => res.redirect(req.user ? '/course' : '/login'));

// ---------- Login ----------
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/course');
  res.render('login', { title: 'Log in', error: null, code: '' });
});

router.post('/login', limiter(20), async (req, res) => {
  const code = normCode(req.body.code);
  const password = String(req.body.password || '');
  const u = await one('SELECT * FROM users WHERE upper(agent_code)=$1', [code]);
  const ok = u && (await bcrypt.compare(password, u.password_hash));
  if (!ok) return res.status(400).render('login', { title: 'Log in', error: 'Agent code or password is incorrect.', code });
  if (u.status === 'pending') return res.status(400).render('login', { title: 'Log in', error: 'Your registration is still waiting for admin approval. You will get an email once it is approved.', code });
  if (u.status === 'rejected') return res.status(400).render('login', { title: 'Log in', error: 'Your registration was not approved. Please contact your upline or the agency.', code });
  if (u.status !== 'active') return res.status(400).render('login', { title: 'Log in', error: 'This account is no longer active. Please contact the agency.', code });
  const returnTo = req.session.returnTo;
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = u.id;
    res.redirect(returnTo || (u.is_admin && !u.trainee ? '/admin' : '/course'));
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------- Registration ----------
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', errors: [], form: {} });
});

router.get('/api/upline', limiter(200), async (req, res) => {
  const code = normCode(req.query.code);
  if (!code) return res.json({ found: false });
  const u = await one(`SELECT name FROM users WHERE upper(agent_code)=$1 AND status='active'`, [code]);
  res.json(u ? { found: true, name: u.name } : { found: false });
});

router.post('/register', limiter(10), async (req, res) => {
  const form = {
    name: String(req.body.name || '').trim(),
    code: normCode(req.body.code),
    email: String(req.body.email || '').trim().toLowerCase(),
    mobile: String(req.body.mobile || '').trim(),
    upline: normCode(req.body.upline),
  };
  const password = String(req.body.password || '');
  const password2 = String(req.body.password2 || '');
  const errors = [];
  if (form.name.length < 2) errors.push('Please enter your full name.');
  if (!/^[A-Z0-9-]{3,20}$/.test(form.code)) errors.push('Please enter a valid agent code (letters and numbers only).');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.push('Please enter a valid email address.');
  if (form.mobile.replace(/\D/g, '').length < 9) errors.push('Please enter a valid mobile number.');
  if (!form.upline) errors.push("Please enter your upline's agent code.");
  if (form.upline && form.upline === form.code) errors.push('Your upline code cannot be your own code.');
  if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== password2) errors.push('The two passwords do not match.');
  const existing = form.code && (await one('SELECT status FROM users WHERE upper(agent_code)=$1', [form.code]));
  if (existing) {
    errors.push(existing.status === 'pending'
      ? 'This agent code has already registered and is waiting for approval.'
      : 'This agent code already has an account. Try logging in, or use "Forgot password".');
  }
  if (errors.length) return res.status(400).render('register', { title: 'Register', errors, form });

  const upline = await one(`SELECT id FROM users WHERE upper(agent_code)=$1 AND status='active'`, [form.upline]);
  const hash = await bcrypt.hash(password, 10);
  const u = await one(
    `INSERT INTO users (agent_code, name, email, mobile, upline_code, password_hash, status, trainee, self_registered)
     VALUES ($1,$2,$3,$4,$5,$6,'pending',TRUE,TRUE) RETURNING *`,
    [form.code, form.name, form.email, form.mobile, form.upline, hash]
  );
  const admins = await all(`SELECT email FROM users WHERE is_admin AND status='active' AND email <> ''`);
  mail.newRegistrationAlert(admins.map((a) => a.email), { ...u, upline_not_found: !upline }).catch(() => {});
  res.render('message', {
    title: 'Registration received',
    message: "Thank you! An admin will review your registration. You'll get an email at " + form.email + ' once your account is approved.',
    link: { href: '/login', label: 'Back to log in' },
  });
});

// ---------- Forgot / reset password ----------
router.get('/forgot', (req, res) => res.render('forgot', { title: 'Forgot password', sent: false }));

router.post('/forgot', limiter(10), async (req, res) => {
  const code = normCode(req.body.code);
  const u = await one(`SELECT * FROM users WHERE upper(agent_code)=$1 AND status='active'`, [code]);
  if (u && u.email) {
    const token = randomToken();
    await q(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1,$2, now() + interval '2 hours')`, [sha256(token), u.id]);
    await mail.passwordReset(u, token);
  }
  res.render('forgot', { title: 'Forgot password', sent: true });
});

async function validReset(token) {
  return one(
    `SELECT r.*, u.name, u.agent_code FROM password_resets r JOIN users u ON u.id=r.user_id
      WHERE r.token_hash=$1 AND r.used_at IS NULL AND r.expires_at > now() AND u.status='active'`, [sha256(token)]);
}

router.get('/reset/:token', async (req, res) => {
  const r = await validReset(req.params.token);
  if (!r) return res.render('message', { title: 'Link expired', message: 'This link has expired or was already used. Please request a new one.', link: { href: '/forgot', label: 'Request a new link' } });
  res.render('reset', { title: 'Set a new password', who: r, error: null });
});

router.post('/reset/:token', limiter(20), async (req, res) => {
  const r = await validReset(req.params.token);
  if (!r) return res.render('message', { title: 'Link expired', message: 'This link has expired or was already used. Please request a new one.', link: { href: '/forgot', label: 'Request a new link' } });
  const p1 = String(req.body.password || ''), p2 = String(req.body.password2 || '');
  if (p1.length < 8 || p1 !== p2) {
    return res.status(400).render('reset', { title: 'Set a new password', who: r, error: p1.length < 8 ? 'Password must be at least 8 characters.' : 'The two passwords do not match.' });
  }
  await q('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(p1, 10), r.user_id]);
  await q('UPDATE password_resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [r.user_id]);
  req.flash('ok', 'Your password has been set. Please log in.');
  res.redirect('/login');
});

// ---------- My account ----------
router.get('/account', requireLogin, (req, res) => res.render('account', { title: 'My account', error: null }));

router.post('/account/password', requireLogin, async (req, res) => {
  const cur = String(req.body.current || ''), p1 = String(req.body.password || ''), p2 = String(req.body.password2 || '');
  let error = null;
  if (!(await bcrypt.compare(cur, req.user.password_hash))) error = 'Your current password is incorrect.';
  else if (p1.length < 8) error = 'New password must be at least 8 characters.';
  else if (p1 !== p2) error = 'The two new passwords do not match.';
  if (error) return res.status(400).render('account', { title: 'My account', error });
  await q('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(p1, 10), req.user.id]);
  req.flash('ok', 'Password changed.');
  res.redirect('/account');
});

module.exports = router;
