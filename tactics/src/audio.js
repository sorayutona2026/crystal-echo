'use strict';
// ===== audio: procedural orchestral-style BGM (strings pad, piano/harp arpeggios, cello bass, timpani, convolution reverb) + chiptune SFX (WebAudio, no audio files) =====
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
TRACKS.camp = { bpm: 72, lead: 'E5 - G5 - C6 - - . D5 - F5 - A5 - - . C5 - E5 - A5 - - . B4 - D5 - G5 - - . F5 - A5 - C6 - - . E5 - G5 - C6 - - . D5 - F5 - A5 - - . E5 - - - - - - .',
  bass: 'C3 - - - - - - . D3 - - - - - - . A2 - - - - - - . G2 - - - - - - . F2 - - - - - - . C3 - - - - - - . D3 - - - - - - . E3 - - - - - - .' };
// mood per track: key (scale for the automatic pad chords), lead voice, reverb amount, drums style
const MOOD = {
  title: { key: 'Am', str: 1, wet: 0.45, drum: 'timp', arp: 1 }, camp: { key: 'C', str: 1, wet: 0.5, drum: '', arp: 1, soft: 1 },
  field: { key: 'Am', str: 0, wet: 0.32, drum: 'timp', arp: 1 }, enemy: { key: 'Dm', str: 0, wet: 0.28, drum: 'timp', arp: 1, ost: 1 },
  boss: { key: 'Em', str: 0, wet: 0.3, drum: 'taiko', arp: 1, ost: 1 }, win: { key: 'C', str: 1, wet: 0.4, drum: 'timp', arp: 1 },
  lose: { key: 'Am', str: 1, wet: 0.55, drum: '', arp: 0 }, end: { key: 'C', str: 1, wet: 0.55, drum: '', arp: 1 }
};
const SCALES = { Am: [9, 11, 0, 2, 4, 5, 7], C: [0, 2, 4, 5, 7, 9, 11], Dm: [2, 4, 5, 7, 9, 10, 0, 1], Em: [4, 6, 7, 9, 11, 0, 2, 8] };
function midiOf(n) { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return m ? NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12 : 0; }
const mhz = m => 440 * Math.pow(2, (m - 69) / 12);
// the chord of one bar (8 steps): root = most frequent bass pitch class, third / fifth from the scale  -> MIDI notes around C3..B4
function barChord(bass, bar, scale, prev) {
  const cnt = {}; for (let k = 0; k < 8; k++) { const n = bass[(bar * 8 + k) % bass.length]; if (n && n !== '.' && n !== '-') { const pc = midiOf(n) % 12; cnt[pc] = (cnt[pc] || 0) + (k === 0 ? 2 : 1); } }
  let root = null, best = 0; for (const pc in cnt) if (cnt[pc] > best) { best = cnt[pc]; root = +pc; }
  if (root === null) return prev || [57, 60, 64];
  const sc = SCALES[scale], inS = x => sc.indexOf(((x % 12) + 12) % 12) >= 0, third = inS(root + 3) ? 3 : 4, fifth = (!inS(root + 7) && inS(root + 6)) ? 6 : 7, r = 48 + (root % 12);
  return [r, r + third, r + fifth];
}
const Aud = {
  ctx: null, on: true, cur: null, timer: null, master: null, mIn: null, conv: null,
  unlock() {
    if (!this.ctx) {
      try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.5 : 0; this.master.connect(this.ctx.destination); this.buildMusicBus(); } catch (e) { this.ctx = null; return; }
      if (this.want) this.bgm(this.want);
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  buildMusicBus() { // music in -> compressor -> master;  music send -> procedural convolution reverb -> compressor
    const c = this.ctx; this.mIn = c.createGain(); const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    this.mIn.connect(comp); comp.connect(this.master);
    try {
      const len = Math.floor(c.sampleRate * 1.9), ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const a = ir.getChannelData(ch); let y = 0; for (let i = 0; i < len; i++) { const e = Math.pow(1 - i / len, 2.7); y += ((Math.random() * 2 - 1) * e - y) * 0.42; a[i] = i < 600 ? 0 : y * 1.6; } }
      this.conv = c.createConvolver(); this.conv.buffer = ir; this.send = c.createGain(); this.send.gain.value = 1; this.conv.connect(comp);
    } catch (e) { this.conv = null; }
  },
  toggle() { this.on = !this.on; if (this.master) this.master.gain.value = this.on ? 0.5 : 0; const b = document.getElementById('bMute'); if (b) b.textContent = this.on ? '音 ON' : '音 OFF'; },
  tone(f, t, d, type, vol, slide) {
    const c = this.ctx; if (!c || !f) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(t, d, vol, hp, dest, kind) {
    const c = this.ctx; if (!c) return;
    if (!this.nbuf) { const b = c.createBuffer(1, c.sampleRate, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; this.nbuf = b; }
    const s = c.createBufferSource(); s.buffer = this.nbuf; const g = c.createGain(), f = c.createBiquadFilter(); f.type = kind || 'highpass'; f.frequency.value = hp || 1000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(dest || this.master); s.start(t); s.stop(t + d + 0.02);
  },
  // ---- orchestral voices (all go to the track's bus) ----
  // oscillators [type, freq, detune cents, gain] -> optional lowpass -> envelope (attack a, hold to t+d, release r) -> bus
  voice(bus, t, d, vol, oscs, o) {
    const c = this.ctx, g = c.createGain(), a = o.a || 0.005, r = o.r || 0.1; let out = g;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = 0.5; g.connect(f); out = f; }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * (o.sus || 0.0002)), t + a + o.decay); else g.gain.setValueAtTime(vol, t + Math.max(a, d - r));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + r); out.connect(bus);
    for (const [ty, f, det, gn] of oscs) { const os = c.createOscillator(); os.type = ty; os.frequency.value = f; os.detune.value = det; if (gn === 1) os.connect(g); else { const q = c.createGain(); q.gain.value = gn; os.connect(q); q.connect(g); } os.start(t); os.stop(t + d + r + 0.05); }
  },
  strings(bus, f, t, d, vol, lp) { this.voice(bus, t, d, vol, [['sawtooth', f, -8, 0.6], ['sawtooth', f, 7, 0.6], ['triangle', f, 0, 0.5]], { a: Math.min(0.4, d * 0.4), r: 0.5, lp: lp || 1500 }); },
  piano(bus, f, t, d, vol) { this.voice(bus, t, Math.min(d, 1.2), vol, [['sine', f, 0, 1], ['triangle', f * 2, 3, 0.3], ['sine', f * 3, 0, 0.1]], { a: 0.006, decay: Math.min(1.4, Math.max(0.5, d)), sus: 0.08, r: 0.15 }); },
  harp(bus, f, t, vol) { this.voice(bus, t, 0.35, vol, [['triangle', f, 0, 1], ['sine', f * 2, 0, 0.35]], { a: 0.004, decay: 0.7, sus: 0.03, r: 0.1 }); },
  cello(bus, f, t, d, vol) { this.voice(bus, t, d, vol, [['sawtooth', f, 0, 0.35], ['sine', f, 0, 1], ['triangle', f * 2, 0, 0.2]], { a: 0.03, r: 0.12, lp: 650 }); },
  drum(bus, kind, t) {
    const c = this.ctx; if (kind === 'k' || kind === 'K') { const big = kind === 'K', o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(big ? 95 : 120, t); o.frequency.exponentialRampToValueAtTime(big ? 42 : 58, t + 0.3);
      g.gain.setValueAtTime(big ? 0.55 : 0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.55 : 0.4)); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.6); this.noise(t, 0.07, big ? 0.22 : 0.14, 380, bus, 'lowpass'); }
    else if (kind === 's') this.noise(t, 0.07, 0.07, 2200, bus, 'bandpass'); else if (kind === 'h') this.noise(t, 0.025, 0.025, 7500, bus);
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
    this.stop(); const tr = TRACKS[name]; if (!tr) return; const mood = MOOD[name] || MOOD.field;
    const parse = s => s.trim().split(/\s+/), c = this.ctx;
    const bus = c.createGain(); bus.gain.value = 1; bus.connect(this.mIn);   // dry
    if (this.conv) { const w = c.createGain(); w.gain.value = mood.wet; bus.connect(w); w.connect(this.conv); }   // reverb send
    this.cur = { name, tr, mood, bus, lead: parse(tr.lead), bass: tr.bass ? parse(tr.bass) : [], drums: tr.drums || '', step: 0, next: c.currentTime + 0.05, dur: 60 / tr.bpm / 2, chord: null };
    const sched = () => {
      const s = this.cur; if (!s || !this.ctx) return;
      while (s.next < this.ctx.currentTime + 0.25) {
        const i = s.step, t = s.next, L = s.lead[i % s.lead.length], B = s.bass.length ? s.bass[i % s.bass.length] : null, m = s.mood, soft = m.soft ? 0.7 : 1;
        const hold = (arr, k) => { let n = 1; while (arr[(k + n) % arr.length] === '-' && n < 8) n++; return n; };
        if (i % 8 === 0) { s.chord = barChord(s.bass, i / 8, m.key, s.chord); const ch = s.chord, bd = s.dur * 8 * 1.02;   // strings pad: one chord per bar, slow attack
          ch.forEach((n, k) => this.strings(bus, mhz(n + (k === 0 ? 0 : 0)), t, bd, 0.05 * soft, 1200)); this.strings(bus, mhz(ch[0] + 12), t, bd, 0.025 * soft, 1400); }
        if (m.arp && s.chord) { const a = [s.chord[0] + 12, s.chord[1] + 12, s.chord[2] + 12, s.chord[0] + 24, s.chord[1] + 24], p = [0, 1, 2, 3, 4, 3, 2, 1][i % 8]; if (!(m.ost && i % 2)) this.harp(bus, mhz(a[p]), t, 0.055 * soft); }
        if (L && L !== '.' && L !== '-') { const n = hold(s.lead, i), d = s.dur * n * 0.95, f = nfreq(L);
          this.piano(bus, f, t, d, 0.11 * soft); if (n >= 3 || m.str) this.strings(bus, f, t, d, 0.035 * soft, 2600); }
        if (B && B !== '.' && B !== '-') { const d = s.dur * hold(s.bass, i) * 0.92; this.cello(bus, nfreq(B), t, d, 0.17); }
        if (s.drums && m.drum) { const d = s.drums[i % s.drums.length]; if (d === 'k') this.drum(bus, m.drum === 'taiko' ? 'K' : 'k', t); else if (d === 's' || d === 'h') { if (m.drum === 'taiko' || d === 's') this.drum(bus, 's', t); else if (name === 'field') this.drum(bus, 'h', t); } }
        s.step++; s.next += s.dur;
        if (s.tr.once && s.step >= s.lead.length) { this.cur.over = true; clearInterval(this.timer); return; }
      }
    };
    this.timer = setInterval(sched, 40); sched();
  },
  stop() { clearInterval(this.timer); const s = this.cur; if (s && s.bus && this.ctx) { try { s.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12); const b = s.bus; setTimeout(() => { try { b.disconnect(); } catch (e) { } }, 1500); } catch (e) { } } this.cur = null; }
};
