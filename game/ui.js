/* ========= UI LAYER ========= */
window.NUTS = window.NUTS || {};

NUTS.UI = (function () {
  const $ = (id) => document.getElementById(id);

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function showModal(html, buttons) {
    const back = $('modal-backdrop');
    const content = $('modal-content');
    content.innerHTML = html;
    if (buttons && buttons.length) {
      const row = document.createElement('div');
      row.className = 'modal-buttons';
      buttons.forEach((b) => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.primary ? 'btn-primary' : '');
        btn.textContent = b.label;
        btn.onclick = () => {
          NUTS.audio.sfx.click();
          if (b.onClick) b.onClick();
        };
        row.appendChild(btn);
      });
      content.appendChild(row);
    }
    back.classList.remove('hidden');
  }

  function hideModal() { $('modal-backdrop').classList.add('hidden'); }

  function toast(msg, ms) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), ms || 1800);
  }

  function renderMap(progress, onPick) {
    const root = $('map-nodes');
    root.innerHTML = '';
    let totalStars = 0;
    NUTS.levels.forEach((lv, idx) => {
      const stars = (progress.stars && progress.stars[lv.id]) || 0;
      totalStars += stars;
      const unlocked = idx === 0 || ((progress.stars && progress.stars[NUTS.levels[idx - 1].id]) || 0) > 0;
      const node = document.createElement('div');
      node.className = 'map-node' + (unlocked ? '' : ' locked');
      node.innerHTML =
        `<div class="map-node-num">${lv.id}</div>` +
        `<div class="map-node-info">` +
          `<div class="map-node-name">${escapeHtml(lv.name)}</div>` +
          `<div class="map-node-obj">${objectiveSummary(lv)}</div>` +
        `</div>` +
        `<div class="map-node-stars">` +
          starHtml(stars >= 1) + starHtml(stars >= 2) + starHtml(stars >= 3) +
        `</div>`;
      if (unlocked) {
        node.onclick = () => { NUTS.audio.sfx.click(); onPick(lv); };
      }
      root.appendChild(node);
    });
    $('stars-total').textContent = totalStars;
    $('stars-max').textContent = NUTS.levels.length * 3;
  }

  function starHtml(on) {
    return `<span class="${on ? 'star-on' : 'star-off'}">★</span>`;
  }

  function objectiveSummary(lv) {
    return lv.objectives.map((o) => {
      if (o.type === 'score') return `Score ${o.target.toLocaleString()}`;
      if (o.type === 'collect') {
        const meta = NUTS.tileTypes.find((t) => t.id === o.tile);
        return `Collect ${o.count} ${meta ? meta.label : o.tile}`;
      }
      if (o.type === 'jinx') return `Clear ${o.count} jinxed`;
      if (o.type === 'golden') return `Drop ${o.count} golden acorns`;
      return '';
    }).join(' • ') + ` · ${lv.moves} moves`;
  }

  function renderObjectives(level, stats, score) {
    const root = $('objectives');
    root.innerHTML = '';
    level.objectives.forEach((o) => {
      const chip = document.createElement('div');
      chip.className = 'obj-chip';
      let icon = '⭐', cur = 0, tgt = 1, label = '';
      if (o.type === 'score') {
        icon = '⭐'; cur = score; tgt = o.target; label = `${cur.toLocaleString()}/${tgt.toLocaleString()}`;
      } else if (o.type === 'collect') {
        const meta = NUTS.tileTypes.find((t) => t.id === o.tile);
        icon = meta ? meta.glyph : '·';
        cur = (stats.collect[o.tile] || 0);
        tgt = o.count; label = `${Math.min(cur, tgt)}/${tgt}`;
      } else if (o.type === 'jinx') {
        icon = '🔒'; cur = stats.jinx; tgt = o.count; label = `${Math.min(cur, tgt)}/${tgt}`;
      } else if (o.type === 'golden') {
        icon = '👑'; cur = stats.golden; tgt = o.count; label = `${Math.min(cur, tgt)}/${tgt}`;
      }
      chip.innerHTML = `<span class="obj-icon">${icon}</span><span>${label}</span>`;
      if (cur >= tgt) chip.classList.add('done');
      root.appendChild(chip);
    });
  }

  function pulseHud(id) {
    const el = $(id).parentElement;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function setHud(level, score, moves) {
    if ($('hud-level').textContent !== String(level.id)) $('hud-level').textContent = level.id;
    $('hud-score').textContent = score.toLocaleString();
    $('hud-moves').textContent = moves;
    $('level-name').textContent = `${NUTS.branding.levelNamePrefix} ${level.id} — ${level.name}`;
  }

  function settingsModal() {
    const a = NUTS.audio.state;
    showModal(`
      <h2>Settings</h2>
      <div class="settings-row">
        <label>Sound effects</label>
        <div class="switch ${a.sfxOn ? 'on' : ''}" data-sw="sfx"></div>
      </div>
      <div class="settings-row">
        <label>Background music</label>
        <div class="switch ${a.musicOn ? 'on' : ''}" data-sw="music"></div>
      </div>
      <div class="settings-row">
        <label>SFX volume</label>
        <input class="slider" type="range" min="0" max="1" step="0.05" value="${a.sfxVol}" data-sl="sfx">
      </div>
      <div class="settings-row">
        <label>Music volume</label>
        <input class="slider" type="range" min="0" max="1" step="0.05" value="${a.musicVol}" data-sl="music">
      </div>
    `, [{ label: 'Done', primary: true, onClick: hideModal }]);
    document.querySelectorAll('[data-sw]').forEach((sw) => {
      sw.onclick = () => {
        sw.classList.toggle('on');
        const on = sw.classList.contains('on');
        if (sw.dataset.sw === 'sfx') NUTS.audio.setSfxEnabled(on);
        else NUTS.audio.setMusicEnabled(on);
        save();
      };
    });
    document.querySelectorAll('[data-sl]').forEach((sl) => {
      sl.oninput = (e) => {
        const v = parseFloat(e.target.value);
        if (sl.dataset.sl === 'sfx') NUTS.audio.setSfxVol(v);
        else NUTS.audio.setMusicVol(v);
        save();
      };
    });
  }

  function save() { if (NUTS.Main && NUTS.Main.saveSettings) NUTS.Main.saveSettings(); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return {
    showScreen, showModal, hideModal, toast,
    renderMap, renderObjectives, setHud, pulseHud,
    settingsModal,
  };
})();
