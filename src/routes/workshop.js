const express = require('express');
const rateLimit = require('express-rate-limit');
const { one, all, q } = require('../db');
const { requireLogin } = require('../lib/auth');
const progress = require('../lib/progress');
const B = require('../lib/batches');

const router = express.Router();

router.get('/workshop', requireLogin, async (req, res) => {
  const course = await progress.courseFor(req.user);
  const myBatch = await B.batchOfUser(req.user.id);
  let sessions = [];
  if (myBatch) {
    const zs = await B.zoomSessions(myBatch.id);
    const att = await all('SELECT zoom_session_id FROM zoom_attendance WHERE user_id=$1', [req.user.id]);
    const attended = new Set(att.map((a) => a.zoom_session_id));
    sessions = zs.map((z) => ({
      ...z,
      attended: attended.has(z.id),
      open: B.zoomOpen(z),
      over: B.zoomOver(z),
    }));
  }
  const upcoming = await B.upcomingBatches();
  const regs = await all('SELECT batch_id FROM workshop_registrations WHERE user_id=$1', [req.user.id]);
  const regSet = new Set(regs.map((r) => r.batch_id));
  const missed = await all(
    `SELECT b.* FROM workshop_registrations r JOIN batches b ON b.id=r.batch_id
      WHERE r.user_id=$1 AND b.workshop_end < now()
        AND NOT EXISTS (SELECT 1 FROM workshop_attendance a WHERE a.user_id=r.user_id AND a.batch_id=r.batch_id)
      ORDER BY b.workshop_start DESC`, [req.user.id]);
  res.render('workshop', {
    title: 'Workshop & Zoom', course, myBatch, sessions,
    upcoming: upcoming.map((b) => ({ ...b, registered: regSet.has(b.id) })),
    missed,
  });
});

router.post('/workshop/register', requireLogin, async (req, res) => {
  const course = await progress.courseFor(req.user);
  if (!course.allModulesDone) { req.flash('warn', 'Finish all modules first, then register for a workshop.'); return res.redirect('/workshop'); }
  const b = await one('SELECT * FROM batches WHERE id=$1 AND workshop_end > now()', [req.body.batch_id]);
  if (!b) { req.flash('warn', 'That workshop is no longer open for registration.'); return res.redirect('/workshop'); }
  // One upcoming registration at a time: replace any other future registration
  await q(`DELETE FROM workshop_registrations r USING batches x
            WHERE r.batch_id=x.id AND r.user_id=$1 AND x.workshop_start > now() AND x.id <> $2`, [req.user.id, b.id]);
  await q('INSERT INTO workshop_registrations (user_id, batch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, b.id]);
  req.flash('ok', `You're registered for the Batch ${b.number} workshop.`);
  res.redirect('/workshop');
});

router.post('/workshop/unregister', requireLogin, async (req, res) => {
  await q(`DELETE FROM workshop_registrations r USING batches x
            WHERE r.batch_id=x.id AND r.user_id=$1 AND x.id=$2 AND x.workshop_start > now()`, [req.user.id, req.body.batch_id]);
  req.flash('ok', 'Your workshop registration was cancelled.');
  res.redirect('/workshop');
});

// QR code target
router.get('/checkin/:token', requireLogin, async (req, res) => {
  const b = await one('SELECT * FROM batches WHERE checkin_token=$1', [req.params.token]);
  if (!b) return res.status(404).render('message', { title: 'Invalid QR code', message: 'This QR code is not valid. Please ask the workshop team for help.' });
  if (!B.checkinOpen(b)) {
    return res.render('message', { title: 'Check-in is closed', message: `Check-in for the Batch ${b.number} workshop only works during the workshop. Please ask the workshop team to mark you present.` });
  }
  const already = await one('SELECT * FROM workshop_attendance WHERE user_id=$1 AND batch_id=$2', [req.user.id, b.id]);
  if (!already) {
    await q(`INSERT INTO workshop_attendance (user_id, batch_id, method) VALUES ($1,$2,'qr') ON CONFLICT DO NOTHING`, [req.user.id, b.id]);
    await q('INSERT INTO workshop_registrations (user_id, batch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, b.id]);
  }
  const myBatch = await B.batchOfUser(req.user.id);
  res.render('checked-in', { title: 'Checked in', batch: b, myBatch, already: !!already });
});

const codeLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

router.post('/workshop/zoom/:id', requireLogin, codeLimiter, async (req, res) => {
  const z = await one('SELECT z.*, b.number FROM zoom_sessions z JOIN batches b ON b.id=z.batch_id WHERE z.id=$1', [req.params.id]);
  const myBatch = await B.batchOfUser(req.user.id);
  if (!z || !myBatch || myBatch.id !== z.batch_id) { req.flash('warn', 'That Zoom session is not for your batch.'); return res.redirect('/workshop'); }
  if (!B.zoomOpen(z)) { req.flash('warn', 'Attendance codes only work during the session.'); return res.redirect('/workshop'); }
  const code = String(req.body.code || '').replace(/\D/g, '');
  if (code !== z.code) { req.flash('warn', "That code isn't right. Please check the code shown in the Zoom session."); return res.redirect('/workshop'); }
  await q(`INSERT INTO zoom_attendance (user_id, zoom_session_id, method) VALUES ($1,$2,'code') ON CONFLICT DO NOTHING`, [req.user.id, z.id]);
  req.flash('ok', `Attendance recorded for Zoom session ${z.seq}.`);
  res.redirect('/workshop');
});

module.exports = router;
