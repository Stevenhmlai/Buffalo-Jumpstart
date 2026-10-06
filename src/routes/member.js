const express = require('express');
const { one, all, q, getSetting } = require('../db');
const { requireLogin } = require('../lib/auth');
const progress = require('../lib/progress');
const { shuffle, daysSince, waNumber } = require('../lib/util');
const { groupOf } = require('../lib/group');
const batches = require('../lib/batches');
const { certificatePdf } = require('../lib/certificate');

const router = express.Router();

// ---------- Course overview ----------
router.get('/course', requireLogin, async (req, res) => {
  const course = await progress.courseFor(req.user);
  res.render('course', { title: 'My course', course });
});

// ---------- Watch a video ----------
router.get('/video/:id', requireLogin, async (req, res) => {
  const video = await one('SELECT * FROM videos WHERE id=$1', [req.params.id]);
  if (!video) return res.status(404).render('message', { title: 'Not found', message: 'That video does not exist.' });
  const course = await progress.courseFor(req.user);
  if (!progress.canWatch(course, video)) {
    req.flash('warn', 'Finish the earlier modules first to unlock this one.');
    return res.redirect('/course');
  }
  const mod = course.modules.find((m) => m.id === video.id) || null;
  const watched = video.kind === 'welcome' ? course.welcomeWatched
    : video.kind === 'congrats' ? course.congratsWatched : !!(mod && mod.watched);
  res.render('video', { title: video.title, video, course, mod, watched });
});

// Called by the player when the video reaches the end
router.post('/api/videos/:id/complete', requireLogin, async (req, res) => {
  const video = await one('SELECT * FROM videos WHERE id=$1', [req.params.id]);
  if (!video) return res.status(404).json({ ok: false });
  const course = await progress.courseFor(req.user);
  if (!progress.canWatch(course, video)) return res.status(403).json({ ok: false });
  await q('INSERT INTO video_completions (user_id, video_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, video.id]);
  await progress.touch(req.user.id);
  const after = await progress.courseFor(req.user);
  res.json({ ok: true, certificateReady: after.certificateReady });
});

// ---------- Quiz ----------
async function quizContext(req, res) {
  const video = await one(`SELECT * FROM videos WHERE id=$1 AND kind='module'`, [req.params.id]);
  if (!video) { res.status(404).render('message', { title: 'Not found', message: 'That quiz does not exist.' }); return null; }
  const course = await progress.courseFor(req.user);
  const mod = course.modules.find((m) => m.id === video.id);
  if (!mod || !mod.unlocked) { req.flash('warn', 'That module is still locked.'); res.redirect('/course'); return null; }
  if (!mod.watched) { req.flash('warn', 'Watch the video to the end to unlock its quiz.'); res.redirect('/video/' + video.id); return null; }
  if (!mod.quizLive) { res.redirect('/course'); return null; }
  return { video, course, mod };
}

router.get('/quiz/:id', requireLogin, async (req, res) => {
  const ctx = await quizContext(req, res);
  if (!ctx) return;
  const qs = await all('SELECT * FROM questions WHERE video_id=$1 ORDER BY position, id', [ctx.video.id]);
  const items = shuffle(qs).map((qq) => {
    const idx = qq.options.map((_, i) => i);
    const order = qq.qtype === 'tf' ? idx : shuffle(idx);
    return { qid: qq.id, order, text: qq.text, qtype: qq.qtype, options: order.map((i) => qq.options[i]) };
  });
  req.session.quiz = { videoId: ctx.video.id, items: items.map(({ qid, order }) => ({ qid, order })) };
  const attempts = (await one('SELECT count(*)::int AS n FROM quiz_attempts WHERE user_id=$1 AND video_id=$2', [req.user.id, ctx.video.id])).n;
  res.render('quiz', { title: `Module ${ctx.mod.number} quiz`, ...ctx, items, attempts, alreadyPassed: ctx.mod.state === 'done' });
});

router.post('/quiz/:id', requireLogin, async (req, res) => {
  const ctx = await quizContext(req, res);
  if (!ctx) return;
  const sq = req.session.quiz;
  if (!sq || sq.videoId !== ctx.video.id) return res.redirect('/quiz/' + ctx.video.id);
  const qs = await all('SELECT * FROM questions WHERE video_id=$1', [ctx.video.id]);
  const byId = new Map(qs.map((x) => [x.id, x]));
  let score = 0;
  const total = sq.items.length;
  sq.items.forEach((it, i) => {
    const qq = byId.get(it.qid);
    const picked = parseInt(req.body['a' + i], 10);
    if (qq && !isNaN(picked) && it.order[picked] === qq.correct) score++;
  });
  const passed = total > 0 && score === total;
  await q('INSERT INTO quiz_attempts (user_id, video_id, score, total, passed) VALUES ($1,$2,$3,$4,$5)',
    [req.user.id, ctx.video.id, score, total, passed]);
  await progress.touch(req.user.id);
  delete req.session.quiz;
  const attempts = (await one('SELECT count(*)::int AS n FROM quiz_attempts WHERE user_id=$1 AND video_id=$2', [req.user.id, ctx.video.id])).n;
  const after = await progress.courseFor(req.user);
  const nextMod = after.modules.find((m) => m.number === ctx.mod.number + 1) || null;
  res.render('quiz-result', { title: 'Quiz result', video: ctx.video, mod: ctx.mod, score, total, passed, attempts, course: after, nextMod });
});

// ---------- Completion, certificate ----------
router.get('/complete', requireLogin, async (req, res) => {
  const course = await progress.courseFor(req.user);
  if (!course.allModulesDone) return res.redirect('/course');
  const nextSteps = await getSetting('next_steps');
  const myBatch = await batches.batchOfUser(req.user.id);
  const reg = await one(
    `SELECT b.* FROM workshop_registrations r JOIN batches b ON b.id=r.batch_id
      WHERE r.user_id=$1 AND b.workshop_end > now() ORDER BY b.workshop_start LIMIT 1`, [req.user.id]);
  res.render('complete', { title: 'Congratulations', course, nextSteps, myBatch, reg });
});

router.get('/certificate.pdf', requireLogin, async (req, res) => {
  const course = await progress.courseFor(req.user);
  if (!course.certificateReady) return res.redirect('/course');
  res.setHeader('Content-Type', 'application/pdf');
  const safe = req.user.name.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '-');
  res.setHeader('Content-Disposition', `attachment; filename="Buffalo-Jumpstart-Certificate-${safe}.pdf"`);
  certificatePdf(res, { name: req.user.name, code: req.user.agent_code, date: req.user.course_completed_at || new Date() });
});

