'use strict';
// ===== audio: procedural chiptune BGM + SFX (WebAudio) =====
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function nfreq(n) { // "A4", "C#5", "Bb3"
  const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 0;
  let s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  return 440 * Math.pow(2, (s - 69) / 12);
}
// tracks: 8th-note steps, tokens separated by space, '.' rest, '-' sustain
const TRACKS = {
  title: { bpm: 84, lead: 'E5 - - G5 A5 - - . B5 - A5 G5 E5 - - . D5 - - F5 G5 - - . A5 - G5 F5 D5 - - . C5 - - E5 G5 - - . E5 - D5 C5 A4 - - . D5 - - F5 A5 - - . G5 - - - - - - .',
    bass: 'A2 - . . E3 - . . G2 - . . D3 - . . F2 - . . C3 - . . D2 - . . E2 - - -', wave: 'triangle', drums: '' },
  field: { bpm: 138,
    lead: 'A4 . C5 . E5 . C5 A4 F4 . A4 . C5 . A4 F4 G4 . C5 . E5 . D5 C5 B4 . D5 . G5 . D5 B4 A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 A4 C5 E5 . G5 . C6 . G5 E5 D5 . B4 . G4 . B4 D5',
    bass: 'A2 . A2 . A2 . E3 . F2 . F2 . F2 . C3 . C3 . C3 . C3 . G2 . G2 . G2 . G2 . D3 . A2 . A2 . A2 . E3 . F2 . F2 . F2 . C3 . C3 . E3 . G3 . E3 . G2 . G2 . B2 . D3 . G2 .',
    drums: 'k.h.s.h.k.h.s.hs' },
  enemy: { bpm: 154,
    lead: 'D5 . D5 F5 . E5 . D5 C5 . C5 E5 . D5 . C5 Bb4 . Bb4 D5 . C5 . Bb4 A4 . A4 C#5 . E5 . A5 D5 . F5 . A5 . F5 D5 C5 . E5 . G5 . E5 C5 Bb4 . D5 . F5 . D5 Bb4 A4 C#5 E5 A5 G5 E5 C#5 E5 D5 . . . . . . .',
    bass: 'D2 D2 . D2 D2 . D2 . C2 C2 . C2 C2 . C2 . Bb1 Bb1 . Bb1 Bb1 . Bb1 . A1 A1 . A1 A1 . A1 . D2 D2 . D2 D2 . D2 . C2 C2 . C2 C2 . C2 . Bb1 Bb1 . Bb1 Bb1 . Bb1 . A1 A1 . A1 E2 . A1 .',
    drums: 'k.hks.hkk.hks.hk' },
  boss: { bpm: 164,
    lead: 'E5 E5 . G5 . E5 . B5 A5 A5 . C6 . A5 . E5 D5 D5 . F5 . D5 . A5 G#5 . B5 . E6 . B5 G#5 E5 E5 . G5 . E5 . B5 A5 A5 . C6 . E6 . C6 B5 . G#5 . E5 . G#5 B5 .',
    bass: 'E2 E2 E3 E2 E2 E3 E2 E3 A2 A2 A3 A2 A2 A3 A2 A3 D2 D2 D3 D2 D2 D3 D2 D3 E2 E2 E3 E2 E2 E3 G#2 B2 E2 E2 E3 E2 E2 E3 E2 E3 A2 A2 A3 A2 A2 A3 A2 A3 A2 A2 A3 A2 B2 B2 B3 G#2',
    drums: 'khskhskhkhskhsks' },
  win: { bpm: 150, once: true, lead: 'C5 E5 G5 C6 . G5 C6 - - - - - . . . .', bass: 'C3 . G2 . C3 - - - - - - - . . . .', wave: 'square', drums: '' },
  lose: { bpm: 70, once: true, lead: 'E5 - D5 - C5 - A4 - - - - - . . . .', bass: 'A2 - - - A2 - - - - - - - . . . .', wave: 'triangle', drums: '' },
  end: { bpm: 92,
    lead: 'C5 - E5 G5 C6 - B5 G5 A5 - C6 E6 D6 - C6 A5 F5 - A5 C6 F6 - E6 C6 D6 - B5 G5 C6 - - - - - E5 - G5 C6 E6 - D6 B5 C6 - E6 G6 F6 - E6 C6 D6 - F6 A5 G5 - - - C6 - - -',
    bass: 'C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G3 . C3 . G3 . A2 . E3 . A2 . E3 . F2 . C3 . G2 . D3 . C3 - - -', wave: 'triangle', drums: '' }
};
const Aud = {
  ctx: null, on: true, cur: null, timer: null, master: null,
  unlock() {
    if (!this.ctx) {
      try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.5 : 0; this.master.connect(this.ctx.destination); } catch (e) { this.ctx = null; return; }
      if (this.want) this.bgm(this.want);
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  toggle() { this.on = !this.on; if (this.master) this.master.gain.value = this.on ? 0.5 : 0; const b = document.getElementById('bMute'); if (b) b.textContent = this.on ? '音 ON' : '音 OFF'; },
  tone(f, t, d, type, vol, slide) {
    const c = this.ctx; if (!c || !f) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(t, d, vol, hp) {
    const c = this.ctx; if (!c) return;
    if (!this.nbuf) { const b = c.createBuffer(1, c.sampleRate, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; this.nbuf = b; }
    const s = c.createBufferSource(); s.buffer = this.nbuf; const g = c.createGain(), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.02);
  },
  sfx(n) {
    const c = this.ctx; if (!c || !this.on) return; const t = c.currentTime + 0.01;
    switch (n) {
      case 'ok': this.tone(660, t, 0.07, 'square', 0.15); this.tone(990, t + 0.05, 0.08, 'square', 0.12); break;
      case 'cancel': this.tone(440, t, 0.07, 'square', 0.14); this.tone(330, t + 0.05, 0.08, 'square', 0.12); break;
      case 'move': this.tone(520, t, 0.03, 'square', 0.06); break;
      case 'step': this.tone(180, t, 0.05, 'triangle', 0.1); break;
      case 'hit': this.noise(t, 0.12, 0.35, 700); this.tone(220, t, 0.1, 'square', 0.18, 90); break;
      case 'miss': this.noise(t, 0.12, 0.12, 3000); this.tone(700, t, 0.1, 'sine', 0.08, 300); break;
      case 'heal': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.07, 0.15, 'triangle', 0.18)); break;
      case 'kill': this.noise(t, 0.3, 0.4, 400); this.tone(300, t, 0.3, 'sawtooth', 0.15, 50); break;
      case 'banner': this.tone(392, t, 0.12, 'square', 0.15); this.tone(523, t + 0.1, 0.12, 'square', 0.15); this.tone(659, t + 0.2, 0.25, 'square', 0.15); break;
      case 'levelup': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, t + i * 0.09, 0.14, 'square', 0.15)); break;
    }
  },
  bgm(name) {
    this.want = name; if (!this.ctx) return;
    if (this.cur && this.cur.name === name) return;
    this.stop(); const tr = TRACKS[name]; if (!tr) return;
    const parse = s => s.trim().split(/\s+/);
    this.cur = { name, tr, lead: parse(tr.lead), bass: tr.bass ? parse(tr.bass) : [], drums: tr.drums || '', step: 0, next: this.ctx.currentTime + 0.05, dur: 60 / tr.bpm / 2 };
    const sched = () => {
      const s = this.cur; if (!s || !this.ctx) return;
      while (s.next < this.ctx.currentTime + 0.2) {
        const i = s.step, L = s.lead[i % s.lead.length], B = s.bass.length ? s.bass[i % s.bass.length] : null;
        const hold = (arr, k) => { let n = 1; while (arr[(k + n) % arr.length] === '-' && n < 8) n++; return n; };
        if (L && L !== '.' && L !== '-') this.tone(nfreq(L), s.next, s.dur * hold(s.lead, i) * 0.95, s.tr.wave || 'square', 0.08);
        if (B && B !== '.' && B !== '-') this.tone(nfreq(B), s.next, s.dur * hold(s.bass, i) * 0.9, 'triangle', 0.16);
        if (s.drums) { const d = s.drums[i % s.drums.length]; if (d === 'k') this.tone(120, s.next, 0.09, 'sine', 0.25, 40); else if (d === 's') this.noise(s.next, 0.08, 0.12, 1500); else if (d === 'h') this.noise(s.next, 0.03, 0.05, 6000); }
        s.step++; s.next += s.dur;
        if (s.tr.once && s.step >= s.lead.length) { this.cur.over = true; clearInterval(this.timer); return; }
      }
    };
    this.timer = setInterval(sched, 40); sched();
  },
  stop() { clearInterval(this.timer); this.cur = null; }
};
