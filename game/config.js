/* ========= CONFIG LOADER =========
 * Reads admin overrides from localStorage and merges them into the
 * defaults from textures.js + levels.js BEFORE the rest of the game
 * runs. Lets the admin GUI persist customisations without rebuilding.
 *
 * Storage key: cbwwn-config-v1
 * Shape:
 *   {
 *     version: 1,
 *     tiles:    { <id>: { label, glyph, color, bg, image, svgArt } },
 *     branding: { title, tagline, levelNamePrefix, backgroundImage, backgroundOverlayOpacity },
 *     levels:   [ { id, name, moves, scoreStars, objectives, jinxSeeds, goldenSeeds } ],
 *     audio:    { sfxOn, musicOn, sfxVol, musicVol }
 *   }
 *
 * Image fields are typically data: URLs (base64) so they survive
 * across sessions without writing to disk.
 */
window.NUTS = window.NUTS || {};

NUTS.Config = (function () {
  const KEY = 'cbwwn-config-v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Config] failed to load', e);
      return null;
    }
  }

  function save(cfg) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      console.warn('[Config] save failed (likely localStorage quota)', e);
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function apply(cfg) {
    if (!cfg) return;
    if (cfg.tiles && Array.isArray(NUTS.tileTypes)) {
      NUTS.tileTypes.forEach((t) => {
        const o = cfg.tiles[t.id];
        if (o) Object.assign(t, o);
      });
    }
    if (cfg.branding && NUTS.branding) {
      Object.assign(NUTS.branding, cfg.branding);
    }
    if (cfg.levels && Array.isArray(cfg.levels) && cfg.levels.length) {
      NUTS.levels = cfg.levels;
    }
    /* Audio defaults are applied by main.js on init via NUTS.audio */
    if (cfg.audio) {
      NUTS.Config._audioDefaults = cfg.audio;
    }
  }

  /* Apply localStorage immediately so static defaults are correct
   * before the rest of the scripts run. The optional config.json on
   * disk is fetched asynchronously and applied if present (server-
   * shipped baseline overridable by per-browser localStorage). */
  apply(load());

  const ready = (typeof fetch === 'function')
    ? fetch('config.json', { cache: 'no-cache' })
        .then((r) => r.ok ? r.json() : null)
        .then((diskCfg) => {
          if (!diskCfg) return;
          /* Disk config is the BASE; localStorage tweaks layer on top */
          apply(diskCfg);
          const local = load();
          if (local) apply(local);
        })
        .catch(() => {})
    : Promise.resolve();

  return {
    KEY,
    load,
    save,
    clear,
    apply,
    ready,
    /* Snapshot of current runtime config (for export) */
    snapshot() {
      const tiles = {};
      (NUTS.tileTypes || []).forEach((t) => {
        tiles[t.id] = {
          label: t.label, glyph: t.glyph, color: t.color, bg: t.bg,
          image: t.image, svgArt: t.svgArt,
        };
      });
      return {
        version: 1,
        tiles,
        branding: Object.assign({}, NUTS.branding || {}),
        levels: JSON.parse(JSON.stringify(NUTS.levels || [])),
        audio: NUTS.audio ? {
          sfxOn: NUTS.audio.state.sfxOn,
          musicOn: NUTS.audio.state.musicOn,
          sfxVol: NUTS.audio.state.sfxVol,
          musicVol: NUTS.audio.state.musicVol,
        } : null,
      };
    },
  };
})();
