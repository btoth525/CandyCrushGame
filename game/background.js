/* ========= BACKGROUND SCENE =========
 * Animated canvas: moon, parallax mountains, castle silhouette with flickering
 * windows, drifting fog, occasional lightning, magical drifting particles.
 * Sits behind everything.
 */
window.NUTS = window.NUTS || {};

NUTS.Background = (function () {
  let canvas, ctx, w, h, dpr;
  let t = 0;
  let particles = [];
  let lightningT = 0;
  let nextLightningAt = 0;
  let running = false;
  let rafId = 0;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    seedParticles();
    scheduleLightning();
    if (!running) { running = true; loop(); }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedParticles() {
    particles = [];
    const n = 60;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2,
        sp: 0.08 + Math.random() * 0.25,
        drift: (Math.random() - 0.5) * 0.2,
        hue: Math.random() < 0.3 ? 50 : (Math.random() < 0.5 ? 280 : 200),
        life: Math.random(),
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  function scheduleLightning() {
    nextLightningAt = t + 6 + Math.random() * 14; /* seconds */
  }

  function loop() {
    t += 1 / 60;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function draw() {
    /* Sky gradient */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a0e38');
    g.addColorStop(0.55, '#0e0621');
    g.addColorStop(1, '#05020e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* Distant stars */
    ctx.save();
    for (let i = 0; i < 80; i++) {
      const x = (i * 137.5) % w;
      const y = ((i * 53.7) % (h * 0.55));
      const tw = 0.6 + 0.4 * Math.sin(t * 1.3 + i);
      ctx.globalAlpha = 0.35 * tw;
      ctx.fillStyle = i % 17 === 0 ? '#ffd764' : '#fff';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();

    /* Moon with soft halo */
    const moonX = w * 0.78, moonY = h * 0.22, moonR = Math.min(w, h) * 0.06;
    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.2, moonX, moonY, moonR * 5);
    halo.addColorStop(0, 'rgba(255, 236, 170, 0.5)');
    halo.addColorStop(0.3, 'rgba(255, 236, 170, 0.12)');
    halo.addColorStop(1, 'rgba(255, 236, 170, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 5, 0, Math.PI * 2);
    ctx.fill();
    const mg = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.2, moonX, moonY, moonR);
    mg.addColorStop(0, '#fff6d0');
    mg.addColorStop(0.7, '#f5dd88');
    mg.addColorStop(1, '#b89244');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    /* Far mountains (parallax back) */
    ctx.fillStyle = '#0a0822';
    drawMountains(h * 0.62, 8, 0.015, 0.5);
    /* Mid mountains */
    ctx.fillStyle = '#0f0729';
    drawMountains(h * 0.7, 6, 0.02, 0.7);

    /* Castle silhouette */
    drawCastle(w * 0.22, h * 0.72, Math.min(w, h) * 0.45);

    /* Fog band */
    const fog = ctx.createLinearGradient(0, h * 0.7, 0, h);
    fog.addColorStop(0, 'rgba(40, 22, 70, 0)');
    fog.addColorStop(0.6, 'rgba(40, 22, 70, 0.5)');
    fog.addColorStop(1, 'rgba(20, 10, 40, 0.85)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    /* Drifting fog waves */
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 3; i++) {
      const y = h * 0.78 + i * 24;
      const phase = t * (0.3 + i * 0.1) + i * 1.7;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 20) {
        const yy = y + Math.sin(x * 0.01 + phase) * 10 + Math.sin(x * 0.03 - phase) * 4;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = '#b69ae0';
      ctx.fill();
    }
    ctx.restore();

    /* Magical particles */
    for (const p of particles) {
      p.y -= p.sp;
      p.x += p.drift;
      p.twinkle += 0.05;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      const alpha = 0.35 + 0.35 * Math.sin(p.twinkle);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    /* Lightning */
    if (t >= nextLightningAt && lightningT <= 0) {
      lightningT = 0.7;
      scheduleLightning();
    }
    if (lightningT > 0) {
      const a = lightningT / 0.7;
      ctx.save();
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = '#e8d9ff';
      ctx.fillRect(0, 0, w, h * 0.6);
      ctx.restore();
      /* Draw a jagged bolt */
      if (lightningT > 0.45) {
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 220, 255, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#e8d9ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        let bx = w * (0.4 + Math.random() * 0.3), by = 0;
        ctx.moveTo(bx, by);
        while (by < h * 0.5) {
          by += 20 + Math.random() * 24;
          bx += (Math.random() - 0.5) * 40;
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.restore();
      }
      lightningT -= 1 / 60;
    }
  }

  function drawMountains(baseY, peaks, roughness, opacityMul) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    const step = w / peaks;
    for (let i = 0; i <= peaks; i++) {
      const x = i * step;
      const seed = Math.sin(i * 12.9898) * 43758.5453 % 1;
      const jag = Math.abs(seed);
      const peakY = baseY - (60 + jag * 120);
      ctx.lineTo(x - step * 0.5, baseY);
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.globalAlpha = opacityMul;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawCastle(cx, cy, scale) {
    const s = scale;
    ctx.save();
    ctx.translate(cx, cy);

    /* Cliff base */
    ctx.fillStyle = '#05020e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(-s * 0.45, -s * 0.08);
    ctx.lineTo(-s * 0.2, -s * 0.12);
    ctx.lineTo(s * 0.1, -s * 0.15);
    ctx.lineTo(s * 0.4, -s * 0.08);
    ctx.lineTo(s * 0.55, 0);
    ctx.lineTo(s * 0.55, s * 0.6);
    ctx.lineTo(-s * 0.5, s * 0.6);
    ctx.closePath();
    ctx.fill();

    /* Main silhouette */
    ctx.fillStyle = '#0c0620';
    /* big central keep */
    tower(0, -s * 0.55, s * 0.1, s * 0.4);
    /* left tower */
    tower(-s * 0.22, -s * 0.35, s * 0.06, s * 0.22);
    /* right tower */
    tower(s * 0.18, -s * 0.42, s * 0.07, s * 0.3);
    /* small tower far left */
    tower(-s * 0.32, -s * 0.25, s * 0.045, s * 0.13);
    /* small tower far right */
    tower(s * 0.3, -s * 0.28, s * 0.05, s * 0.16);

    /* Wall segments */
    ctx.fillRect(-s * 0.4, -s * 0.15, s * 0.9, s * 0.3);
    ctx.fillRect(-s * 0.5, -s * 0.08, s * 1.05, s * 0.2);

    /* Battlements (teeth on top of walls) */
    ctx.fillStyle = '#0c0620';
    for (let x = -s * 0.5; x < s * 0.55; x += s * 0.04) {
      ctx.fillRect(x, -s * 0.1, s * 0.02, s * 0.03);
    }

    /* Lit windows (flickering) */
    const windows = [
      [0, -s * 0.48, 'warm'], [0, -s * 0.4, 'warm'], [0, -s * 0.3, 'warm'],
      [0, -s * 0.2, 'cool'],
      [-s * 0.22, -s * 0.3, 'warm'], [-s * 0.22, -s * 0.22, 'warm'],
      [s * 0.18, -s * 0.35, 'warm'], [s * 0.18, -s * 0.25, 'warm'], [s * 0.18, -s * 0.15, 'cool'],
      [-s * 0.32, -s * 0.18, 'warm'],
      [s * 0.3, -s * 0.2, 'warm'],
      [-s * 0.1, -s * 0.05, 'warm'], [s * 0.08, -s * 0.05, 'warm'],
      [-s * 0.3, 0, 'warm'], [s * 0.3, 0, 'warm'],
    ];
    for (let i = 0; i < windows.length; i++) {
      const [wx, wy, kind] = windows[i];
      const fl = 0.7 + 0.3 * Math.sin(t * (2 + (i % 3)) + i);
      const color = kind === 'warm'
        ? `rgba(255, 200, 100, ${fl})`
        : `rgba(150, 200, 255, ${fl * 0.9})`;
      ctx.fillStyle = color;
      ctx.fillRect(wx - s * 0.008, wy, s * 0.016, s * 0.022);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(wx - s * 0.008, wy, s * 0.016, s * 0.022);
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    function tower(x, y, wd, ht) {
      /* body */
      ctx.fillRect(x - wd, y, wd * 2, ht);
      /* conical roof */
      ctx.beginPath();
      ctx.moveTo(x - wd * 1.2, y);
      ctx.lineTo(x, y - wd * 2.2);
      ctx.lineTo(x + wd * 1.2, y);
      ctx.closePath();
      ctx.fill();
      /* flag */
      ctx.fillRect(x - 1, y - wd * 2.8, 2, wd * 0.6);
      ctx.beginPath();
      ctx.moveTo(x, y - wd * 2.6);
      ctx.lineTo(x + wd * 0.6, y - wd * 2.3);
      ctx.lineTo(x, y - wd * 2.0);
      ctx.closePath();
      ctx.fill();
    }
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  return { init, stop };
})();
