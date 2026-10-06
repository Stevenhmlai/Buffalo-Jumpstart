const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const { pool, migrate } = require('./db');
const { loadUser, csrf, flash } = require('./lib/auth');
const util = require('./lib/util');
const { startJobs } = require('./jobs/reminders');

const app = express();
const PROD = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.youtube.com', 'https://s.ytimg.com'],
      frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
      imgSrc: ["'self'", 'data:', 'https://i.ytimg.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: PROD ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Changes on every deploy so browsers fetch fresh CSS/JS despite the 7-day cache
const ASSET_VERSION = (process.env.RAILWAY_DEPLOYMENT_ID || String(Date.now())).slice(0, 12);
app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: PROD ? '7d' : 0 }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));

app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 30 * 24 * 3600 * 1000 },
}));

app.use((req, res, next) => {
  res.locals.u = util;
  res.locals.v = ASSET_VERSION;
  res.locals.path = req.path;
  res.locals.baseUrl = require('./lib/mail').baseUrl();
  next();
});
app.use(flash);
app.use(csrf);
app.use((req, res, next) => loadUser(req, res, next).catch(next));
app.use(async (req, res, next) => {
  try {
    res.locals.showTeam = false;
    if (req.user) {
      const { hasDownlines } = require('./lib/group');
      res.locals.showTeam = await hasDownlines(req.user.agent_code);
    }
    next();
  } catch (e) { next(e); }
});

app.use(require('./routes/auth'));
app.use(require('./routes/member'));
app.use(require('./routes/workshop'));
app.use('/admin', require('./routes/admin'));

app.get('/healthz', (req, res) => res.send('ok'));

app.use((req, res) => res.status(404).render('message', { title: 'Page not found', message: "We couldn't find that page." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('message', { title: 'Something went wrong', message: 'Please try again. If it keeps happening, let an admin know.' });
});

const port = process.env.PORT || 3000;
migrate()
  .then(() => {
    app.listen(port, () => console.log(`Buffalo Jumpstart running on port ${port}`));
    if (process.env.DISABLE_JOBS !== 'true') startJobs();
  })
  .catch((e) => {
    console.error('Startup failed', e);
    process.exit(1);
  });
