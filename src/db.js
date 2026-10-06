const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const useSsl = process.env.PGSSL === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://jump:jump@localhost:5432/jumpstart',
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

const q = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const all = async (text, params) => (await pool.query(text, params)).rows;

const DEFAULT_VIDEOS = [
  { position: 0, kind: 'welcome', title: 'Welcome message', youtube_id: 'jleMS8CjUfU' },
  { position: 1, kind: 'module', title: 'Introduction to Jumpstart and My Market Prospecting List', youtube_id: 'apqy70A-Kxs' },
  { position: 2, kind: 'module', title: 'What is Unit Trust & What-if Analysis Presentation', youtube_id: 'Rm1JoGmXOfA' },
  { position: 3, kind: 'module', title: 'Effective Presentation to Close EPF Sales', youtube_id: 'BcUmenXmoBI' },
  { position: 4, kind: 'module', title: '3 Simple Rules', youtube_id: 'YO4Tq1rRDRo' },
  { position: 5, kind: 'module', title: 'Basic Portfolio Management', youtube_id: 'dC2maWnjxpU' },
  { position: 6, kind: 'module', title: 'Closing Techniques', youtube_id: 'gCXfJTEEFAk' },
  { position: 7, kind: 'module', title: 'Crisis Proof Your Clients', youtube_id: 'UbwwKQZz7I4' },
  { position: 8, kind: 'module', title: 'Proven Game Plan for Success', youtube_id: 'zr1-urV_40E' },
  { position: 9, kind: 'congrats', title: 'Congratulations & Next Steps', youtube_id: null },
];

const DEFAULT_SETTINGS = {
  next_steps:
    'Well done on completing the Buffalo Jumpstart videos!\n\n' +
    '1. Download your certificate below.\n' +
    '2. Register for the next physical Jumpstart Workshop.\n' +
    '3. After the workshop, join the 4 Zoom sessions with your batch.\n\n' +
    'If you have any questions, speak to your upline.',
};

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM videos');
  if (rows[0].n === 0) {
    for (const v of DEFAULT_VIDEOS) {
      await pool.query(
        'INSERT INTO videos (position, kind, title, youtube_id) VALUES ($1,$2,$3,$4)',
        [v.position, v.kind, v.title, v.youtube_id]
      );
    }
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await pool.query('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [key, value]);
  }

  // First admin, from environment variables, only if no admin exists yet.
  const admin = await one('SELECT id FROM users WHERE is_admin LIMIT 1');
  if (!admin && process.env.ADMIN_CODE && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (agent_code, name, email, password_hash, status, is_admin, trainee, approved_at)
       VALUES (upper($1), $2, $3, $4, 'active', TRUE, FALSE, now())
       ON CONFLICT (agent_code) DO UPDATE SET is_admin = TRUE, status = 'active'`,
      [process.env.ADMIN_CODE.trim(), process.env.ADMIN_NAME || 'Admin', process.env.ADMIN_EMAIL || '', hash]
    );
    console.log('Created first admin', process.env.ADMIN_CODE);
  }
}

async function getSetting(key) {
  const r = await one('SELECT value FROM settings WHERE key=$1', [key]);
  return r ? r.value : DEFAULT_SETTINGS[key] || '';
}
async function setSetting(key, value) {
  await q('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [key, value]);
}

module.exports = { pool, q, one, all, migrate, getSetting, setSetting };
