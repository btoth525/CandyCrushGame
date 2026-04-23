/* ========= BACKGROUND SCENE (v2) =========
 * A mind-bending castle scene: towering Hogwarts-style keep on a cliff
 * over a waterfall and reflecting lake, multi-arch stone bridge, clock
 * tower with glowing face, dozens of flickering windows, floating
 * candles, drifting clouds, shooting stars, lightning, and an aurora
 * shimmer behind it all.
 */
window.NUTS = window.NUTS || {};

NUTS.Background = (function () {
  let canvas, ctx, w, h, dpr;
  let t = 0;
  let particles = [];
  let floaters = [];
  let clouds = [];
  let shooters = [];
  let lightningT = 0;
  let nextLightningAt = 0;
  let nextShooterAt = 0;
  let running = false;
  let rafId = 0;

  /* Parallax tilt target */
  let tiltX = 0, tiltY = 0;
  let bgImg = null;
  let bgImgLoaded = false;
  let bgImgFade = 0;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onTilt, { passive: true });
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', onOrient, { passive: true });
    }
    /* Optional user-supplied photo backdrop */
    const src = (NUTS.branding && NUTS.branding.backgroundImage) || '';
    if (src) {
      bgImg = new Image();
      bgImg.onload = () => { bgImgLoaded = true; };
      bgImg.onerror = () => { bgImg = null; };
      bgImg.src = src;
    }
    seed();
    scheduleLightning();
    nextShooterAt = 3 + Math.random() * 5;
    if (!running) { running = true; loop(); }
  }

  function onTilt(e) {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    tiltX = nx * 14;
    tiltY = ny * 10;
  }

  function onOrient(e) {
    if (e.gamma != null) tiltX = Math.max(-14, Math.min(14, e.gamma / 3));
    if (e.beta  != null) tiltY = Math.max(-10, Math.min(10, (e.beta - 45) / 6));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.4,
        sp: 0.08 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 0.3,
        hue: Math.random() < 0.35 ? 50 : (Math.random() < 0.5 ? 285 : 210),
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    /* Floating candles */
    floaters = [];
    for (let i = 0; i < 18; i++) {
      floaters.push({
        x: 0.15 + Math.random() * 0.7,
        y: 0.5 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
        size: 1.6 + Math.random() * 1.6,
      });
    }
    /* Clouds */
    clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * w,
        y: 60 + Math.random() * 100,
        sp: 0.08 + Math.random() * 0.12,
        scale: 0.8 + Math.random() * 0.8,
        op: 0.12 + Math.random() * 0.1,
      });
    }
    shooters = [];
  }

  function scheduleLightning() { nextLightningAt = t + 7 + Math.random() * 16; }

  function loop() {
    t += 1 / 60;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function draw() {
    /* ==== Sky gradient ==== */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0,    '#1f0f44');
    g.addColorStop(0.35, '#140832');
    g.addColorStop(0.75, '#08041a');
    g.addColorStop(1,    '#03010a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* ==== Optional photo backdrop (user-supplied) ==== */
    if (bgImgLoaded && bgImg) {
      bgImgFade = Math.min(1, bgImgFade + 0.01);
      ctx.save();
      ctx.globalAlpha = bgImgFade;
      /* cover-fit */
      const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
      const sc = Math.max(w / iw, h / ih);
      const dw = iw * sc, dh = ih * sc;
      const dx = (w - dw) / 2 + tiltX * 0.6;
      const dy = (h - dh) / 2 + tiltY * 0.4;
      ctx.drawImage(bgImg, dx, dy, dw, dh);
      /* Darken overlay so sky effects still read */
      const op = (NUTS.branding && NUTS.branding.backgroundOverlayOpacity != null)
        ? NUTS.branding.backgroundOverlayOpacity : 0.45;
      ctx.fillStyle = `rgba(10, 5, 25, ${op})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    /* ==== Aurora shimmer ==== */
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const phase = t * 0.12 + i * 2.1;
      const grad = ctx.createLinearGradient(0, h * 0.15, 0, h * 0.55);
      const hue = 260 + Math.sin(phase) * 40;
      grad.addColorStop(0, `hsla(${hue}, 80%, 55%, 0)`);
      grad.addColorStop(0.5, `hsla(${hue}, 85%, 60%, ${0.08 + 0.04 * Math.sin(phase * 1.3)})`);
      grad.addColorStop(1, `hsla(${hue + 40}, 80%, 50%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      for (let x = 0; x <= w; x += 30) {
        const y = h * 0.25 + Math.sin(x * 0.005 + phase + i) * 30 + Math.sin(x * 0.012 - phase) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(0, h * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    /* ==== Distant stars ==== */
    ctx.save();
    for (let i = 0; i < 140; i++) {
      const x = ((i * 137.5) % w);
      const y = ((i * 53.7) % (h * 0.55));
      const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + i);
      ctx.globalAlpha = 0.5 * tw;
      const golden = i % 13 === 0;
      ctx.fillStyle = golden ? '#ffd764' : '#fff';
      const sz = golden ? 2 : 1.2;
      ctx.fillRect(x - tiltX * 0.3, y - tiltY * 0.2, sz, sz);
    }
    ctx.restore();

    /* ==== Clouds (drifting in front of moon) ==== */
    for (const c of clouds) {
      c.x += c.sp;
      if (c.x - 200 * c.scale > w) c.x = -200 * c.scale;
      drawCloud(c.x - tiltX * 0.6, c.y - tiltY * 0.4, c.scale, c.op);
    }

    /* ==== Moon + halo ==== */
    const moonX = w * 0.75 - tiltX * 0.5;
    const moonY = h * 0.18 - tiltY * 0.4;
    const moonR = Math.min(w, h) * 0.07;
    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 6);
    halo.addColorStop(0, 'rgba(255, 236, 170, 0.55)');
    halo.addColorStop(0.3, 'rgba(255, 236, 170, 0.14)');
    halo.addColorStop(1, 'rgba(255, 236, 170, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 6, 0, Math.PI * 2); ctx.fill();
    const mg = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.2, moonX, moonY, moonR);
    mg.addColorStop(0, '#fff6d0');
    mg.addColorStop(0.7, '#f5dd88');
    mg.addColorStop(1, '#b89244');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
    /* Moon craters */
    ctx.fillStyle = 'rgba(180, 140, 70, 0.3)';
    ctx.beginPath(); ctx.arc(moonX + moonR * 0.2, moonY - moonR * 0.1, moonR * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX - moonR * 0.15, moonY + moonR * 0.25, moonR * 0.1, 0, Math.PI * 2); ctx.fill();

    /* ==== Shooting stars ==== */
    if (t >= nextShooterAt) {
      shooters.push({
        x: Math.random() * w * 0.6,
        y: Math.random() * h * 0.3,
        vx: 6 + Math.random() * 4,
        vy: 1 + Math.random() * 2,
        life: 1,
      });
      nextShooterAt = t + 4 + Math.random() * 10;
    }
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += s.vx; s.y += s.vy; s.life -= 0.02;
      if (s.life <= 0) { shooters.splice(i, 1); continue; }
      const grad = ctx.createLinearGradient(s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, `rgba(255, 240, 180, ${s.life})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 8, s.y - s.vy * 8);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }

    /* ==== Far mountains (hidden when user photo loaded) ==== */
    if (!bgImgLoaded) {
      drawMountains(h * 0.60, 10, '#0a0620', 0.85, tiltX * 0.2);
      drawMountains(h * 0.66, 8,  '#0d0526', 1,    tiltX * 0.4);
    }

    /* ==== The castle (hidden when user photo loaded so their photo reads) ==== */
    if (!bgImgLoaded) {
      drawCastleComplex(w * 0.5 + tiltX * 0.8, h * 0.72 + tiltY * 0.2, Math.min(w * 0.9, h * 0.8));
    }

    /* ==== Water / lake at base with reflection + ripples ==== */
    drawLake(h * 0.82);

    /* ==== Fog band ==== */
    const fog = ctx.createLinearGradient(0, h * 0.68, 0, h);
    fog.addColorStop(0, 'rgba(40, 22, 70, 0)');
    fog.addColorStop(0.5, 'rgba(40, 22, 70, 0.45)');
    fog.addColorStop(1, 'rgba(15, 8, 35, 0.85)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    /* Fog wisps */
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
      const y = h * 0.78 + i * 22;
      const phase = t * (0.25 + i * 0.08) + i * 1.7;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 20) {
        const yy = y + Math.sin(x * 0.01 + phase) * 10 + Math.sin(x * 0.03 - phase) * 4;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = '#b69ae0';
      ctx.fill();
    }
    ctx.restore();

    /* ==== Floating candles ==== */
    for (const f of floaters) {
      const fx = f.x * w + Math.sin(t * f.speed + f.phase) * 6;
      const fy = f.y * h + Math.cos(t * f.speed * 0.7 + f.phase) * 4;
      drawCandle(fx - tiltX * 0.3, fy - tiltY * 0.2, f.size, t * 8 + f.phase);
    }

    /* ==== Magical particles ==== */
    for (const p of particles) {
      p.y -= p.sp; p.x += p.drift; p.twinkle += 0.05;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      const alpha = 0.35 + 0.35 * Math.sin(p.twinkle);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    /* ==== Lightning ==== */
    if (t >= nextLightningAt && lightningT <= 0) {
      lightningT = 0.7;
      scheduleLightning();
    }
    if (lightningT > 0) {
      const a = lightningT / 0.7;
      ctx.save();
      ctx.globalAlpha = a * 0.45;
      ctx.fillStyle = '#e8d9ff';
      ctx.fillRect(0, 0, w, h * 0.65);
      ctx.restore();
      if (lightningT > 0.45) {
        ctx.save();
        ctx.strokeStyle = 'rgba(230, 220, 255, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#e8d9ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        let bx = w * (0.35 + Math.random() * 0.4), by = 0;
        ctx.moveTo(bx, by);
        while (by < h * 0.55) {
          by += 22 + Math.random() * 26;
          bx += (Math.random() - 0.5) * 50;
          ctx.lineTo(bx, by);
          if (Math.random() < 0.3) {
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (Math.random() - 0.5) * 40, by + 30 + Math.random() * 20);
            ctx.moveTo(bx, by);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
      lightningT -= 1 / 60;
    }
  }

  function drawCloud(x, y, s, op) {
    ctx.save();
    ctx.globalAlpha = op;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, 100 * s);
    grad.addColorStop(0, 'rgba(200, 200, 240, 0.9)');
    grad.addColorStop(1, 'rgba(80, 70, 140, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x,          y,      70 * s, 22 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 55 * s, y - 4,  50 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 50 * s, y + 2,  45 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCandle(x, y, size, flicker) {
    const fl = 0.75 + 0.25 * Math.sin(flicker);
    const r = size * (2 + fl);
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
    halo.addColorStop(0, `rgba(255, 200, 100, ${0.45 * fl})`);
    halo.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, r * 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 220, 120, ${0.95 * fl})`;
    ctx.shadowColor = '#ffcc66';
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    /* tiny wick silhouette below */
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 0.5, y + size, 1, size * 2);
  }

  function drawMountains(baseY, peaks, color, opacity, parallax) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.translate(parallax || 0, 0);
    ctx.beginPath();
    ctx.moveTo(-50, h);
    const step = (w + 100) / peaks;
    for (let i = 0; i <= peaks; i++) {
      const x = -50 + i * step;
      const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1);
      const peakY = baseY - (60 + seed * 120);
      ctx.lineTo(x - step * 0.5, baseY);
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(w + 50, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawLake(waterY) {
    /* Lake surface with reflection + animated ripples */
    ctx.save();
    const lg = ctx.createLinearGradient(0, waterY, 0, h);
    lg.addColorStop(0, 'rgba(40, 30, 80, 0.8)');
    lg.addColorStop(0.3, 'rgba(15, 10, 35, 0.9)');
    lg.addColorStop(1, 'rgba(3, 2, 10, 1)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, waterY, w, h - waterY);

    /* Moonlight reflection shimmer */
    const rx = w * 0.75;
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 6; i++) {
      const yOff = i * 10 + Math.sin(t * 1.4 + i) * 2;
      const wd = 80 - i * 8;
      ctx.fillStyle = `rgba(255, 236, 170, ${0.2 - i * 0.025})`;
      ctx.fillRect(rx - wd / 2, waterY + 10 + yOff, wd, 3);
    }
    /* Ripple lines */
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(180, 170, 230, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = waterY + 8 + i * 16 + Math.sin(t + i) * 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 18) {
        const yy = y + Math.sin(x * 0.03 + t + i * 0.3) * 2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCastleComplex(cx, cy, scale) {
    const s = scale;
    ctx.save();
    ctx.translate(cx, cy);

    /* Cliff base */
    ctx.fillStyle = '#05020e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, 0);
    ctx.lineTo(-s * 0.52, -s * 0.06);
    ctx.lineTo(-s * 0.42, -s * 0.08);
    ctx.lineTo(-s * 0.3,  -s * 0.1);
    ctx.lineTo(-s * 0.15, -s * 0.14);
    ctx.lineTo(0,          -s * 0.16);
    ctx.lineTo(s * 0.15,  -s * 0.15);
    ctx.lineTo(s * 0.3,   -s * 0.12);
    ctx.lineTo(s * 0.45,  -s * 0.08);
    ctx.lineTo(s * 0.55,  -s * 0.04);
    ctx.lineTo(s * 0.58,  0);
    ctx.lineTo(s * 0.58,  s * 0.4);
    ctx.lineTo(-s * 0.55, s * 0.4);
    ctx.closePath();
    ctx.fill();

    /* Waterfall pouring off left cliff */
    ctx.save();
    ctx.fillStyle = 'rgba(220, 220, 255, 0.18)';
    ctx.fillRect(-s * 0.36, -s * 0.05, s * 0.05, s * 0.42);
    ctx.fillStyle = 'rgba(220, 220, 255, 0.08)';
    ctx.fillRect(-s * 0.38, -s * 0.05, s * 0.09, s * 0.42);
    /* Waterfall mist */
    const mist = ctx.createRadialGradient(-s * 0.335, s * 0.37, 0, -s * 0.335, s * 0.37, s * 0.12);
    mist.addColorStop(0, 'rgba(220, 220, 255, 0.35)');
    mist.addColorStop(1, 'rgba(220, 220, 255, 0)');
    ctx.fillStyle = mist;
    ctx.beginPath(); ctx.arc(-s * 0.335, s * 0.37, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* Stone bridge with arches from far-left to central tower base */
    ctx.save();
    ctx.fillStyle = '#0a051b';
    const bridgeY = -s * 0.02;
    const bridgeLen = s * 0.35;
    ctx.fillRect(-s * 0.55, bridgeY - s * 0.015, bridgeLen, s * 0.04);
    /* Arches */
    ctx.fillStyle = '#05020e';
    for (let i = 0; i < 4; i++) {
      const ax = -s * 0.53 + i * (bridgeLen / 4) + (bridgeLen / 8);
      ctx.beginPath();
      ctx.arc(ax, bridgeY + s * 0.025, s * 0.04, Math.PI, 0);
      ctx.fill();
    }
    /* Pillars */
    for (let i = 0; i < 5; i++) {
      const px = -s * 0.55 + i * (bridgeLen / 4);
      ctx.fillStyle = '#0a051b';
      ctx.fillRect(px - s * 0.006, bridgeY + s * 0.02, s * 0.012, s * 0.1);
    }
    ctx.restore();

    /* ==== Main castle silhouette ==== */
    ctx.fillStyle = '#0c0620';

    /* Low walls */
    ctx.fillRect(-s * 0.25, -s * 0.12, s * 0.7, s * 0.14);
    ctx.fillRect(-s * 0.35, -s * 0.06, s * 0.9, s * 0.1);
    ctx.fillRect(-s * 0.45, -s * 0.02, s * 1.0, s * 0.06);

    /* Battlements */
    for (let x = -s * 0.44; x < s * 0.55; x += s * 0.025) {
      ctx.fillRect(x, -s * 0.05, s * 0.012, s * 0.022);
    }
    for (let x = -s * 0.34; x < s * 0.45; x += s * 0.025) {
      ctx.fillRect(x, -s * 0.09, s * 0.012, s * 0.022);
    }

    /* Towers -- relative positions so we can place windows reliably */
    const towers = [
      /* [cx, baseY, width, height, roofStyle, hasFlag] */
      [0,          -s * 0.08, s * 0.08, s * 0.52, 'cone', true],   /* central keep */
      [-s * 0.18,  -s * 0.06, s * 0.055, s * 0.38, 'cone', true],
      [ s * 0.14,  -s * 0.08, s * 0.06, s * 0.46, 'cone', true],
      [-s * 0.32,  -s * 0.04, s * 0.045, s * 0.28, 'cone', false],
      [ s * 0.3,   -s * 0.05, s * 0.05, s * 0.32, 'cone', true],
      [-s * 0.42,  -s * 0.02, s * 0.035, s * 0.18, 'cone', false],
      [ s * 0.43,  -s * 0.02, s * 0.035, s * 0.2,  'cone', false],
      /* clock tower */
      [ s * 0.04,  -s * 0.04, s * 0.055, s * 0.36, 'pyramid', true],
    ];

    const windowList = [];
    for (const [tcx, tby, tw, tht, style, flag] of towers) {
      /* body */
      ctx.fillStyle = '#0c0620';
      ctx.fillRect(tcx - tw, tby - tht, tw * 2, tht);
      /* roof */
      ctx.beginPath();
      if (style === 'cone') {
        ctx.moveTo(tcx - tw * 1.25, tby - tht);
        ctx.lineTo(tcx, tby - tht - tw * 2.4);
        ctx.lineTo(tcx + tw * 1.25, tby - tht);
      } else {
        ctx.moveTo(tcx - tw * 1.3, tby - tht);
        ctx.lineTo(tcx, tby - tht - tw * 1.8);
        ctx.lineTo(tcx + tw * 1.3, tby - tht);
      }
      ctx.closePath();
      ctx.fill();
      /* flag */
      if (flag) {
        const fx = tcx, fy = tby - tht - tw * (style === 'cone' ? 2.4 : 1.8);
        ctx.fillRect(fx - 0.8, fy, 1.6, tw * 0.7);
        ctx.beginPath();
        ctx.moveTo(fx, fy + 2);
        ctx.lineTo(fx + tw * 0.8, fy + tw * 0.15);
        ctx.lineTo(fx, fy + tw * 0.3);
        ctx.closePath();
        ctx.fill();
      }
      /* plan windows on this tower */
      const nWin = Math.floor(tht / (s * 0.045));
      for (let k = 0; k < nWin; k++) {
        const wy = tby - tht * 0.15 - k * s * 0.052;
        windowList.push([tcx, wy, Math.random() < 0.25 ? 'cool' : 'warm']);
      }
    }

    /* Clock tower face */
    const clockX = s * 0.04, clockY = -s * 0.32;
    const clockR = s * 0.03;
    /* backplate glow */
    const cg = ctx.createRadialGradient(clockX, clockY, 0, clockX, clockY, clockR * 2.5);
    cg.addColorStop(0, 'rgba(255, 220, 140, 0.7)');
    cg.addColorStop(1, 'rgba(255, 220, 140, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(clockX, clockY, clockR * 2.5, 0, Math.PI * 2); ctx.fill();
    /* face */
    ctx.fillStyle = '#f8e0a0';
    ctx.beginPath(); ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3d2810';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    /* hour ticks */
    ctx.strokeStyle = '#3d2810';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = clockX + Math.cos(a) * clockR * 0.85;
      const y1 = clockY + Math.sin(a) * clockR * 0.85;
      const x2 = clockX + Math.cos(a) * clockR * 0.95;
      const y2 = clockY + Math.sin(a) * clockR * 0.95;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    /* hands */
    const hour = (t * 0.02) % (Math.PI * 2);
    const minute = (t * 0.3) % (Math.PI * 2);
    ctx.strokeStyle = '#3d2810';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(clockX + Math.cos(hour - Math.PI / 2) * clockR * 0.5, clockY + Math.sin(hour - Math.PI / 2) * clockR * 0.5);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(clockX + Math.cos(minute - Math.PI / 2) * clockR * 0.75, clockY + Math.sin(minute - Math.PI / 2) * clockR * 0.75);
    ctx.stroke();

    /* Gothic windows on central walls */
    for (let i = -4; i <= 4; i++) {
      windowList.push([i * s * 0.05, -s * 0.06, 'warm']);
    }
    for (let i = -6; i <= 6; i++) {
      windowList.push([i * s * 0.05, 0, 'warm']);
    }

    /* Lit windows flicker */
    for (let i = 0; i < windowList.length; i++) {
      const [wx, wy, kind] = windowList[i];
      const fl = 0.65 + 0.35 * Math.sin(t * (2 + (i % 4)) + i * 0.8);
      const color = kind === 'warm'
        ? `rgba(255, 200, 100, ${fl})`
        : `rgba(150, 200, 255, ${fl * 0.9})`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillRect(wx - s * 0.007, wy - s * 0.012, s * 0.014, s * 0.018);
      ctx.shadowBlur = 0;
    }

    /* Great arched entrance below central keep */
    ctx.fillStyle = '#05020e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.045, 0.04 * s);
    ctx.lineTo(-s * 0.045, -0.05 * s);
    ctx.arc(0, -0.05 * s, s * 0.045, Math.PI, 0);
    ctx.lineTo(s * 0.045, 0.04 * s);
    ctx.closePath();
    ctx.fill();
    /* warm glow from inside entrance */
    const entG = ctx.createRadialGradient(0, -s * 0.01, 0, 0, -s * 0.01, s * 0.07);
    entG.addColorStop(0, 'rgba(255, 180, 80, 0.55)');
    entG.addColorStop(1, 'rgba(255, 180, 80, 0)');
    ctx.fillStyle = entG;
    ctx.beginPath(); ctx.arc(0, -s * 0.01, s * 0.07, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  return { init, stop };
})();
