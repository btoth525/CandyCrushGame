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

  /* ========= Cinematic multi-voice music =========
   * Four layered voices (pad / arpeggio / melody / bass) in A minor,
   * looping over 16 beats. All pure WebAudio synthesis.
   */
  const BEAT = 0.38; /* seconds per beat */

  /* Chord progression (Am - F - C - G) */
  const chords = [
    [220.0, 261.6, 329.6],   /* Am */
    [174.6, 220.0, 261.6],   /* F  */
    [196.0, 246.9, 329.6],   /* C/e  inversion */
    [196.0, 246.9, 293.7],   /* G-ish */
  ];
  const bassNotes = [110.0, 174.6 / 2, 130.8, 196.0 / 2];

  /* Arpeggio pattern (16ths over the chord) */
  const arpPattern = [0, 1, 2, 1, 0, 2, 1, 0];

  /* Melody (haunting lead line, one note per beat. 0 = rest) */
  const melody = [
    [659.3, 1], [587.3, 1], [523.3, 1], [587.3, 1],
    [698.5, 1], [659.3, 1], [523.3, 1], [0, 1],
    [783.9, 1], [698.5, 1], [659.3, 1], [587.3, 1],
    [523.3, 2], [659.3, 1], [0, 1],
  ];

  function padChord(t0, freqs, dur) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t0);
    filter.frequency.linearRampToValueAtTime(1800, t0 + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(1000, t0 + dur);
    filter.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.3);
    g.gain.linearRampToValueAtTime(0.06, t0 + dur - 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    filter.connect(g);
    g.connect(musicGain);
    freqs.forEach((f) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sawtooth'; o1.frequency.value = f;
      o2.type = 'sawtooth'; o2.frequency.value = f * 1.003;
      o1.connect(filter); o2.connect(filter);
      o1.start(t0); o2.start(t0);
      o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
    });
  }

  function arp(t0, chordFreqs, beats) {
    const sixteenth = BEAT / 2;
    const n = beats * 2;
    for (let i = 0; i < n; i++) {
      const f = chordFreqs[arpPattern[i % arpPattern.length]] * 2;
      const tt = t0 + i * sixteenth;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(0.05, tt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + sixteenth * 1.2);
      osc.connect(g); g.connect(musicGain);
      osc.start(tt); osc.stop(tt + sixteenth * 1.3);
    }
  }

  function leadNote(t0, f, dur) {
    if (f <= 0) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 3500; filter.Q.value = 2;
    osc.type = 'triangle'; osc.frequency.value = f;
    osc2.type = 'sine'; osc2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.1;
    osc2.connect(g2); g2.connect(filter);
    osc.connect(filter); filter.connect(g); g.connect(musicGain);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.14, t0 + 0.04);
    g.gain.linearRampToValueAtTime(0.1, t0 + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); osc2.start(t0);
    osc.stop(t0 + dur + 0.05); osc2.stop(t0 + dur + 0.05);
  }

  function bassNote(t0, f, beats) {
    const dur = beats * BEAT;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = f;
    sub.type = 'sine'; sub.frequency.value = f / 2;
    const gs = ctx.createGain(); gs.gain.value = 0.45;
    sub.connect(gs); gs.connect(g);
    osc.connect(g); g.connect(musicGain);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.linearRampToValueAtTime(0.12, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); sub.start(t0);
    osc.stop(t0 + dur + 0.05); sub.stop(t0 + dur + 0.05);
  }

  function drumHit(t0, type) {
    /* Kick */
    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t0);
      osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.14);
      g.gain.setValueAtTime(0.28, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.connect(g); g.connect(musicGain);
      osc.start(t0); osc.stop(t0 + 0.25);
    } else if (type === 'snare') {
      const len = Math.floor(ctx.sampleRate * 0.15);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.13, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      src.connect(bp); bp.connect(g); g.connect(musicGain);
      src.start(t0);
    }
  }

  function scheduleMusicNote() {
    if (!ctx || !state.musicOn) return;
    /* Schedule a full bar (4 beats) every time this fires. */
    const barBeats = 4;
    const bar = Math.floor(musicStep / barBeats);
    const chord = chords[bar % chords.length];
    const bassF = bassNotes[bar % bassNotes.length];
    const t0 = ctx.currentTime + 0.02;
    const barDur = barBeats * BEAT;

    /* Pad */
    padChord(t0, chord, barDur);
    /* Bass */
    bassNote(t0, bassF, barBeats);
    /* Arpeggio */
    arp(t0, chord, barBeats);
    /* Drums */
    drumHit(t0, 'kick');
    drumHit(t0 + BEAT * 2, 'kick');
    drumHit(t0 + BEAT, 'snare');
    drumHit(t0 + BEAT * 3, 'snare');
    /* Melody over this bar (beats indexed by musicStep) */
    let acc = 0;
    let mi = bar * barBeats;
    while (acc < barBeats) {
      const entry = melody[mi % melody.length];
      const [mf, mb] = entry;
      leadNote(t0 + acc * BEAT, mf, mb * BEAT);
      acc += mb;
      mi++;
    }

    musicStep += barBeats;
    musicTimer = setTimeout(scheduleMusicNote, barDur * 1000);
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
