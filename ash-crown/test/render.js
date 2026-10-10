// Tone.js で曲を実際に書き出して検算する(無音・音割れ・長さ)。WAV を test-out/music/ に保存して聞けるようにする。
// 使い方: node test/render.js [曲名 ...]  (省略時は town dungeon boss title)
const { chromium } = require(process.env.PW_PATH || 'playwright'); const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../test-out/music'); fs.mkdirSync(OUT, { recursive: true });
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['town', 'dungeon', 'boss', 'title'];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.__rpg && window.__rpg.G.scene); await p.waitForTimeout(500);
  let bad = 0;
  for (const n of names) {
    const r = await p.evaluate(async n => {
      const tr = TRACKS[n]; const S = Audio8.build(tr); const secs = Math.min(70, S.len * S.step + 3);
      const buf = await Tone.Offline(async () => { const rig = ToneMusic.makeRig(); await rig.rev.ready; ToneMusic.schedule(rig, tr); Tone.getTransport().start(0.05); }, secs);
      const ch = buf.getChannelData(0), ch2 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : ch; let peak = 0, sum = 0, clip = 0;
      for (let i = 0; i < ch.length; i++) { const v = Math.abs(ch[i]); if (v > peak) peak = v; if (v >= 0.999) clip++; sum += ch[i] * ch[i]; }
      // 16bit WAV (stereo)
      const sr = buf.sampleRate, len = ch.length, a = new ArrayBuffer(44 + len * 4), d = new DataView(a); const w = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); d.setUint32(4, 36 + len * 4, true); w(8, 'WAVEfmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 2, true); d.setUint32(24, sr, true); d.setUint32(28, sr * 4, true); d.setUint16(32, 4, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, len * 4, true);
      for (let i = 0; i < len; i++) { d.setInt16(44 + i * 4, Math.max(-1, Math.min(1, ch[i])) * 32767, true); d.setInt16(46 + i * 4, Math.max(-1, Math.min(1, ch2[i])) * 32767, true); }
      let bin = ''; const u = new Uint8Array(a); for (let i = 0; i < u.length; i += 8192) bin += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
      return { secs, peak, rms: Math.sqrt(sum / len), clip, wav: btoa(bin) };
    }, n);
    fs.writeFileSync(path.join(OUT, n + '.wav'), Buffer.from(r.wav, 'base64'));
    const ok = r.peak > 0.05 && r.peak < 1 && r.clip === 0 && r.rms > 0.01; if (!ok) bad++;
    console.log(n.padEnd(8), `長さ${r.secs.toFixed(1)}s ピーク${r.peak.toFixed(2)} 平均${r.rms.toFixed(3)} 音割れ${r.clip}`, ok ? 'OK' : 'NG');
  }
  console.log(errs.length ? 'errors: ' + errs.join() : 'no page errors'); await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
