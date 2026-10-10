// ===================== AUDIO (WebAudio chiptune) =====================
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteMidi(n) { const m = /^([A-G][#b]?)(-?\d)$/.exec(n); if (!m) return null; return 12 * (+m[2] + 1) + NOTE_IDX[m[1]]; }
function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function chordNotes(name, oct = 3) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name); const root = 12 * (oct + 1) + NOTE_IDX[m[1]]; const q = m[2];
  const iv = q === 'm' ? [0, 3, 7] : q === 'dim' ? [0, 3, 6] : q === '7' ? [0, 4, 7, 10] : q === 'm7' ? [0, 3, 7, 10] : q === 'maj7' ? [0, 4, 7, 11] : q === 'sus4' ? [0, 5, 7] : [0, 4, 7];
  return iv.map(i => root + i);
}

const TRACKS = {
  title: { pad: 1, bpm: 80, chords: 'Am F C G Am F E E F G Em Am Dm E Am Am', bass: 'long', arp: 'up', mel:
    'A4 - C5 - E5 - - - F5 - E5 - C5 - A4 - G4 - C5 - E5 - G5 - F5 - - - D5 - - - E5 - A5 - - - G5 - F5 - E5 - D5 - C5 - B4 - - - G#4 - B4 - E5 - - - - - - - A5 - - - C6 - B5 - B5 - G5 - D5 - - - E5 - G5 - B5 - - - A5 - - - E5 - - - F5 - A5 - D6 - C6 - B5 - - - G#5 - E5 - A5 - - - - - - - . . . . E5 - . .' },
  town: { pad: 1, bpm: 108, chords: 'F Bb C F Dm Gm C F Bb C Am Dm Gm C F C', bass: 'walk', arp: null, drums: 'soft', mel:
    'C5 - A4 C5 F5 - E5 F5 D5 - Bb4 D5 F5 - - . E5 - C5 E5 G5 - F5 E5 F5 - - - C5 - . . D5 - F5 - A5 - G5 F5 G5 - Bb4 - D5 - C5 Bb4 A4 - C5 - E5 - G5 - F5 - - - - - . . D5 - F5 - Bb5 - A5 G5 G5 - E5 - C5 - - . C5 - E5 - A5 - G5 - F5 - - - D5 - . . Bb4 - D5 - G5 - F5 - E5 - G5 - C6 - Bb5 - A5 - F5 - C5 - A4 - G4 - C5 - E5 - G5 -' },
  field: { bpm: 120, chords: 'D A Bm G D G A D G A F#m Bm G A Bm A', bass: 'root', arp: 'up', drums: 'march', mel:
    'D5 - - A4 D5 - F#5 - E5 - - C#5 A4 - - - B4 - D5 - F#5 - E5 D5 E5 - - - - - . . F#5 - - E5 D5 - A5 - G5 - F#5 - E5 - D5 - C#5 - E5 - A5 - G5 - F#5 - - - D5 - - - B5 - A5 - G5 - D5 - C#5 - E5 - A5 - - - A5 - G5 - F#5 - C#5 - D5 - F#5 - B5 - - - B5 - A5 - G5 - B5 - A5 - G5 - F#5 - E5 - F#5 - - - D5 - B4 - C#5 - E5 - A5 - G5 -' },
  dungeon: { pad: 1, bpm: 84, chords: 'Dm Dm Bb A Dm Gm A A Gm Gm Dm Dm Bb C A A', bass: 'long', arp: 'down', mel:
    'D5 - - - F5 - E5 - D5 - - - A4 - - - Bb4 - - - D5 - C5 Bb4 A4 - - - - - . . F5 - - - A5 - G5 - F5 - E5 - D5 - Bb4 - C#5 - - - E5 - - - A4 - - - - - . . G5 - - - Bb5 - A5 - G5 - - - D5 - - - F5 - - - A5 - G5 - F5 - E5 - D5 - - - D5 - F5 - Bb5 - A5 - G5 - E5 - C5 - - - C#5 - E5 - A5 - G5 - E5 - - - C#5 - - -' },
  tower: { pad: 1, bpm: 96, chords: 'Am Bb Am G F E Am E F G Am Am Dm E Am E', bass: 'root', arp: 'up', mel:
    'A4 - C5 - E5 - - - F5 - - - D5 - - - E5 - C5 - A4 - - - B4 - D5 - G5 - - - A5 - G5 - F5 - E5 - G#5 - - - B4 - - - C5 - E5 - A5 - - - G#5 - - - - - . . A5 - - - C6 - - - B5 - - - D6 - - - C6 - B5 - A5 - E5 - A5 - - - - - - - F5 - A5 - D6 - - - E6 - - - B5 - G#5 - A5 - E5 - C5 - A4 - B4 - - - G#4 - - -' },
  battle: { bpm: 152, chords: 'Em Em C D Em Em C B Am Am Em Em C D B B', bass: 'octave', arp: null, drums: 'rock', mel:
    'E5 - G5 - B5 - A5 G5 F#5 - G5 - E5 - . . E5 - G5 - C6 - B5 A5 A5 - - - F#5 - D5 - E5 G5 B5 - E6 - D6 B5 C6 - B5 - G5 - E5 - G5 - A5 - B5 - C6 - B5 - - - D#5 - F#5 - A5 - C6 - E6 - D6 C6 B5 - A5 - E5 - . . G5 - B5 - E6 - D6 B5 C6 - B5 - G5 - E5 - E5 F#5 G5 - C6 - B5 - A5 - F#5 - D5 - A5 - B5 - - - A5 - G5 - F#5 - D#5 - B4 - D#5 -' },
  boss: { bpm: 168, chords: 'Cm Cm Ab Bb Cm Cm Fm G Ab Bb Gm Cm Ab Bb G G', bass: 'octave', arp: 'up', drums: 'rock', mel:
    'C5 - Eb5 - G5 - F#5 G5 Ab5 - G5 - Eb5 - D5 - C5 - Eb5 - Ab5 - G5 Ab5 Bb5 - - - F5 - D5 - G5 - C6 - B5 - C6 - D6 - Eb6 - D6 - C6 - Ab5 - G5 - F5 - Eb5 - D5 - B4 - G4 - B4 - Eb6 - C6 - Ab5 - C6 - D6 - Bb5 - F5 - Bb5 - G5 - Bb5 - D6 - C6 Bb5 C6 - - - G5 - Eb5 - Ab5 - G5 - F5 - Eb5 - D5 - Eb5 - F5 - Bb5 - B5 - - - D6 - - - G5 - F5 - D5 - B4 -' },
  victory: { bpm: 140, chords: 'C C F G Em Am Dm G C C', bass: 'root', arp: 'up', loopFrom: 16, mel:
    'G4 C5 E5 G5 - - E5 G5 C6 - - - - - . . A5 - G5 - F5 - C5 - D5 - G5 - - - B4 - E5 - G5 - B5 - G5 - A5 - - - E5 - . . F5 - E5 - D5 - A4 - B4 - D5 - G5 - F5 - E5 - - - G5 - - - C5 - - - - - . .' },
  ending: { pad: 1, bpm: 88, chords: 'G D Em C G C D G', bass: 'long', arp: 'up', mel:
    'B4 - D5 - G5 - - - F#5 - E5 - D5 - A4 - B4 - - - E5 - G5 - E5 - - - - - D5 C5 B4 - D5 - G5 - B5 - A5 - G5 - E5 - C5 - D5 - - - F#5 - A5 - G5 - - - - - . .' },
  gameover: { pad: 1, bpm: 70, chords: 'Am Dm E Am', bass: 'long', arp: 'down', mel:
    'E5 - - - D5 - C5 - F5 - - - E5 - D5 - B4 - - - G#4 - B4 - A4 - - - - - - -' },
  inn: { bpm: 120, chords: 'C G C', bass: 'long', arp: 'up', once: true, mel: 'E5 - G5 - C6 - - - B5 - D6 - G5 - - - C6 - - - - - - -' },
};

const Audio8 = {
  ac: null, master: null, mus: null, sfxG: null, muted: false, want: null, cur: null, timer: null, waves: {},
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { this.ac = new AC(); } catch (e) { return; }
      const ac = this.ac;
      this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(ac.destination);
      this.mus = ac.createGain(); this.mus.gain.value = 0.55; this.mus.connect(this.master);
      // room reverb (generated impulse) + tempo-synced echo on the lead
      try {
        const rl = Math.floor(ac.sampleRate * 2.4), ir = ac.createBuffer(2, rl, ac.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2); }
        this.rev = ac.createConvolver(); this.rev.buffer = ir; this.revSend = ac.createGain(); this.revSend.gain.value = 0.32;
        this.mus.connect(this.revSend); this.revSend.connect(this.rev); this.rev.connect(this.master);
      } catch (e) { }
      this.lead = ac.createGain(); this.lead.gain.value = 1; this.lead.connect(this.mus);
      this.dly = ac.createDelay(1.5); this.dly.delayTime.value = 0.3; this.fb = ac.createGain(); this.fb.gain.value = 0.28; this.dlyOut = ac.createGain(); this.dlyOut.gain.value = 0.32;
      this.lead.connect(this.dly); this.dly.connect(this.fb); this.fb.connect(this.dly); this.dly.connect(this.dlyOut); this.dlyOut.connect(this.mus);
      this.sfxG = ac.createGain(); this.sfxG.gain.value = 0.8; this.sfxG.connect(this.master);
      for (const duty of [0.125, 0.25, 0.5]) this.waves[duty] = this.pulse(duty);
      const len = ac.sampleRate; const b = ac.createBuffer(1, len, ac.sampleRate); const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = b;
      if (this.want) { const w = this.want; this.cur = null; this.play(w); }
    }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  pulse(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty) * 1, re[k] = 0;
    // use cosine form for duty-cycle pulse
    for (let k = 1; k < n; k++) { re[k] = (2 / (k * Math.PI)) * Math.sin(2 * Math.PI * k * duty); im[k] = (2 / (k * Math.PI)) * (1 - Math.cos(2 * Math.PI * k * duty)); }
    return this.ac.createPeriodicWave(re, im);
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ac.currentTime, 0.02); },
  tone(dest, t, dur, hz, wave, vol, opts = {}) {
    const ac = this.ac; const o = ac.createOscillator(); const g = ac.createGain();
    if (typeof wave === 'number') o.setPeriodicWave(this.waves[wave]); else o.type = wave;
    o.frequency.setValueAtTime(hz, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
    if (opts.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = hz * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + Math.min(0.15, dur / 2)); l.stop(t + dur + 0.05); }
    const a = opts.a ?? 0.008, r = opts.r ?? Math.min(0.08, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol * (opts.sus ?? 0.8), t + Math.max(a, dur - r)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dest, t, dur, vol, freq = 3000, type = 'highpass') {
    const ac = this.ac; const s = ac.createBufferSource(); s.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  build(tr) {
    const evs = []; const chords = tr.chords.split(' '); const cl = 8;
    const mel = tr.mel.split(/\s+/).filter(Boolean);
    const len = Math.max(mel.length, chords.length * cl);
    // melody
    for (let i = 0; i < mel.length; i++) {
      const m = noteMidi(mel[i]); if (m == null) continue;
      let d = 1; while (mel[i + d] === '-') d++;
      evs.push({ t: i, d: d * 0.92, m, ch: 'mel' });
    }
    chords.forEach((c, ci) => {
      const t0 = ci * cl; const tones = chordNotes(c, 3); const root = tones[0] - 12;
      if (tr.bass === 'long') evs.push({ t: t0, d: cl * 0.95, m: root, ch: 'bass' });
      if (tr.bass === 'root') for (let b = 0; b < cl; b += 2) evs.push({ t: t0 + b, d: 1.6, m: b % 4 === 2 ? root + 7 : root, ch: 'bass' });
      if (tr.bass === 'walk') { const w = [0, 7, 12, 7]; for (let b = 0; b < 4; b++) evs.push({ t: t0 + b * 2, d: 1.7, m: root + w[b], ch: 'bass' }); }
      if (tr.bass === 'octave') for (let b = 0; b < cl; b++) evs.push({ t: t0 + b, d: 0.7, m: root + (b % 2 ? 12 : 0), ch: 'bass' });
      if (tr.arp) { const at = tones.map(x => x + 12); const seq = tr.arp === 'down' ? [...at].reverse() : at; for (let b = 0; b < cl; b++) evs.push({ t: t0 + b, d: 0.9, m: seq[b % seq.length] + (b >= seq.length && b % 2 ? 12 : 0), ch: 'arp' }); }
      if (tr.pad) tones.forEach((tn, k) => evs.push({ t: t0, d: cl, m: tn + 12, ch: 'pad' }));
      if (tr.drums) for (let b = 0; b < cl; b++) {
        if (tr.drums === 'march') { if (b % 4 === 0) evs.push({ t: t0 + b, ch: 'kick' }); if (b % 4 === 2) evs.push({ t: t0 + b, ch: 'snare' }); evs.push({ t: t0 + b, ch: 'hat' }); }
        if (tr.drums === 'rock') { if (b === 0 || b === 3 || b === 5) evs.push({ t: t0 + b, ch: 'kick' }); if (b === 2 || b === 6) evs.push({ t: t0 + b, ch: 'snare' }); evs.push({ t: t0 + b, ch: 'hat' }); }
        if (tr.drums === 'soft') { if (b % 2 === 1) evs.push({ t: t0 + b, ch: 'hat', soft: 1 }); }
      }
    });
    evs.sort((a, b) => a.t - b.t);
    return { evs, len, loopFrom: tr.loopFrom || 0, once: !!tr.once, step: 60 / tr.bpm / 2 };
  },
  playEv(e, t, step) {
    const m = this.mus;
    switch (e.ch) {
      case 'mel': { const L = this.lead || m; const dur = e.d * step; this.tone(L, t, dur, midiHz(e.m), 0.25, 0.12, { vib: dur > 0.3 }); this.tone(L, t, dur, midiHz(e.m) * 1.0046, 0.5, 0.05, { vib: dur > 0.3 }); break; }
      case 'pad': this.tone(m, t, e.d * step, midiHz(e.m), 'triangle', 0.035, { a: Math.min(0.6, e.d * step * 0.4), r: 0.5, sus: 1 }); break;
      case 'bass': this.tone(m, t, e.d * step, midiHz(e.m), 'triangle', 0.32); break;
      case 'arp': this.tone(m, t, e.d * step, midiHz(e.m), 0.125, 0.045); break;
      case 'kick': this.tone(m, t, 0.12, 150, 'sine', 0.5, { slide: 40, r: 0.1 }); break;
      case 'snare': this.noiseHit(m, t, 0.12, 0.22, 1800); break;
      case 'hat': this.noiseHit(m, t, 0.03, e.soft ? 0.04 : 0.07, 7000); break;
    }
  },
  play(name) {
    this.want = name;
    if (!this.ac || this.muted && false) return;
    if (this.cur === name) return;
    this.stop(); this.cur = name; if (!name) return;
    const S = this.build(TRACKS[name]); const ac = this.ac;
    if (this.dly) this.dly.delayTime.setValueAtTime(Math.min(1.4, S.step * 3), ac.currentTime);
    let idx = 0, base = 0; const t0 = ac.currentTime + 0.08;
    const tick = () => {
      const until = ac.currentTime - t0 + 0.35;
      let guard = 0;
      while (guard++ < 400) {
        const e = S.evs[idx]; if (!e) break;
        const at = (base + e.t) * S.step; if (at > until) break;
        if (at >= ac.currentTime - t0 - 0.02) this.playEv(e, t0 + at, S.step);
        idx++;
        if (idx >= S.evs.length) {
          if (S.once) { clearInterval(this.timer); this.timer = null; return; }
          base += S.len - S.loopFrom; idx = S.evs.findIndex(x => x.t >= S.loopFrom); if (idx < 0) idx = 0;
        }
      }
    };
    this.timer = setInterval(tick, 50); tick();
    // fade in
    this.mus.gain.cancelScheduledValues(ac.currentTime); this.mus.gain.setValueAtTime(0.0001, ac.currentTime); this.mus.gain.linearRampToValueAtTime(0.55, ac.currentTime + 0.15);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; if (this.ac) { const g = this.mus.gain; g.cancelScheduledValues(this.ac.currentTime); g.setValueAtTime(g.value, this.ac.currentTime); g.linearRampToValueAtTime(0.0001, this.ac.currentTime + 0.06); } },
  sfx(name) {
    if (!this.ac || this.ac.state !== 'running') return;
    const t = this.ac.currentTime + 0.005, d = this.sfxG;
    switch (name) {
      case 'cursor': this.tone(d, t, 0.04, 1320, 0.5, 0.12); break;
      case 'ok': this.tone(d, t, 0.05, 990, 0.5, 0.14); this.tone(d, t + 0.05, 0.07, 1480, 0.5, 0.14); break;
      case 'cancel': this.tone(d, t, 0.07, 660, 0.5, 0.12, { slide: 330 }); break;
      case 'error': this.tone(d, t, 0.12, 180, 0.5, 0.15); break;
      case 'hit': this.noiseHit(d, t, 0.12, 0.5, 900, 'lowpass'); this.tone(d, t, 0.08, 220, 'square', 0.12, { slide: 60 }); break;
      case 'crit': this.noiseHit(d, t, 0.22, 0.7, 600, 'lowpass'); this.tone(d, t, 0.18, 330, 'square', 0.18, { slide: 50 }); break;
      case 'slash': this.noiseHit(d, t, 0.1, 0.35, 4000); break;
      case 'fire': this.noiseHit(d, t, 0.5, 0.5, 700, 'lowpass'); this.tone(d, t, 0.4, 200, 'sawtooth', 0.08, { slide: 80 }); break;
      case 'ice': for (let i = 0; i < 6; i++) this.tone(d, t + i * 0.05, 0.1, 1800 + i * 300, 0.125, 0.08); break;
      case 'bolt': this.noiseHit(d, t, 0.35, 0.6, 2500); this.tone(d, t, 0.3, 90, 'square', 0.15, { slide: 40 }); break;
      case 'heal': for (let i = 0; i < 5; i++) this.tone(d, t + i * 0.07, 0.14, midiHz(72 + [0, 4, 7, 12, 16][i]), 0.25, 0.09); break;
      case 'holy': for (let i = 0; i < 8; i++) this.tone(d, t + i * 0.05, 0.3, midiHz(84 + [0, 7, 12, 4, 16, 7, 19, 12][i]), 'sine', 0.08); break;
      case 'dark': this.tone(d, t, 0.6, 110, 'sawtooth', 0.12, { slide: 40 }); this.noiseHit(d, t, 0.6, 0.3, 400, 'lowpass'); break;
      case 'meteor': for (let i = 0; i < 4; i++) { this.noiseHit(d, t + i * 0.15, 0.3, 0.6, 500, 'lowpass'); this.tone(d, t + i * 0.15, 0.25, 160, 'square', 0.1, { slide: 40 }); } break;
      case 'encounter': for (let i = 0; i < 8; i++) this.tone(d, t + i * 0.035, 0.05, 400 + i * 160, 0.5, 0.1); this.noiseHit(d, t + 0.28, 0.4, 0.3, 1500); break;
      case 'chest': this.tone(d, t, 0.08, 784, 0.5, 0.12); this.tone(d, t + 0.09, 0.08, 988, 0.5, 0.12); this.tone(d, t + 0.18, 0.2, 1175, 0.5, 0.12); break;
      case 'levelup': [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => this.tone(d, t + i * 0.08, 0.12, midiHz(72 + n), 0.25, 0.12)); break;
      case 'ko': this.tone(d, t, 0.5, 440, 0.5, 0.14, { slide: 70 }); break;
      case 'escape': for (let i = 0; i < 6; i++) this.tone(d, t + i * 0.04, 0.05, 900 - i * 100, 0.5, 0.1); break;
      case 'steal': this.tone(d, t, 0.05, 1500, 0.125, 0.1); this.tone(d, t + 0.06, 0.08, 2000, 0.125, 0.1); break;
      case 'save': [0, 7, 12, 19].forEach((n, i) => this.tone(d, t + i * 0.09, 0.2, midiHz(76 + n), 'sine', 0.1)); break;
      case 'door': this.noiseHit(d, t, 0.15, 0.3, 500, 'lowpass'); break;
      case 'buy': this.tone(d, t, 0.05, 1568, 0.5, 0.1); this.tone(d, t + 0.06, 0.1, 2093, 0.5, 0.1); break;
      case 'boss': this.tone(d, t, 0.8, 55, 'sawtooth', 0.2, { slide: 45 }); this.noiseHit(d, t, 0.9, 0.4, 300, 'lowpass'); break;
      case 'crystal': for (let i = 0; i < 12; i++) this.tone(d, t + i * 0.09, 0.4, midiHz(79 + [0, 4, 7, 11, 12, 16, 19, 23, 24, 19, 16, 12][i]), 'sine', 0.07); break;
    }
  },
};
document.getElementById('mute').addEventListener('click', e => {
  Audio8.unlock(); Audio8.setMuted(!Audio8.muted); e.currentTarget.textContent = Audio8.muted ? '♪ OFF' : '♪ ON'; e.currentTarget.blur();
});
