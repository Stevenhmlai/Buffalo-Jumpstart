const crypto = require('crypto');

const TZ = 'Asia/Kuala_Lumpur';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
}
// Value for <input type="datetime-local"> in Malaysia time
function toLocalInput(d) {
  if (!d) return '';
  const t = new Date(new Date(d).getTime() + 8 * 3600 * 1000);
  return t.toISOString().slice(0, 16);
}
// Parse "YYYY-MM-DDTHH:MM" entered in Malaysia time
function fromLocalInput(s) {
  if (!s) return null;
  const d = new Date(s + ':00+08:00');
  return isNaN(d) ? null : d;
}
function daysSince(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}
function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function randomCode4() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function normCode(s) {
  return String(s || '').trim().toUpperCase().replace(/\s+/g, '');
}
// Malaysian mobile → digits for wa.me (e.g. 012-345 6789 → 60123456789)
function waNumber(mobile) {
  let d = String(mobile || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = '6' + d;
  return d;
}

module.exports = {
  TZ, fmtDate, fmtDateLong, fmtDateTime, fmtTime, toLocalInput, fromLocalInput, daysSince,
  randomToken, sha256, randomCode4, shuffle, normCode, waNumber,
};

// Inline SVG icons for templates: <%- u.icon('check') %>
const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  quiz: '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V15"/><path d="M12 18.5v.01"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8"/>',
  wave: '<path d="M12 3l2.6 5.6 6 .6-4.5 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.4 9.2l6-.6z"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  whatsapp: '<path d="M4 20l1.4-4.2A8 8 0 1 1 8.2 18.6z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 18h2v2h-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
};
module.exports.icon = function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
};
