/* ========= API CLIENT =========
 * Wrapper around the optional server backend. If /api/ping doesn't
 * respond, every method silently no-ops -- the game continues to work
 * fully offline with localStorage. So the same code runs in static
 * deploy AND server-mode deploy.
 *
 * Token persisted in localStorage (cbwwn-auth).
 */
window.NUTS = window.NUTS || {};

NUTS.Api = (function () {
  const TOKEN_KEY = 'cbwwn-auth';
  const USER_KEY = 'cbwwn-user';
  let online = false;
  let probed = false;
  let probePromise = null;

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
  }
  function setUser(u) {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }

  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache',
    };
    const t = getToken();
    if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const r = await fetch(path, opts);
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) {
      const err = new Error((data && data.error) || ('http_' + r.status));
      err.status = r.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  function probe() {
    if (probed) return probePromise || Promise.resolve(online);
    probed = true;
    probePromise = (typeof fetch === 'function')
      ? fetch('/api/ping', { cache: 'no-cache' })
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            online = !!(data && data.ok);
            if (online && getToken() && !getUser()) {
              return request('GET', '/api/me').then((d) => setUser(d.user)).catch(() => {});
            }
          })
          .then(() => online)
          .catch(() => { online = false; })
      : Promise.resolve(false);
    return probePromise;
  }

  return {
    probe,
    isOnline: () => online,
    user: getUser,

    async register(name) {
      if (!online) throw new Error('offline');
      const data = await request('POST', '/api/auth/register', { name });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },

    /* Restore session from a known token (e.g. paste-in / migration) */
    async loginWithToken(token) {
      if (!online) throw new Error('offline');
      setToken(token);
      try {
        const data = await request('GET', '/api/me');
        setUser(data.user);
        return data.user;
      } catch (e) {
        setToken(''); setUser(null);
        throw e;
      }
    },

    logout() { setToken(''); setUser(null); },

    async updateProfile(patch) {
      if (!online || !getToken()) return null;
      const data = await request('POST', '/api/me', patch);
      setUser(data.user);
      return data.user;
    },

    async submitScore(level, score, stars, moves) {
      if (!online || !getToken()) return null;
      try {
        return await request('POST', '/api/scores', { level, score, stars, moves });
      } catch (e) {
        console.warn('[api] score submit failed', e.message);
        return null;
      }
    },

    async leaderboard(level, period = 'all', limit = 25) {
      if (!online) return null;
      try {
        return await request('GET',
          `/api/leaderboard?level=${level}&period=${period}&limit=${limit}`);
      } catch (e) { return null; }
    },

    async leaderboardGlobal(period = 'all', limit = 25) {
      if (!online) return null;
      try {
        return await request('GET', `/api/leaderboard/global?period=${period}&limit=${limit}`);
      } catch (e) { return null; }
    },

    async loadCloudSave() {
      if (!online || !getToken()) return null;
      try {
        const d = await request('GET', '/api/save');
        return d.save;
      } catch (e) { return null; }
    },

    async pushCloudSave(progress) {
      if (!online || !getToken()) return null;
      try {
        return await request('PUT', '/api/save', { progress });
      } catch (e) { return null; }
    },

    async daily() {
      if (!online) return null;
      try { return await request('GET', '/api/daily'); }
      catch (e) { return null; }
    },
  };
})();
