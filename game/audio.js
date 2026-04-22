/* ========= AUDIO =========
 * Zero-asset audio: every sound is synthesized live with WebAudio.
 * Means no files to ship and no loading delay.
 */

window.NUTS = window.NUTS || {};

NUTS.audio = (function () {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let musicStep = 0;
  const state = {
    sfxOn: true,
    musicOn: true,
    sfxVol: 0.7,
    musicVol: 0.35,
  };

  function ensure() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      sfxGain = ctx.createGain();
      musicGain = ctx.createGain();
      sfxGain.connect(masterGain);
      musicGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      masterGain.gain.value = 0.9;
      sfxGain.gain.value = state.sfxVol;
      musicGain.gain.value = state.musicVol;
    } catch (e) {
      ctx = null;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, opts) {
    if (!state.sfxOn) return;
    ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = (opts && opts.type) || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts && opts.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    }
    const peak = (opts && opts.gain) != null ? opts.gain : 0.35;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, opts) {
    if (!state.sfxOn) return;
    ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const peak = (opts && opts.gain) != null ? opts.gain : 0.25;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = (opts && opts.freq) || 1200;
    bp.Q.value = 1;
    src.connect(bp);
    bp.connect(g);
    g.connect(sfxGain);
    src.start(t0);
  }

  const sfx = {
    swap:   () => tone(520, 0.08, { type:'triangle', slideTo: 660, gain: 0.25 }),
    bad:    () => tone(180, 0.14, { type:'sawtooth', slideTo: 110, gain: 0.22 }),
    match:  (chain) => {
      const base = 440 + Math.min(chain || 0, 8) * 60;
      tone(base, 0.14, { type:'triangle', slideTo: base * 1.4, gain: 0.3 });
    },
    drop:   () => tone(300, 0.06, { type:'sine', slideTo: 220, gain: 0.18 }),
    specialCreate: () => {
      tone(660, 0.1, { type:'triangle', slideTo: 990, gain: 0.3 });
      setTimeout(() => tone(990, 0.14, { type:'sine', slideTo: 1320, gain: 0.25 }), 60);
    },
    bombarda: () => {
      noise(0.3, { freq: 600, gain: 0.35 });
      tone(200, 0.3, { type:'sawtooth', slideTo: 60, gain: 0.3 });
    },
    incendio: () => {
      noise(0.45, { freq: 900, gain: 0.4 });
      tone(150, 0.4, { type:'square', slideTo: 50, gain: 0.25 });
    },
    patronus: () => {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => tone(f, 0.22, { type:'triangle', gain: 0.3 }), i * 70));
    },
    combo: (n) => {
      const f = 440 * Math.pow(1.1, Math.min(n, 10));
      tone(f, 0.18, { type:'square', slideTo: f * 1.2, gain: 0.24 });
    },
    jinxClear: () => tone(330, 0.2, { type:'sawtooth', slideTo: 160, gain: 0.3 }),
    goldenDrop: () => {
      tone(880, 0.15, { type:'triangle', gain: 0.3 });
      setTimeout(() => tone(1320, 0.2, { type:'triangle', gain: 0.3 }), 80);
    },
    win: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => tone(f, 0.3, { type:'triangle', gain: 0.35 }), i * 140));
    },
    lose: () => {
      [330, 262, 196, 147].forEach((f, i) =>
        setTimeout(() => tone(f, 0.35, { type:'sawtooth', gain: 0.3 }), i * 180));
    },
    click:  () => tone(880, 0.04, { type:'square', gain: 0.15 }),
    star:   () => tone(1200, 0.18, { type:'triangle', slideTo: 1800, gain: 0.3 }),
  };

  /* Background music: a slow minor-key wizarding motif, looped. */
  const melody = [
    [220.0, 0.5], [261.6, 0.5], [329.6, 0.5], [392.0, 0.75], [0, 0.25],
    [349.2, 0.5], [329.6, 0.5], [261.6, 1.0],
    [196.0, 0.5], [261.6, 0.5], [329.6, 0.5], [440.0, 0.75], [0, 0.25],
    [392.0, 0.5], [349.2, 0.5], [329.6, 1.0],
  ];
  const bass = [
    [110, 2], [130.8, 2], [98, 2], [87.3, 2],
  ];

  function scheduleMusicNote() {
    if (!ctx || !state.musicOn) return;
    const note = melody[musicStep % melody.length];
    const [freq, beats] = note;
    const beat = 0.42;
    const dur = beats * beat;
    if (freq > 0) {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.14, t0 + 0.05);
      g.gain.linearRampToValueAtTime(0.1, t0 + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(musicGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
    /* Bass on the 1 of each bar */
    if (musicStep % 4 === 0) {
      const bi = Math.floor(musicStep / 4) % bass.length;
      const [bf] = bass[bi];
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = bf;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + beat * 2);
      osc.connect(g);
      g.connect(musicGain);
      osc.start(t0);
      osc.stop(t0 + beat * 2 + 0.05);
    }
    musicStep++;
    musicTimer = setTimeout(scheduleMusicNote, dur * 1000);
  }

  function startMusic() {
    ensure();
    if (!ctx) return;
    if (musicTimer) return;
    state.musicOn = true;
    musicGain.gain.value = state.musicVol;
    musicStep = 0;
    scheduleMusicNote();
  }

  function stopMusic() {
    state.musicOn = false;
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  return {
    state,
    resume,
    sfx,
    setSfxEnabled(on) {
      state.sfxOn = on;
      if (on) this.sfx.click();
    },
    setMusicEnabled(on) {
      if (on) startMusic(); else stopMusic();
    },
    setSfxVol(v) {
      state.sfxVol = v;
      ensure();
      if (sfxGain) sfxGain.gain.value = v;
    },
    setMusicVol(v) {
      state.musicVol = v;
      ensure();
      if (musicGain) musicGain.gain.value = v;
    },
    startMusic,
    stopMusic,
  };
})();
