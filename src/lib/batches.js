const { all, one } = require('../db');

const CHECKIN_BEFORE_MIN = 60;   // QR works from 1 hour before the workshop starts
const CHECKIN_AFTER_MIN = 60;    // ...until 1 hour after it ends
const ZOOM_BEFORE_MIN = 15;      // Zoom code works from 15 min before
const ZOOM_AFTER_MIN = 30;       // ...until 30 min after the planned end

function checkinOpen(batch, now = new Date()) {
  const from = new Date(new Date(batch.workshop_start).getTime() - CHECKIN_BEFORE_MIN * 60000);
  const to = new Date(new Date(batch.workshop_end).getTime() + CHECKIN_AFTER_MIN * 60000);
  return now >= from && now <= to;
}
function zoomWindow(z) {
  if (!z.starts_at) return null;
  const start = new Date(z.starts_at).getTime();
  return {
    from: new Date(start - ZOOM_BEFORE_MIN * 60000),
    to: new Date(start + (z.duration_min || 90) * 60000 + ZOOM_AFTER_MIN * 60000),
    end: new Date(start + (z.duration_min || 90) * 60000),
  };
}
function zoomOpen(z, now = new Date()) {
  const w = zoomWindow(z);
  return !!w && now >= w.from && now <= w.to;
}
function zoomOver(z, now = new Date()) {
  const w = zoomWindow(z);
  return !!w && now > w.to;
}

// A member's batch = the earliest workshop they actually attended.
async function batchOfUser(userId) {
  return one(
    `SELECT b.* FROM workshop_attendance a JOIN batches b ON b.id = a.batch_id
      WHERE a.user_id = $1 ORDER BY b.workshop_start LIMIT 1`, [userId]);
}

async function batchNumbersFor(userIds) {
  if (!userIds.length) return {};
  const rows = await all(
    `SELECT DISTINCT ON (a.user_id) a.user_id, b.number, b.workshop_start
       FROM workshop_attendance a JOIN batches b ON b.id=a.batch_id
      WHERE a.user_id = ANY($1) ORDER BY a.user_id, b.workshop_start`, [userIds]);
  const out = {};
  for (const r of rows) out[r.user_id] = r.number;
  return out;
}

async function upcomingBatches() {
  return all(`SELECT * FROM batches WHERE workshop_end > now() ORDER BY workshop_start`);
}

async function zoomSessions(batchId) {
  return all(`SELECT * FROM zoom_sessions WHERE batch_id=$1 ORDER BY seq`, [batchId]);
}

module.exports = {
  checkinOpen, zoomWindow, zoomOpen, zoomOver, batchOfUser, batchNumbersFor, upcomingBatches, zoomSessions,
  CHECKIN_BEFORE_MIN, CHECKIN_AFTER_MIN,
};
