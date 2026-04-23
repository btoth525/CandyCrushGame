/* ========= WIZARDING NUTS SERVER =========
 * Single-file Node + Express backend.
 *
 *   - SQLite (better-sqlite3) at $DATA_DIR/wizarding.db
 *   - Static game served from ../game/
 *   - JSON API under /api/*
 *
 * Endpoints:
 *   GET  /api/ping
 *   POST /api/auth/register      { name }                 -> { token, user }
 *   GET  /api/me                 (Bearer)                 -> { user }
 *   POST /api/me                 { displayName, house }   -> { user }
 *   POST /api/scores             (Bearer) { level, score, stars, moves } -> { ok, rank }
 *   GET  /api/leaderboard?level=N&period=all|daily|weekly  -> { entries }
 *   GET  /api/leaderboard/global?period=...               -> { entries }
 *   GET  /api/save               (Bearer)                 -> { save }
 *   PUT  /api/save               (Bearer) { progress }    -> { ok }
 *   GET  /api/daily                                       -> { seed, level }
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const compression = require('compression');
const Database = require('better-sqlite3');

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'game');
const DB_PATH = path.join(DATA_DIR, 'wizarding.db');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ========================================================================
   DATABASE
   ======================================================================== */
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT UNIQUE NOT NULL COLLATE NOCASE,
    display_name  TEXT NOT NULL,
    token_hash    TEXT NOT NULL,
    house         TEXT,
    created_at    INTEGER NOT NULL,
    last_seen_at  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level       INTEGER NOT NULL,
    score       INTEGER NOT NULL,
    stars       INTEGER NOT NULL,
    moves_used  INTEGER,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_scores_level_score ON scores(level, score DESC);
  CREATE INDEX IF NOT EXISTS idx_scores_user_level  ON scores(user_id, level);
  CREATE INDEX IF NOT EXISTS idx_scores_created     ON scores(created_at);

  CREATE TABLE IF NOT EXISTS saves (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload     TEXT NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS achievements (
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code         TEXT NOT NULL,
    unlocked_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, code)
  );
  CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
`);

/* ========================================================================
   AUTH HELPERS
   ======================================================================== */
const NAME_RE = /^[A-Za-z0-9_\- ]{2,20}$/;
const RESERVED = new Set(['admin', 'root', 'system', 'mod', 'official']);

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}
function hashToken(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}
function now() { return Date.now(); }

function authUser(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+([A-Fa-f0-9]{64})$/.exec(h);
  if (!m) return null;
  const hash = hashToken(m[1]);
  const user = db.prepare('SELECT * FROM users WHERE token_hash = ?').get(hash);
  if (user) {
    db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(now(), user.id);
  }
  return user || null;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    displayName: u.display_name,
    house: u.house || null,
    createdAt: u.created_at,
  };
}

/* ========================================================================
   APP
   ======================================================================== */
const app = express();
app.disable('x-powered-by');
app.use(compression());
/* 30MB JSON body cap -- admin config can carry backdrop + tile images
 * as data URLs. Everything else (scores, names, saves) is tiny. */
app.use(express.json({ limit: '30mb' }));

/* Tiny in-memory rate limiter (per IP, per minute) */
const RATE = new Map();
function rateLimit(maxPerMin) {
  return (req, res, next) => {
    const key = (req.ip || 'unknown') + ':' + req.path;
    const minute = Math.floor(Date.now() / 60000);
    const entry = RATE.get(key);
    if (!entry || entry.minute !== minute) {
      RATE.set(key, { minute, n: 1 });
      return next();
    }
    entry.n++;
    if (entry.n > maxPerMin) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

/* ========== HEALTH ========== */
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: now(), service: 'wizarding-nuts', version: 1 });
});

/* ========== REGISTER ========== */
app.post('/api/auth/register', rateLimit(20), (req, res) => {
  const name = (req.body && req.body.name || '').trim();
  if (!NAME_RE.test(name)) return res.status(400).json({ error: 'invalid_name' });
  if (RESERVED.has(name.toLowerCase())) return res.status(400).json({ error: 'name_reserved' });
  const existing = db.prepare('SELECT 1 FROM users WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ error: 'name_taken' });
  const token = genToken();
  const t = now();
  const info = db.prepare(`
    INSERT INTO users (name, display_name, token_hash, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, name, hashToken(token), t, t);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token, user: publicUser(user) });
});

/* ========== ME ========== */
app.get('/api/me', (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  res.json({ user: publicUser(u) });
});

app.post('/api/me', rateLimit(30), (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const { displayName, house } = req.body || {};
  const upd = {};
  if (typeof displayName === 'string' && displayName.trim().length >= 1 && displayName.trim().length <= 30) {
    upd.display_name = displayName.trim();
  }
  if (typeof house === 'string' && house.length <= 30) {
    upd.house = house.trim() || null;
  }
  const fields = Object.keys(upd);
  if (!fields.length) return res.json({ user: publicUser(u) });
  const sql = 'UPDATE users SET ' + fields.map((f) => f + ' = ?').join(', ') + ' WHERE id = ?';
  db.prepare(sql).run(...fields.map((f) => upd[f]), u.id);
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  res.json({ user: publicUser(fresh) });
});

