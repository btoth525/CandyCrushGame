/* ========= ADMIN PANEL LOGIC =========
 * Renders editors for tiles, branding, levels, audio.
 * Persists to localStorage via NUTS.Config.
 * Drag-and-drop image upload -> base64 data URL.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const qs = (s, r) => (r || document).querySelector(s);
  const qsa = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---- Working snapshot we mutate, save on demand ---- */
  let cfg = NUTS.Config.snapshot();

  /* =========================================================
     TABS
     ========================================================= */
  qsa('.tab').forEach((tab) => {
    tab.onclick = () => {
      qsa('.tab').forEach((t) => t.classList.remove('active'));
      qsa('.tab-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $('tab-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'preview') reloadPreview();
    };
  });

  /* =========================================================
     TILES
     ========================================================= */
  function renderTiles() {
    const root = $('tile-grid');
    root.innerHTML = '';
    NUTS.tileTypes.forEach((tile) => {
      const card = document.createElement('div');
      card.className = 'tile-card';
      card.innerHTML = `
        <div class="tile-preview" data-id="${tile.id}"></div>
        <div class="tile-fields">
          <div class="field-row">
            <label>ID</label>
            <input type="text" value="${escapeAttr(tile.id)}" disabled>
          </div>
          <div class="field-row">
            <label>Name</label>
            <input type="text" data-field="label" value="${escapeAttr(tile.label || '')}" maxlength="40">
          </div>
          <div class="field-row">
            <label>Glyph</label>
            <input type="text" data-field="glyph" value="${escapeAttr(tile.glyph || '')}" maxlength="4">
          </div>
          <div class="field-row row-double" style="grid-template-columns: 70px 1fr 70px 1fr;">
            <label>Color</label><input type="color" data-field="color" value="${tile.color || '#444444'}">
            <label>Rim</label><input type="color" data-field="bg" value="${tile.bg || '#222222'}">
          </div>
          <div class="field-row tile-image-row">
            <label>Image</label>
            <div class="image-drop" data-tile="${tile.id}">
              <div class="image-drop-inner">
                <div class="drop-icon">🖼</div>
                <div class="drop-label">Drop PNG/JPG or click</div>
                <input type="file" accept="image/*" hidden>
              </div>
            </div>
          </div>
        </div>`;
      root.appendChild(card);

      const preview = qs('.tile-preview', card);
      const inputs = qsa('input[data-field]', card);
      inputs.forEach((inp) => {
        inp.addEventListener('input', () => {
          tile[inp.dataset.field] = inp.value;
          rememberTile(tile);
          paintTilePreview(preview, tile);
        });
      });
      const drop = qs('.image-drop', card);
      wireImageDrop(drop, (dataUrl) => {
        tile.image = dataUrl;
        rememberTile(tile);
        paintTilePreview(preview, tile);
        renderImageInDrop(drop, dataUrl, () => {
          tile.image = '';
          rememberTile(tile);
          paintTilePreview(preview, tile);
          drop.querySelector('.image-drop-inner').style.display = '';
          const img = drop.querySelector('img'); if (img) img.remove();
          const btn = drop.querySelector('.btn-small'); if (btn) btn.remove();
        });
      }, { maxW: 256, quality: 0.92 });
      if (tile.image) renderImageInDrop(drop, tile.image, () => {
        tile.image = ''; rememberTile(tile); paintTilePreview(preview, tile);
        drop.querySelector('.image-drop-inner').style.display = '';
        const img = drop.querySelector('img'); if (img) img.remove();
        const btn = drop.querySelector('.btn-small'); if (btn) btn.remove();
      });
      paintTilePreview(preview, tile);
    });
  }

  function paintTilePreview(el, tile) {
    el.innerHTML = '';
    el.style.background = `linear-gradient(180deg, ${tile.color || '#444'} 0%, ${tile.bg || tile.color || '#222'} 100%)`;
    if (tile.image) {
      const img = document.createElement('img');
      img.src = tile.image;
      el.appendChild(img);
    } else if (tile.svgArt && NUTS.tileArt && NUTS.tileArt[tile.svgArt]) {
      const wrap = document.createElement('div');
      wrap.className = 'tp-svg';
      wrap.innerHTML = NUTS.tileArt[tile.svgArt];
      el.appendChild(wrap);
    } else {
      const span = document.createElement('span');
      span.className = 'tp-glyph';
      span.textContent = tile.glyph || '?';
      el.appendChild(span);
    }
  }

  function rememberTile(tile) {
    if (!cfg.tiles) cfg.tiles = {};
    cfg.tiles[tile.id] = {
      label: tile.label,
      glyph: tile.glyph,
      color: tile.color,
      bg: tile.bg,
      image: tile.image || '',
      svgArt: tile.svgArt,
    };
  }

  /* =========================================================
     BRANDING
     ========================================================= */
  function renderBranding() {
    const b = Object.assign({}, NUTS.branding || {}, cfg.branding || {});
    $('brand-title').value   = b.title || '';
    $('brand-tagline').value = b.tagline || '';
    $('brand-prefix').value  = b.levelNamePrefix || 'Chapter';
    $('brand-bg-opacity').value = b.backgroundOverlayOpacity != null ? b.backgroundOverlayOpacity : 0.45;
    $('bg-op-label').textContent = $('brand-bg-opacity').value;

    ['title', 'tagline', 'levelNamePrefix'].forEach((k) => {
      const el = $({title: 'brand-title', tagline: 'brand-tagline', levelNamePrefix: 'brand-prefix'}[k]);
      el.addEventListener('input', () => {
        cfg.branding = cfg.branding || {};
        cfg.branding[k] = el.value;
      });
    });
    $('brand-bg-opacity').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      $('bg-op-label').textContent = v.toFixed(2);
      cfg.branding = cfg.branding || {};
      cfg.branding.backgroundOverlayOpacity = v;
    });

    /* Background image drop */
    const drop = $('bg-drop');
    const preview = $('bg-preview');
    const clearBtn = $('bg-clear');
    function showBg(url) {
      if (!url) { preview.hidden = true; clearBtn.hidden = true; return; }
      preview.src = url;
      preview.hidden = false;
      clearBtn.hidden = false;
    }
    showBg(b.backgroundImage || '');
    wireImageDrop(drop, (dataUrl) => {
      cfg.branding = cfg.branding || {};
      cfg.branding.backgroundImage = dataUrl;
      showBg(dataUrl);
      toast('Backdrop loaded — Save to apply');
    }, { maxW: 1920, quality: 0.82 });
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      cfg.branding = cfg.branding || {};
      cfg.branding.backgroundImage = '';
      showBg('');
    };
  }

  /* =========================================================
     LEVELS
     ========================================================= */
  function renderLevels() {
    const root = $('level-list');
    root.innerHTML = '';
    const levels = (cfg.levels && cfg.levels.length) ? cfg.levels : NUTS.levels;
    levels.forEach((lv, idx) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      const stars = lv.scoreStars || [0, 0, 0];
      const story = lv.story || { intro: '', win: '', lose: '' };
      card.innerHTML = `
        <div class="lc-head">
          <div class="lc-num">${lv.id}</div>
          <input type="text" data-k="name" value="${escapeAttr(lv.name)}" maxlength="40">
        </div>
        <div class="lc-grid">
          <label>Moves</label>
          <input type="number" data-k="moves" value="${lv.moves}" min="5" max="99">
          <label>1★ score</label>
          <input type="number" data-k="s1" value="${stars[0]}" min="0" step="500">
          <label>2★ score</label>
          <input type="number" data-k="s2" value="${stars[1]}" min="0" step="500">
          <label>3★ score</label>
          <input type="number" data-k="s3" value="${stars[2]}" min="0" step="500">
        </div>
        <div class="lc-stories">
          <label class="lc-story-label">Story · Intro</label>
          <textarea data-k="intro" rows="2" maxlength="280" placeholder="Shown before the level. {name} expands to wizard name.">${escapeAttr(story.intro || '')}</textarea>
          <label class="lc-story-label">Story · Victory line</label>
          <textarea data-k="win" rows="2" maxlength="280" placeholder="Shown when the player wins.">${escapeAttr(story.win || '')}</textarea>
          <label class="lc-story-label">Story · Defeat line</label>
          <textarea data-k="lose" rows="2" maxlength="280" placeholder="Shown when the player runs out of moves.">${escapeAttr(story.lose || '')}</textarea>
        </div>
        <div class="lc-obj">${objectiveSummary(lv)}</div>`;
      root.appendChild(card);
      qsa('input, textarea', card).forEach((inp) => {
        inp.addEventListener('input', () => {
          /* Lazy clone levels so we mutate cfg, not defaults */
          if (!cfg.levels || cfg.levels.length === 0) {
            cfg.levels = JSON.parse(JSON.stringify(NUTS.levels));
          }
          const target = cfg.levels[idx];
          if (inp.dataset.k === 'name')  target.name  = inp.value;
          if (inp.dataset.k === 'moves') target.moves = Math.max(5, Math.min(99, parseInt(inp.value || '0', 10) || 0));
          if (inp.dataset.k === 's1')    target.scoreStars = [intv(inp), target.scoreStars ? target.scoreStars[1] : 0, target.scoreStars ? target.scoreStars[2] : 0];
          if (inp.dataset.k === 's2')    target.scoreStars = [target.scoreStars[0], intv(inp), target.scoreStars[2]];
          if (inp.dataset.k === 's3')    target.scoreStars = [target.scoreStars[0], target.scoreStars[1], intv(inp)];
          if (inp.dataset.k === 'intro' || inp.dataset.k === 'win' || inp.dataset.k === 'lose') {
            if (!target.story) target.story = { intro: '', win: '', lose: '' };
            target.story[inp.dataset.k] = inp.value;
          }
        });
      });
    });
  }
  function intv(inp) { return Math.max(0, parseInt(inp.value || '0', 10) || 0); }

  function objectiveSummary(lv) {
    return (lv.objectives || []).map((o) => {
      if (o.type === 'score')   return `Score ${o.target.toLocaleString()}`;
      if (o.type === 'collect') return `Collect ${o.count} ${o.tile}`;
      if (o.type === 'jinx')    return `Clear ${o.count} jinxed`;
      if (o.type === 'golden')  return `Drop ${o.count} golden`;
      return JSON.stringify(o);
    }).join(' • ');
  }

  /* =========================================================
     AUDIO
     ========================================================= */
  function renderAudio() {
    const a = Object.assign({ sfxOn: true, musicOn: true, sfxVol: 0.7, musicVol: 0.35 }, cfg.audio || {});
    $('audio-sfx').checked   = !!a.sfxOn;
    $('audio-music').checked = !!a.musicOn;
    $('audio-sfx-vol').value = a.sfxVol;
    $('audio-music-vol').value = a.musicVol;
    $('vol-sfx-label').textContent   = (+a.sfxVol).toFixed(2);
    $('vol-music-label').textContent = (+a.musicVol).toFixed(2);
    const update = () => {
      cfg.audio = {
        sfxOn:   $('audio-sfx').checked,
        musicOn: $('audio-music').checked,
        sfxVol:   parseFloat($('audio-sfx-vol').value),
        musicVol: parseFloat($('audio-music-vol').value),
      };
      $('vol-sfx-label').textContent   = cfg.audio.sfxVol.toFixed(2);
      $('vol-music-label').textContent = cfg.audio.musicVol.toFixed(2);
    };
    ['audio-sfx', 'audio-music', 'audio-sfx-vol', 'audio-music-vol'].forEach((id) => {
      $(id).addEventListener('input', update);
      $(id).addEventListener('change', update);
    });
  }

  /* =========================================================
     IMAGE DROP HELPER
     ========================================================= */
  function wireImageDrop(drop, onLoaded, opts) {
    const input = drop.querySelector('input[type=file]');
    drop.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      input.click();
    });
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (f) readImage(f, onLoaded, opts);
      input.value = '';
    });
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) readImage(f, onLoaded, opts);
    });
  }

  function readImage(file, cb, opts) {
    if (!/^image\//.test(file.type)) {
      toast('That is not an image.');
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      const maxW = (opts && opts.maxW) || 1920;
      const quality = (opts && opts.quality) || 0.85;
      /* Resize + JPEG-compress anything bigger than 150KB so it fits
       * comfortably in localStorage and the server config. Transparent
       * PNGs (tiles) keep their format when small. */
      if (file.size > 150 * 1024 || /^image\/heic|image\/heif/.test(file.type)) {
        compressImage(r.result, maxW, quality).then((url) => {
          cb(url);
          if (url !== r.result) {
            const kb = Math.round(url.length / 1400); /* rough base64 decode size */
            toast(`Image compressed to ~${kb}KB`);
          }
        });
      } else {
        cb(r.result);
      }
    };
    r.onerror = () => toast('Failed to read file.');
    r.readAsDataURL(file);
  }

  function compressImage(dataUrl, maxW, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.max(1, Math.round(img.width  * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const cx = canvas.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        try {
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out.length < dataUrl.length ? out : dataUrl);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function renderImageInDrop(drop, dataUrl, onClear) {
    let img = drop.querySelector('img');
    if (!img) { img = document.createElement('img'); drop.appendChild(img); }
    img.src = dataUrl;
    drop.querySelector('.image-drop-inner').style.display = 'none';
    let btn = drop.querySelector('.btn-small');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'btn btn-small btn-danger';
      btn.textContent = 'Remove';
      btn.onclick = (e) => { e.stopPropagation(); onClear(); };
      drop.appendChild(btn);
    }
  }

  /* =========================================================
     SAVE / EXPORT / IMPORT / RESET
     ========================================================= */
  function save() {
    const ok = NUTS.Config.save(cfg);
    if (ok) {
      toast('Saved! Reload the game to see changes.');
      reloadPreview();
    } else {
      toast('Save failed — likely localStorage full. Try removing large images or exporting JSON.');
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wizarding-nuts-config.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
        cfg = parsed;
        NUTS.Config.apply(cfg);
        renderAll();
        toast('Imported. Click Save & Apply to persist.');
      } catch (e) {
        toast('Invalid config JSON.');
      }
    };
    r.readAsText(file);
  }

  function resetAll() {
    if (!confirm('Wipe all admin customisations and restore the default tiles, branding, levels, audio?')) return;
    NUTS.Config.clear();
    cfg = { version: 1 };
    /* Reload page so defaults reappear cleanly */
    location.reload();
  }

  /* =========================================================
     PREVIEW
     ========================================================= */
  function reloadPreview() {
    const f = $('preview-frame');
    if (f) f.src = 'index.html?ts=' + Date.now();
  }

  /* =========================================================
     TOAST
     ========================================================= */
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), 2500);
  }

  /* =========================================================
     UTILITIES
     ========================================================= */
  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* =========================================================
     SERVER PUSH (when ADMIN_TOKEN is set on the container)
     ========================================================= */
  let serverState = { enabled: false, authenticated: false, hasConfig: false };

  async function probeServer() {
    try {
      const r = await fetch('/api/admin/status', {
        cache: 'no-cache',
        headers: tokenHeader(),
      });
      if (r.ok) serverState = await r.json();
    } catch (e) { serverState.enabled = false; }
    paintServerState();
    paintGate();
  }

  /* ========================================================================
     PASSWORD GATE -- shown when the server has ADMIN_TOKEN set and the
     user has not yet supplied a valid token.
     ======================================================================== */
  function paintGate() {
    const gate = $('admin-gate');
    if (!gate) return;
    const needsAuth = !!serverState.enabled && !serverState.authenticated;
    if (needsAuth) {
      gate.classList.remove('hidden');
      gate.classList.add('active');
    } else {
      gate.classList.add('hidden');
      gate.classList.remove('active');
    }
  }

  async function trySubmitGate() {
    const inp = $('gate-pw');
    const err = $('gate-err');
    const tok = (inp.value || '').trim();
    err.textContent = '';
    if (!tok) { err.textContent = 'Enter the admin token.'; return; }
    /* Validate by hitting an admin-protected endpoint */
    try {
      const r = await fetch('/api/admin/config', {
        cache: 'no-cache',
        headers: { 'Authorization': 'Bearer ' + tok },
      });
      if (r.status === 401) { err.textContent = 'Wrong token.'; return; }
      if (!r.ok && r.status !== 404) { err.textContent = 'Error: ' + r.status; return; }
      sessionStorage.setItem('admin-token', tok);
      probeServer(); /* this hides the gate when authenticated */
    } catch (e) {
      err.textContent = 'Network error reaching the server.';
    }
  }

  function paintServerState() {
    const tabBtn = $('tab-btn-server');
    const pushBtn = $('btn-push');
    const stateEl = $('server-state');
    const enabled = !!serverState.enabled;
    if (tabBtn)  tabBtn.hidden  = !enabled;
    if (pushBtn) pushBtn.hidden = !enabled;
    if (!stateEl) return;
    if (!enabled) {
      stateEl.textContent = 'Admin push is disabled. Set ADMIN_TOKEN env var on the server container to enable.';
      stateEl.parentElement.classList.add('error');
      return;
    }
    stateEl.parentElement.classList.remove('error');
    if (!serverState.authenticated) {
      stateEl.textContent = serverState.hasConfig
        ? 'Server has a published config. Enter your admin token to push or pull.'
        : 'No server config published yet. Enter your admin token to push the first one.';
    } else {
      stateEl.innerHTML = serverState.hasConfig
        ? '✅ Authenticated. A server config is currently live.'
        : '✅ Authenticated. No server config yet — push your local one to publish.';
    }
  }

  function tokenHeader() {
    const t = sessionStorage.getItem('admin-token') || '';
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  function setAdminToken(t) {
    if (t) sessionStorage.setItem('admin-token', t);
    else sessionStorage.removeItem('admin-token');
    probeServer();
  }

  async function pushToServer() {
    const t = sessionStorage.getItem('admin-token') || '';
    if (!t) { toast('Enter the admin token first.'); return; }
    try {
      const r = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, tokenHeader()),
        body: JSON.stringify(cfg),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast(data.error === 'unauthorized' ? 'Wrong admin token.' : 'Push failed: ' + (data.error || r.status));
        return;
      }
      toast(`Published! ${(data.size / 1024).toFixed(1)}KB live for everyone.`);
      probeServer();
    } catch (e) { toast('Network error pushing config.'); }
  }

  async function pullFromServer() {
    try {
      const r = await fetch('/api/admin/config', {
        cache: 'no-cache',
        headers: tokenHeader(),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { toast('Pull failed: ' + (data.error || r.status)); return; }
      if (!data.config) { toast('No server config to pull.'); return; }
      cfg = data.config;
      NUTS.Config.apply(cfg);
      renderAll();
      toast('Pulled. Click Save Locally to persist.');
    } catch (e) { toast('Network error pulling config.'); }
  }

  async function clearServer() {
    if (!confirm('Wipe the server-side published config? Visitors will fall back to bundled defaults.')) return;
    try {
      const r = await fetch('/api/admin/config', {
        method: 'DELETE',
        headers: tokenHeader(),
      });
      if (!r.ok) { toast('Clear failed.'); return; }
      toast('Server config cleared.');
      probeServer();
    } catch (e) { toast('Network error clearing config.'); }
  }

  /* =========================================================
     WIRE EVERYTHING
     ========================================================= */
  function renderAll() {
    renderTiles();
    renderBranding();
    renderLevels();
    renderAudio();
  }

  $('btn-save').onclick   = save;
  $('btn-export').onclick = exportJson;
  $('btn-reset').onclick  = resetAll;
  $('file-import').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJson(f);
    e.target.value = '';
  });
  const reloadBtn = $('btn-preview-reload');
  if (reloadBtn) reloadBtn.onclick = reloadPreview;

  /* Password gate wiring */
  const gateSubmit = $('gate-submit');
  if (gateSubmit) gateSubmit.onclick = trySubmitGate;
  const gatePw = $('gate-pw');
  if (gatePw) gatePw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); trySubmitGate(); }
  });

  /* Server-mode wiring */
  const tokenInput = $('admin-token');
  if (tokenInput) {
    tokenInput.value = sessionStorage.getItem('admin-token') || '';
    tokenInput.addEventListener('input', () => setAdminToken(tokenInput.value.trim()));
  }
  const pushBtn = $('btn-push');
  if (pushBtn) pushBtn.onclick = pushToServer;
  const pushBtn2 = $('btn-push-server');
  if (pushBtn2) pushBtn2.onclick = pushToServer;
  const pullBtn = $('btn-pull-server');
  if (pullBtn) pullBtn.onclick = pullFromServer;
  const clearBtn = $('btn-clear-server');
  if (clearBtn) clearBtn.onclick = clearServer;
  probeServer();

  /* Cmd/Ctrl+S to save */
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  });

  renderAll();
})();
