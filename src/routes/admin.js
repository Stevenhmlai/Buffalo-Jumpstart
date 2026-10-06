const express = require('express');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const { one, all, q, pool, getSetting, setSetting } = require('../db');
const { requireAdmin } = require('../lib/auth');
const progress = require('../lib/progress');
const B = require('../lib/batches');
const { groupOf, directDownlines } = require('../lib/group');
const mail = require('../lib/mail');
const U = require('../lib/util');

const router = express.Router();
router.use(requireAdmin);

const nav = (res, key) => { res.locals.adminNav = key; };

async function counts() {
  return one(`SELECT
    (SELECT count(*)::int FROM users WHERE status='pending') AS pending,
    (SELECT count(*)::int FROM videos WHERE quiz_status='draft') AS drafts`);
}
router.use(async (req, res, next) => { res.locals.adminCounts = await counts(); next(); });

// ================= Dashboard =================
router.get('/', async (req, res) => {
  nav(res, 'dashboard');
  const videos = await progress.getVideos();
  const trainees = await all(`SELECT * FROM users WHERE status='active' AND trainee`);
  const progs = await progress.loadUserProgress(trainees.map((t) => t.id));
  const modules = videos.filter((v) => v.kind === 'module');
  const dist = { notStarted: 0, perModule: modules.map(() => 0) };
  let inTraining = 0, idle = 0, completed = 0;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 8 * 3600 * 1000);
  let completedThisMonth = 0;
  const durations = [];
  for (const t of trainees) {
    const c = progress.buildCourse(videos, progs[t.id]);
    if (c.certificateReady) {
      completed++;
      const doneAt = t.course_completed_at;
      if (doneAt && new Date(doneAt) >= monthStart) completedThisMonth++;
      if (doneAt && t.approved_at) durations.push((new Date(doneAt) - new Date(t.approved_at)) / 86400000);
      continue;
    }
    inTraining++;
    if (U.daysSince(t.last_activity_at || t.approved_at || t.created_at) >= 7) idle++;
    if (!c.modules.some((m) => m.watched) && c.modulesDone === 0) dist.notStarted++;
    else if (c.allModulesDone) dist.perModule[modules.length - 1]++;
    else {
      const idx = c.modules.findIndex((m) => m.state === 'current' || m.state === 'quiz');
      if (idx >= 0) dist.perModule[idx]++;
    }
  }
  const avgDays = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
  const hardest = await all(
    `WITH firstpass AS (
       SELECT user_id, video_id, min(created_at) AS at FROM quiz_attempts WHERE passed GROUP BY 1,2)
     SELECT v.id, v.position, v.title, round(avg(n.cnt)::numeric, 1) AS avg_attempts, count(*)::int AS passers
       FROM firstpass f
       JOIN LATERAL (SELECT count(*) AS cnt FROM quiz_attempts a WHERE a.user_id=f.user_id AND a.video_id=f.video_id AND a.created_at <= f.at) n ON TRUE
       JOIN videos v ON v.id=f.video_id
      GROUP BY v.id ORDER BY avg_attempts DESC LIMIT 4`);
  const nextBatch = await one(`SELECT b.*, (SELECT count(*)::int FROM workshop_registrations r WHERE r.batch_id=b.id) AS regs
                                 FROM batches b WHERE workshop_end > now() ORDER BY workshop_start LIMIT 1`);
  const maxBar = Math.max(1, dist.notStarted, ...dist.perModule);
  res.render('admin/dashboard', {
    title: 'Dashboard', inTraining, idle, completed, completedThisMonth, avgDays, dist, modules, hardest, nextBatch, maxBar,
  });
});

// ================= Approvals =================
router.get('/approvals', async (req, res) => {
  nav(res, 'approvals');
  const pending = await all(
    `SELECT u.*, up.name AS upline_name, up.agent_code AS upline_found_code
       FROM users u LEFT JOIN users up ON upper(up.agent_code)=upper(u.upline_code) AND up.status='active'
      WHERE u.status='pending' ORDER BY u.created_at`);
  const recent = await all(
    `SELECT u.*, a.name AS approver FROM users u LEFT JOIN users a ON a.id=u.approved_by
      WHERE u.self_registered AND u.status IN ('active','rejected') ORDER BY coalesce(u.approved_at,u.created_at) DESC LIMIT 10`);
  res.render('admin/approvals', { title: 'Approvals', pending, recent });
});

