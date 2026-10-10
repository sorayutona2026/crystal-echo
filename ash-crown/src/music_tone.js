// ===================== MUSIC via Tone.js (MIT, vendor/Tone.js) =====================
// 曲データ TRACKS(audio.js と同じ形式)を Tone.js の音源・リバーブ・ディレイで鳴らす。
// Tone.js が読み込めないとき(または音が出せないとき)は、audio.js の元のチップチューン再生にそのまま戻る。
const ToneMusic = {
  ok: typeof Tone !== 'undefined', ready: false, rig: null, part: null,
  makeRig() {
    const T = Tone, dest = T.getDestination();
    const lim = new T.Limiter(-6).connect(dest); const master = new T.Gain(0.65).connect(lim); // 音割れ防止のリミッター
    const rev = new T.Reverb({ decay: 4.2, wet: 0.4 }); rev.connect(master);
    const bus = new T.Gain(1); bus.connect(master); bus.connect(rev);
    const delay = new T.FeedbackDelay({ delayTime: 0.4, maxDelay: 2, feedback: 0.32, wet: 0.28 }); delay.connect(bus);
    const lpf = (f, to) => { const n = new T.Filter(f, 'lowpass'); n.connect(to); return n; };
    const env = (a, d, s, r) => ({ attack: a, decay: d, sustain: s, release: r });
    const lead = new T.Synth({ oscillator: { type: 'fatsawtooth', count: 2, spread: 14 }, envelope: env(0.03, 0.25, 0.55, 0.6), volume: -13 });
    const vib = new T.Vibrato({ frequency: 5, depth: 0.07 }); const leadF = lpf(2600, bus); lead.chain(vib, leadF); leadF.connect(delay); // 原音+エコー
    const harm = new T.Synth({ oscillator: { type: 'triangle' }, envelope: env(0.05, 0.3, 0.5, 0.6), volume: -19 }); harm.connect(lpf(1800, bus));
    const pad = new T.PolySynth(T.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 22 }, envelope: env(0.9, 0.5, 0.8, 1.8) }); pad.volume.value = -27; pad.connect(lpf(900, bus));
    const bass = new T.Synth({ oscillator: { type: 'fatsquare', count: 2, spread: 8 }, envelope: env(0.02, 0.2, 0.7, 0.3), volume: -13 }); bass.connect(lpf(420, master));
    const arp = new T.Synth({ oscillator: { type: 'pulse', width: 0.3 }, envelope: env(0.005, 0.18, 0.1, 0.25), volume: -25 }); arp.connect(lpf(3200, delay));
    const kick = new T.MembraneSynth({ pitchDecay: 0.05, octaves: 5, envelope: env(0.001, 0.3, 0, 0.2), volume: -7 }).connect(master);
    const tom = new T.MembraneSynth({ pitchDecay: 0.08, octaves: 2, envelope: env(0.001, 0.25, 0, 0.2), volume: -11 }).connect(master);
    const snare = new T.NoiseSynth({ noise: { type: 'white' }, envelope: env(0.001, 0.16, 0, 0.1), volume: -15 }); snare.connect(new T.Filter(1800, 'highpass').connect(bus));
    const hat = new T.NoiseSynth({ noise: { type: 'white' }, envelope: env(0.001, 0.04, 0, 0.02), volume: -30 }); hat.connect(new T.Filter(7000, 'highpass').connect(master));
    const crash = new T.NoiseSynth({ noise: { type: 'pink' }, envelope: env(0.002, 1.2, 0, 0.6), volume: -26 }); crash.connect(new T.Filter(4500, 'highpass').connect(bus));
    return { master, rev, delay, lead, harm, pad, bass, arp, kick, tom, snare, hat, crash };
  },
  // 曲を Transport に載せる。once なら1回だけ。戻り値は曲の長さ(秒)
  schedule(rig, tr, onEnd) {
    const S = Audio8.build(tr), step = S.step, hz = m => Tone.Frequency(m, 'midi').toFrequency();
    rig.delay.delayTime.value = Math.min(1.4, step * 3);
    const part = new Tone.Part((time, e) => {
      const dur = (e.d || 0.5) * step;
      switch (e.ch) {
        case 'mel': rig.lead.triggerAttackRelease(hz(e.m), dur, time); break;
        case 'harm': rig.harm.triggerAttackRelease(hz(e.m), dur, time); break;
        case 'pad': rig.pad.triggerAttackRelease(hz(e.m), dur, time); break;
        case 'bass': rig.bass.triggerAttackRelease(hz(e.m), dur, time); break;
        case 'arp': rig.arp.triggerAttackRelease(hz(e.m), dur, time); break;
        case 'kick': rig.kick.triggerAttackRelease('C1', 0.2, time); break;
        case 'tom': rig.tom.triggerAttackRelease(110 + (e.m || 0) * 40, 0.2, time); break;
        case 'snare': rig.snare.triggerAttackRelease(0.16, time); break;
        case 'hat': rig.hat.triggerAttackRelease(0.04, time, e.soft ? 0.5 : 1); break;
        case 'crash': rig.crash.triggerAttackRelease(1.2, time); break;
      }
    }, S.evs.map(e => [e.t * step, e]));
    part.humanize = false;
    if (S.once) { part.loop = false; if (onEnd) Tone.getTransport().scheduleOnce(() => onEnd(), S.len * step + 0.2); }
    else { part.loop = true; part.loopStart = S.loopFrom * step; part.loopEnd = S.len * step; }
    part.start(0);
    return { part, seconds: S.len * step };
  },
  async start() { try { await Tone.start(); this.ready = true; if (!this.rig) this.rig = this.makeRig(); Tone.getDestination().mute = Audio8.muted; } catch (e) { this.ok = false; console.warn('Tone start failed', e); } },
  play(name, after) {
    const tr = TRACKS[name]; if (!tr || !this.rig) return;
    this.stop(true); const T = Tone.getTransport(); T.cancel(); T.stop();
    const nx = after || null;
    const r = this.schedule(this.rig, tr, nx ? () => setTimeout(() => { if (Audio8.cur === name) { Audio8.cur = null; Audio8.play(nx); } }, 0) : null);
    this.part = r.part; this.rig.master.gain.cancelScheduledValues(Tone.now()); this.rig.master.gain.setValueAtTime(0.0001, Tone.now()); this.rig.master.gain.linearRampToValueAtTime(1, Tone.now() + 0.2);
    T.start('+0.05');
  },
  stop(quick) {
    if (!this.rig) return; const T = Tone.getTransport();
    if (this.part) { this.part.dispose(); this.part = null; }
    this.rig.pad.releaseAll(); this.rig.master.gain.cancelScheduledValues(Tone.now());
    if (!quick) { this.rig.master.gain.setValueAtTime(this.rig.master.gain.value, Tone.now()); this.rig.master.gain.linearRampToValueAtTime(0.0001, Tone.now() + 0.25); }
  },
};
if (ToneMusic.ok) {
  const orig = { play: Audio8.play, stop: Audio8.stop, unlock: Audio8.unlock, setMuted: Audio8.setMuted };
  Audio8.unlock = function () { orig.unlock.call(this); if (ToneMusic.ok && !ToneMusic.ready && !ToneMusic.starting) { ToneMusic.starting = true; ToneMusic.start().then(() => { ToneMusic.starting = false; if (ToneMusic.ok && this.want) { this.cur = null; this.play(this.want, this.after); } }); } };
  Audio8.play = function (name, after) {
    if (!ToneMusic.ok) return orig.play.call(this, name, after);
    this.want = name; this.after = after || null;
    if (!ToneMusic.ready || this.cur === name) return;
    this.cur = name; if (!name) { ToneMusic.stop(); return; }
    ToneMusic.play(name, after);
  };
  Audio8.stop = function () { if (!ToneMusic.ok) return orig.stop.call(this); this.cur = null; ToneMusic.stop(); };
  Audio8.setMuted = function (m) { orig.setMuted.call(this, m); if (ToneMusic.ready) Tone.getDestination().mute = m; };
}
