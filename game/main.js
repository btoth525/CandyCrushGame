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
    window.addEventListener('resize', () => { if (game) game.resize(); });
    /* First user gesture starts audio context */
    document.addEventListener('pointerdown', () => audio.resume(), { once: true });
  }

  function init() {
    load();
    applySettings();
    wireEvents();
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas && NUTS.Background) NUTS.Background.init(bgCanvas);
    /* Respect PWA shortcut hashes: #map / #play */
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

  function registerSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { saveSettings };
})();