router.post('/approvals/:id/approve', async (req, res) => {
  const u = await one(`SELECT * FROM users WHERE id=$1 AND status='pending'`, [req.params.id]);
  if (!u) return res.redirect('/admin/approvals');
  const newUpline = U.normCode(req.body.upline);
  if (newUpline && newUpline !== U.normCode(u.upline_code)) {
    await q('INSERT INTO upline_changes (user_id, old_upline, new_upline, changed_by, note) VALUES ($1,$2,$3,$4,$5)',
      [u.id, u.upline_code, newUpline, req.user.id, 'Corrected at approval']);
    u.upline_code = newUpline;
  }
  await q(`UPDATE users SET status='active', upline_code=$2, approved_at=now(), approved_by=$3 WHERE id=$1`, [u.id, u.upline_code, req.user.id]);
  await mail.approved(u);
  const upline = await one(`SELECT * FROM users WHERE upper(agent_code)=upper($1) AND status='active'`, [u.upline_code]);
  if (upline) await mail.uplineNotified(upline, u);
  req.flash('ok', `${u.name} approved.${upline ? ' Their upline has been emailed.' : ''}`);
  res.redirect('/admin/approvals');
});

router.post('/approvals/:id/reject', async (req, res) => {
  const u = await one(`SELECT * FROM users WHERE id=$1 AND status='pending'`, [req.params.id]);
  if (!u) return res.redirect('/admin/approvals');
  const reason = String(req.body.reason || '').trim();
  await q(`UPDATE users SET status='rejected', rejected_reason=$2, approved_by=$3, approved_at=now() WHERE id=$1`, [u.id, reason || null, req.user.id]);
  await mail.rejected(u, reason);
  req.flash('ok', `${u.name}'s registration was rejected and they have been emailed.`);
  res.redirect('/admin/approvals');
});

// ================= Agents =================
async function agentRows(where = 'TRUE', params = []) {
  const users = await all(
    `SELECT u.*, up.name AS upline_name FROM users u
       LEFT JOIN users up ON upper(up.agent_code)=upper(u.upline_code)
      WHERE ${where} ORDER BY u.created_at DESC`, params);
  const videos = await progress.getVideos();
  const progs = await progress.loadUserProgress(users.map((x) => x.id));
  const batchNums = await B.batchNumbersFor(users.map((x) => x.id));
  return users.map((x) => {
    const c = progress.buildCourse(videos, progs[x.id]);
    const idleDays = U.daysSince(x.last_activity_at || x.approved_at || x.created_at);
    let statusLabel;
    if (x.status !== 'active') statusLabel = x.status === 'pending' ? 'Pending' : x.status === 'rejected' ? 'Rejected' : 'Inactive';
    else if (!x.trainee) statusLabel = 'Not enrolled';
    else if (c.certificateReady) statusLabel = 'Completed';
    else if (c.modulesDone === 0 && !c.modules.some((m) => m.watched)) statusLabel = idleDays >= 7 ? `Not started · ${idleDays}d` : 'Not started';
    else statusLabel = idleDays >= 7 ? `Idle ${idleDays} days` : 'In progress';
    return { ...x, course: c, idleDays, statusLabel, batch: batchNums[x.id] || null };
  });
}

router.get('/agents', async (req, res) => {
  nav(res, 'agents');
  const search = String(req.query.q || '').trim();
  const status = String(req.query.s || 'all');
  let rows = await agentRows(`u.status <> 'rejected'`);
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((r) => [r.name, r.agent_code, r.upline_code, r.upline_name, r.email].some((v) => String(v || '').toLowerCase().includes(s)));
  }
  if (status === 'training') rows = rows.filter((r) => r.status === 'active' && r.trainee && !r.course.certificateReady);
  else if (status === 'idle') rows = rows.filter((r) => r.status === 'active' && r.trainee && !r.course.certificateReady && r.idleDays >= 7);
  else if (status === 'completed') rows = rows.filter((r) => r.trainee && r.course.certificateReady);
  else if (status === 'inactive') rows = rows.filter((r) => r.status === 'inactive');
  else if (status === 'admins') rows = rows.filter((r) => r.is_admin);
  res.render('admin/agents', { title: 'Agents', rows, search, status });
});

router.get('/agents/new', (req, res) => {
  nav(res, 'agents');
  res.render('admin/agent-new', { title: 'Add agent', errors: [], form: { trainee: false } });
});

