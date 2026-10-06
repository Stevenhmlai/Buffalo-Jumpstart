const crypto = require('crypto');
const { one } = require('../db');

// Load the logged-in user (if any) on every request.
async function loadUser(req, res, next) {
  res.locals.user = null;
  if (req.session && req.session.userId) {
    const u = await one(`SELECT * FROM users WHERE id=$1 AND status='active'`, [req.session.userId]);
    if (u) {
      req.user = u;
      res.locals.user = u;
    } else {
      req.session.userId = null;
    }
  }
  next();
}

function requireLogin(req, res, next) {
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  if (!req.user.is_admin) return res.status(403).render('message', { title: 'Admins only', message: 'This page is for admins.' });
  next();
}

// Simple per-session CSRF token
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('base64url');
  res.locals.csrf = req.session.csrf;
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const sent = (req.body && req.body._csrf) || req.get('x-csrf-token');
    if (!sent || sent !== req.session.csrf) {
      return res.status(403).render('message', {
        title: 'Page expired',
        message: 'This page has expired. Please go back, refresh, and try again.',
      });
    }
  }
  next();
}

// Flash messages
function flash(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  req.flash = (type, text) => { req.session.flash = { type, text }; };
  next();
}

module.exports = { loadUser, requireLogin, requireAdmin, csrf, flash };
