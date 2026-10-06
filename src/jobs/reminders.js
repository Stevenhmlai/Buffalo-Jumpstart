const cron = require('node-cron');
const { all, q } = require('../db');
const progress = require('../lib/progress');
const mail = require('../lib/mail');
const { fmtDateTime, fmtTime } = require('../lib/util');

// Runs once a day. Every reminder is recorded so nobody gets the same one twice.
async function runReminders() {
  const summary = { idle: 0, workshop: 0, zoom: 0 };

  // 1) Members with no progress for 7 days (repeat at most every 7 days)
  const videos = await progress.getVideos();
  const idle = await all(
    `SELECT * FROM users
      WHERE status='active' AND trainee AND course_completed_at IS NULL AND email <> ''
        AND coalesce(last_activity_at, approved_at, created_at) < now() - interval '7 days'
        AND (last_idle_reminder_at IS NULL OR last_idle_reminder_at < now() - interval '7 days')`);
  if (idle.length) {
    const progs = await progress.loadUserProgress(idle.map((u) => u.id));
    for (const u of idle) {
      const c = progress.buildCourse(videos, progs[u.id]);
      if (c.certificateReady) continue;
      await mail.idleReminder(u, c.nextLabel);
      await q('UPDATE users SET last_idle_reminder_at=now() WHERE id=$1', [u.id]);
      summary.idle++;
    }
  }

  // 2) Workshop tomorrow (Malaysia date) → everyone registered
  const ws = await all(
    `SELECT b.id AS batch_id, b.number, b.venue, b.workshop_start, b.workshop_end, u.*
       FROM batches b JOIN workshop_registrations r ON r.batch_id=b.id JOIN users u ON u.id=r.user_id
      WHERE (b.workshop_start AT TIME ZONE 'Asia/Kuala_Lumpur')::date = ((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 1)
        AND u.status='active' AND u.email <> ''
        AND NOT EXISTS (SELECT 1 FROM reminders_sent s WHERE s.kind='workshop' AND s.user_id=u.id AND s.ref_id=b.id)`);
  for (const r of ws) {
    const when = `${fmtDateTime(r.workshop_start)} – ${fmtTime(r.workshop_end)}`;
    await mail.workshopReminder(r, { number: r.number, venue: r.venue }, when);
    await q(`INSERT INTO reminders_sent (kind, user_id, ref_id) VALUES ('workshop',$1,$2) ON CONFLICT DO NOTHING`, [r.id, r.batch_id]);
    summary.workshop++;
  }

  // 3) Zoom session tomorrow → members of that batch (attended its workshop)
  const zs = await all(
    `SELECT z.id AS zid, z.seq, z.starts_at, b.id AS batch_id, b.number, u.*
       FROM zoom_sessions z JOIN batches b ON b.id=z.batch_id
       JOIN workshop_attendance a ON a.batch_id=b.id JOIN users u ON u.id=a.user_id
      WHERE z.starts_at IS NOT NULL
        AND (z.starts_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date = ((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 1)
        AND u.status='active' AND u.email <> ''
        AND NOT EXISTS (SELECT 1 FROM reminders_sent s WHERE s.kind='zoom' AND s.user_id=u.id AND s.ref_id=z.id)`);
  for (const r of zs) {
    await mail.zoomReminder(r, { number: r.number }, { seq: r.seq }, fmtDateTime(r.starts_at));
    await q(`INSERT INTO reminders_sent (kind, user_id, ref_id) VALUES ('zoom',$1,$2) ON CONFLICT DO NOTHING`, [r.id, r.zid]);
    summary.zoom++;
  }
  console.log('Reminders sent', summary);
  return summary;
}

function startJobs() {
  // 9:00am Malaysia time, every day
  cron.schedule('0 9 * * *', () => runReminders().catch((e) => console.error('Reminder job failed', e)), { timezone: 'Asia/Kuala_Lumpur' });
}

module.exports = { startJobs, runReminders };