router.post('/agents', async (req, res) => {
  nav(res, 'agents');
  const form = {
    name: String(req.body.name || '').trim(), code: U.normCode(req.body.code),
    email: String(req.body.email || '').trim().toLowerCase(), mobile: String(req.body.mobile || '').trim(),
    upline: U.normCode(req.body.upline), trainee: !!req.body.trainee, is_admin: !!req.body.is_admin,
  };
  const errors = [];
  if (form.name.length < 2) errors.push('Enter the full name.');
  if (!/^[A-Z0-9-]{3,20}$/.test(form.code)) errors.push('Enter a valid agent code.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.push('Enter a valid email (needed to set their password).');
  if (await one('SELECT 1 FROM users WHERE upper(agent_code)=$1', [form.code])) errors.push('That agent code already exists.');
  if (errors.length) return res.status(400).render('admin/agent-new', { title: 'Add agent', errors, form });
  const randomPw = await bcrypt.hash(U.randomToken(), 10);
  const u = await one(
    `INSERT INTO users (agent_code, name, email, mobile, upline_code, password_hash, status, is_admin, trainee, approved_at, approved_by)
     VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,now(),$9) RETURNING *`,
    [form.code, form.name, form.email, form.mobile, form.upline || null, randomPw, form.is_admin, form.trainee, req.user.id]);
  const token = U.randomToken();
  await q(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1,$2, now() + interval '7 days')`, [U.sha256(token), u.id]);
  await mail.welcomeSetPassword(u, token);
  req.flash('ok', `${u.name} added. They have been emailed a link to set their password.`);
  res.redirect('/admin/agents/' + u.id);
});

router.get('/agents/:id', async (req, res) => {
  nav(res, 'agents');
  const rows = await agentRows('u.id=$1', [req.params.id]);
  const a = rows[0];
  if (!a) return res.redirect('/admin/agents');
  const group = await groupOf(a.agent_code);
  const direct = await directDownlines(a.agent_code);
  const attempts = await all(
    `SELECT v.position, count(*)::int AS n, bool_or(passed) AS passed FROM quiz_attempts qa JOIN videos v ON v.id=qa.video_id
      WHERE qa.user_id=$1 GROUP BY v.position ORDER BY v.position`, [a.id]);
  const workshops = await all(
    `SELECT b.number, b.workshop_start, a.method, a.at FROM workshop_attendance a JOIN batches b ON b.id=a.batch_id WHERE a.user_id=$1 ORDER BY b.workshop_start`, [a.id]);
  const zooms = await all(
    `SELECT b.number, z.seq, za.at FROM zoom_attendance za JOIN zoom_sessions z ON z.id=za.zoom_session_id JOIN batches b ON b.id=z.batch_id
      WHERE za.user_id=$1 ORDER BY b.number, z.seq`, [a.id]);
  const changes = await all(
    `SELECT c.*, x.name AS by_name FROM upline_changes c LEFT JOIN users x ON x.id=c.changed_by WHERE c.user_id=$1 ORDER BY c.changed_at DESC`, [a.id]);
  const uplineUser = a.upline_code ? await one('SELECT * FROM users WHERE upper(agent_code)=upper($1)', [a.upline_code]) : null;
  res.render('admin/agent', { title: a.name, a, groupSize: group.length, direct, attempts, workshops, zooms, changes, uplineUser });
});

router.post('/agents/:id', async (req, res) => {
  const a = await one('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (!a) return res.redirect('/admin/agents');
  const name = String(req.body.name || '').trim() || a.name;
  const email = String(req.body.email || '').trim().toLowerCase();
  const mobile = String(req.body.mobile || '').trim();
  let isAdmin = !!req.body.is_admin;
  if (a.id === req.user.id && !isAdmin) { isAdmin = true; req.flash('warn', "You can't remove your own admin access."); }
  await q('UPDATE users SET name=$2, email=$3, mobile=$4, trainee=$5, is_admin=$6 WHERE id=$1',
    [a.id, name, email, mobile, !!req.body.trainee, isAdmin]);
  if (!req.session.flash) req.flash('ok', 'Details saved.');
  res.redirect('/admin/agents/' + a.id);
});

router.post('/agents/:id/upline', async (req, res) => {
  const a = await one('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (!a) return res.redirect('/admin/agents');
  const nu = U.normCode(req.body.upline) || null;
  if (nu && nu === U.normCode(a.agent_code)) { req.flash('warn', 'An agent cannot be their own upline.'); return res.redirect('/admin/agents/' + a.id); }
  if (nu) {
    const below = await groupOf(a.agent_code);
    if (below.some((m) => U.normCode(m.agent_code) === nu)) {
      req.flash('warn', `${nu} is in ${a.name}'s own group, so it can't be their upline.`);
      return res.redirect('/admin/agents/' + a.id);
    }
  }
  if (U.normCode(a.upline_code) !== (nu || '')) {
    await q('UPDATE users SET upline_code=$2 WHERE id=$1', [a.id, nu]);
    await q('INSERT INTO upline_changes (user_id, old_upline, new_upline, changed_by, note) VALUES ($1,$2,$3,$4,$5)',
      [a.id, a.upline_code, nu, req.user.id, String(req.body.note || '').trim() || null]);
    req.flash('ok', `Upline changed to ${nu || 'none'}. ${a.name}'s whole group moved with them.`);
  }
  res.redirect('/admin/agents/' + a.id);
});

router.post('/agents/:id/deactivate', async (req, res) => {
  const a = await one('SELECT * FROM users WHERE id=$1', [req.params.id]);
  if (!a || a.id === req.user.id) return res.redirect('/admin/agents');
  const moveTo = U.normCode(req.body.move_to) || U.normCode(a.upline_code) || null;
  const direct = await all(`SELECT * FROM users WHERE upper(upline_code)=upper($1) AND status IN ('active','pending')`, [a.agent_code]);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const d of direct) {
      await client.query('UPDATE users SET upline_code=$2 WHERE id=$1', [d.id, moveTo]);
      await client.query('INSERT INTO upline_changes (user_id, old_upline, new_upline, changed_by, note) VALUES ($1,$2,$3,$4,$5)',
        [d.id, d.upline_code, moveTo, req.user.id, `Upline ${a.agent_code} deactivated`]);
    }
    await client.query(`UPDATE users SET status='inactive', deactivated_at=now() WHERE id=$1`, [a.id]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  req.flash('ok', `${a.name} deactivated.${direct.length ? ` ${direct.length} direct downline(s) moved to ${moveTo || 'no upline'}.` : ''} Training records are kept.`);
  res.redirect('/admin/agents/' + a.id);
});

