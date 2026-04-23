/* ========= MAIN: state machine, save/load, wiring ========= */
window.NUTS = window.NUTS || {};

NUTS.Main = (function () {
  const SAVE_KEY = 'cbwwn-save-v1';
  const ui = NUTS.UI;
  const audio = NUTS.audio;

  let progress = { stars: {}, best: {} };
  let settings = { sfxOn: true, musicOn: true, sfxVol: 0.7, musicVol: 0.35 };
  let game = null;
  let currentLevel = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.progress) progress = o.progress;
      if (o.settings) settings = o.settings;
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ progress, settings }));
    } catch (e) {}
  }

  function saveSettings() {
    settings.sfxOn = audio.state.sfxOn;
    settings.musicOn = audio.state.musicOn;
    settings.sfxVol = audio.state.sfxVol;
    settings.musicVol = audio.state.musicVol;
    save();
  }

  function applySettings() {
    /* Admin-supplied audio defaults take precedence the very first run. */
    if (NUTS.Config && NUTS.Config._audioDefaults) {
      const a = NUTS.Config._audioDefaults;
      const seenKey = 'cbwwn-audio-touched';
      if (!localStorage.getItem(seenKey)) {
        if (a.sfxOn   != null) settings.sfxOn   = a.sfxOn;
        if (a.musicOn != null) settings.musicOn = a.musicOn;
        if (a.sfxVol  != null) settings.sfxVol  = a.sfxVol;
        if (a.musicVol != null) settings.musicVol = a.musicVol;
      }
    }
    audio.setSfxEnabled(settings.sfxOn);
    audio.setSfxVol(settings.sfxVol);
    audio.setMusicVol(settings.musicVol);
    if (settings.musicOn) audio.startMusic();
  }

  function startLevel(level) {
    currentLevel = level;
    ui.showScreen('screen-game');
    audio.resume();
    if (game) game.destroy();
    const stats = { collect: {}, jinx: 0, golden: 0 };
    ui.setHud(level, 0, level.moves);
    ui.renderObjectives(level, stats, 0);
    game = NUTS.Game(level, {
      boardEl: document.getElementById('board'),
      fxEl: document.getElementById('fx-layer'),
      onEvent: (kind, payload) => onGameEvent(kind, payload, level),
    });
    game.start();
  }

  function onGameEvent(kind, payload, level) {
    if (!game) return;
    const score = game.getScore ? game.getScore() : 0;
    const moves = game.getMoves ? game.getMoves() : 0;
    const stats = game.getStats ? game.getStats() : { collect: {}, jinx: 0, golden: 0 };
    if (kind === 'score') ui.pulseHud('hud-score');
    if (kind === 'moves') ui.pulseHud('hud-moves');
    ui.setHud(level, score, moves);
    ui.renderObjectives(level, stats, score);
    if (kind === 'win') endLevel(true, payload);
    if (kind === 'lose') endLevel(false, payload);
  }

  function endLevel(won, payload) {
    const lv = currentLevel;
    const score = payload.score;
    const stars = won ? computeStars(lv, score) : 0;
    if (won) {
      const prev = progress.stars[lv.id] || 0;
      if (stars > prev) progress.stars[lv.id] = stars;
      const prevBest = progress.best[lv.id] || 0;
      if (score > prevBest) progress.best[lv.id] = score;
      save();
      pushCloudSave();
      submitScoreToServer(lv, score, stars);
      setTimeout(() => audio.sfx.star(), 400);
      setTimeout(() => audio.sfx.star(), 600);
      setTimeout(() => audio.sfx.star(), 800);
    }
    const next = NUTS.levels.find((l) => l.id === lv.id + 1);
    setTimeout(() => {
      ui.showModal(
        `<h2>${won ? 'Victory!' : 'Hex Hath Fallen'}</h2>
         <p>${won ? `${lv.name} cleared with ${score.toLocaleString()} points` : `Out of moves on ${lv.name}`}</p>
         ${won ? `<div class="big-stars">
            <span class="${stars>=1?'star-on':'star-off'}">★</span>
            <span class="${stars>=2?'star-on':'star-off'}">★</span>
            <span class="${stars>=3?'star-on':'star-off'}">★</span>
         </div>` : ''}`,
        [
          { label: 'Map', onClick: () => { ui.hideModal(); openMap(); } },
          { label: 'Retry', onClick: () => { ui.hideModal(); startLevel(lv); } },
          ...(won && next ? [{ label: 'Next', primary: true, onClick: () => { ui.hideModal(); startLevel(next); } }] : []),
        ]
      );
    }, 700);
  }

  function computeStars(lv, score) {
    const t = lv.scoreStars || [0, 0, 0];
    if (score >= t[2]) return 3;
    if (score >= t[1]) return 2;
    if (score >= t[0]) return 1;
    return 1; /* won = at least 1 star */
  }

  function openMap() {
    ui.showScreen('screen-map');
    ui.renderMap(progress, (lv) => startLevel(lv));
  }

  function openTitle() { ui.showScreen('screen-title'); }

  function pause() {
    if (!game) return;
    ui.showModal(
      `<h2>Paused</h2><p>Take a breather, wizard.</p>`,
      [
        { label: 'Settings', onClick: () => { ui.hideModal(); ui.settingsModal(); } },
        { label: 'Quit to Map', onClick: () => { ui.hideModal(); if (game) { game.destroy(); game = null; } openMap(); } },
        { label: 'Resume', primary: true, onClick: () => ui.hideModal() },
      ]
    );
  }

  function resetProgress() {
    ui.showModal(
      `<h2>Reset Progress?</h2><p>This wipes all stars and unlocks. Cannot be undone.</p>`,
      [
        { label: 'Cancel', onClick: () => ui.hideModal() },
        { label: 'Wipe', primary: true, onClick: () => {
          progress = { stars: {}, best: {} };
          save();
          ui.hideModal();
          ui.toast('Progress reset.');
        } },
      ]
    );
  }

  function wireEvents() {
    document.getElementById('btn-play').onclick = () => { audio.sfx.click(); audio.resume(); openMap(); };
    document.getElementById('btn-settings').onclick = () => { audio.sfx.click(); ui.settingsModal(); };
    document.getElementById('btn-reset').onclick = () => { audio.sfx.click(); resetProgress(); };
    document.getElementById('btn-map-back').onclick = () => { audio.sfx.click(); openTitle(); };
    document.getElementById('btn-pause').onclick = () => { audio.sfx.click(); pause(); };
    /* Server-mode buttons */
    const lbBtn = document.getElementById('btn-leaderboard');
    if (lbBtn) lbBtn.onclick = () => { audio.sfx.click(); openLeaderboard(); };
    const dailyBtn = document.getElementById('btn-daily');
    if (dailyBtn) dailyBtn.onclick = () => { audio.sfx.click(); playDaily(); };
    const acctBtn = document.getElementById('btn-account');
    if (acctBtn) acctBtn.onclick = () => { audio.sfx.click(); accountModal(); };
    const lbBack = document.getElementById('btn-lb-back');
    if (lbBack) lbBack.onclick = () => { audio.sfx.click(); openTitle(); };
    const lbScope  = document.getElementById('lb-scope');
    const lbPeriod = document.getElementById('lb-period');
    if (lbScope)  lbScope.onchange  = renderLeaderboard;
    if (lbPeriod) lbPeriod.onchange = renderLeaderboard;
    window.addEventListener('resize', () => { if (game) game.resize(); });
    document.addEventListener('pointerdown', () => audio.resume(), { once: true });
  }

  function pushCloudSave() {
    if (!NUTS.Api || !NUTS.Api.isOnline() || !NUTS.Api.user()) return;
    NUTS.Api.pushCloudSave(progress);
  }

  function submitScoreToServer(lv, score, stars) {
    if (!NUTS.Api || !NUTS.Api.isOnline()) return;
    if (!NUTS.Api.user()) {
      /* Prompt for a name on the first WIN if user is anonymous */
      promptWizardName('You won! Pick a wizard name to save your score on the leaderboard.')
        .then((u) => { if (u) NUTS.Api.submitScore(lv.id, score, stars, lv.moves - game.getMoves()); });
      return;
    }
    NUTS.Api.submitScore(lv.id, score, stars, lv.moves - game.getMoves());
  }

  function promptWizardName(reason) {
    return new Promise((resolve) => {
      ui.showModal(`
        <h2>Choose Your Wizard Name</h2>
        <p>${reason || 'Pick a name to compete on the global leaderboards. 2-20 letters/numbers/spaces.'}</p>
        <input id="wn-input" type="text" maxlength="20" placeholder="e.g. Stardust the Bold"
               style="width:100%;padding:10px;margin-top:10px;background:rgba(0,0,0,0.4);
                      border:2px solid var(--gold);border-radius:8px;color:var(--parchment);
                      font-family:inherit;font-size:16px;text-align:center;">
        <p id="wn-err" class="muted" style="margin-top:8px;color:#ff7aa5;min-height:18px;"></p>
      `, [
        { label: 'Skip', onClick: () => { ui.hideModal(); resolve(null); } },
        { label: 'Claim Name', primary: true, onClick: async () => {
          const name = document.getElementById('wn-input').value.trim();
          const err = document.getElementById('wn-err');
          try {
            const u = await NUTS.Api.register(name);
            ui.hideModal();
            refreshOnlineStatus();
            ui.toast('Welcome, ' + (u.displayName || u.name) + '!');
            resolve(u);
          } catch (e) {
            const map = {
              invalid_name: 'Use 2-20 letters, numbers, or spaces.',
              name_taken:   'That name is already claimed by another wizard.',
              name_reserved: 'That name is reserved.',
              offline: 'Offline. The leaderboard server is unreachable.',
            };
            err.textContent = map[e.message] || ('Error: ' + e.message);
          }
        } },
      ]);
      setTimeout(() => {
        const inp = document.getElementById('wn-input');
        if (inp) inp.focus();
      }, 50);
    });
  }

  function accountModal() {
    const u = NUTS.Api && NUTS.Api.user();
    if (!u) { promptWizardName(); return; }
    ui.showModal(`
      <h2>Wizard Profile</h2>
      <p><strong>${escapeHtml(u.displayName || u.name)}</strong></p>
      <p class="muted" style="font-size:12px;">Handle: <code>${escapeHtml(u.name)}</code></p>
      <p style="margin-top:14px;">Display name (shown on leaderboards):</p>
      <input id="acct-display" type="text" maxlength="30" value="${escapeHtml(u.displayName || u.name)}"
             style="width:100%;padding:10px;background:rgba(0,0,0,0.4);
                    border:2px solid var(--gold);border-radius:8px;color:var(--parchment);
                    font-family:inherit;font-size:15px;">
    `, [
      { label: 'Sign Out', onClick: () => {
        if (!confirm('Sign out? Your local progress stays; you can sign in again with a new name.')) return;
        NUTS.Api.logout();
        ui.hideModal();
        refreshOnlineStatus();
      } },
      { label: 'Save', primary: true, onClick: async () => {
        const v = document.getElementById('acct-display').value.trim();
        if (v) await NUTS.Api.updateProfile({ displayName: v });
        ui.hideModal();
        refreshOnlineStatus();
        ui.toast('Profile updated.');
      } },
    ]);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function openLeaderboard() {
    if (!NUTS.Api || !NUTS.Api.isOnline()) {
      ui.toast('Leaderboards need server mode.');
      return;
    }
    /* Populate level options on first open */
    const scope = document.getElementById('lb-scope');
    if (scope.options.length <= 1) {
      NUTS.levels.forEach((lv) => {
        const opt = document.createElement('option');
        opt.value = 'level:' + lv.id;
        opt.textContent = `Chapter ${lv.id} — ${lv.name}`;
        scope.appendChild(opt);
      });
    }
    ui.showScreen('screen-leaderboard');
    renderLeaderboard();
  }

  async function renderLeaderboard() {
    const scope  = document.getElementById('lb-scope').value;
    const period = document.getElementById('lb-period').value;
    const list = document.getElementById('lb-list');
    list.innerHTML = '<div class="lb-empty">Loading…</div>';
    let data = null;
    if (scope === 'global') {
      data = await NUTS.Api.leaderboardGlobal(period, 25);
    } else {
      const lv = parseInt(scope.replace('level:', ''), 10);
      data = await NUTS.Api.leaderboard(lv, period, 25);
    }
    list.innerHTML = '';
    if (!data || !data.entries || !data.entries.length) {
      list.innerHTML = '<div class="lb-empty">No scores yet — be the first wizard on the board.</div>';
      return;
    }
    const me = NUTS.Api.user();
    data.entries.forEach((e) => {
      const row = document.createElement('div');
      const placeClass = e.rank === 1 ? 'gold' : e.rank === 2 ? 'silver' : e.rank === 3 ? 'bronze' : '';
      row.className = 'lb-row ' + placeClass + (me && e.name === me.name ? ' you' : '');
      const stars = '★'.repeat(Math.min(3, e.stars || 0)) + '☆'.repeat(Math.max(0, 3 - (e.stars || 0)));
      row.innerHTML = `
        <div class="lb-rank ${placeClass}">${e.rank}</div>
        <div class="lb-name">${escapeHtml(e.displayName || e.name)}<span class="lb-handle">@${escapeHtml(e.name)}</span></div>
        <div class="lb-stars">${stars}</div>
        <div class="lb-score">${e.score.toLocaleString()}</div>`;
      list.appendChild(row);
    });
  }

  async function playDaily() {
    if (!NUTS.Api || !NUTS.Api.isOnline()) {
      ui.toast('Daily Spell needs server mode.');
      return;
    }
    const d = await NUTS.Api.daily();
    if (!d || !d.level) { ui.toast('Could not load daily.'); return; }
    startLevel(d.level);
  }

  function init() {
    load();
    const ready = (NUTS.Config && NUTS.Config.ready) || Promise.resolve();
    /* Probe API in parallel with config load */
    const apiReady = (NUTS.Api && NUTS.Api.probe) ? NUTS.Api.probe() : Promise.resolve(false);
    Promise.all([ready, apiReady]).then(boot);
  }

  function boot() {
    applySettings();
    wireEvents();
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && NUTS.Background) NUTS.Background.init(bgCanvas);
    refreshOnlineStatus();
    /* Pull cloud save if logged in */
    if (NUTS.Api && NUTS.Api.isOnline() && NUTS.Api.user()) {
      NUTS.Api.loadCloudSave().then((cloud) => {
        if (cloud && cloud.stars) {
          /* Merge: keep highest stars per level, highest best score */
          Object.keys(cloud.stars || {}).forEach((k) => {
            const a = progress.stars[k] || 0;
            const b = cloud.stars[k] || 0;
            if (b > a) progress.stars[k] = b;
          });
          Object.keys(cloud.best || {}).forEach((k) => {
            const a = progress.best[k] || 0;
            const b = cloud.best[k] || 0;
            if (b > a) progress.best[k] = b;
          });
          save();
        }
      });
    }
    const hash = (location.hash || '').slice(1);
    if (hash === 'map' && Object.keys(progress.stars || {}).length > 0) {
      openMap();
    } else if (hash === 'play') {
      startLevel(NUTS.levels[0]);
    } else {
      openTitle();
    }
    registerSW();
  }

  function refreshOnlineStatus() {
    const elStat = document.getElementById('online-status');
    const isOn = NUTS.Api && NUTS.Api.isOnline();
    /* Reveal server-only buttons */
    document.querySelectorAll('.server-only').forEach((b) => { b.hidden = !isOn; });
    if (!elStat) return;
    if (!isOn) { elStat.classList.add('hidden'); return; }
    elStat.classList.remove('hidden');
    elStat.classList.add('online');
    const u = NUTS.Api.user();
    if (u) {
      elStat.classList.add('you');
      elStat.textContent = `Online · ${u.displayName || u.name}`;
    } else {
      elStat.classList.remove('you');
      elStat.textContent = 'Online · No wizard name yet';
    }
  }

  function registerSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { saveSettings };
})();
