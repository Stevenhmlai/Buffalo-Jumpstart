// Works out where a member is in the course, and what is locked/unlocked.
const { all, one, q } = require('../db');

async function getVideos() {
  return all('SELECT * FROM videos ORDER BY position');
}

async function loadUserProgress(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (!ids.length) return {};
  const comps = await all('SELECT user_id, video_id, completed_at FROM video_completions WHERE user_id = ANY($1)', [ids]);
  const passes = await all(
    'SELECT user_id, video_id, min(created_at) AS at FROM quiz_attempts WHERE passed AND user_id = ANY($1) GROUP BY 1,2', [ids]);
  const out = {};
  for (const id of ids) out[id] = { watched: new Map(), passed: new Map() };
  for (const c of comps) out[c.user_id].watched.set(c.video_id, c.completed_at);
  for (const p of passes) out[p.user_id].passed.set(p.video_id, p.at);
  return out;
}

// Pure function: given videos + one user's progress → course state
function buildCourse(videos, prog) {
  const welcome = videos.find((v) => v.kind === 'welcome') || null;
  const congrats = videos.find((v) => v.kind === 'congrats') || null;
  const modules = videos.filter((v) => v.kind === 'module');

  // A module is "done" when its quiz is passed, or (no published quiz and the video was watched),
  // or a later module has already been watched (so a quiz published later never re-locks anyone).
  const doneFlags = new Array(modules.length).fill(false);
  let laterWatched = false;
  for (let i = modules.length - 1; i >= 0; i--) {
    const m = modules[i];
    const watched = prog.watched.has(m.id);
    const quizLive = m.quiz_status === 'approved';
    doneFlags[i] = prog.passed.has(m.id) || (watched && !quizLive) || laterWatched;
    if (watched) laterWatched = true;
  }

  const items = modules.map((m, i) => {
    const watched = prog.watched.has(m.id);
    const unlocked = i === 0 || doneFlags[i - 1];
    let state;
    if (doneFlags[i]) state = 'done';
    else if (!unlocked) state = 'locked';
    else if (watched) state = 'quiz';
    else state = 'current';
    return { ...m, number: i + 1, watched, unlocked, state, quizLive: m.quiz_status === 'approved' };
  });

  const modulesDone = doneFlags.filter(Boolean).length;
  const allModulesDone = modules.length > 0 && modulesDone === modules.length;
  const congratsHasVideo = !!(congrats && congrats.youtube_id);
  const congratsWatched = congrats ? prog.watched.has(congrats.id) : false;
  const certificateReady = allModulesDone && (!congratsHasVideo || congratsWatched);

  let next = items.find((it) => it.state === 'current' || it.state === 'quiz') || null;
  let nextLabel = null;
  if (next) nextLabel = next.state === 'quiz' ? `Module ${next.number} quiz` : `Module ${next.number}: ${next.title}`;
  else if (allModulesDone && congratsHasVideo && !congratsWatched) nextLabel = congrats.title;

  return {
    welcome,
    welcomeWatched: welcome ? prog.watched.has(welcome.id) : false,
    modules: items,
    modulesTotal: modules.length,
    modulesDone,
    allModulesDone,
    congrats,
    congratsHasVideo,
    congratsWatched,
    certificateReady,
    next,
    nextLabel,
    percent: modules.length ? Math.round((modulesDone / modules.length) * 100) : 0,
  };
}

async function courseFor(user) {
  const videos = await getVideos();
  const prog = (await loadUserProgress(user.id))[user.id];
  const course = buildCourse(videos, prog);
  if (course.certificateReady && !user.course_completed_at) {
    const r = await one('UPDATE users SET course_completed_at=now() WHERE id=$1 AND course_completed_at IS NULL RETURNING course_completed_at', [user.id]);
    if (r) user.course_completed_at = r.course_completed_at;
  }
  return course;
}

// Can this user open this video right now?
function canWatch(course, video) {
  if (video.kind === 'welcome') return true;
  if (video.kind === 'congrats') return course.allModulesDone && !!video.youtube_id;
  const m = course.modules.find((x) => x.id === video.id);
  return !!(m && m.unlocked);
}

async function touch(userId) {
  await q('UPDATE users SET last_activity_at=now() WHERE id=$1', [userId]);
}

module.exports = { getVideos, loadUserProgress, buildCourse, courseFor, canWatch, touch };
