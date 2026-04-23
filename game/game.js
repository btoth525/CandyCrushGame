/* ========= GAME ENGINE ========= */
window.NUTS = window.NUTS || {};

NUTS.Game = function (level, opts) {
  const ROWS = 8, COLS = 8;
  const SWAP_MS = 180, CLEAR_MS = 320, FALL_MS = 280;
  const types = NUTS.tileTypes;
  const audio = NUTS.audio;

  const boardEl = opts.boardEl;
  const fxEl = opts.fxEl;
  const onEvent = opts.onEvent || function () {};

  let board = [];
  let nextId = 1;
  let cellPx = 0;
  let score = 0;
  let moves = level.moves;
  let busy = false;
  let over = false;
  let selected = null;
  let chain = 0;
  const stats = { collect: {}, jinx: 0, golden: 0 };

  function newTile(typeId, extra) {
    return Object.assign({
      id: nextId++,
      type: typeId,
      special: null,
      jinx: 0,
      golden: false,
      el: null,
    }, extra || {});
  }

  function randType() {
    return types[Math.floor(Math.random() * types.length)].id;
  }

  function typeMeta(id) {
    return types.find((t) => t.id === id) || types[0];
  }

  function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

  function buildBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let t;
        let tries = 0;
        do {
          t = newTile(randType());
          row[c] = t;
          tries++;
        } while (tries < 30 && createsInitialMatch(row, c, r));
        row[c] = t;
      }
      board.push(row);
    }
    seedJinx(level.jinxSeeds || 0);
    seedGolden(level.goldenSeeds || 0);
  }

  function createsInitialMatch(row, c, r) {
    const t = row[c].type;
    if (c >= 2 && row[c - 1] && row[c - 2] && row[c - 1].type === t && row[c - 2].type === t) return true;
    if (r >= 2 && board[r - 1] && board[r - 2] && board[r - 1][c].type === t && board[r - 2][c].type === t) return true;
    return false;
  }

  function seedJinx(n) {
    let placed = 0, tries = 0;
    while (placed < n && tries < 200) {
      const r = Math.floor(Math.random() * (ROWS - 2)) + 1;
      const c = Math.floor(Math.random() * COLS);
      const t = board[r][c];
      if (t && !t.jinx && !t.golden) {
        t.jinx = 1;
        placed++;
      }
      tries++;
    }
  }

  function seedGolden(n) {
    let placed = 0;
    const usedCols = new Set();
    while (placed < n && usedCols.size < COLS) {
      const c = Math.floor(Math.random() * COLS);
      if (usedCols.has(c)) continue;
      usedCols.add(c);
      const t = board[0][c];
      if (t && !t.jinx) {
        t.golden = true;
        placed++;
      }
    }
  }

  function computeCellPx() {
    const wrap = boardEl.parentElement;
    /* Use the smaller of available width/height, minus the board's own
     * padding (12px total from 6px padding on each side). Cap at 720px
     * on very large screens so the board doesn't grow absurdly big. */
    const avail = Math.max(240, Math.min(wrap.clientWidth, wrap.clientHeight, 720));
    const boardInner = avail - 12;
    cellPx = Math.floor(boardInner / COLS);
    boardEl.style.width  = (cellPx * COLS + 12) + 'px';
    boardEl.style.height = (cellPx * ROWS + 12) + 'px';
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, ${cellPx}px)`;
    boardEl.style.gridTemplateRows    = `repeat(${ROWS}, ${cellPx}px)`;
  }

  function renderInitial() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        boardEl.appendChild(cell);
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (t) makeTileEl(t, r, c);
      }
    }
  }

  function makeTileEl(t, r, c) {
    const el = document.createElement('div');
    el.className = 'tile';
    const meta = typeMeta(t.type);
    el.style.background = `linear-gradient(180deg, ${meta.color} 0%, ${meta.bg || meta.color} 100%)`;
    el.style.width = cellPx + 'px';
    el.style.height = cellPx + 'px';
    el.style.transform = `translate(${c * cellPx}px, ${r * cellPx}px)`;
    /* Priority: external PNG > inline SVG > emoji glyph */
    if (meta.image) {
      const img = document.createElement('img');
      img.className = 'tile-img';
      img.src = meta.image;
      img.alt = meta.label;
      img.onerror = () => {
        img.remove();
        fallbackArt(el, meta);
      };
      el.appendChild(img);
    } else {
      fallbackArt(el, meta);
    }
    applySpecialClasses(el, t);
    el.dataset.id = t.id;
    el.addEventListener('pointerdown', (e) => onTilePointer(e, r, c));
    boardEl.appendChild(el);
    t.el = el;
  }

  function fallbackArt(el, meta) {
    if (meta.svgArt && NUTS.tileArt && NUTS.tileArt[meta.svgArt]) {
      const wrap = document.createElement('div');
      wrap.className = 'tile-svg';
      wrap.innerHTML = NUTS.tileArt[meta.svgArt];
      el.appendChild(wrap);
    } else {
      el.appendChild(glyphSpan(meta.glyph));
    }
  }

  function glyphSpan(g) {
    const s = document.createElement('span');
    s.className = 'tile-glyph';
    s.textContent = g;
    return s;
  }

  function applySpecialClasses(el, t) {
    el.classList.remove('special-striped_h','special-striped_v','special-wrapped','special-colorbomb','jinx','jinx-2','golden');
    if (t.special) el.classList.add('special-' + t.special);
    if (t.jinx >= 1) el.classList.add('jinx');
    if (t.jinx >= 2) el.classList.add('jinx-2');
    if (t.golden) el.classList.add('golden');
  }

  function moveTileEl(t, r, c, ms, cls) {
    if (!t.el) return Promise.resolve();
    if (cls) t.el.classList.add(cls);
    t.el.style.transition = `transform ${ms}ms ease`;
    t.el.style.transform = `translate(${c * cellPx}px, ${r * cellPx}px)`;
    return wait(ms).then(() => {
      if (cls && t.el) t.el.classList.remove(cls);
    });
  }

  function findCellAt(r, c) {
    return { r, c };
  }

  function findRC(tile) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] === tile) return { r, c };
      }
    }
    return null;
  }

  function onTilePointer(e, r, c) {
    if (busy || over) return;
    audio.resume();
    bumpIdle();
    clearHint();
    const t = board[r][c];
    if (!t) return;
    if (t.jinx > 0) { audio.sfx.bad(); return; }
    /* If something is already selected, treat this as the second tap */
    if (selected) {
      const { r: sr, c: sc } = selected;
      if (sr === r && sc === c) { deselect(); return; }
      if (Math.abs(sr - r) + Math.abs(sc - c) === 1) {
        const a = board[sr][sc], b = board[r][c];
        deselect();
        if (a && b && !a.jinx && !b.jinx) attemptSwap(sr, sc, r, c, a, b);
        return;
      }
      deselect();
    }
    /* Begin drag/tap on this tile. If pointer moves enough, swap with
     * the neighbour in that direction; if it lifts in place, just
     * select it (classic tap-tap-to-swap). */
    e.preventDefault && e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    let didSwap = false;
    function onMove(ev) {
      if (didSwap) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const threshold = Math.max(12, cellPx * 0.35);
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      let dr = 0, dc = 0;
      if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1;
      else                              dr = dy > 0 ? 1 : -1;
      const r2 = r + dr, c2 = c + dc;
      if (!inBounds(r2, c2)) return;
      const b = board[r2][c2];
      if (!b || b.jinx > 0) { audio.sfx.bad(); cleanup(); return; }
      didSwap = true;
      cleanup();
      deselect();
      attemptSwap(r, c, r2, c2, t, b);
    }
    function onUp() {
      cleanup();
      if (didSwap) return;
      /* No drag -> classic tap-select */
      selected = { r, c };
      if (t.el) t.el.classList.add('selected');
    }
    function cleanup() {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel', onUp);
    }
    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel', onUp);
  }

  function deselect() {
    if (selected) {
      const t = board[selected.r] && board[selected.r][selected.c];
      if (t && t.el) t.el.classList.remove('selected');
    }
    selected = null;
  }

  async function attemptSwap(r1, c1, r2, c2, a, b) {
    busy = true;
    audio.sfx.swap();
    swapInBoard(r1, c1, r2, c2);
    await Promise.all([
      moveTileEl(a, r2, c2, SWAP_MS, 'swapping'),
      moveTileEl(b, r1, c1, SWAP_MS, 'swapping'),
    ]);
    const isSpecialPair = a.special || b.special;
    let resolved = false;
    if (isSpecialPair) {
      const did = await trySpecialCombo(r1, c1, r2, c2, a, b);
      if (did) resolved = true;
    }
    if (!resolved) {
      const matches = findMatches();
      if (matches.length === 0) {
        swapInBoard(r1, c1, r2, c2);
        audio.sfx.bad();
        await Promise.all([
          moveTileEl(a, r1, c1, SWAP_MS, 'swapping'),
          moveTileEl(b, r2, c2, SWAP_MS, 'swapping'),
        ]);
        busy = false;
        return;
      }
      await resolveCascades({ swappedAt: [{ r: r1, c: c1 }, { r: r2, c: c2 }] });
    } else {
      await resolveCascades({});
    }
    moves--;
    onEvent('moves', moves);
    checkEnd();
    busy = false;
  }

  function swapInBoard(r1, c1, r2, c2) {
    const tmp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = tmp;
  }

  function findMatches() {
    const m = [];
    for (let r = 0; r < ROWS; r++) {
      let run = 1;
      for (let c = 1; c <= COLS; c++) {
        const prev = board[r][c - 1];
        const cur = c < COLS ? board[r][c] : null;
        if (cur && prev && cur.type === prev.type && !cur.jinx && !prev.jinx) {
          run++;
        } else {
          if (run >= 3) {
            const cells = [];
            for (let k = 0; k < run; k++) cells.push({ r, c: c - 1 - k });
            m.push({ cells, len: run, dir: 'h' });
          }
          run = 1;
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      let run = 1;
      for (let r = 1; r <= ROWS; r++) {
        const prev = board[r - 1][c];
        const cur = r < ROWS ? board[r][c] : null;
        if (cur && prev && cur.type === prev.type && !cur.jinx && !prev.jinx) {
          run++;
        } else {
          if (run >= 3) {
            const cells = [];
            for (let k = 0; k < run; k++) cells.push({ r: r - 1 - k, c });
            m.push({ cells, len: run, dir: 'v' });
          }
          run = 1;
        }
      }
    }
    return m;
  }

  async function resolveCascades(ctx) {
    chain = 0;
    while (true) {
      const matches = findMatches();
      if (matches.length === 0) break;
      chain++;
      if (chain > 1) showCombo(chain);
      await processMatches(matches, ctx);
      ctx = {};
      await applyGravity();
    }
    await collectGolden();
    /* If the player is left without any valid swap, reshuffle */
    if (!over && !findHint()) await reshuffleBoard();
    bumpIdle();
  }

  /* =========================================================
     HINT SYSTEM + NO-MOVES RESHUFFLE
     ========================================================= */
  function findHint() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (!t || t.jinx) continue;
        /* Try swap right */
        if (c + 1 < COLS) {
          const t2 = board[r][c + 1];
          if (t2 && !t2.jinx) {
            swapInBoard(r, c, r, c + 1);
            const has = findMatches().length > 0;
            swapInBoard(r, c, r, c + 1);
            if (has) return [{ r, c }, { r, c: c + 1 }];
          }
        }
        /* Try swap down */
        if (r + 1 < ROWS) {
          const t2 = board[r + 1][c];
          if (t2 && !t2.jinx) {
            swapInBoard(r, c, r + 1, c);
            const has = findMatches().length > 0;
            swapInBoard(r, c, r + 1, c);
            if (has) return [{ r, c }, { r: r + 1, c }];
          }
        }
      }
    }
    return null;
  }

  function showHint() {
    const h = findHint();
    if (!h) return;
    h.forEach(({ r, c }) => {
      const t = board[r][c];
      if (t && t.el) t.el.classList.add('hint');
    });
  }
  function clearHint() {
    boardEl.querySelectorAll('.tile.hint').forEach((el) => el.classList.remove('hint'));
  }

  let idleTimer = 0;
  function bumpIdle() {
    clearHint();
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (!busy && !over) showHint(); }, 6000);
  }

  async function reshuffleBoard() {
    /* Collect the "loose" tiles (non-jinx, non-golden, non-special). */
    const loose = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (t && !t.jinx && !t.golden && !t.special) loose.push({ r, c, t });
      }
    }
    if (loose.length < 4) return;
    /* Shuffle the types around until both (a) there's no immediate
     * matches on the resulting board AND (b) at least one valid swap
     * exists. Cap retries so we never spin forever. */
    const pool = loose.map((x) => x.t.type);
    let attempts = 0;
    do {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      loose.forEach((x, i) => { x.t.type = pool[i]; });
      attempts++;
    } while ((findMatches().length > 0 || !findHint()) && attempts < 80);

    /* Rebuild tile visuals for the loose set. */
    loose.forEach((x) => {
      if (x.t.el) { x.t.el.remove(); x.t.el = null; }
      makeTileEl(x.t, x.r, x.c);
    });
    spawnFloatText(Math.floor(ROWS / 2), Math.floor(COLS / 2), 'SHUFFLE!');
    audio.sfx.specialCreate();
    await wait(250);
  }

  async function processMatches(matches, ctx) {
    audio.sfx.match(chain);
    if (NUTS.Achievements) {
      NUTS.Achievements.unlock('first_match');
      if (chain >= 5) NUTS.Achievements.unlock('combo_5');
    }
    const toClear = new Set();
    const specialsToCreate = [];
    const cleared = []; /* {r,c, type} */
    matches.forEach((m) => {
      m.cells.forEach((p) => toClear.add(p.r + ',' + p.c));
      if (m.len >= 5) {
        const at = preferredCreatePos(m, ctx);
        specialsToCreate.push({ r: at.r, c: at.c, type: 'colorbomb', baseType: null });
      } else if (m.len === 4) {
        const at = preferredCreatePos(m, ctx);
        const sp = m.dir === 'h' ? 'striped_v' : 'striped_h';
        specialsToCreate.push({ r: at.r, c: at.c, type: sp, baseType: board[m.cells[0].r][m.cells[0].c].type });
      }
    });
    /* Activate any specials caught in matches */
    const activated = new Set();
    toClear.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = board[r][c];
      if (t && t.special && !activated.has(t.id)) {
        activated.add(t.id);
        activateSpecial(r, c, t, toClear);
      }
    });
    /* Reduce jinx on neighbors of any cleared tile */
    const jinxHit = new Set();
    toClear.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => {
        if (!inBounds(nr,nc)) return;
        const nt = board[nr][nc];
        if (nt && nt.jinx > 0 && !toClear.has(nr+','+nc)) jinxHit.add(nr+','+nc);
      });
    });
    /* Mark specials-to-create cells so we don't clear them */
    const keepForSpecial = new Set(specialsToCreate.map(s => s.r + ',' + s.c));
    const promises = [];
    toClear.forEach((k) => {
      if (keepForSpecial.has(k)) return;
      const [r, c] = k.split(',').map(Number);
      const t = board[r][c];
      if (!t) return;
      cleared.push({ r, c, type: t.type, golden: t.golden });
      score += 50 * chain;
      onEvent('score', score);
      stats.collect[t.type] = (stats.collect[t.type] || 0) + 1;
      onEvent('collect', { tile: t.type, count: stats.collect[t.type] });
      spawnSparks(r, c, typeMeta(t.type).color);
      if (t.el) {
        t.el.classList.add('clearing');
        promises.push(wait(CLEAR_MS).then(() => t.el && t.el.remove()));
      }
      board[r][c] = null;
    });
    /* Convert specials-to-create */
    specialsToCreate.forEach((s) => {
      const t = board[s.r][s.c];
      if (!t) {
        const tt = newTile(s.baseType || randType(), { special: s.type });
        board[s.r][s.c] = tt;
        makeTileEl(tt, s.r, s.c);
      } else {
        t.special = s.type;
        if (s.type === 'colorbomb') t.type = randType();
        applySpecialClasses(t.el, t);
      }
      audio.sfx.specialCreate();
      spawnFloatText(s.r, s.c, s.type === 'colorbomb' ? 'PATRONUS!' : 'BOMBARDA!');
      /* Achievements */
      if (NUTS.Achievements) {
        if (s.type === 'colorbomb') NUTS.Achievements.unlock('patronus');
        else NUTS.Achievements.unlock('bombarda');
      }
    });
    /* Reduce jinx layers */
    jinxHit.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = board[r][c];
      if (!t) return;
      t.jinx--;
      applySpecialClasses(t.el, t);
      if (t.jinx === 0) {
        stats.jinx++;
        onEvent('jinx', stats.jinx);
        score += 200;
        onEvent('score', score);
        audio.sfx.jinxClear();
        spawnFloatText(r, c, '+200');
      }
    });
    if (chain >= 3) shake();
    if (chain >= 4) spawnLightning();
    await Promise.all(promises);
  }

  function preferredCreatePos(m, ctx) {
    if (ctx && ctx.swappedAt) {
      for (const p of ctx.swappedAt) {
        if (m.cells.some((c) => c.r === p.r && c.c === p.c)) return p;
      }
    }
    return m.cells[Math.floor(m.cells.length / 2)];
  }

  function activateSpecial(r, c, t, toClear) {
    if (t.special === 'striped_h') {
      for (let cc = 0; cc < COLS; cc++) addClear(r, cc, toClear);
    } else if (t.special === 'striped_v') {
      for (let rr = 0; rr < ROWS; rr++) addClear(rr, c, toClear);
    } else if (t.special === 'wrapped') {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (inBounds(r+dr, c+dc)) addClear(r+dr, c+dc, toClear);
    } else if (t.special === 'colorbomb') {
      const target = randType();
      for (let rr = 0; rr < ROWS; rr++)
        for (let cc = 0; cc < COLS; cc++) {
          const x = board[rr][cc];
          if (x && x.type === target && !x.jinx) addClear(rr, cc, toClear);
        }
    }
    audio.sfx[t.special === 'colorbomb' ? 'patronus' : t.special === 'wrapped' ? 'incendio' : 'bombarda']();
    if (t.el) spawnSparks(r, c, '#fff');
    spawnShockwave(r, c, t.special === 'colorbomb' ? 'violet' : (t.special === 'wrapped' ? 'crimson' : ''));
    if (t.special === 'colorbomb') spawnLightning();
  }

  function addClear(r, c, toClear) {
    if (!inBounds(r, c)) return;
    const t = board[r][c];
    if (!t || t.jinx > 0) return;
    const k = r + ',' + c;
    if (toClear.has(k)) return;
    toClear.add(k);
    if (t.special) activateSpecial(r, c, t, toClear);
  }

  async function trySpecialCombo(r1, c1, r2, c2, a, b) {
    const isCB = (t) => t && t.special === 'colorbomb';
    if (isCB(a) && isCB(b)) {
      const all = new Set();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (board[r][c] && !board[r][c].jinx) all.add(r+','+c);
      }
      audio.sfx.patronus();
      shake();
      await processFromSet(all);
      return true;
    }
    if (isCB(a) || isCB(b)) {
      const cb = isCB(a) ? a : b;
      const other = isCB(a) ? b : a;
      const target = other.type;
      const set = new Set();
      const cbPos = isCB(a) ? { r: r2, c: c2 } : { r: r1, c: c1 };
      set.add(cbPos.r + ',' + cbPos.c);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (t && t.type === target && !t.jinx) set.add(r+','+c);
      }
      audio.sfx.patronus();
      await processFromSet(set);
      return true;
    }
    return false;
  }

  async function processFromSet(toClear) {
    chain = Math.max(chain, 1);
    const promises = [];
    toClear.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = board[r][c];
      if (!t) return;
      if (t.special) activateSpecial(r, c, t, toClear);
    });
    toClear.forEach((k) => {
      const [r, c] = k.split(',').map(Number);
      const t = board[r][c];
      if (!t) return;
      score += 80;
      onEvent('score', score);
      stats.collect[t.type] = (stats.collect[t.type] || 0) + 1;
      onEvent('collect', { tile: t.type, count: stats.collect[t.type] });
      spawnSparks(r, c, '#fff');
      if (t.el) {
        t.el.classList.add('clearing');
        promises.push(wait(CLEAR_MS).then(() => t.el && t.el.remove()));
      }
      board[r][c] = null;
    });
    await Promise.all(promises);
  }

  async function applyGravity() {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
      let writeR = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        const t = board[r][c];
        if (t) {
          if (writeR !== r) {
            board[writeR][c] = t;
            board[r][c] = null;
            moves.push({ t, r: writeR, c });
          }
          writeR--;
        }
      }
      /* Spawn new tiles to fill the top */
      let spawnFrom = -1;
      for (let r = writeR; r >= 0; r--) {
        const nt = newTile(randType());
        board[r][c] = nt;
        makeTileEl(nt, spawnFrom, c);
        nt.el.style.transition = 'none';
        nt.el.style.transform = `translate(${c * cellPx}px, ${spawnFrom * cellPx}px)`;
        moves.push({ t: nt, r, c });
        spawnFrom--;
      }
    }
    if (moves.length === 0) return;
    audio.sfx.drop();
    /* Force reflow then animate */
    boardEl.offsetHeight;
    const promises = moves.map((m) => moveTileEl(m.t, m.r, m.c, FALL_MS, 'falling'));
    await Promise.all(promises);
  }

  async function collectGolden() {
    let collected = 0;
    for (let c = 0; c < COLS; c++) {
      const t = board[ROWS - 1][c];
      if (t && t.golden) {
        collected++;
        stats.golden++;
        score += 500;
        onEvent('score', score);
        onEvent('golden', stats.golden);
        audio.sfx.goldenDrop();
        spawnFloatText(ROWS - 1, c, '+500');
        spawnSparks(ROWS - 1, c, '#fbbf24');
        if (t.el) {
          t.el.classList.add('clearing');
          setTimeout(() => t.el && t.el.remove(), CLEAR_MS);
        }
        board[ROWS - 1][c] = null;
      }
    }
    if (collected > 0) {
      await wait(CLEAR_MS);
      await applyGravity();
    }
  }

  function spawnSparks(r, c, color) {
    const x = c * cellPx + cellPx / 2 + 6;
    const y = r * cellPx + cellPx / 2 + 6;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const col = i % 3 === 0 ? '#ffd764' : (i % 3 === 1 ? color : '#ffffff');
      s.style.background = col;
      s.style.color = col;
      const size = 4 + Math.random() * 8;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = 40 + Math.random() * 50;
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      fxEl.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  function spawnShockwave(r, c, variant) {
    const x = c * cellPx + cellPx / 2 + 6;
    const y = r * cellPx + cellPx / 2 + 6;
    const s = document.createElement('div');
    s.className = 'shockwave' + (variant ? ' ' + variant : '');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.width = cellPx + 'px';
    s.style.height = cellPx + 'px';
    fxEl.appendChild(s);
    setTimeout(() => s.remove(), 720);
  }

  function spawnLightning() {
    const f = document.createElement('div');
    f.className = 'lightning-flash';
    fxEl.appendChild(f);
    setTimeout(() => f.remove(), 400);
  }

  function spawnFloatText(r, c, text) {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.left = (c * cellPx + cellPx / 2 + 6) + 'px';
    el.style.top  = (r * cellPx + 6) + 'px';
    fxEl.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function showCombo(n) {
    const labels = ['', '', 'COMBO!', 'BIG COMBO!', 'HUGE COMBO!', 'SPELLBINDING!', 'WIZARDLY!', 'LEGENDARY!'];
    const text = labels[Math.min(n, labels.length - 1)] || `${n}x COMBO!`;
    const el = document.getElementById('combo-popup');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    audio.sfx.combo(n);
  }

  function shake() {
    boardEl.classList.remove('shake');
    void boardEl.offsetWidth;
    boardEl.classList.add('shake');
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function checkEnd() {
    const won = level.objectives.every((o) => objectiveDone(o));
    if (won) {
      over = true;
      audio.sfx.win();
      onEvent('win', { score, stats });
      return;
    }
    if (moves <= 0) {
      over = true;
      audio.sfx.lose();
      onEvent('lose', { score, stats });
    }
  }

  function objectiveDone(o) {
    if (o.type === 'score') return score >= o.target;
    if (o.type === 'collect') return (stats.collect[o.tile] || 0) >= o.count;
    if (o.type === 'jinx') return stats.jinx >= o.count;
    if (o.type === 'golden') return stats.golden >= o.count;
    return true;
  }

  function attachBoardTilt() {
    /* One transform on the board element, not 64 -- HW accelerated. */
    const wrap = boardEl.parentElement;
    if (!wrap || wrap._tiltAttached) return;
    wrap._tiltAttached = true;
    let tx = 0, ty = 0, raf = 0;
    function paint() {
      raf = 0;
      boardEl.style.transform = `rotateX(${ty}deg) rotateY(${tx}deg)`;
    }
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5;
      const py = (e.clientY - r.top)  / r.height - 0.5;
      tx =  px * 6;   /* yaw degrees */
      ty = -py * 6;   /* pitch degrees */
      if (!raf) raf = requestAnimationFrame(paint);
    });
    wrap.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(paint);
    });
  }

  function start() {
    buildBoard();
    computeCellPx();
    renderInitial();
    attachBoardTilt();
    onEvent('moves', moves);
    onEvent('score', 0);
    onEvent('start', { level });
    /* Resolve any accidental initial matches silently, then make sure
     * the starting board actually HAS a valid swap somewhere. */
    setTimeout(async () => {
      busy = true;
      while (findMatches().length > 0) {
        await processMatches(findMatches(), {});
        await applyGravity();
      }
      if (!findHint()) await reshuffleBoard();
      busy = false;
      bumpIdle();
    }, 50);
  }

  function destroy() {
    boardEl.innerHTML = '';
    fxEl.innerHTML = '';
  }

  function resize() {
    if (!board.length) return;
    computeCellPx();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board[r][c];
        if (t && t.el) {
          t.el.style.width = cellPx + 'px';
          t.el.style.height = cellPx + 'px';
          t.el.style.transition = 'none';
          t.el.style.transform = `translate(${c * cellPx}px, ${r * cellPx}px)`;
        }
      }
    }
  }

  return { start, destroy, resize, getStats: () => stats, getScore: () => score, getMoves: () => moves };
};