/* ========== SCORE SUBMIT ========== */
const MAX_LEVEL = 200;
const MAX_SCORE = 5_000_000;

app.post('/api/scores', rateLimit(60), (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const { level, score, stars, moves } = req.body || {};
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    return res.status(400).json({ error: 'invalid_level' });
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ error: 'invalid_score' });
  }
  if (!Number.isInteger(stars) || stars < 0 || stars > 3) {
    return res.status(400).json({ error: 'invalid_stars' });
  }
  const movesVal = Number.isInteger(moves) ? moves : null;
  const t = now();
  db.prepare(`
    INSERT INTO scores (user_id, level, score, stars, moves_used, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(u.id, level, score, stars, movesVal, t);

  const rank = db.prepare(`
    SELECT 1 + COUNT(*) AS r FROM (
      SELECT user_id, MAX(score) AS best
      FROM scores WHERE level = ?
      GROUP BY user_id
    ) WHERE best > (
      SELECT MAX(score) FROM scores WHERE level = ? AND user_id = ?
    )
  `).get(level, level, u.id);

  res.json({ ok: true, rank: rank ? rank.r : null });
});

/* ========== LEADERBOARD ========== */
function periodCutoff(period) {
  const t = now();
  if (period === 'daily')  return t - 24 * 3600 * 1000;
  if (period === 'weekly') return t - 7 * 24 * 3600 * 1000;
  return 0;
}

app.get('/api/leaderboard', (req, res) => {
  const level = parseInt(req.query.level, 10);
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    return res.status(400).json({ error: 'invalid_level' });
  }
  const period = String(req.query.period || 'all');
  const cutoff = periodCutoff(period);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 25);
  const rows = db.prepare(`
    SELECT u.name, u.display_name, u.house, MAX(s.score) AS score, MAX(s.stars) AS stars
    FROM scores s
    JOIN users u ON u.id = s.user_id
    WHERE s.level = ? AND s.created_at >= ?
    GROUP BY u.id
    ORDER BY score DESC, u.id ASC
    LIMIT ?
  `).all(level, cutoff, limit);
  res.json({
    level, period,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      displayName: r.display_name,
      house: r.house,
      score: r.score,
      stars: r.stars,
    })),
  });
});

app.get('/api/leaderboard/global', (req, res) => {
  const period = String(req.query.period || 'all');
  const cutoff = periodCutoff(period);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 25);
  /* Sum each user's BEST score per level (capped at level<=MAX_LEVEL) */
  const rows = db.prepare(`
    SELECT u.name, u.display_name, u.house,
           SUM(per_level_best) AS total,
           SUM(per_level_stars) AS stars
    FROM (
      SELECT user_id, level,
             MAX(score) AS per_level_best,
             MAX(stars) AS per_level_stars
      FROM scores
      WHERE created_at >= ?
      GROUP BY user_id, level
    ) AS bests
    JOIN users u ON u.id = bests.user_id
    GROUP BY u.id
    ORDER BY total DESC, stars DESC, u.id ASC
    LIMIT ?
  `).all(cutoff, limit);
  res.json({
    period,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      displayName: r.display_name,
      house: r.house,
      score: r.total,
      stars: r.stars,
    })),
  });
});

/* ========== CLOUD SAVE ========== */
app.get('/api/save', (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const row = db.prepare('SELECT payload, updated_at FROM saves WHERE user_id = ?').get(u.id);
  if (!row) return res.json({ save: null });
  let parsed = null;
  try { parsed = JSON.parse(row.payload); } catch (e) {}
  res.json({ save: parsed, updatedAt: row.updated_at });
});

app.put('/api/save', rateLimit(120), (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const payload = req.body && req.body.progress;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'invalid_payload' });
  }
  const text = JSON.stringify(payload);
  if (text.length > 64 * 1024) return res.status(413).json({ error: 'payload_too_large' });
  const t = now();
  db.prepare(`
    INSERT INTO saves (user_id, payload, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).run(u.id, text, t);
  res.json({ ok: true, updatedAt: t });
});

/* ========== ACHIEVEMENTS ========== */
const ACH_CODE_RE = /^[a-z0-9_]{2,40}$/;

app.get('/api/achievements', (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const rows = db.prepare(`
    SELECT code, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC
  `).all(u.id);
  res.json({ achievements: rows });
});