router.post('/agents/:id/reactivate', async (req, res) => {
  await q(`UPDATE users SET status='active', deactivated_at=NULL WHERE id=$1 AND status='inactive'`, [req.params.id]);
  req.flash('ok', 'Account reactivated.');
  res.redirect('/admin/agents/' + req.params.id);
});

router.post('/agents/:id/send-reset', async (req, res) => {
  const a = await one(`SELECT * FROM users WHERE id=$1 AND status='active'`, [req.params.id]);
  if (a) {
    const token = U.randomToken();
    await q(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1,$2, now() + interval '7 days')`, [U.sha256(token), a.id]);
    await mail.welcomeSetPassword(a, token);
    req.flash('ok', `Password link emailed to ${a.email}.`);
  }
  res.redirect('/admin/agents/' + req.params.id);
});

router.get('/changes', async (req, res) => {
  nav(res, 'agents');
  const rows = await all(
    `SELECT c.*, u.name, u.agent_code, x.name AS by_name FROM upline_changes c JOIN users u ON u.id=c.user_id
       LEFT JOIN users x ON x.id=c.changed_by ORDER BY c.changed_at DESC LIMIT 300`);
  res.render('admin/changes', { title: 'Upline change log', rows });
});

// ================= Videos & quizzes =================
router.get('/videos', async (req, res) => {
  nav(res, 'videos');
  const videos = await all(
    `SELECT v.*, (SELECT count(*)::int FROM questions qq WHERE qq.video_id=v.id) AS qcount FROM videos v ORDER BY position`);
  res.render('admin/videos', { title: 'Videos & quizzes', videos });
});

router.post('/videos/:id', async (req, res) => {
  const v = await one('SELECT * FROM videos WHERE id=$1', [req.params.id]);
  if (!v) return res.redirect('/admin/videos');
  const title = String(req.body.title || '').trim() || v.title;
  const yt = parseYouTube(req.body.youtube);
  if (req.body.youtube && !yt) { req.flash('warn', "That doesn't look like a YouTube link."); return res.redirect('/admin/videos'); }
  await q('UPDATE videos SET title=$2, youtube_id=$3 WHERE id=$1', [v.id, title, yt]);
  req.flash('ok', 'Video saved.');
  res.redirect('/admin/videos');
});

function parseYouTube(s) {
  s = String(s || '').trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

router.get('/videos/:id/quiz', async (req, res) => {
  nav(res, 'videos');
  const v = await one(`SELECT v.*, a.name AS approver FROM videos v LEFT JOIN users a ON a.id=v.quiz_approved_by WHERE v.id=$1 AND v.kind='module'`, [req.params.id]);
  if (!v) return res.redirect('/admin/videos');
  const questions = await all('SELECT * FROM questions WHERE video_id=$1 ORDER BY position, id', [v.id]);
  const moduleNo = (await one(`SELECT count(*)::int AS n FROM videos WHERE kind='module' AND position <= $1`, [v.position])).n;
  res.render('admin/quiz', { title: `Module ${moduleNo} quiz`, v, questions, moduleNo, edit: req.query.edit ? Number(req.query.edit) : null });
});

function readQuestion(body) {
  const qtype = body.qtype === 'tf' ? 'tf' : 'mc';
  const text = String(body.text || '').trim();
  let options, correct;
  if (qtype === 'tf') {
    options = ['True', 'False'];
    correct = body.correct === '1' ? 1 : 0;
  } else {
    const raw = [body.o0, body.o1, body.o2, body.o3, body.o4].map((x) => String(x || '').trim());
    const idx = [];
    raw.forEach((o, i) => { if (o) idx.push(i); });
    options = idx.map((i) => raw[i]);
    correct = idx.indexOf(parseInt(body.correct, 10));
  }
  const error = !text ? 'Enter the question.' : options.length < 2 ? 'Enter at least 2 answer options.' : correct < 0 ? 'Choose which answer is correct.' : null;
  return { qtype, text, options, correct, error };
}

router.post('/videos/:id/questions', async (req, res) => {
  const v = await one(`SELECT * FROM videos WHERE id=$1 AND kind='module'`, [req.params.id]);
  if (!v) return res.redirect('/admin/videos');
  const qq = readQuestion(req.body);
  if (qq.error) { req.flash('warn', qq.error); return res.redirect(`/admin/videos/${v.id}/quiz#add`); }
  const pos = (await one('SELECT coalesce(max(position),0)+1 AS p FROM questions WHERE video_id=$1', [v.id])).p;
  await q('INSERT INTO questions (video_id, position, qtype, text, options, correct) VALUES ($1,$2,$3,$4,$5,$6)',
    [v.id, pos, qq.qtype, qq.text, JSON.stringify(qq.options), qq.correct]);
  if (v.quiz_status === 'none') await q(`UPDATE videos SET quiz_status='draft' WHERE id=$1`, [v.id]);
  req.flash('ok', 'Question added.' + (v.quiz_status === 'approved' ? ' The quiz is live, so this question is live too.' : ''));
  res.redirect(`/admin/videos/${v.id}/quiz#add`);
});

router.post('/questions/:id', async (req, res) => {
  const old = await one('SELECT * FROM questions WHERE id=$1', [req.params.id]);
  if (!old) return res.redirect('/admin/videos');
  const qq = readQuestion(req.body);
  if (qq.error) { req.flash('warn', qq.error); return res.redirect(`/admin/videos/${old.video_id}/quiz?edit=${old.id}#q${old.id}`); }
  await q('UPDATE questions SET qtype=$2, text=$3, options=$4, correct=$5 WHERE id=$1',
    [old.id, qq.qtype, qq.text, JSON.stringify(qq.options), qq.correct]);
  req.flash('ok', 'Question saved.');
  res.redirect(`/admin/videos/${old.video_id}/quiz#q${old.id}`);
});

router.post('/questions/:id/delete', async (req, res) => {
  const old = await one('SELECT * FROM questions WHERE id=$1', [req.params.id]);
  if (!old) return res.redirect('/admin/videos');
  await q('DELETE FROM questions WHERE id=$1', [old.id]);
  const left = (await one('SELECT count(*)::int AS n FROM questions WHERE video_id=$1', [old.video_id])).n;
  if (left === 0) await q(`UPDATE videos SET quiz_status='none', quiz_approved_by=NULL, quiz_approved_at=NULL WHERE id=$1`, [old.video_id]);
  req.flash('ok', 'Question deleted.');
  res.redirect(`/admin/videos/${old.video_id}/quiz`);
});

router.post('/videos/:id/quiz/approve', async (req, res) => {
  const n = (await one('SELECT count(*)::int AS n FROM questions WHERE video_id=$1', [req.params.id])).n;
  if (n < 1) { req.flash('warn', 'Add questions before publishing.'); return res.redirect(`/admin/videos/${req.params.id}/quiz`); }
  await q(`UPDATE videos SET quiz_status='approved', quiz_approved_by=$2, quiz_approved_at=now() WHERE id=$1 AND kind='module'`, [req.params.id, req.user.id]);
  req.flash('ok', 'Quiz approved and published. Members must now pass it to unlock the next module.');
  res.redirect(`/admin/videos/${req.params.id}/quiz`);
});

router.post('/videos/:id/quiz/unpublish', async (req, res) => {
  await q(`UPDATE videos SET quiz_status='draft', quiz_approved_by=NULL, quiz_approved_at=NULL WHERE id=$1`, [req.params.id]);
  req.flash('ok', 'Quiz moved back to draft. Members are not asked to take it until it is published again.');
  res.redirect(`/admin/videos/${req.params.id}/quiz`);
});

// ================= Batches =================
router.get('/batches', async (req, res) => {
  nav(res, 'batches');
  const batches = await all(
    `SELECT b.*,
       (SELECT count(*)::int FROM workshop_registrations r WHERE r.batch_id=b.id) AS regs,
       (SELECT count(*)::int FROM workshop_attendance a WHERE a.batch_id=b.id) AS attended
     FROM batches b ORDER BY b.workshop_start DESC`);
  const suggested = ((await one('SELECT max(number) AS m FROM batches')).m || 0) + 1;
  res.render('admin/batches', { title: 'Batches', batches, suggested });
});

router.post('/batches', async (req, res) => {
  const number = parseInt(req.body.number, 10);
  const start = U.fromLocalInput(req.body.start);
  const end = U.fromLocalInput(req.body.end);
  const venue = String(req.body.venue || '').trim();
  const err = !number ? 'Enter the batch number.' : !start || !end ? 'Enter the workshop start and end.' : end <= start ? 'The end must be after the start.' : !venue ? 'Enter the venue.' : null;
  if (err) { req.flash('warn', err); return res.redirect('/admin/batches'); }
  if (await one('SELECT 1 FROM batches WHERE number=$1', [number])) { req.flash('warn', `Batch ${number} already exists.`); return res.redirect('/admin/batches'); }
  const b = await one('INSERT INTO batches (number, workshop_start, workshop_end, venue, checkin_token) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [number, start, end, venue, U.randomToken(18)]);
  for (let s = 1; s <= 4; s++) {
    await q('INSERT INTO zoom_sessions (batch_id, seq, code) VALUES ($1,$2,$3)', [b.id, s, U.randomCode4()]);
  }
  req.flash('ok', `Batch ${number} created. Add the 4 Zoom session dates and links below.`);
  res.redirect('/admin/batches/' + b.id);
});

async function batchDetail(id) {
  const b = await one('SELECT * FROM batches WHERE id=$1', [id]);
  if (!b) return null;
  const zs = await B.zoomSessions(b.id);
  const attendees = await all(
    `SELECT u.*, a.method, a.at FROM workshop_attendance a JOIN users u ON u.id=a.user_id WHERE a.batch_id=$1 ORDER BY u.name`, [b.id]);
  // Members whose batch is THIS batch (first workshop attended)
  const firstBatch = await B.batchNumbersFor(attendees.map((x) => x.id));
  const members = attendees.filter((x) => firstBatch[x.id] === b.number);
  const registeredAbsent = await all(
    `SELECT u.* FROM workshop_registrations r JOIN users u ON u.id=r.user_id
      WHERE r.batch_id=$1 AND NOT EXISTS (SELECT 1 FROM workshop_attendance a WHERE a.batch_id=r.batch_id AND a.user_id=r.user_id)
      ORDER BY u.name`, [b.id]);
  const za = await all(`SELECT * FROM zoom_attendance WHERE zoom_session_id = ANY($1)`, [zs.map((z) => z.id)]);
  const zoomAtt = {};
  for (const z of zs) zoomAtt[z.id] = new Set();
  for (const r of za) zoomAtt[r.zoom_session_id].add(r.user_id);
  return { b, zs, attendees, members, registeredAbsent, zoomAtt };
}

router.get('/batches/:id', async (req, res) => {
  nav(res, 'batches');
  const d = await batchDetail(req.params.id);
  if (!d) return res.redirect('/admin/batches');
  const workshopOver = new Date(d.b.workshop_end) < new Date();
  res.render('admin/batch', {
    title: `Batch ${d.b.number}`, ...d, workshopOver, checkinOpen: B.checkinOpen(d.b),
    zoomInfo: Object.fromEntries(d.zs.map((z) => [z.id, { open: B.zoomOpen(z), over: B.zoomOver(z), win: B.zoomWindow(z) }])),
  });
});

router.post('/batches/:id', async (req, res) => {
  const b = await one('SELECT * FROM batches WHERE id=$1', [req.params.id]);
  if (!b) return res.redirect('/admin/batches');
  const number = parseInt(req.body.number, 10) || b.number;
  const start = U.fromLocalInput(req.body.start) || b.workshop_start;
  const end = U.fromLocalInput(req.body.end) || b.workshop_end;
  const venue = String(req.body.venue || '').trim() || b.venue;
  if (number !== b.number && (await one('SELECT 1 FROM batches WHERE number=$1', [number]))) {
    req.flash('warn', `Batch ${number} already exists.`); return res.redirect('/admin/batches/' + b.id);
  }
  if (new Date(end) <= new Date(start)) { req.flash('warn', 'The end must be after the start.'); return res.redirect('/admin/batches/' + b.id); }
  await q('UPDATE batches SET number=$2, workshop_start=$3, workshop_end=$4, venue=$5 WHERE id=$1', [b.id, number, start, end, venue]);
  req.flash('ok', 'Workshop details saved.');
  res.redirect('/admin/batches/' + b.id);
});

router.post('/batches/:id/delete', async (req, res) => {
  const att = (await one('SELECT count(*)::int AS n FROM workshop_attendance WHERE batch_id=$1', [req.params.id])).n;
  if (att > 0) { req.flash('warn', 'This batch has attendance recorded, so it cannot be deleted.'); return res.redirect('/admin/batches/' + req.params.id); }
  await q('DELETE FROM batches WHERE id=$1', [req.params.id]);
  req.flash('ok', 'Batch deleted.');
  res.redirect('/admin/batches');
});

router.post('/zoom/:id', async (req, res) => {
  const z = await one('SELECT * FROM zoom_sessions WHERE id=$1', [req.params.id]);
  if (!z) return res.redirect('/admin/batches');
  const startsAt = U.fromLocalInput(req.body.starts_at);
  const duration = Math.max(15, Math.min(480, parseInt(req.body.duration_min, 10) || 90));
  const link = String(req.body.link || '').trim();
  if (link && !/^https:\/\//i.test(link)) { req.flash('warn', 'The Zoom link should start with https://'); return res.redirect('/admin/batches/' + z.batch_id); }
  await q('UPDATE zoom_sessions SET starts_at=$2, duration_min=$3, link=$4 WHERE id=$1', [z.id, startsAt, duration, link || null]);
  req.flash('ok', `Zoom session ${z.seq} saved.`);
  res.redirect('/admin/batches/' + z.batch_id + '#zoom' + z.seq);
});

router.post('/zoom/:id/new-code', async (req, res) => {
  const z = await one('SELECT * FROM zoom_sessions WHERE id=$1', [req.params.id]);
  if (!z) return res.redirect('/admin/batches');
  await q('UPDATE zoom_sessions SET code=$2 WHERE id=$1', [z.id, U.randomCode4()]);
  req.flash('ok', `New code for Zoom session ${z.seq}.`);
  res.redirect('/admin/batches/' + z.batch_id + '#zoom' + z.seq);
});

router.get('/batches/:id/qr', async (req, res) => {
  const b = await one('SELECT * FROM batches WHERE id=$1', [req.params.id]);
  if (!b) return res.redirect('/admin/batches');
  const url = `${mail.baseUrl()}/checkin/${b.checkin_token}`;
  const qr = await QRCode.toDataURL(url, { width: 720, margin: 1, color: { dark: '#1c1c1c', light: '#ffffff' } });
  const count = (await one('SELECT count(*)::int AS n FROM workshop_attendance WHERE batch_id=$1', [b.id])).n;
  res.render('admin/qr', { title: `Batch ${b.number} check-in`, b, qr, url, count, open: B.checkinOpen(b), layout: false });
});

router.get('/batches/:id/count', async (req, res) => {
  const count = (await one('SELECT count(*)::int AS n FROM workshop_attendance WHERE batch_id=$1', [req.params.id])).n;
  res.json({ count });
});

async function userByCode(code) {
  return one(`SELECT * FROM users WHERE upper(agent_code)=$1 AND status='active'`, [U.normCode(code)]);
}

router.post('/batches/:id/mark', async (req, res) => {
  const b = await one('SELECT * FROM batches WHERE id=$1', [req.params.id]);
  const u = b && (await userByCode(req.body.code));
  if (!u) { req.flash('warn', 'No active member with that agent code.'); return res.redirect('/admin/batches/' + req.params.id + '#workshop'); }
  await q(`INSERT INTO workshop_attendance (user_id, batch_id, method, recorded_by) VALUES ($1,$2,'manual',$3) ON CONFLICT DO NOTHING`, [u.id, b.id, req.user.id]);
  await q('INSERT INTO workshop_registrations (user_id, batch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [u.id, b.id]);
  req.flash('ok', `${u.name} marked present at the workshop.`);
  res.redirect('/admin/batches/' + b.id + '#workshop');
});

router.post('/batches/:id/unmark/:uid', async (req, res) => {
  await q('DELETE FROM workshop_attendance WHERE batch_id=$1 AND user_id=$2', [req.params.id, req.params.uid]);
  req.flash('ok', 'Workshop attendance removed.');
  res.redirect('/admin/batches/' + req.params.id + '#workshop');
});

router.post('/zoom/:id/mark', async (req, res) => {
  const z = await one('SELECT * FROM zoom_sessions WHERE id=$1', [req.params.id]);
  const u = z && (await userByCode(req.body.code));
  if (!u) { req.flash('warn', 'No active member with that agent code.'); return res.redirect('/admin/batches/' + (z ? z.batch_id : '')); }
  await q(`INSERT INTO zoom_attendance (user_id, zoom_session_id, method, recorded_by) VALUES ($1,$2,'manual',$3) ON CONFLICT DO NOTHING`, [u.id, z.id, req.user.id]);
  req.flash('ok', `${u.name} marked present for Zoom session ${z.seq}.`);
  res.redirect('/admin/batches/' + z.batch_id + '#zoom' + z.seq);
});

router.post('/zoom/:id/unmark/:uid', async (req, res) => {
  const z = await one('SELECT * FROM zoom_sessions WHERE id=$1', [req.params.id]);
  await q('DELETE FROM zoom_attendance WHERE zoom_session_id=$1 AND user_id=$2', [req.params.id, req.params.uid]);
  req.flash('ok', 'Zoom attendance removed.');
  res.redirect('/admin/batches/' + (z ? z.batch_id : '') + (z ? '#zoom' + z.seq : ''));
});

// ================= Excel exports =================
function styleSheet(ws) {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA3121B' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
}
async function sendWorkbook(res, wb, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}
const d = (x) => (x ? new Date(new Date(x).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10) : '');

router.get('/batches/:id/export.xlsx', async (req, res) => {
  const det = await batchDetail(req.params.id);
  if (!det) return res.redirect('/admin/batches');
  const people = det.attendees;
  const videos = await progress.getVideos();
  const progs = await progress.loadUserProgress(people.map((p) => p.id));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Batch ${det.b.number}`);
  ws.columns = [
    { header: 'Name', key: 'name', width: 28 }, { header: 'Agent code', key: 'code', width: 14 },
    { header: 'Upline code', key: 'upline', width: 14 }, { header: 'Upline name', key: 'upline_name', width: 24 },
    { header: 'Email', key: 'email', width: 28 }, { header: 'Mobile', key: 'mobile', width: 16 },
    { header: 'Videos completed', key: 'completed', width: 16 },
    { header: 'Workshop', key: 'workshop', width: 12 }, { header: 'Check-in', key: 'method', width: 10 },
    ...det.zs.map((z) => ({ header: `Zoom ${z.seq}`, key: 'z' + z.seq, width: 10 })),
    { header: 'Zoom total', key: 'ztotal', width: 10 },
  ];
  const uplines = await all(`SELECT agent_code, name FROM users`);
  const upName = Object.fromEntries(uplines.map((x) => [x.agent_code.toUpperCase(), x.name]));
  for (const p of people) {
    const c = progress.buildCourse(videos, progs[p.id]);
    const row = {
      name: p.name, code: p.agent_code, upline: p.upline_code || '', upline_name: upName[String(p.upline_code || '').toUpperCase()] || '',
      email: p.email, mobile: p.mobile || '', completed: c.certificateReady ? d(p.course_completed_at) : `In progress (${c.modulesDone}/${c.modulesTotal})`,
      workshop: 'Present', method: p.method === 'qr' ? 'QR' : 'Manual', ztotal: 0,
    };
    for (const z of det.zs) {
      const present = det.zoomAtt[z.id].has(p.id);
      row['z' + z.seq] = present ? 'Present' : B.zoomOver(z) ? 'Absent' : '';
      if (present) row.ztotal++;
    }
    ws.addRow(row);
  }
  styleSheet(ws);
  const ws2 = wb.addWorksheet('Registered, absent');
  ws2.columns = [
    { header: 'Name', key: 'name', width: 28 }, { header: 'Agent code', key: 'code', width: 14 },
    { header: 'Upline code', key: 'upline', width: 14 }, { header: 'Email', key: 'email', width: 28 }, { header: 'Mobile', key: 'mobile', width: 16 },
  ];
  for (const p of det.registeredAbsent) ws2.addRow({ name: p.name, code: p.agent_code, upline: p.upline_code || '', email: p.email, mobile: p.mobile || '' });
  styleSheet(ws2);
  await sendWorkbook(res, wb, `Jumpstart-Batch-${det.b.number}.xlsx`);
});

router.get('/export/agents.xlsx', async (req, res) => {
  const rows = await agentRows(`u.status IN ('active','inactive')`);
  const videos = await progress.getVideos();
  const modules = videos.filter((v) => v.kind === 'module');
  const zc = await all('SELECT user_id, count(*)::int AS n FROM zoom_attendance GROUP BY 1');
  const zoomCount = Object.fromEntries(zc.map((x) => [x.user_id, x.n]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Agents');
  ws.columns = [
    { header: 'Name', key: 'name', width: 28 }, { header: 'Agent code', key: 'code', width: 14 },
    { header: 'Upline code', key: 'upline', width: 14 }, { header: 'Upline name', key: 'upline_name', width: 24 },
    { header: 'Email', key: 'email', width: 28 }, { header: 'Mobile', key: 'mobile', width: 16 },
    { header: 'Account', key: 'account', width: 10 }, { header: 'Enrolled', key: 'trainee', width: 10 },
    { header: 'Approved', key: 'approved', width: 12 }, { header: 'Status', key: 'status', width: 18 },
    { header: 'Modules done', key: 'done', width: 13 },
    ...modules.map((m, i) => ({ header: `M${i + 1}`, key: 'm' + i, width: 7 })),
    { header: 'Course completed', key: 'completed', width: 16 }, { header: 'Last activity', key: 'last', width: 13 },
    { header: 'Batch', key: 'batch', width: 8 }, { header: 'Zoom sessions', key: 'zoom', width: 13 },
  ];
  for (const r of rows) {
    const row = {
      name: r.name, code: r.agent_code, upline: r.upline_code || '', upline_name: r.upline_name || '', email: r.email, mobile: r.mobile || '',
      account: r.status === 'active' ? 'Active' : 'Inactive', trainee: r.trainee ? 'Yes' : 'No', approved: d(r.approved_at),
      status: r.statusLabel, done: `${r.course.modulesDone}/${r.course.modulesTotal}`,
      completed: r.course.certificateReady ? d(r.course_completed_at) : '', last: d(r.last_activity_at),
      batch: r.batch || '', zoom: zoomCount[r.id] || 0,
    };
    r.course.modules.forEach((m, i) => { row['m' + i] = m.state === 'done' ? '✓' : m.state === 'quiz' ? 'Quiz' : m.state === 'current' ? '…' : ''; });
    ws.addRow(row);
  }
  styleSheet(ws);
  await sendWorkbook(res, wb, `Jumpstart-Agents-${d(new Date())}.xlsx`);
});

// ================= Settings =================
router.get('/settings', async (req, res) => {
  nav(res, 'settings');
  res.render('admin/settings', { title: 'Settings', nextSteps: await getSetting('next_steps') });
});

router.post('/settings', async (req, res) => {
  await setSetting('next_steps', String(req.body.next_steps || '').trim());
  req.flash('ok', 'Next steps text saved.');
  res.redirect('/admin/settings');
});

module.exports = router;