// ---------- Upline: my group ----------
router.get('/team', requireLogin, async (req, res) => {
  const members = await groupOf(req.user.agent_code);
  const videos = await progress.getVideos();
  const progs = await progress.loadUserProgress(members.map((m) => m.id));
  const batchNums = await batches.batchNumbersFor(members.map((m) => m.id));
  const zoomCounts = await zoomCountsFor(members.map((m) => m.id));
  const filter = ['all', 'nudge', 'completed', 'training'].includes(req.query.f) ? req.query.f : 'all';

  const rows = members.map((m) => {
    const c = progress.buildCourse(videos, progs[m.id]);
    const idleDays = daysSince(m.last_activity_at || m.approved_at || m.created_at);
    const inTraining = m.trainee && !c.certificateReady;
    const needsNudge = inTraining && idleDays >= 7;
    return {
      ...m, course: c, idleDays, inTraining, needsNudge,
      notStarted: inTraining && c.modulesDone === 0 && c.modules.every((x) => !x.watched),
      batch: batchNums[m.id] || null, zoom: zoomCounts[m.id] || 0,
      wa: waNumber(m.mobile),
      waText: `Hi ${m.name}, just checking in on your Buffalo Jumpstart training. ` +
        (c.nextLabel ? `Your next step is ${c.nextLabel}. ` : '') + `Keep going! ${require('../lib/mail').baseUrl()}/course`,
    };
  });
  const stats = {
    training: rows.filter((r) => r.inTraining).length,
    completed: rows.filter((r) => r.trainee && r.course.certificateReady).length,
    nudge: rows.filter((r) => r.needsNudge).length,
  };
  let shown = rows;
  if (filter === 'nudge') shown = rows.filter((r) => r.needsNudge);
  else if (filter === 'completed') shown = rows.filter((r) => r.trainee && r.course.certificateReady);
  else if (filter === 'training') shown = rows.filter((r) => r.inTraining);
  shown.sort((a, b) => (b.needsNudge - a.needsNudge) || (a.depth - b.depth) || a.name.localeCompare(b.name));
  res.render('team', { title: 'My group', rows: shown, stats, filter, total: rows.length });
});

async function zoomCountsFor(ids) {
  if (!ids.length) return {};
  const r = await all('SELECT user_id, count(*)::int AS n FROM zoom_attendance WHERE user_id = ANY($1) GROUP BY 1', [ids]);
  return Object.fromEntries(r.map((x) => [x.user_id, x.n]));
}

module.exports = router;
