const { all, one } = require('../db');

// Everyone below an upline (up to 10 levels), active members only.
async function groupOf(agentCode) {
  return all(
    `WITH RECURSIVE g AS (
       SELECT u.id, u.agent_code, u.upline_code, 1 AS depth
         FROM users u WHERE upper(u.upline_code) = upper($1) AND u.status = 'active'
       UNION ALL
       SELECT u.id, u.agent_code, u.upline_code, g.depth + 1
         FROM users u JOIN g ON upper(u.upline_code) = upper(g.agent_code)
        WHERE u.status = 'active' AND g.depth < 10
     )
     SELECT DISTINCT ON (u.id) u.*, g.depth, COALESCE(NULLIF(up.preferred_name, ''), up.name) AS upline_name
       FROM g JOIN users u ON u.id = g.id
       LEFT JOIN users up ON upper(up.agent_code) = upper(u.upline_code)
      ORDER BY u.id, g.depth`,
    [agentCode]
  );
}

async function hasDownlines(agentCode) {
  const r = await one(`SELECT 1 FROM users WHERE upper(upline_code)=upper($1) AND status='active' LIMIT 1`, [agentCode]);
  return !!r;
}

async function directDownlines(agentCode) {
  return all(`SELECT * FROM users WHERE upper(upline_code)=upper($1) AND status IN ('active','pending') ORDER BY name`, [agentCode]);
}

module.exports = { groupOf, hasDownlines, directDownlines };
