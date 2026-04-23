/* ========= ACHIEVEMENTS =========
 * Define unlockable badges. Code is the durable identifier sent to
 * the server; everything else is purely cosmetic.
 *
 * Unlocks live in localStorage (offline-friendly) and -- when server
 * mode is available -- are mirrored to the server so they survive
 * device changes and show up on profile pages.
 */
window.NUTS = window.NUTS || {};

NUTS.achievements = [
  { code: 'first_match',   name: 'First Spell Cast',     desc: 'Make your first match.',                    icon: '⚡',  rarity: 'common' },
  { code: 'first_win',     name: 'First Victory',        desc: 'Complete your first level.',                icon: '⭐',  rarity: 'common' },
  { code: 'bombarda',      name: 'Bombarda!',            desc: 'Create your first Bombarda (match 4).',     icon: '💥',  rarity: 'common' },
  { code: 'patronus',      name: 'Patronus Conjured',    desc: 'Create your first Patronus (match 5).',     icon: '✨',  rarity: 'rare'   },
  { code: 'three_star',    name: 'Perfect Cast',         desc: 'Earn 3 stars on any level.',                icon: '🌟',  rarity: 'rare'   },
  { code: 'combo_5',       name: 'Spellbinding',         desc: 'Reach a 5-chain combo.',                    icon: '⚡⚡', rarity: 'rare'   },
  { code: 'streak_3',      name: 'On a Roll',            desc: 'Play three days in a row.',                 icon: '🔥',  rarity: 'rare'   },
  { code: 'streak_7',      name: 'Devoted Wizard',       desc: 'Play seven days in a row.',                 icon: '🔥🔥', rarity: 'epic'   },
  { code: 'daily_first',   name: 'Daily Dedicated',      desc: 'Complete a Daily Spell.',                   icon: '🌙',  rarity: 'rare'   },
  { code: 'top_10',        name: 'Quidditch Champion',   desc: 'Reach top 10 on the global leaderboard.',   icon: '🏆',  rarity: 'epic'   },
  { code: 'all_three_star',name: 'Master Wizard',        desc: 'Earn 3 stars on every level.',              icon: '🪄',  rarity: 'legendary' },
];

NUTS.Achievements = (function () {
  const KEY = 'cbwwn-ach';
  function getUnlocked() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveUnlocked(map) {
    try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {}
  }
  function isUnlocked(code) { return !!getUnlocked()[code]; }

  function unlock(code, opts) {
    const map = getUnlocked();
    if (map[code]) return false; /* already had it */
    map[code] = Date.now();
    saveUnlocked(map);
    /* mirror to server in best-effort fashion */
    if (NUTS.Api && NUTS.Api.isOnline && NUTS.Api.isOnline() && NUTS.Api.user && NUTS.Api.user()) {
      fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('cbwwn-auth') || ''),
        },
        body: JSON.stringify({ code }),
      }).catch(() => {});
    }
    if (!opts || !opts.silent) showToast(code);
    return true;
  }

  function showToast(code) {
    const def = NUTS.achievements.find((a) => a.code === code);
    if (!def) return;
    const el = document.createElement('div');
    el.className = 'ach-toast rarity-' + def.rarity;
    el.innerHTML =
      `<div class="ach-toast-icon">${def.icon}</div>` +
      `<div class="ach-toast-body">` +
        `<div class="ach-toast-head">Achievement Unlocked</div>` +
        `<div class="ach-toast-name">${escapeHtml(def.name)}</div>` +
        `<div class="ach-toast-desc">${escapeHtml(def.desc)}</div>` +
      `</div>`;
    document.body.appendChild(el);
    if (NUTS.audio && NUTS.audio.sfx && NUTS.audio.sfx.star) NUTS.audio.sfx.star();
    setTimeout(() => el.classList.add('out'), 4000);
    setTimeout(() => el.remove(), 4500);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderModal() {
    const map = getUnlocked();
    const total = NUTS.achievements.length;
    const got = Object.keys(map).length;
    const list = NUTS.achievements.map((a) => {
      const u = !!map[a.code];
      return `<div class="ach-row rarity-${a.rarity} ${u ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${u ? a.icon : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${escapeHtml(a.name)}</div>
          <div class="ach-desc">${escapeHtml(a.desc)}</div>
        </div>
      </div>`;
    }).join('');
    return `
      <h2>Achievements <span style="color:var(--gold-bright);font-size:0.7em;">${got}/${total}</span></h2>
      <div class="ach-list">${list}</div>`;
  }

  return { unlock, isUnlocked, getUnlocked, renderModal };
})();