app.post('/api/achievements', rateLimit(120), (req, res) => {
  const u = authUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  const code = (req.body && req.body.code || '').trim();
  if (!ACH_CODE_RE.test(code)) return res.status(400).json({ error: 'invalid_code' });
  const t = now();
  const info = db.prepare(`
    INSERT OR IGNORE INTO achievements (user_id, code, unlocked_at) VALUES (?, ?, ?)
  `).run(u.id, code, t);
  res.json({ ok: true, newlyUnlocked: info.changes > 0, unlockedAt: t });
});

/* ========== DAILY CHALLENGE ========== */
function dailySeed() {
  const d = new Date();
  return parseInt(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`,
    10
  );
}
function seededInt(seed, min, max) {
  /* xorshift32 */
  let x = seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const r = (x >>> 0) / 0xffffffff;
  return Math.floor(min + r * (max - min + 1));
}

app.get('/api/daily', (req, res) => {
  const seed = dailySeed();
  const moves = seededInt(seed, 18, 26);
  const target = seededInt(seed * 7 + 11, 8000, 22000);
  const jinx = seededInt(seed * 31 + 3, 0, 8);
  const golden = seededInt(seed * 91 + 5, 0, 3);
  res.json({
    seed,
    level: {
      id: 999,
      name: "Daily Spell",
      moves,
      scoreStars: [target, Math.floor(target * 1.6), Math.floor(target * 2.3)],
      objectives: [
        { type: 'score', target },
        ...(jinx > 0   ? [{ type: 'jinx', count: jinx }]     : []),
        ...(golden > 0 ? [{ type: 'golden', count: golden }] : []),
      ],
      jinxSeeds: jinx,
      goldenSeeds: golden,
    },
  });
});

/* ========== ADMIN: SERVER-SIDE CONFIG ========== */
function constantTimeMatch(supplied) {
  if (!ADMIN_TOKEN || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_TOKEN);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function adminAuth(req) {
  if (!ADMIN_TOKEN) return false;
  const h = req.headers.authorization || '';
  const bearer = /^Bearer\s+(.+)$/.exec(h);
  if (bearer) return constantTimeMatch(bearer[1]);
  /* Also accept Basic Auth (browser-friendly for /admin.html) */
  const basic = /^Basic\s+(.+)$/.exec(h);
  if (basic) {
    try {
      const [, pass = ''] = Buffer.from(basic[1], 'base64').toString().split(':');
      return constantTimeMatch(pass);
    } catch (e) { return false; }
  }
  return false;
}

/* Admin page is publicly reachable; the UI itself shows a password
 * overlay (see admin.js) when the server reports ADMIN_TOKEN is set.
 * All dangerous endpoints (/api/admin/*) still require the token
 * server-side, so unauthenticated visitors can only look at the UI
 * shell, not publish anything. */

app.get('/api/admin/status', (req, res) => {
  res.json({
    enabled: !!ADMIN_TOKEN,
    authenticated: adminAuth(req),
    hasConfig: fs.existsSync(CONFIG_PATH),
  });
});

app.get('/api/admin/config', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  if (!fs.existsSync(CONFIG_PATH)) return res.json({ config: null });
  try {
    res.json({ config: JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) });
  } catch (e) {
    res.status(500).json({ error: 'config_corrupt' });
  }
});

app.put('/api/admin/config', rateLimit(60), (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const cfg = req.body;
  if (!cfg || typeof cfg !== 'object') return res.status(400).json({ error: 'invalid_config' });
  const text = JSON.stringify(cfg, null, 2);
  /* 25MB cap -- plenty of headroom for a handful of compressed
   * backdrop / tile images embedded as data URLs. */
  if (text.length > 25 * 1024 * 1024) return res.status(413).json({ error: 'config_too_large' });
  fs.writeFileSync(CONFIG_PATH, text, 'utf8');
  res.json({ ok: true, size: text.length });
});

app.delete('/api/admin/config', (req, res) => {
  if (!adminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  res.json({ ok: true });
});

/* Public read of the live config (used by config.js on every page load).
 * Server-side admin push (above) wins over the static game/config.json. */
app.get('/config.json', (req, res) => {
  if (fs.existsSync(CONFIG_PATH)) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(CONFIG_PATH);
  }
  /* Fall back to bundled file if it exists */
  const bundled = path.join(STATIC_DIR, 'config.json');
  if (fs.existsSync(bundled)) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(bundled);
  }
  res.status(404).json({ error: 'not_found' });
});

/* ========== STATIC GAME ========== */
app.use(express.static(STATIC_DIR, {
  etag: true,
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.(png|jpe?g|svg|ico|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

/* ========== ERROR HANDLER ========== */
app.use((err, req, res, _next) => {
  console.error('[err]', err);
  res.status(500).json({ error: 'internal' });
});

app.listen(PORT, () => {
  console.log(`Wizarding Nuts server: http://0.0.0.0:${PORT}`);
  console.log(`  static dir: ${STATIC_DIR}`);
  console.log(`  database:   ${DB_PATH}`);
});
