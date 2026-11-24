/* Atumaa — The Seventh Seat. One-thumb reel gestures, plain canvas, no dependencies.
   Story beats follow the film's trailer: the signal, the launch, 1998 KY26, the corridor, the twin suns, the seats. */
(() => {
  'use strict';

  // Each signal is answered with one of the gestures people already use on short-video feeds.
  const ELEMENTS = [
    { name: 'Pulse', rgb: '125,220,132', note: 392.0, gesture: 'up' },
    { name: 'Echo', rgb: '95,201,243', note: 440.0, gesture: 'down' },
    { name: 'Flare', rgb: '255,200,87', note: 523.25, gesture: 'like' },
    { name: 'Lock', rgb: '185,160,255', note: 587.33, gesture: 'hold' },
  ];

  // The seven seats. Story text lives here so it can be swapped for the film's own names.
  // Each seat adds one complication on top of everything before it.
  // The ten seats follow the film's eight episodes. `when` and `story` make the story card shown
  // the first time a seat is reached; `art` picks the landmark painted behind the lane.
  const WORLDS = [
    { name: 'The Listening Room', when: 'November 2026', story: 'Eleven metres of rock is speeding up, and nobody can say why. In the listening room she closes her eyes. Inside the noise, a heartbeat.', art: 'scope',
      adds: 'Pulse and Echo: swipe up, swipe down', bg: '#040a0c', glow: '18,70,72', speck: '255,190,120', side: [10, 34, 38], shape: 'girders', accent: '90,235,190' },
    { name: 'First Contact', when: 'July 2031', story: 'The probe arrives after five years. The rock answers it with a single line of light, and a ring opens on its face.', art: 'crossing', beam: true,
      adds: 'Flare: double-tap', bg: '#030408', glow: '30,36,60', speck: '220,225,255', side: [26, 28, 36], shape: 'crystals', accent: '200,210,255' },
    { name: 'The Notebook', when: 'Three days later', story: 'She lays the traces beside an old notebook. The pattern is not noise. It is counting, and it stops at six.', art: 'notebook',
      adds: 'Gaps come thick now: never touch them', bg: '#0b0906', glow: '96,70,38', speck: '255,214,160', side: [46, 32, 18], shape: 'screens', accent: '255,200,120' },
    { name: 'Launch', when: '2032', story: 'Six go. None of them can say why it had to be these six, only that each is missing the same five minutes.', art: 'rocket',
      adds: 'Lock: press and hold', bg: '#120b08', glow: '120,70,48', speck: '255,220,190', side: [50, 28, 20], shape: 'pillars', accent: '255,190,140' },
    { name: 'Day 212', when: 'At 1998 KY26', story: 'They reach it at last. The ring turns once, and the rock opens.', art: 'ky26',
      adds: 'Bound signals: answer each in turn', bg: '#070605', glow: '92,66,26', speck: '255,215,150', side: [36, 32, 28], shape: 'shards', accent: '255,196,110' },
    { name: 'The Corridor', when: 'Inside', story: 'A wall of screens with no end, each one a memory of Earth. One of them is showing the listening room.', art: 'corridor',
      adds: 'Mirrored signals: swipe the opposite way', bg: '#04070a', glow: '30,70,90', speck: '255,200,140', side: [86, 62, 40], shape: 'screens', accent: '255,190,120' },
    { name: 'The Seventh Seat', when: 'The chamber', story: 'Seven seats of black stone. Six were always theirs. On the seventh lies a figure made of sand.', art: 'seats',
      adds: 'Cloaked signals: revealed at the last moment', bg: '#050505', glow: '70,60,40', speck: '255,220,150', side: [24, 24, 26], shape: 'pillars', accent: '255,214,130' },
    // beyond the seventh seat the signals arrive in lanes, and the move has to be made in the right one
    { name: 'Twin Suns', when: 'Through the ring', story: 'Two of them step into the light and wake under two suns, above a violet sea.', art: 'suns',
      adds: "Aim: two lanes. Make your move in the signal's own lane", bg: '#0a0612', glow: '110,60,150', speck: '255,180,230', side: [44, 22, 60], shape: 'dunes', accent: '255,140,170' },
    { name: 'The Field', when: 'The far world', story: 'Rocks to the horizon, every one with its own ring. It has been calling to many worlds.', art: 'field',
      adds: 'Three lanes, and the old tricks return', bg: '#03090b', glow: '20,90,100', speck: '120,255,240', side: [14, 40, 44], shape: 'shards', accent: '90,240,230' },
    { name: 'The Shore', when: 'The far world', story: 'On the black sand, someone has been waiting.', art: 'shore',
      adds: 'Everything at once, sometimes two together', bg: '#0b0907', glow: '110,80,50', speck: '255,220,180', side: [40, 30, 24], shape: 'dunes', accent: '255,200,140' },
  ];
  const INTRO = [
    { el: 0, dur: 2.1, touch: 'Swipe up', desk: 'Swipe up  ·  ↑' },
    { el: 1, dur: 2.1, touch: 'Swipe down', desk: 'Swipe down  ·  ↓' },
    { el: 2, dur: 2.1, touch: 'Double-tap', desk: 'Double-tap  ·  Space' },
    { el: 3, dur: 2.1, touch: 'Press and hold', desk: 'Hold  ·  Shift' },
    { el: -1, dur: 1.6, touch: 'Never touch a Gap', desk: 'Never touch a Gap' },
  ];
  const INTRO_TOTAL = INTRO.reduce((s, b) => s + b.dur, 0); // 10 seconds

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const TAU = Math.PI * 2;
  const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';
  const SWIPE_PX = 24, TAP_PX = 12, TAP_MS = 300, DOUBLE_MS = 420, HOLD_S = 0.38;
  const SWIPE_CONE = Math.tan((50 * Math.PI) / 180); // thumbs arc: accept up to 50 degrees off vertical
  const TOUCH = window.matchMedia && window.matchMedia('(hover: none)').matches;

  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const ui = {
    hud: $('hud'), grove: $('grove'), pips: $('pips'), light: $('light'), score: $('score'),
    clock: $('clock'), hint: $('hint'), banner: $('banner'), skip: $('btn-skip'),
    title: $('screen-title'), pause: $('screen-pause'), over: $('screen-over'),
    board: $('board'), boardCount: $('board-count'), boardList: $('board-list'), boardName: $('board-name'), post: $('btn-post'), streak: $('streak-line'),
    retry: $('btn-retry'),
    finalScore: $('final-score'), again: $('btn-again'), endless: $('btn-endless'), finalStats: $('final-stats'), haptic: $('btn-haptic'), finalDetail: $('final-detail'),
    bestTitle: $('best-title'), bestOver: $('best-over'),
    sound: $('btn-sound'),
    // send a signal
    compose: $('screen-compose'), start: $('btn-start'), premise: $('premise'),
    glyphTitle: $('glyph-title'), glyphCompose: $('glyph-compose'), glyphOver: $('glyph-over'),
    tapPad: $('tap-pad'), composeHint: $('compose-hint'), composeCount: $('compose-count'),
    playSignal: $('btn-play-signal'), redo: $('btn-redo'),
    overTitle: $('over-title'), daily: $('btn-daily'), daily2: $('btn-daily2'), signalBtn: $('btn-signal'), sound2: $('btn-sound2'), haptic2: $('btn-haptic2'),
    signalResult: $('signal-result'), share: $('btn-share'), shareNote: $('share-note'), free: $('btn-free'),
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const seatOf = (lv) => Math.min(lv, WORLDS.length);
  const LAST = WORLDS.length; // beyond this the last seat repeats in faster cycles
  const world = () => WORLDS[seatOf(level) - 1];

  // Everything that decides what falls and when draws from rng, so a shared signal
  // replays the same run for whoever opens it. Effects keep using Math.random.
  let rng = Math.random;
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Layout ---------- */
  let W = 0, H = 0, U = 1, DPR = 1;
  const field = { cx: 0, top: 64, heartY: 0, path: 0 };
  let ground = null, scenery = null;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    U = clamp(Math.min(W, H * 0.6) / 400, 0.7, 1.4);
    field.cx = W / 2;
    field.heartY = H - Math.max(120, 132 * U);
    field.path = Math.min(W * 0.33, 150 * U);
    buildBackdrop();
    if (TOUCH && W > H && H < 520 && mode === 'play') setMode('pause');
  }

  function sideShape(f, kind, x, y, s, col) {
    f.fillStyle = col;
    f.strokeStyle = col;
    if (kind === 'girders') {
      f.fillRect(x - s * 0.1, y - s * 1.3, s * 0.2, s * 2.6);
      f.fillRect(x - s * 0.7, y - s * 0.08, s * 1.4, s * 0.16);
      f.fillRect(x - s * 0.45, y - s * 0.9, s * 0.9, s * 0.1);
    } else if (kind === 'shards') {
      f.beginPath();
      f.moveTo(x - s * 0.4, y + s * 0.7); f.lineTo(x + s * 0.1, y - s * 1.2); f.lineTo(x + s * 0.5, y + s * 0.7);
      f.closePath(); f.fill();
    } else if (kind === 'screens') {
      f.fillRect(x - s * 0.5, y - s * 0.32, s, s * 0.64);
      f.fillStyle = 'rgba(255,225,180,0.16)';
      f.fillRect(x - s * 0.5, y - s * 0.02, s, s * 0.1);
    } else if (kind === 'dunes') {
      f.beginPath();
      f.ellipse(x, y, s * 1.9, s * 0.5, 0, Math.PI, TAU);
      f.closePath(); f.fill();
    } else if (kind === 'kelp') {
      f.lineWidth = s * 0.16;
      f.lineCap = 'round';
      f.beginPath();
      f.moveTo(x, y + s * 1.2);
      f.bezierCurveTo(x + s * 0.6, y + s * 0.4, x - s * 0.6, y - s * 0.4, x + s * 0.15, y - s * 1.2);
      f.stroke();
      f.beginPath(); f.arc(x + s * 0.5, y - s * 0.3, s * 0.12, 0, TAU); f.fill();
    } else if (kind === 'pines') {
      for (let k = 0; k < 3; k++) {
        const ww = s * (0.75 - k * 0.17), top = y - s * (0.55 + k * 0.42);
        f.beginPath();
        f.moveTo(x - ww, top + s * 0.62); f.lineTo(x, top); f.lineTo(x + ww, top + s * 0.62);
        f.closePath(); f.fill();
      }
    } else if (kind === 'crystals') {
      f.beginPath();
      f.moveTo(x, y - s * 1.1); f.lineTo(x + s * 0.45, y); f.lineTo(x, y + s * 1.1); f.lineTo(x - s * 0.45, y);
      f.closePath(); f.fill();
    } else { // pillars
      f.fillRect(x - s * 0.22, y - s * 1.2, s * 0.44, s * 2.4);
      f.fillRect(x - s * 0.36, y - s * 1.32, s * 0.72, s * 0.14);
      f.fillRect(x - s * 0.36, y + s * 1.18, s * 0.72, s * 0.14);
    }
  }

  // what you are travelling toward, drawn once behind the lane so a still frame names the seat
  function drawLandmark(b, idx, w) {
    const cx = field.cx, top = field.top, R = Math.min(W, 560 * U);
    b.save();
    b.lineJoin = 'round';
    b.lineCap = 'round';
    if (w.art === 'notebook') { // the notebook: rows of heartbeat traces, like the pages on the desk
      b.strokeStyle = 'rgba(255,214,150,0.4)';
      b.lineWidth = 1.6 * U;
      const sp = 120 * U;
      for (let r = 0; r < 6; r++) {
        const base = top + H * 0.06 + r * 34 * U;
        b.globalAlpha = 1 - r * 0.13;
        b.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const d = ((x + r * 37 * U) % sp + sp) % sp - sp / 2;
          const y = base - beatShape(d / U, r === 4 && Math.abs(x - cx) < sp ? 1 : 0) * U * 0.22;
          if (x) b.lineTo(x, y); else b.moveTo(x, y);
        }
        b.stroke();
      }
      b.globalAlpha = 1;
      b.strokeStyle = 'rgba(200,60,50,0.75)'; // the one she circled
      b.lineWidth = 2 * U;
      b.beginPath(); b.ellipse(cx, top + H * 0.06 + 4 * 34 * U, 30 * U, 17 * U, 0, 0, TAU); b.stroke();
      b.restore();
      return;
    }
    idx = ['scope', 'rocket', 'crossing', 'ky26', 'corridor', 'suns', 'seats', 'field', 'shore'].indexOf(w.art);
    if (idx === 0) { // the listening room: a heartbeat across a scope
      b.strokeStyle = 'rgba(90,235,190,0.1)';
      b.lineWidth = 1;
      for (let y = top; y < top + H * 0.34; y += 26 * U) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
      b.strokeStyle = 'rgba(110,245,200,0.5)';
      b.lineWidth = 2.5 * U;
      b.beginPath();
      const sp = 170 * U, base = top + H * 0.2;
      for (let x = 0; x <= W; x += 2) {
        const d = ((x - cx) % sp + sp * 1.5) % sp - sp / 2;
        const y = base - beatShape(d / U, 0) * U * 0.8;
        if (x) b.lineTo(x, y); else b.moveTo(x, y);
      }
      b.stroke();
    } else if (idx === 1) { // launch: a rocket on a pillar of fire
      const x = cx, y = top + H * 0.08, bw = 15 * U, bh = 92 * U;
      const plume = b.createLinearGradient(0, y + bh, 0, y + bh + H * 0.55);
      plume.addColorStop(0, 'rgba(255,236,190,0.75)');
      plume.addColorStop(0.2, 'rgba(255,170,90,0.4)');
      plume.addColorStop(1, 'rgba(255,120,60,0)');
      b.fillStyle = plume;
      b.beginPath();
      b.moveTo(x - bw * 0.5, y + bh); b.lineTo(x + bw * 0.5, y + bh); b.lineTo(x + bw * 5, y + bh + H * 0.55); b.lineTo(x - bw * 5, y + bh + H * 0.55);
      b.closePath();
      b.fill();
      b.fillStyle = 'rgba(244,236,226,0.82)';
      b.fillRect(x - bw / 2, y, bw, bh);
      b.beginPath();
      b.moveTo(x - bw / 2, y); b.lineTo(x, y - bw * 1.7); b.lineTo(x + bw / 2, y);
      b.closePath();
      b.fill();
      b.fillStyle = 'rgba(40,36,34,0.9)';
      b.fillRect(x - bw / 2, y + bh * 0.3, bw, 3 * U);
    } else if (idx === 2) { // the crossing: the rock far ahead, the probe closing on it
      for (let i = 0; i < 26; i++) {
        const x = rand(0, W), y = rand(top, H), l = rand(20, 80) * U;
        b.strokeStyle = `rgba(210,220,255,${rand(0.05, 0.2)})`;
        b.lineWidth = 1;
        b.beginPath(); b.moveTo(x, y); b.lineTo(x, y + l); b.stroke();
      }
      rock(b, cx, top + H * 0.13, 30 * U, 0.75);
      b.strokeStyle = 'rgba(255,196,110,0.75)';
      b.lineWidth = 2 * U;
      b.beginPath(); b.arc(cx, top + H * 0.13, 12 * U, 0, TAU); b.stroke();
      if (w.beam) { // the single line of light
        const beam = b.createLinearGradient(0, top - 20, 0, top + H * 0.13);
        beam.addColorStop(0, 'rgba(255,240,220,0)'); beam.addColorStop(1, 'rgba(255,240,220,0.95)');
        b.strokeStyle = beam;
        b.lineWidth = 3 * U;
        b.beginPath(); b.moveTo(cx + 26 * U, top - 20); b.lineTo(cx + 4 * U, top + H * 0.13 - 18 * U); b.stroke();
      }
    } else if (idx === 3) { // 1998 KY26: the rock itself, the gold ring open on its face
      const r = R * 0.5, y = top + r * 0.5;
      rock(b, cx, y, r, 0.95);
      b.strokeStyle = 'rgba(255,196,110,0.85)';
      b.lineWidth = 3 * U;
      b.beginPath(); b.arc(cx, y + r * 0.12, r * 0.42, 0, TAU); b.stroke();
      b.lineWidth = 1.5 * U;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, r1 = r * 0.42, r2 = r * (0.5 + (i % 3) * 0.08);
        b.beginPath();
        b.moveTo(cx + Math.cos(a) * r1, y + r * 0.12 + Math.sin(a) * r1);
        b.lineTo(cx + Math.cos(a + 0.12) * r2, y + r * 0.12 + Math.sin(a + 0.12) * r2);
        b.stroke();
      }
      b.fillStyle = 'rgba(255,214,150,0.9)';
      b.beginPath(); b.arc(cx + r * 0.3, y - r * 0.18, 4 * U, 0, TAU); b.fill();
    } else if (idx === 4) { // the corridor: walls of screens running to a vanishing point
      const vy = top + H * 0.06;
      for (let r = 0; r < 11; r++) {
        const k = Math.pow(r / 10, 1.5), y = vy + k * (H - vy), h = (9 + k * 54) * U, ww = h * 1.45;
        for (let c = 0; c < 3; c++) for (const side of [-1, 1]) {
          const x = cx + side * (field.path * (0.5 + k * 0.7) + c * (ww + 5 * U)) - (side < 0 ? ww : 0);
          b.fillStyle = `hsla(${rand(14, 52)},${rand(55, 85)}%,${rand(32, 58)}%,${0.3 + k * 0.4})`;
          b.fillRect(x, y, ww, h * 0.8);
          b.fillStyle = 'rgba(255,240,210,0.16)';
          b.fillRect(x, y + h * 0.5, ww, h * 0.08);
        }
      }
    } else if (idx === 5) { // twin suns over an iridescent sea
      const hy = top + H * 0.2;
      for (const [dx, rr, rgb] of [[-78, 24, '240,244,255'], [70, 40, '255,96,96']]) {
        const g = b.createRadialGradient(cx + dx * U, hy - 46 * U, 0, cx + dx * U, hy - 46 * U, rr * U * 3);
        g.addColorStop(0, `rgba(${rgb},0.95)`);
        g.addColorStop(0.3, `rgba(${rgb},0.85)`);
        g.addColorStop(0.36, `rgba(${rgb},0.22)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        b.fillStyle = g;
        b.fillRect(0, top, W, hy - top);
      }
      for (let i = 0; i < 46; i++) {
        const y = hy + Math.pow(i / 46, 1.4) * (H - hy), ww = rand(0.2, 0.9) * W;
        b.fillStyle = `hsla(${[285, 320, 190, 265][i % 4]},85%,68%,${rand(0.05, 0.16)})`;
        b.fillRect(cx - ww / 2 + rand(-40, 40), y, ww, (2 + i * 0.22) * U);
      }
      b.fillStyle = 'rgba(255,200,230,0.35)';
      b.fillRect(0, hy, W, 1.5);
    } else if (idx === 7) { // the field: rows of dark spheres with one ember each, running to the horizon
      for (let r = 0; r < 10; r++) {
        const k = Math.pow(r / 9, 1.5), y = top + H * 0.05 + k * H * 0.9, sz = (3 + k * 19) * U;
        for (let c = -5; c <= 5; c++) {
          const x = cx + c * sz * 3.3 + (r % 2) * sz * 1.6;
          if (Math.abs(x - cx) < field.path * 1.05) continue;
          b.fillStyle = `rgba(6,14,16,${0.5 + k * 0.45})`;
          b.strokeStyle = `rgba(90,240,230,${0.18 + k * 0.4})`;
          b.lineWidth = 1.2;
          b.beginPath(); b.arc(x, y, sz, 0, TAU); b.fill(); b.stroke();
          b.fillStyle = `rgba(255,150,70,${0.4 + k * 0.5})`;
          b.beginPath(); b.arc(x + sz * 0.3, y - sz * 0.1, sz * 0.2, 0, TAU); b.fill();
        }
      }
    } else if (idx === 8) { // the shore: a hooded figure against a low sun
      const hy = top + H * 0.2;
      const sun = b.createRadialGradient(cx + 60 * U, hy, 0, cx + 60 * U, hy, 150 * U);
      sun.addColorStop(0, 'rgba(255,226,170,0.95)'); sun.addColorStop(0.12, 'rgba(255,200,130,0.5)'); sun.addColorStop(1, 'rgba(255,180,110,0)');
      b.fillStyle = sun;
      b.fillRect(0, top, W, hy - top + 4);
      b.fillStyle = 'rgba(8,7,6,0.96)';
      for (const [dx, hh, ww] of [[-150, 44, 60], [-96, 26, 40], [150, 54, 74], [108, 30, 46]]) {
        b.beginPath(); b.moveTo(cx + (dx - ww / 2) * U, hy); b.lineTo(cx + dx * U, hy - hh * U); b.lineTo(cx + (dx + ww / 2) * U, hy); b.closePath(); b.fill();
      }
      b.beginPath(); // the figure
      b.moveTo(cx - 20 * U, hy + 4 * U);
      b.quadraticCurveTo(cx - 17 * U, hy - 66 * U, cx, hy - 92 * U);
      b.quadraticCurveTo(cx + 17 * U, hy - 66 * U, cx + 20 * U, hy + 4 * U);
      b.closePath(); b.fill();
      for (let i = 0; i < 34; i++) {
        const y = hy + 6 + Math.pow(i / 34, 1.5) * (H - hy), ww = rand(0.15, 0.7) * W;
        b.fillStyle = `rgba(255,200,140,${rand(0.04, 0.13)})`;
        b.fillRect(cx - ww / 2 + rand(-30, 30), y, ww, (1.5 + i * 0.16) * U);
      }
    } else if (idx === 9) { // the answer: the gold ring alone, open
      const r = R * 0.34, y = top + r * 0.75;
      const g = b.createRadialGradient(cx, y, r * 0.2, cx, y, r * 1.9);
      g.addColorStop(0, 'rgba(255,214,130,0.3)'); g.addColorStop(1, 'rgba(255,214,130,0)');
      b.fillStyle = g;
      b.fillRect(0, top - 40, W, r * 4);
      b.strokeStyle = 'rgba(255,214,130,0.42)';
      b.lineWidth = 3 * U;
      b.beginPath(); b.arc(cx, y, r, 0, TAU); b.stroke();
      b.lineWidth = 1.5 * U;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU, r2 = r * (i % 6 === 0 ? 1.22 : 1.1);
        b.beginPath(); b.moveTo(cx + Math.cos(a) * r * 1.04, y + Math.sin(a) * r * 1.04); b.lineTo(cx + Math.cos(a) * r2, y + Math.sin(a) * r2); b.stroke();
      }
      b.fillStyle = 'rgba(255,236,190,0.95)';
      b.beginPath(); b.arc(cx + r * 0.72, y - r * 0.72, 5 * U, 0, TAU); b.fill();
    } else { // the seventh seat: seven stone seats in an arc, one of them lit
      for (let i = 0; i < 9; i++) {
        let x = rand(0, W), y = top;
        b.strokeStyle = `rgba(255,214,130,${rand(0.12, 0.3)})`;
        b.lineWidth = 1.5 * U;
        b.beginPath(); b.moveTo(x, y);
        for (let k = 0; k < 7; k++) { x += rand(-16, 16) * U; y += rand(16, 34) * U; b.lineTo(x, y); }
        b.stroke();
      }
      const span = Math.min(W * 0.9, 620 * U), sw = span / 8.2, y0 = top + H * 0.13;
      for (let i = 0; i < 7; i++) {
        const x = cx + (i - 3) * (span / 7), y = y0 - Math.abs(i - 3) * 9 * U, lit = i === 3;
        if (lit) { const g = b.createRadialGradient(x, y, 0, x, y, sw * 2.2); g.addColorStop(0, 'rgba(255,214,130,0.55)'); g.addColorStop(1, 'rgba(255,214,130,0)'); b.fillStyle = g; b.fillRect(x - sw * 2.2, y - sw * 2.2, sw * 4.4, sw * 4.4); }
        b.fillStyle = lit ? '#3a3020' : '#16161a';
        b.strokeStyle = lit ? 'rgba(255,214,130,0.95)' : 'rgba(190,190,205,0.4)';
        b.lineWidth = 1.5 * U;
        b.beginPath();
        b.rect(x - sw / 2, y - sw * 0.9, sw, sw * 0.5);   // back
        b.rect(x - sw / 2, y - sw * 0.4, sw, sw * 0.8);   // block
        b.fill();
        b.stroke();
      }
    }
    b.restore();
  }

  function rock(b, x, y, r, alpha) {
    const g = b.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(150,152,160,${alpha})`);
    g.addColorStop(0.6, `rgba(70,72,80,${alpha})`);
    g.addColorStop(1, `rgba(18,18,24,${alpha})`);
    b.fillStyle = g;
    b.beginPath();
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * TAU, rr = r * (1 + Math.sin(a * 3 + 1) * 0.05 + Math.sin(a * 7) * 0.03);
      if (i) b.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else b.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    b.closePath();
    b.fill();
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, d = r * (0.2 + (i % 4) * 0.17), cr = r * (0.05 + (i % 3) * 0.035);
      b.fillStyle = `rgba(10,10,14,${0.35 * alpha})`;
      b.beginPath(); b.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, cr, cr * 0.75, a, 0, TAU); b.fill();
    }
  }

  function buildBackdrop() {
    // the title screen shows the asteroid; each seat shows its own landmark
    const idle = mode === 'title' || mode === 'compose';
    const seatIdx = idle ? WORLDS.findIndex((q) => q.art === 'ky26') : seatOf(level) - 1, w = WORLDS[seatIdx];
    // fixed ground with a lit lane up the middle
    ground = document.createElement('canvas');
    ground.width = canvas.width;
    ground.height = canvas.height;
    const b = ground.getContext('2d');
    b.scale(DPR, DPR);
    b.fillStyle = w.bg;
    b.fillRect(0, 0, W, H);
    const g = b.createLinearGradient(field.cx - field.path * 1.9, 0, field.cx + field.path * 1.9, 0);
    g.addColorStop(0, `rgba(${w.glow},0)`);
    g.addColorStop(0.5, `rgba(${w.glow},0.9)`);
    g.addColorStop(1, `rgba(${w.glow},0)`);
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);
    drawLandmark(b, seatIdx, w);

    // one screen-tall scenery tile that wraps vertically, so it can scroll forever
    scenery = document.createElement('canvas');
    scenery.width = canvas.width;
    scenery.height = canvas.height;
    const f = scenery.getContext('2d');
    f.scale(DPR, DPR);
    const wrapped = (y, pad, fn) => { for (const o of [-H, 0, H]) if (y + o > -pad && y + o < H + pad) fn(y + o); };

    for (let i = 0; i < Math.round((W * H) / 2600); i++) {
      const x = rand(0, W), y = rand(0, H), r = rand(0.5, 1.9) * U, a = rand(0.05, 0.3);
      wrapped(y, 4, (yy) => { f.fillStyle = `rgba(${w.speck},${a})`; f.beginPath(); f.arc(x, yy, r, 0, TAU); f.fill(); });
    }
    // rungs across the lane that you scroll past
    f.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const y = (i + 0.5) * (H / 4);
      wrapped(y, 40, (yy) => {
        f.strokeStyle = `rgba(${w.accent},0.11)`;
        f.beginPath();
        f.ellipse(field.cx, yy, field.path * 0.9, 16 * U, 0, Math.PI, TAU);
        f.stroke();
      });
    }
    const sideW = Math.max(30, field.cx - field.path);
    const count = Math.round((sideW * 2 * H) / 5200) + 10;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const x = field.cx + side * (field.path + rand(0.05, 1) * sideW);
      const y = rand(0, H);
      const s = rand(24, 54) * U;
      const k = rand(1.1, 2.2);
      const col = `rgba(${(w.side[0] * k) | 0},${(w.side[1] * k) | 0},${(w.side[2] * k) | 0},0.94)`;
      wrapped(y, s * 2.2, (yy) => sideShape(f, w.shape, x, yy, s, col));
    }
  }

  /* ---------- Audio ---------- */
  let ac = null, muted = false;
  function initAudio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); unlockSong(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { ac = new AC(); } catch (e) { ac = null; } }
    unlockSong();
  }

  /* ---------- Soundtrack: Project LA ---------- */
  // One track per stretch of the story. `tonic` is the track's key note, so the sounds the
  // player makes (answers, the call and reply, fanfares) are tuned to sit inside the music.
  // `trim` evens out how loud the recordings are, so no track jumps out over the others.
  const TRACKS = {
    prelude: { src: 'music/prelude.mp3', tonic: 440.0, trim: 0.82 },            // A
    marionettes: { src: 'music/marionettes.mp3', tonic: 493.88, trim: 0.98 },   // B
    curtains: { src: 'music/curtains.mp3', tonic: 440.0, trim: 0.62 },          // A
    afterwords: { src: 'music/afterwords.mp3', tonic: 392.0, trim: 1.3 },       // G
  };
  const ORDER = ['prelude', 'marionettes', 'curtains', 'afterwords'];
  const MUSIC_LEVEL = 0.3; // kept well under the game's own sounds
  // the track that suits each stretch of the story
  const trackFor = (seat) => (seat <= 3 ? 'prelude' : seat <= 6 ? 'marionettes' : seat === 7 ? 'curtains' : 'afterwords');
  let songPlayed = new Set();
  // tonic, second, fourth and fifth: notes that fit a major or a minor key alike
  const DEGREES = [1, 1.1225, 1.3348, 1.4983];
  let song = null, songGain = null, songName = '', songWant = '', songVol = 0, songFailed = false;
  const songOn = () => !!(song && songName && !songFailed);
  const keyNote = () => (songOn() ? TRACKS[songName].tonic : 392);
  const noteOf = (el) => keyNote() * DEGREES[el];

  // Phones only let a page start audio from inside a tap, so the player is created and started
  // (silently) on the first one; after that it can change track by itself.
  function unlockSong() {
    if (song) return;
    song = new Audio();
    song.loop = false; // tracks are never repeated back to back: when one ends, the next begins
    song.preload = 'auto';
    song.addEventListener('error', () => { songFailed = true; });
    song.addEventListener('ended', nextSong);
    if (ac && location.protocol !== 'file:') {
      try {
        songGain = ac.createGain();
        songGain.gain.value = 0;
        ac.createMediaElementSource(song).connect(songGain).connect(ac.destination);
      } catch (e) { songGain = null; }
    }
    if (!songGain) { song.volume = 0; song.muted = true; }
    songName = songWant || 'prelude';
    song.src = TRACKS[songName].src;
    const p = song.play();
    if (p && p.catch) p.catch(() => { /* will be retried from the next tap */ });
  }
  // The very first run chooses the opening track to suit the seat it starts in. After that
  // the music simply carries on: seat changes and new runs never cut a track short.
  function playSong(name) {
    if (!song || !songName || (!songPlayed.size && song.currentTime < 3)) songWant = name;
  }
  // When a track ends, play one that has not been heard yet: the one that suits the current
  // seat if possible, otherwise the next in order. Only when all four have played does the
  // list start again, and never with the track that just finished.
  function nextSong() {
    songPlayed.add(songName);
    if (songPlayed.size >= ORDER.length) songPlayed = new Set([songName]);
    const suits = txMode ? 'prelude' : trackFor(seatOf(level));
    const from = ORDER.indexOf(songName);
    let pick = !songPlayed.has(suits) ? suits : '';
    for (let i = 1; i <= ORDER.length && !pick; i++) { const n = ORDER[(from + i) % ORDER.length]; if (!songPlayed.has(n)) pick = n; }
    songName = songWant = pick || ORDER[(from + 1) % ORDER.length];
    song.src = TRACKS[songName].src;
    const p = song.play();
    if (p && p.catch) p.catch(() => {});
  }

  function tickSong(dt) {
    if (!song || songFailed) return;
    const live = mode === 'play' || mode === 'interlude' || mode === 'story' || mode === 'bonus' || mode === 'act' || mode === 'ending' || mode === 'over';
    const lead = mode === 'play' ? front() : null;
    // full in play; hushed while a silence leads, during the timing acts and on the end screen
    let want = muted || !live ? 0 : mode === 'act' ? 0.2 : mode === 'bonus' ? 0.45 : mode === 'over' ? 0.6 : lead && lead.shade ? 0.25 : 1;
    const swap = songWant && songWant !== songName;
    if (swap) want = 0;
    songVol += clamp(want - songVol, -dt * 2.2, dt * 1.1);
    if (swap && songVol <= 0.01) {
      songName = songWant;
      song.src = TRACKS[songName].src;
      const p = song.play();
      if (p && p.catch) p.catch(() => {});
    }
    const out = songVol * MUSIC_LEVEL * TRACKS[songName].trim;
    if (songGain) songGain.gain.value = out;
    else { song.volume = clamp(out, 0, 1); song.muted = songVol < 0.02; }
    const idle = songVol <= 0.01 && want === 0 && !swap;
    if (idle && !song.paused) song.pause();
    else if (!idle && song.paused) { const p = song.play(); if (p && p.catch) p.catch(() => {}); }
  }
  function tone(freq, dur, type = 'sine', vol = 0.1, when = 0, slideTo = 0) {
    if (!ac || muted) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  }
  let noiseBuf = null;
  function noise(dur, vol, freq, when = 0, q = 1) {
    if (!ac || muted) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, Math.round(ac.sampleRate * 0.6), ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + when;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /* ---------- Haptics ---------- */
  // Android browsers vibrate directly. iOS Safari has no vibration API, so there a hidden
  // switch control is toggled, which makes the phone give its small system tick.
  const canVibrate = typeof navigator.vibrate === 'function';
  let hapticsOn = true, iosSwitch = null;
  try { hapticsOn = localStorage.getItem('atumaa.haptics') !== 'off'; } catch (e) { /* storage blocked */ }
  function initHaptics() {
    if (canVibrate || iosSwitch || !TOUCH) return;
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.tabIndex = -1;
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  function buzz(pattern) {
    if (!hapticsOn || !pattern) return;
    try {
      if (canVibrate) navigator.vibrate(pattern);
      else if (iosSwitch) {
        const ticks = Array.isArray(pattern) ? Math.min(3, Math.ceil(pattern.length / 2)) : 1;
        iosSwitch.click();
        for (let k = 1; k < ticks; k++) setTimeout(() => iosSwitch.click(), k * 80);
      }
    } catch (e) { /* not supported */ }
  }
  // every kind of event has its own feel; all of them are short and light
  // Nothing under 15 ms (cheap motors cannot play it), nothing on a bare touch, and the
  // things that go wrong are the ones that hit hardest.
  const HAPTIC = {
    touch: 0, tally: 0, tap: 15, swipe: 15, holdTick: 15,
    up: 20, down: [15, 30, 24], like: [16, 90, 16], hold: 38,
    wrong: 50, lostTime: 65, missed: 90,
    letGo: 15, streak: [15, 40, 15, 40, 15], seat: [20, 60, 20, 60, 36], over: [90, 70, 170],
  };

  const ROOTS = [110, 98, 82.41, 73.42, 110, 92.5, 65.41, 87.31, 98, 73.42];
  let musicNext = 0, musicStep = 0;
  function music() {
    if (!ac || muted || songOn()) { musicNext = 0; return; } // the synth loop is only a fallback now
    const step = 60 / (96 + 2 * Math.min(level, 8)) / 2; // eighth notes
    if (!musicNext || musicNext < ac.currentTime - 0.3) musicNext = ac.currentTime + 0.05;
    const lead = front(), hush = !!(lead && lead.shade); // the sound falls away while a silence leads
    while (musicNext < ac.currentTime + 0.2) {
      const when = Math.max(0, musicNext - ac.currentTime), st = musicStep % 8, root = ROOTS[seatOf(level) - 1];
      if (!hush && st % 4 === 0) tone(105, 0.16, 'sine', 0.045, when, 44);           // pulse
      if (st % 4 === 2) noise(0.03, 0.03, 5200, when, 3);                  // metronome tick
      const bass = [1, 0, 0, 1.5, 1.2, 0, 1.5, 0][st];
      if (bass && !hush) tone(root * bass, 0.24, 'triangle', 0.026, when);
      if (st === 6 && musicStep % 16 === 14) tone(root * 4, 0.5, 'sine', 0.018, when);
      musicNext += step;
      musicStep++;
    }
  }

  const sfx = {
    tap: () => tone(880, 0.035, 'sine', 0.03),
    // the asteroid calls in four notes at the start of a seat; clearing the seat answers in three
    call: () => { const r = songOn() ? keyNote() : ROOTS[seatOf(level) - 1] * 4; [1, 1.5, 1.335, 2].forEach((m, i) => tone(r * m, 0.32, 'sine', 0.05, 0.3 + i * 0.17)); },
    reply: () => { const r = songOn() ? keyNote() : ROOTS[seatOf(level) - 1] * 4; [2, 1.5, 2.67].forEach((m, i) => { tone(r * m, 0.7, 'triangle', 0.075, i * 0.16); tone(r * m * 2, 0.7, 'sine', 0.03, i * 0.16); }); },
    tally: (k) => tone(900 + k * 500, 0.03, 'square', 0.018),
    perfect: () => [2, 2.6697, 2.9966, 4].forEach((m, i) => tone(keyNote() * m, 0.35, 'sine', 0.06, 0.75 + i * 0.07)),
    best: () => [1, 1.3348, 1.4983, 2, 2.6697].forEach((m, i) => tone(keyNote() * m, 0.5, 'triangle', 0.07, i * 0.09)),
    hit: (el, step) => {
      noise(0.05, 0.1, el === 3 ? 500 : 1900, 0, 1.2);
      const f = noteOf(el); // always in the key of the music, so a streak plays a tune over it
      if (el === 0) tone(f, 0.16, 'triangle', 0.09, 0, f * 1.6);
      else if (el === 1) tone(f, 0.2, 'sine', 0.1, 0, f * 0.6);
      else if (el === 2) { tone(f, 0.12, 'triangle', 0.08); tone(f * 1.5, 0.22, 'triangle', 0.08, 0.07); }
      else tone(f * 0.5, 0.45, 'sine', 0.11);
    },
    swish: (up) => tone(up ? 220 : 330, 0.09, 'sine', 0.025, 0, up ? 420 : 170),
    wrong: () => { tone(196, 0.1, 'square', 0.045); tone(147, 0.2, 'square', 0.045, 0.09); noise(0.12, 0.08, 320, 0, 0.8); },
    leak: () => { tone(120, 0.45, 'sawtooth', 0.09, 0, 50); tone(90, 0.3, 'square', 0.04, 0.03, 45); noise(0.4, 0.2, 180, 0, 0.7); },
    pass: () => tone(660, 0.25, 'sine', 0.05, 0, 880),
    dawn: () => [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.8, 'sine', 0.07, i * 0.11)),
    over: () => [1, 0.7492, 0.6674, 0.5].forEach((m, i) => tone(keyNote() * m, 0.7, 'triangle', 0.08, i * 0.22)),
  };

  /* ---------- State ---------- */
  let mode = 'title'; // title | compose | intro | play | pause | interlude | over
  let time = 0, level = 1, score = 0, light = 1, introT = 0, bannerT = 0;
  let combo = 0, bestCombo = 0, cleared = 0, goal = 13, totalCleared = 0, spawned = 0;
  let spawnTimer = 0, interlude = 0, shake = 0, lastVoid = false;
  let scrollY = 0, scrollKick = 0, jolt = 0, heartPulse = 0, hitStop = 0, flash = 0;
  const seatStats = { hit: 0, wrong: 0, missed: 0 }, runStats = { hit: 0, wrong: 0, missed: 0 };
  let overT = 0, overTick = 0, overBest = false;
  const tallyUp = (k) => { seatStats[k]++; runStats[k]++; };
  const accuracy = (st) => { const n = st.hit + st.wrong + st.missed; return n ? Math.round((st.hit / n) * 100) : 0; };
  let best = 0, played = false;
  try { best = parseInt(localStorage.getItem('atumaa.best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }

  // interval act: a Memory signal opens a wall of six screens; pick one, then all are revealed
  const PRIZES = {
    skip: { label: 'Skip to next seat', rgb: '230,196,106' },
    time: { label: 'Signal restored', rgb: '95,201,243' },
    score: { label: 'Bonus', rgb: '255,200,87' },
    shield: { label: 'Shield: one mistake forgiven', rgb: '125,220,132' },
    empty: { label: 'Nothing here', rgb: '150,155,170' },
  };
  let bonus = null;      // {tiles:[{x,y,w,h,prize,open}], picked, t, pickT, applied}
  let bonusAt = -1, bonusDone = false, shield = 0, memories = 0;
  const ACTS = ['memory', 'metro', 'heart']; // one interval act per seat, in rotation
  let act = null;        // the running metronome or heartbeat act

  let targets = [];   // {shade,seq,done,mirror,cloak,y,ph,wob}; they fall toward the seat, lowest one is the front
  let ghosts = [];    // answered signals flying off: {el,x,y,vx,vy,life,max,r}
  let particles = []; // {x,y,vx,vy,life,max,rgb,size}
  let rings = [];     // {x,y,r,max,life,rgb}
  let texts = [];     // {x,y,text,life,rgb,size}
  const learned = { 0: 0, 1: 0, 2: 0, 3: 0, void: 0, mirror: 0, cloak: 0, bound: 0, aim: 0 };

  // input
  let ptr = null;     // {id,x0,y0,t0,done}
  let dragY = 0, holding = false, holdT = 0, lastTap = 0, keyHold = false;
  let lastWheelT = 0, lastWheelMag = 0;

  /* ---------- Send a signal ---------- */
  // A player taps six times. The five gaps between the taps are the signal: they travel in the
  // link as five hex digits, seed the run, set the rhythm the signals fall in, and draw its mark.
  const SIG_TAPS = 6, SIG_MIN = 100, SIG_SPAN = 16; // gaps from 0.1 s to 1.6 s, on a log scale
  const SIG_NOTES = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
  let signal = null;  // the signal being played: {code,q,iv,norm,mark,mine}
  let sigStep = 0;
  let taps = [], draft = null, composeFrom = 'title';

  function makeSignal(code, mark, mine) {
    if (!/^[0-9a-f]{5}$/.test(code)) return null;
    const q = code.split('').map((c) => parseInt(c, 16));
    const iv = q.map((v) => (SIG_MIN * Math.pow(SIG_SPAN, v / 15)) / 1000); // seconds
    const top = Math.max(...iv);
    return { code, q, iv, norm: iv.map((v) => v / top), mark, mine };
  }

  function codeFromTaps(times) {
    let code = '';
    for (let i = 1; i < times.length; i++) {
      const d = clamp(times[i] - times[i - 1], SIG_MIN, SIG_MIN * SIG_SPAN);
      code += Math.round((15 * Math.log(d / SIG_MIN)) / Math.log(SIG_SPAN)).toString(16);
    }
    return code;
  }

  function signalFromUrl() {
    try {
      const p = new URLSearchParams(location.search);
      const m = parseInt(p.get('p') || '', 36), r = parseInt(p.get('r') || '', 10);
      let sig;
      if (p.has('daily')) { const d = p.get('daily') || ''; sig = dailySignal(/^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today() ? d : today()); }
      else sig = makeSignal((p.get('s') || '').toLowerCase(), null, false);
      // the sender's result, to play against
      if (sig && Number.isFinite(m) && m >= 0 && Number.isFinite(r) && r >= 0 && r <= TX_N) sig.theirs = { r, p: m };
      return sig;
    } catch (e) { return null; }
  }

  // one signal a day, the same for everyone: the date is hashed into a signal code
  function today() { return new Date().toISOString().slice(0, 10); }
  function dailySignal(day) {
    const d = day || today();
    let h = 2166136261;
    for (const c of 'atumaa ' + d) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const sig = makeSignal(((h >>> 0) % 0x100000).toString(16).padStart(5, '0'), null, false);
    sig.daily = d;
    return sig;
  }
  function dayLabel(d) { return d === today() ? "Today's transmission" : 'The transmission of ' + d; }
  // the day turns over at 00:00 UTC for everyone; show that moment on the player's own clock
  function resetTime() {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function dailyBest(d) { try { return parseInt(localStorage.getItem('atumaa.daily.' + d) || '0', 10) || 0; } catch (e) { return 0; } }
  function playDaily() {
    signal = dailySignal();
    startGame();
  }

  function signalUrl(sig, mark) {
    return location.origin + location.pathname + (sig.daily ? '?daily=' + sig.daily : '?s=' + sig.code) + '&p=' + Math.round(mark).toString(36) + '&r=' + tx.ok;
  }

  // every signal has its own mark: six points set around a ring by its rhythm
  function drawGlyph(cv, sig) {
    const g = cv.getContext('2d'), s = cv.width, c = s / 2, R = s * 0.38;
    g.clearRect(0, 0, s, s);
    g.lineWidth = s * 0.012;
    g.strokeStyle = 'rgba(255,255,255,0.2)';
    g.beginPath();
    g.arc(c, c, R, 0, TAU);
    g.stroke();
    if (!sig) return;
    const hue = (parseInt(sig.code, 16) * 137) % 360;
    const total = sig.iv.reduce((a, b) => a + b, 0) * 1.15; // the ring never quite closes
    const pts = [];
    let acc = 0;
    for (let i = 0; i < SIG_TAPS; i++) {
      const a = -Math.PI / 2 + (acc / total) * TAU;
      const rr = R * (i ? 0.55 + 0.45 * sig.norm[i - 1] : 1);
      pts.push([c + Math.cos(a) * rr, c + Math.sin(a) * rr]);
      if (i < sig.iv.length) acc += sig.iv[i];
    }
    g.lineJoin = 'round';
    g.lineWidth = s * 0.024;
    g.strokeStyle = `hsl(${hue},85%,72%)`;
    g.fillStyle = `hsla(${hue},85%,60%,0.18)`;
    g.beginPath();
    pts.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.closePath();
    g.fill();
    g.stroke();
    pts.forEach((p, i) => {
      g.fillStyle = i ? '#fffbe6' : 'rgb(230,196,106)';
      g.beginPath();
      g.arc(p[0], p[1], s * (i ? 0.03 : 0.045), 0, TAU);
      g.fill();
    });
  }

  // the signal as sound: its own six notes in its own rhythm
  function playMotif(sig) {
    let t = 0;
    for (let i = 0; i < SIG_TAPS; i++) {
      tone(SIG_NOTES[i ? (sig.q[i - 1] + i) % SIG_NOTES.length : 0], 0.18, 'triangle', 0.08, t);
      if (i < sig.iv.length) t += sig.iv[i];
    }
  }

  function renderCompose() {
    drawGlyph(ui.glyphCompose, draft);
    ui.composeCount.textContent = draft ? 'This is your signal' : taps.length + ' / ' + SIG_TAPS;
    ui.composeHint.textContent = draft
      ? 'Play it first. Your score becomes the mark your friends have to beat.'
      : 'Tap the ring six times, in any rhythm. That rhythm is your signal.';
    ui.playSignal.hidden = !draft;
    ui.redo.hidden = !draft && taps.length === 0;
  }

  function openCompose() {
    initAudio();
    initHaptics();
    composeFrom = mode === 'over' ? 'over' : 'title';
    taps = [];
    draft = null;
    renderCompose();
    setMode('compose');
  }

  function composeTap() {
    if (mode !== 'compose' || draft) return;
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2500) taps = []; // a long pause starts over
    taps.push(now);
    tone(SIG_NOTES[(taps.length - 1) % SIG_NOTES.length], 0.14, 'triangle', 0.08);
    buzz(HAPTIC.tap);
    if (taps.length === SIG_TAPS) {
      draft = makeSignal(codeFromTaps(taps), null, true);
      buzz(HAPTIC.seat);
      const made = draft;
      setTimeout(() => { if (mode === 'compose' && draft === made) playMotif(made); }, 600);
    }
    renderCompose();
  }

  function playDraft() {
    if (!draft) return;
    signal = draft;
    startGame();
  }

  /* ---------- Daily streak and the worldwide board ---------- */
  // The board needs the small server in backend/worker.js. Until its address is set here,
  // the board stays hidden and nothing is sent anywhere.
  const BOARD_URL = '';

  function dayBefore(d) {
    const t = new Date(d + 'T00:00:00Z');
    t.setUTCDate(t.getUTCDate() - 1);
    return t.toISOString().slice(0, 10);
  }
  function readStreak() {
    try {
      const v = JSON.parse(localStorage.getItem('atumaa.streak') || 'null');
      if (v && Number.isInteger(v.n) && typeof v.last === 'string') return v;
    } catch (e) { /* storage blocked or damaged */ }
    return { n: 0, last: '' };
  }
  // a streak is alive if today's or yesterday's transmission was finished
  function liveStreak() {
    const v = readStreak();
    return v.last === today() || v.last === dayBefore(today()) ? v.n : 0;
  }
  function bumpStreak() {
    const v = readStreak(), t = today();
    if (v.last === t) return v.n;
    const n = v.last === dayBefore(t) ? v.n + 1 : 1;
    try { localStorage.setItem('atumaa.streak', JSON.stringify({ n, last: t })); } catch (e) { /* storage blocked */ }
    return n;
  }
  const days = (n) => n + ' day' + (n === 1 ? '' : 's');

  function cleanName(v) { return String(v || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12); }
  function renderBoard(data) {
    if (!data || !Array.isArray(data.top)) return;
    ui.boardCount.textContent = data.count ? data.count + (data.count === 1 ? ' person has' : ' people have') + ' answered today' : 'Nobody has taken a seat yet today';
    ui.boardList.textContent = '';
    const me = cleanName(ui.boardName.value).toLowerCase();
    data.top.forEach((e) => {
      // names come from other players, so they are only ever written as text
      const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
      a.textContent = String(e.name).slice(0, 12);
      b.textContent = e.ok + ' of ' + TX_N + ' · ' + Number(e.score).toLocaleString();
      if (String(e.name).toLowerCase() === me) li.className = 'me';
      li.append(a, b);
      ui.boardList.appendChild(li);
    });
  }
  function loadBoard() {
    if (!BOARD_URL) return;
    fetch(BOARD_URL + '/board?day=' + today()).then((r) => r.json()).then(renderBoard).catch(() => { ui.boardCount.textContent = 'The board cannot be reached right now.'; });
  }
  function postBoard() {
    if (!BOARD_URL || !txMode || !signal || signal.daily !== today()) return;
    const name = cleanName(ui.boardName.value);
    ui.boardName.value = name;
    if (!name) { ui.boardCount.textContent = 'Type a name to take a seat.'; return; }
    try { localStorage.setItem('atumaa.name', name); } catch (e) { /* storage blocked */ }
    ui.post.disabled = true;
    fetch(BOARD_URL + '/board', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ day: signal.daily, name, ok: tx.ok, score }) })
      .then((r) => r.json())
      .then((d) => { if (d.error) ui.boardCount.textContent = 'Not accepted: ' + d.error + '.'; else { renderBoard(d); ui.post.textContent = 'Posted'; } })
      .catch(() => { ui.boardCount.textContent = 'The board cannot be reached right now.'; ui.post.disabled = false; });
  }

  /* ---------- Story ---------- */
  let storyN = 0, storyT = 0, retries = 3, seatStartScore = 0;
  const storyImg = {}, storySeen = new Set();
  try { (localStorage.getItem('atumaa.story') || '').split(',').forEach((v) => { if (v) storySeen.add(+v); }); } catch (e) { /* storage blocked */ }
  function loadStill(n) {
    if (n < 1 || n > WORLDS.length || storyImg[n]) return;
    const im = new Image();
    im.src = 'story/' + n + '.jpg';
    storyImg[n] = im;
  }
  function beginStory(n) {
    storyN = n;
    storyT = 0;
    storySeen.add(n);
    try { localStorage.setItem('atumaa.story', [...storySeen].join(',')); } catch (e) { /* storage blocked */ }
    setMode('story');
  }
  function endStory() {
    if (mode !== 'story' || storyT < 0.5) return;
    setMode('play');
    last = performance.now();
    showBanner(world().name + '<small>' + seatLabel() + ' · ' + world().adds + '</small>', 2.4);
    sfx.call();
  }
  function wrapText(text, x, y, maxW, lineH) {
    let line = '';
    for (const word of text.split(' ')) {
      if (line && ctx.measureText(line + ' ' + word).width > maxW) { ctx.fillText(line, x, y); y += lineH; line = word; }
      else line = line ? line + ' ' + word : word;
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineH;
  }
  function drawStory() {
    const w = WORLDS[storyN - 1], im = storyImg[storyN], t = storyT;
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, W, H);
    if (im && im.complete && im.naturalWidth) {
      // cover the screen, drifting slowly
      const k = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (1.04 + t * 0.012);
      const iw = im.naturalWidth * k, ih = im.naturalHeight * k;
      ctx.globalAlpha = clamp(t * 2, 0, 1);
      ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2 - t * 3, iw, ih);
      ctx.globalAlpha = 1;
    }
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, 'rgba(2,2,4,0)');
    g.addColorStop(0.55, 'rgba(2,2,4,0.82)');
    g.addColorStop(1, 'rgba(2,2,4,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const x = Math.max(22, field.cx - 250 * U), maxW = Math.min(W - 44, 500 * U);
    let y = H * 0.66;
    ctx.textAlign = 'left';
    ctx.globalAlpha = clamp((t - 0.25) * 2.5, 0, 1);
    ctx.fillStyle = 'rgb(230,196,106)';
    ctx.font = `700 ${Math.round(12.5 * U)}px ${FONT}`;
    ctx.fillText(('SEAT ' + ROMAN[storyN - 1] + '  ·  ' + w.when).toUpperCase(), x, y);
    y += 34 * U;
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(30 * U)}px ${FONT}`;
    y = wrapText(w.name.toUpperCase(), x, y, maxW, 34 * U) + 2 * U;
    ctx.globalAlpha = clamp((t - 0.7) * 2, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `500 ${Math.round(16 * U)}px ${FONT}`;
    wrapText(w.story, x, y, maxW, 23 * U);
    ctx.globalAlpha = clamp((t - 1.6) * 2, 0, 1) * 0.7;
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${Math.round(11.5 * U)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(TOUCH ? 'TAP TO GO ON' : 'CLICK OR PRESS SPACE', field.cx, H - 26 * U);
    ctx.globalAlpha = 1;
  }

  let overLine = '';
  // A signal run is a transmission: thirteen signals, identical for everyone who opens it,
  // with no time meter, prizes or interval acts, so two results can be compared fairly.
  const TX_N = 13;
  let txMode = false, txGap = 0, txHowI = '';
  const tx = { ok: 0, flinch: false, missed: 0 };
  let guided = false;          // first run ever: the first four signals teach the gamble
  let phrase = [], endT = 0;   // the last notes the player played; the Seat VII ending
  function txName() {
    return signal.daily ? dayLabel(signal.daily) : 'Transmission ' + String(parseInt(signal.code, 16) % 100000).padStart(5, '0');
  }
  function resultLine() {
    if (txMode) return 'ATUMAA · ' + txName() + ' · ' + tx.ok + ' of ' + TX_N + ' answered. ' + txHowI + (tx.ok === TX_N ? 'Can you match it?' : 'Can you get all ' + TX_N + '?');
    return 'ATUMAA ' + ROMAN[seatOf(level) - 1] + ' · ' + accuracy(runStats) + '% clean · ' + score.toLocaleString() + ' · ' + overLine;
  }

  // a 9:16 card of the run, for stories and chats
  function makeCard() {
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    const g = cv.getContext('2d'), w = world(), cx = 540, gold = 'rgb(230,196,106)';
    g.fillStyle = w.bg;
    g.fillRect(0, 0, 1080, 1920);
    const lane = g.createLinearGradient(140, 0, 940, 0);
    lane.addColorStop(0, `rgba(${w.glow},0)`); lane.addColorStop(0.5, `rgba(${w.glow},0.95)`); lane.addColorStop(1, `rgba(${w.glow},0)`);
    g.fillStyle = lane;
    g.fillRect(0, 0, 1080, 1920);
    const halo = g.createRadialGradient(cx, 1500, 0, cx, 1500, 420);
    halo.addColorStop(0, `rgba(${w.accent},0.5)`); halo.addColorStop(1, `rgba(${w.accent},0)`);
    g.fillStyle = halo;
    g.fillRect(0, 1000, 1080, 920);
    g.textAlign = 'center';
    g.fillStyle = gold;
    g.font = `700 112px ${FONT}`;
    g.fillText('A T U M A A', cx, 250);
    g.fillStyle = '#fff';
    g.font = `700 40px ${FONT}`;
    g.fillText('T H E   S E V E N T H   S E A T', cx, 320);
    g.fillStyle = gold;
    g.font = `700 150px ${FONT}`;
    g.fillText(txMode ? tx.ok + ' OF ' + TX_N : 'SEAT ' + ROMAN[seatOf(level) - 1], cx, 620);
    g.fillStyle = '#fff';
    g.font = `600 56px ${FONT}`;
    g.fillText((txMode ? txName() : world().name).toUpperCase(), cx, 710);
    // seven marks, lit for each seat reached
    for (let i = 0; i < 7 && !txMode; i++) {
      g.beginPath();
      g.arc(cx + (i - 3) * 92, 830, 22, 0, TAU);
      if (i < Math.min(7, seatOf(level))) { g.fillStyle = gold; g.fill(); } else { g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 4; g.stroke(); }
    }
    g.fillStyle = '#fff';
    g.font = `700 170px ${FONT}`;
    g.fillText(score.toLocaleString(), cx, 1080);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = `600 50px ${FONT}`;
    g.fillText(accuracy(runStats) + '% CLEAN  ·  STREAK ' + bestCombo, cx, 1170);
    g.fillStyle = gold;
    g.font = `600 46px ${FONT}`;
    g.fillText(overLine.toUpperCase(), cx, 1270);
    if (signal) {
      const mark = document.createElement('canvas');
      mark.width = mark.height = 360;
      drawGlyph(mark, signal);
      g.drawImage(mark, cx - 180, 1320);
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.font = `600 38px ${FONT}`;
      g.fillText('ANSWER THIS SIGNAL', cx, 1730);
    } else {
      g.fillStyle = '#fffbe6';
      g.beginPath(); g.arc(cx, 1500, 44, 0, TAU); g.fill();
    }
    g.fillStyle = gold;
    g.font = `700 54px ${FONT}`;
    g.fillText('atumaa.com', cx, 1840);
    return cv;
  }

  // iOS only opens the share sheet from inside the tap itself, so nothing here may wait:
  // the card image is built when the run ends and attached only if it is already there.
  let cardFile = null;
  function buildCard() {
    cardFile = null;
    try {
      makeCard().toBlob((blob) => {
        if (blob && typeof File === 'function') cardFile = new File([blob], 'atumaa.png', { type: 'image/png' });
      }, 'image/png');
    } catch (e) { /* no card, text only */ }
  }

  function shareSignal() {
    const url = signal ? signalUrl(signal, score) : location.origin + location.pathname;
    const lead = !signal ? '' : signal.daily ? dayLabel(signal.daily) + '. ' : signal.mine ? 'I sent you a signal. Answer it. ' : 'I answered this signal. Your turn. ';
    const text = txMode ? resultLine() : lead + resultLine();
    const note = (msg) => { ui.shareNote.textContent = msg; };
    const copy = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + ' ' + url).then(() => note('Copied. Paste it to a friend.'), () => note(text + ' ' + url));
      else note(text + ' ' + url);
    };
    if (!navigator.share) { copy(); return; }
    let withCard = false;
    try { withCard = !!(cardFile && navigator.canShare && navigator.canShare({ files: [cardFile] })); } catch (e) { withCard = false; }
    navigator.share(withCard ? { files: [cardFile], text: text + ' ' + url } : { title: 'Atumaa — The Seventh Seat', text, url })
      .catch((err) => { if (!err || err.name !== 'AbortError') copy(); }); // closing the sheet is not a failure
  }

  // From Seat VIII the signals come down separate lanes and a move only counts in the lane it
  // is made in. Aiming is hard, so speed and the mix of signals drop back before climbing again.
  let aimLane = 0, lastLane = 9;
  function lanes() { return txMode || level < 8 ? 1 : level === 8 ? 2 : 3; }
  function laneGap() { return field.path * 0.64; }
  function speedLevel() { return level < 8 ? level : level - 6; }
  function ruleLevel() { return level < 8 ? level : level === 8 ? 4 : level === 9 ? 6 : level - 3; }
  function laneAt(x) {
    if (lanes() === 2) return x < field.cx ? -1 : 1;
    const g = laneGap();
    return x < field.cx - g / 2 ? -1 : x > field.cx + g / 2 ? 1 : 0;
  }
  function frontIn(lane) {
    let f = null;
    for (const t of targets) if (t.lane === lane && t.y > field.top + 6 && (!f || t.y > f.y)) f = t;
    return f;
  }
  // the signal a move would land on right now
  function aimed() { return lanes() > 1 ? frontIn(aimLane) : front(); }
  function fallSpeed() { return Math.min(0.62, 0.25 * (1 + 0.085 * (speedLevel() - 1))) * H; }
  function spawnGap() {
    if (guided && level === 1 && spawned <= 4) return 2.3; // one at a time while the gamble is being learned
    const base = Math.max(0.44, 1.18 - 0.075 * speedLevel());
    // a shared signal falls in the rhythm it was tapped in
    if (signal) return base * (0.78 + 0.44 * signal.norm[sigStep++ % signal.norm.length]);
    return base * rand(0.82, 1.2);
  }
  function multiplier() { return Math.min(6, 1 + Math.floor(combo / 8)); }
  function targetX(t) { if (t.lane != null) return field.cx + t.lane * laneGap(); return field.cx + Math.sin(t.ph + t.y * 0.008) * field.path * 0.42; }
  function revealY() { return lerp(field.top, field.heartY, 0.42); }
  function isCloaked(t) { return t.cloak && t.y < revealY(); }
  // the gesture that answers a signal; mirrored ones want the opposite swipe
  function needOf(t) {
    const g = ELEMENTS[t.seq[t.done]].gesture;
    if (t.mirror) return g === 'up' ? 'down' : g === 'down' ? 'up' : g;
    return g;
  }

  function seatLabel() {
    const s = seatOf(level);
    return 'Seat ' + ROMAN[s - 1] + (level > LAST ? ' · Cycle ' + (level - LAST + 1) : '');
  }

  function showBanner(html, dur) {
    ui.banner.hidden = true;
    void ui.banner.offsetWidth; // restart the CSS animation
    ui.banner.innerHTML = html;
    ui.banner.hidden = false;
    bannerT = dur;
  }

  function setupLevel(n) {
    level = n;
    cleared = 0;
    seatStats.hit = seatStats.wrong = seatStats.missed = 0;
    bonusDone = false;
    bonusAt = Math.floor((10 + 3 * Math.min(n, 7)) * (0.35 + rng() * 0.3));
    goal = 10 + 3 * Math.min(level, 7);
    aimLane = lanes() === 2 ? -1 : 0;
    lastLane = 9;
    spawnTimer = 1.2;
    ui.grove.textContent = seatLabel();
    buildBackdrop();
    showBanner(world().name + '<small>' + seatLabel() + (level <= LAST ? ' · ' + world().adds : ' · faster') + '</small>', 2.4);
    if (txMode) {
      goal = TX_N;
      bonusDone = true;
      txGap = 4 + ((rng() * 7) | 0); // every transmission has at least one silence in it
      ui.grove.textContent = 'Transmission';
      showBanner(txName() + '<small>' + TX_N + ' signals · the same for everyone who opens it</small>', 2.4);
    } else {
      seatStartScore = score;
      loadStill(n + 1);
      // the first time a seat is reached, its story card comes before the signals
      if (n <= WORLDS.length && !storySeen.has(n)) { loadStill(n); beginStory(n); }
      else sfx.call();
    }
  }

  function resetRun() {
    score = 0; light = 1; combo = 0; bestCombo = 0; totalCleared = 0; spawned = 0; level = 1;
    targets = []; ghosts = []; particles = []; rings = []; texts = [];
    for (const k in learned) learned[k] = 0;
    runStats.hit = runStats.wrong = runStats.missed = 0;
    bonus = null; act = null; shield = 0; memories = 0;
    lastVoid = false;
    ptr = null; dragY = 0; holding = false; keyHold = false;
    rng = signal ? mulberry32(parseInt(signal.code, 16) + 1) : Math.random;
    txMode = !!signal;
    guided = !played && !signal;
    retries = 3;
    tx.ok = 0; tx.flinch = false; tx.missed = 0;
    phrase = [];
    sigStep = 0;
  }

  function startIntro() {
    initAudio();
    resetRun();
    introT = 0;
    setMode('intro');
    buildBackdrop();
  }

  function startGame(at) {
    initAudio();
    resetRun();
    const from = !txMode && Number.isInteger(at) && at > 1 ? Math.min(at, WORLDS.length) : 1;
    if (from > 1) guided = false;
    playSong(txMode ? 'prelude' : trackFor(from));
    setMode('play');
    setupLevel(txMode ? 3 : from);
  }

  // a fall is not the end: the seat can be replayed, three times in a run
  function retrySeat() {
    if (mode !== 'over' || txMode || retries <= 0) return;
    retries--;
    score = seatStartScore;
    light = 1;
    combo = 0;
    shield = 0;
    targets = []; ghosts = []; rings = []; texts = [];
    bonus = null; act = null;
    setMode('play');
    setupLevel(level);
  }

  function setMode(m) {
    mode = m;
    const playing = m === 'play' || m === 'interlude';
    ui.title.hidden = m !== 'title';
    ui.compose.hidden = m !== 'compose';
    ui.endless.hidden = true;
    if (m === 'title') {
      const fresh = !played, run = liveStreak();
      ui.daily.hidden = fresh;
      ui.signalBtn.hidden = fresh;
      ui.daily.textContent = "Today's transmission" + (run ? ' · streak ' + days(run) : '');
    }
    ui.pause.hidden = m !== 'pause';
    ui.over.hidden = m !== 'over';
    ui.hud.hidden = m === 'title' || m === 'intro' || m === 'compose' || m === 'ending' || m === 'story';
    if (m === 'story') ui.banner.hidden = true;
    ui.skip.hidden = m !== 'intro';
    if (!playing) ui.hint.hidden = true;
    if (m === 'intro' || m === 'over' || m === 'compose') { ui.banner.hidden = true; bannerT = 0; }
  }

  /* ---------- Spawning ---------- */
  function spawnTarget(avoid) {
    spawned++;
    const rl = ruleLevel();
    const t = { shade: false, bonus: false, seq: [], done: 0, mirror: false, cloak: false, y: field.top - 40 * U, ph: rng() * TAU, wob: 0 };
    if (txMode) {
      if (spawned === txGap || (!lastVoid && spawned > 2 && rng() < 0.12)) t.shade = true;
      else t.seq.push((rng() * 3) | 0);
      lastVoid = t.shade;
      targets.push(t);
      return;
    }
    if (guided && level === 1 && spawned <= 4) {
      // swipe up; then wait for the glow; then choose for yourself; then keep your thumb still
      if (spawned === 4) { t.shade = true; t.soft = true; t.tip = 'Silence. Let this one pass, do not touch'; }
      else { t.seq.push(0); t.wait = spawned === 2; t.tip = spawned === 1 ? 'Swipe up' : spawned === 2 ? 'Wait for the glow, then swipe up' : 'Your call: the closer, the more it is worth'; }
      lastVoid = t.shade;
      targets.push(t);
      return;
    }
    const n = lanes();
    if (n > 1) {
      const opts = n === 2 ? [-1, 1] : [-1, 0, 1];
      let l, tries = 0;
      do { l = opts[(rng() * opts.length) | 0]; } while (tries++ < 12 && (l === avoid || (n === 3 && l === lastLane && rng() < 0.6)));
      t.lane = lastLane = l;
    }
    if (!bonusDone && cleared + targets.length >= bonusAt) {
      bonusDone = true;
      t.bonus = true;
      t.act = ACTS[(level - 1) % ACTS.length];
      lastVoid = false;
      targets.push(t);
      return;
    }
    const signs = rl >= 4 ? 4 : rl >= 2 ? 3 : spawned > 4 ? 2 : 1;
    if (rl >= 2 && !lastVoid && rng() < (rl === 2 ? 0.08 : Math.min(0.24, 0.12 + 0.02 * rl))) {
      t.shade = true;
    } else {
      let len = 1;
      if (rl >= 5 && rng() < Math.min(0.5, 0.25 + 0.05 * (rl - 5))) len = rl >= 7 && rng() < 0.4 ? 3 : 2;
      for (let i = 0; i < len; i++) t.seq.push((rng() * signs) | 0);
      // meet each new thing early in the seat that introduces it
      const first = cleared + targets.length === 0;
      if (first && level === 2) { t.seq = [2]; len = 1; }
      if (first && level === 4) { t.seq = [3]; len = 1; }
      if (first && level === 5) { t.seq = [0, 1]; len = 2; }
      if (len === 1 && t.seq[0] < 2 && rl >= 6 && (first && level === 6 || rng() < Math.min(0.45, 0.28 + 0.03 * (rl - 6)))) t.mirror = true;
      if (rl >= 7 && !t.mirror && (first && level === 7 || rng() < Math.min(0.5, 0.3 + 0.04 * (rl - 7)))) t.cloak = true;
    }
    if ((level === 3 && cleared + targets.length === 1) || (level === 1 && spawned === 9)) { t.shade = true; t.seq = []; t.mirror = t.cloak = false; }
    lastVoid = t.shade;
    targets.push(t);
  }

  function burst(x, y, rgb, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.25, 1) * speed * U;
      const life = rand(0.35, 0.9);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, rgb, size: rand(1.2, 3.2) * U });
    }
  }

  function front() {
    let f = null;
    for (const t of targets) if (t.y > field.top + 6 && (!f || t.y > f.y)) f = t;
    return f;
  }

  /* ---------- Gestures ---------- */
  function gesture(g) {
    if (mode !== 'play') return;
    // the whole world scrolls with the thumb, like a feed
    if (g === 'up') { scrollKick = 1150 * U; jolt = -22 * U; sfx.swish(true); }
    else if (g === 'down') { scrollKick = -850 * U; jolt = 22 * U; sfx.swish(false); }
    const multi = lanes() > 1;
    const t = multi ? frontIn(aimLane) : front();
    if (!t) {
      buzz(HAPTIC.swipe);
      // a move made in an empty lane while signals are falling elsewhere is a miss-aim
      if (multi && g !== 'hold' && front()) penalty(0.04, 'Nothing in that lane', field.cx + aimLane * laneGap(), field.heartY - 90 * U);
      return;
    }
    if (t.bonus) { if (t.act === 'memory') openBonus(t); else startAct(t, t.act); return; }
    if (t.shade) {
      if (g === 'hold') return;
      t.wob = 0.35;
      t.touched = true;
      if (txMode) tx.flinch = true;
      penalty(t.soft ? 0.03 : 0.12, 'You touched the silence', targetX(t), t.y, HAPTIC.lostTime);
      return;
    }
    if (needOf(t) === g) answer(t, t.seq[t.done]);
    else if (g !== 'hold') {
      t.wob = 0.35;
      penalty(0.07, t.mirror ? 'Mirrored: opposite' : 'Wrong signal', targetX(t), t.y);
    }
  }

  function answer(t, el) {
    const x = targetX(t), y = t.y;
    const near = clamp((y - field.top) / (field.heartY - field.top), 0, 1);
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    tallyUp('hit');
    buzz(combo % 8 === 0 ? HAPTIC.streak : HAPTIC[needOf(t)]);
    // the gamble: answer early and safe, or let it come close for much more
    const close = near > 0.7;
    const pts = Math.round((close ? 30 : 10 + 14 * near) * multiplier() * (t.mirror || t.cloak ? 1.5 : 1));
    phrase.push(noteOf(el));
    if (phrase.length > 7) phrase.shift();
    if (close) {
      // the seat sends a gold wave back up the lane, and the note gains a fifth
      rings.push({ x: field.cx, y: field.heartY, r: 20, max: (field.heartY - field.top) * 1.05, life: 0.6, rgb: '230,196,106' });
      heartPulse = 1;
      tone(noteOf(el) * 1.4983, 0.32, 'sine', 0.07, 0.03);
    } else {
      rings.push({ x: field.cx, y: field.heartY, r: 14, max: 44 * U, life: 0.3, rgb: world().accent });
      if (t.wait) texts.push({ x: field.cx, y: H * 0.46, text: 'Early. Next time wait for the glow', life: 1.6, rgb: '230,196,106', size: 17 });
    }
    score += pts;
    light = Math.min(1, light + (el === 1 ? 0.014 : 0.007));
    hitStop = 0.04;
    learned[el]++;
    if (t.lane != null) learned.aim++;
    if (t.mirror) learned.mirror++;
    if (t.cloak) learned.cloak++;
    if (t.seq.length > 1) learned.bound++;
    sfx.hit(el, combo);
    const rgb = ELEMENTS[el].rgb, r = 27 * U;
    const dir = needOf(t);
    if (dir === 'up') ghosts.push({ el, x, y, vx: rand(-60, 60) * U, vy: -1500 * U, life: 0.5, max: 0.5, r });
    else if (dir === 'down') {
      const d = Math.max(60, field.heartY - y);
      ghosts.push({ el, x, y, vx: ((field.cx - x) / d) * 1300 * U, vy: 1300 * U, life: Math.min(0.5, d / (1300 * U)), max: 0.5, r });
      heartPulse = 1;
    } else if (dir === 'like') {
      rings.push({ x, y, r: r, max: r * 3.4, life: 0.5, rgb });
      rings.push({ x, y, r: r * 0.5, max: r * 2.3, life: 0.4, rgb: '255,243,196' });
      burst(x, y, rgb, 22, 300);
    } else {
      rings.push({ x, y, r: r * 2.6, max: r * 0.3, life: 0.45, rgb });
      burst(x, y, rgb, 14, 90);
    }
    burst(x, y, rgb, 8, 160);
    texts.push({ x: x + 50 * U, y: y - 8 * U, text: '+' + pts + (close ? ' close' : ''), life: 0.9, rgb: close ? '230,196,106' : '255,243,196', size: close ? 21 : 18 });
    if (combo % 8 === 0) texts.push({ x: field.cx, y: H * 0.42, text: 'Streak ' + combo + '  ×' + multiplier(), life: 1.3, rgb, size: 26 });
    t.done++;
    t.cloak = false;
    if (t.done >= t.seq.length) {
      targets.splice(targets.indexOf(t), 1);
      if (txMode) tx.ok++;
      clearedOne();
    }
  }

  function openBonus(t) {
    const x = targetX(t), y = t.y;
    targets.splice(targets.indexOf(t), 1);
    memories++;
    burst(x, y, '230,196,106', 30, 320);
    const cols = W > H ? 3 : 2, rows = 6 / cols;
    const tw = Math.min(150 * U, (W - 48) / cols - 12), th = tw * 0.72, gap = 12 * U;
    const x0 = field.cx - (cols * tw + (cols - 1) * gap) / 2;
    const y0 = Math.max(field.top + 96 * U, H * 0.5 - (rows * th + (rows - 1) * gap) / 2);
    const kinds = ['skip', 'time', 'score', 'shield', 'empty', 'empty'];
    // always a real gamble: the wall is shuffled afresh, even on a shared signal
    for (let i = kinds.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
    bonus = { tiles: kinds.map((prize, i) => ({ prize, open: 0, x: x0 + (i % cols) * (tw + gap), y: y0 + Math.floor(i / cols) * (th + gap), w: tw, h: th })), picked: -1, t: 0, pickT: 0, applied: false };
    ptr = null; dragY = 0; endHold();
    setMode('bonus');
    [659.25, 987.77, 1318.5].forEach((f, i) => tone(f, 0.4, 'sine', 0.07, i * 0.09));
    buzz(HAPTIC.seat);
  }

  function pickBonus(i) {
    if (!bonus || bonus.picked >= 0 || bonus.t < 0.45) return;
    bonus.picked = i;
    bonus.pickT = bonus.t;
    sfx.tap();
    noise(0.08, 0.1, 1400);
    buzz(HAPTIC.hold);
  }

  function updateBonus(dt) {
    time += dt;
    bonus.t += dt;
    if (bonus.picked < 0) {
      if (bonus.t > 9) pickBonus((Math.random() * 6) | 0); // never stall the run
      return;
    }
    const since = bonus.t - bonus.pickT;
    bonus.tiles.forEach((tile, i) => {
      // the chosen screen opens at once, the rest follow so you see what you passed up
      const start = i === bonus.picked ? 0 : 0.9 + 0.12 * i;
      if (since >= start && tile.open === 0) {
        tile.open = 0.001;
        if (i !== bonus.picked) { sfx.tally(i / 6); buzz(HAPTIC.tally); }
      }
      if (tile.open > 0) tile.open = Math.min(1, tile.open + dt * 5);
    });
    const prize = bonus.tiles[bonus.picked].prize;
    if (!bonus.applied && since > 0.25) {
      bonus.applied = true;
      if (prize === 'empty') { tone(196, 0.3, 'triangle', 0.06, 0, 130); buzz(HAPTIC.wrong); }
      else { sfx.best(); buzz(HAPTIC.streak); }
      if (prize === 'time') light = 1;
      if (prize === 'score') score += 500 * level;
      if (prize === 'shield') shield++;
    }
    if (since > 3) {
      bonus = null;
      setMode('play');
      spawnTimer = Math.max(spawnTimer, 0.7);
      last = performance.now();
      if (prize === 'skip') { cleared = goal; if (level === 7) startEnding(); else startInterlude(); }
    }
  }

  function startAct(t, type) {
    burst(targetX(t), t.y, '230,196,106', 30, 320);
    targets.splice(targets.indexOf(t), 1);
    memories++;
    ptr = null; dragY = 0; endHold();
    if (type === 'metro') {
      // two ticks to listen, then six to tap along with
      act = { type, t: -0.6, beat: Math.max(0.5, 0.76 - 0.02 * level), n: 8, res: [], tick: 0, end: -1, note: '', noteT: -9 };
    } else {
      const spacing = 200 * U, period = Math.max(0.52, 0.82 - 0.03 * level);
      act = { type, t: 0, spacing, speed: spacing / period, odd: 2 + ((rng() * 5) | 0), n: 9, blip: -1, end: -1, subtle: level >= 4 };
    }
    setMode('act');
    [659.25, 987.77, 1318.5].forEach((f, i) => tone(f, 0.4, 'sine', 0.07, i * 0.09));
    buzz(HAPTIC.seat);
  }

  function beatX(i) {
    const a = act;
    return W + 60 * U + i * a.spacing - a.speed * (a.end >= 0 ? a.end : a.t);
  }

  function finishAct(msg, sub, good) {
    act.end = act.t;
    act.msg = msg;
    act.sub = sub;
    act.good = good;
    if (good) { sfx.best(); buzz(HAPTIC.streak); }
    else { tone(196, 0.3, 'triangle', 0.06, 0, 130); buzz(HAPTIC.wrong); }
  }

  function actTap() {
    const a = act;
    if (!a || a.end >= 0) return;
    if (a.type === 'metro') {
      const k = Math.round(a.t / a.beat);
      if (k < 3 || k > a.n || a.res[k]) return;
      const off = Math.abs(a.t - k * a.beat);
      const g = off < 0.07 ? 'perfect' : off < 0.15 ? 'good' : 'off';
      a.res[k] = g;
      a.note = g === 'perfect' ? 'Perfect' : g === 'good' ? 'Good' : 'Off';
      a.noteT = a.t;
      if (g === 'off') { sfx.wrong(); buzz(HAPTIC.wrong); }
      else { tone(g === 'perfect' ? 1318.5 : 1046.5, 0.12, 'triangle', 0.08); buzz(HAPTIC.up); }
    } else {
      if (a.t < 0.5) return;
      let near = 0, dist = 1e9;
      for (let i = 0; i < a.n; i++) { const d = Math.abs(beatX(i) - field.cx); if (d < dist) { dist = d; near = i; } }
      if (near === a.odd && dist < a.spacing * 0.45) {
        const exact = dist < a.spacing * 0.14, pts = 300 * level;
        score += pts;
        light = Math.min(1, light + 0.3);
        if (exact) shield++;
        finishAct(exact ? 'Exact' : 'Found it', '+' + pts + ' · signal back' + (exact ? ' · shield' : ''), true);
      } else finishAct('That beat was true', 'No prize', false);
    }
  }

  function updateAct(dt) {
    const a = act;
    time += dt;
    a.t += dt;
    if (a.end >= 0) {
      if (a.t - a.end > 2.1) {
        act = null;
        setMode('play');
        spawnTimer = Math.max(spawnTimer, 0.7);
        last = performance.now();
      }
      return;
    }
    if (a.type === 'metro') {
      const k = Math.floor(a.t / a.beat);
      if (k > a.tick && k >= 1 && k <= a.n) {
        a.tick = k;
        tone(k <= 2 ? 660 : 990, 0.05, 'square', 0.05);
        noise(0.03, 0.09, 2600, 0, 2);
        buzz(HAPTIC.tap);
      }
      if (a.t > (a.n + 0.5) * a.beat) {
        let perfect = 0, good = 0;
        for (let i = 3; i <= a.n; i++) { if (a.res[i] === 'perfect') perfect++; else if (a.res[i] === 'good') good++; }
        const hits = perfect + good, pts = (perfect * 80 + good * 40) * level;
        score += pts;
        let sub = pts ? '+' + pts : 'No prize';
        if (hits >= 5) { light = 1; sub += ' · signal restored'; }
        if (perfect === 6) { shield++; sub += ' · shield'; }
        finishAct(hits + ' of 6 in time', sub, hits >= 3);
      }
    } else {
      const crossed = Math.floor((field.cx - beatX(0)) / a.spacing);
      if (crossed > a.blip && crossed >= 0 && crossed < a.n) {
        a.blip = crossed;
        tone(880, 0.06, 'sine', 0.06);
        buzz(HAPTIC.tap);
      }
      if (beatX(a.odd) < field.cx - a.spacing * 0.5) finishAct('It slipped past', 'No prize', false);
    }
  }

  function clearedOne() {
    cleared++;
    totalCleared++;
    if (cleared < goal) return;
    if (txMode) gameOver(); else if (level === 7) startEnding(); else startInterlude();
  }

  function useShield(x, y) {
    if (shield <= 0) return false;
    shield--;
    texts.push({ x, y: y - 44 * U, text: 'Shielded', life: 1, rgb: PRIZES.shield.rgb, size: 18 });
    rings.push({ x: field.cx, y: field.heartY, r: 20, max: 90 * U, life: 0.5, rgb: PRIZES.shield.rgb });
    sfx.pass();
    buzz(HAPTIC.letGo);
    return true;
  }

  function penalty(amount, label, x, y, feel) {
    if (useShield(x, y)) return;
    light -= amount;
    flash = 1;
    tallyUp('wrong');
    buzz(feel || HAPTIC.wrong);
    combo = 0;
    shake = 0.2;
    texts.push({ x, y: y - 44 * U, text: label, life: 1, rgb: '255,150,140', size: 17 });
    sfx.wrong();
  }

  function startInterlude() {
    mode = 'interlude';
    interlude = 3;
    const acc = accuracy(seatStats), perfect = seatStats.wrong + seatStats.missed === 0;
    const bonus = 200 * level + (perfect ? 150 * level : 0);
    light = Math.min(1, light + 0.25);
    score += bonus;
    for (const t of targets) burst(targetX(t), t.y, t.shade ? '150,110,210' : t.bonus ? '230,196,106' : ELEMENTS[t.seq[t.done]].rgb, 16, 220);
    targets = [];
    rings.push({ x: field.cx, y: field.heartY, r: 20, max: Math.max(W, H) * 1.1, life: 1.6, rgb: world().accent });
    scrollKick = 2600 * U;
    showBanner(level === 7 ? 'The seventh seat is taken<small>It was looking for you · ' + acc + '% clean · +' + bonus + '</small>'
      : world().name + '<small>' + seatLabel() + ' answered · ' + (perfect ? 'perfect signal' : acc + '% clean · ' + seatStats.missed + ' missed') + ' · +' + bonus + '</small>', 3);
    buzz(HAPTIC.seat);
    if (perfect) sfx.perfect();
    for (let i = 0; i < 6; i++) setTimeout(() => { if (mode === 'interlude') sfx.tally(i / 6); }, 900 + i * 70);
    ui.hint.hidden = true;
    sfx.reply();
  }

  // Seat VII stops the action: the signal goes back, six seats answer, and the seventh
  // answers with the last phrase the player actually played.
  function startEnding() {
    score += 1400;
    light = 1;
    for (const t of targets) burst(targetX(t), t.y, t.shade ? '150,110,210' : t.bonus ? '230,196,106' : ELEMENTS[t.seq[t.done]].rgb, 16, 220);
    targets = [];
    endT = 0;
    setMode('ending');
    buzz(HAPTIC.seat);
    const k = keyNote();
    [1, 1.4983, 1.3348, 2].forEach((m, i) => tone((k / 2) * m, 0.55, 'sine', 0.08, 1.0 + i * 0.3));
    [1, 1.1225, 1.3348, 1.4983, 2, 2.245].forEach((m, i) => tone(k * m, 0.5, 'triangle', 0.07, 2.8 + i * 0.42));
    (phrase.length ? phrase : [k, k * 1.3348, k * 1.4983]).forEach((f, i) => { tone(f, 0.5, 'triangle', 0.09, 5.8 + i * 0.27); tone(f * 2, 0.5, 'sine', 0.04, 5.8 + i * 0.27); });
  }

  function drawEnding() {
    const cx = field.cx, gold = '230,196,106', t = endT;
    ctx.fillStyle = `rgba(2,2,4,${0.82 * clamp(t * 1.5, 0, 1)})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    const span = Math.min(W * 0.92, 640 * U), sw = span / 8.4, y0 = H * 0.4;
    // the signal going back up from the receiver
    for (let k = 0; k < 3; k++) {
      const q = (t - 1 - k * 0.35) / 1.6;
      if (q > 0 && q < 1) {
        ctx.strokeStyle = `rgba(${gold},${1 - q})`;
        ctx.lineWidth = 3 * U;
        ctx.beginPath();
        ctx.arc(cx, H * 0.74, q * H * 0.5, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    }
    const order = [0, 1, 2, 4, 5, 6];
    for (let i = 0; i < 7; i++) {
      const x = cx + (i - 3) * (span / 7), y = y0 - (3 - Math.abs(i - 3)) * 10 * U;
      const at = i === 3 ? 5.8 : 2.8 + order.indexOf(i) * 0.42;
      const lit = clamp((t - at) * 3, 0, 1), mine = i === 3;
      if (lit > 0) glow(x, y, sw * (mine ? 3 : 1.7), mine ? gold : '200,210,255', (mine ? 0.75 : 0.4) * lit);
      ctx.fillStyle = lit > 0 ? (mine ? '#4a3c1c' : '#262a36') : '#101014';
      ctx.strokeStyle = mine ? `rgba(${gold},${0.35 + 0.65 * lit})` : `rgba(200,210,255,${0.25 + 0.55 * lit})`;
      ctx.lineWidth = (mine ? 2.5 : 1.5) * U;
      ctx.beginPath();
      ctx.rect(x - sw / 2, y - sw * 1.0, sw, sw * 0.55);
      ctx.rect(x - sw / 2, y - sw * 0.45, sw, sw * 0.9);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#fffbe6';
    ctx.beginPath();
    ctx.arc(cx, H * 0.74, 12 * U * (1 + 0.06 * Math.sin(time * 3)), 0, TAU);
    ctx.fill();
    ctx.textAlign = 'center';
    const line = t < 1 ? '' : t < 2.7 ? 'THE SIGNAL GOES BACK' : t < 5.7 ? 'SIX ANSWER' : 'THE SEVENTH IS YOU';
    ctx.fillStyle = `rgb(${gold})`;
    ctx.font = `700 ${Math.round(25 * U)}px ${FONT}`;
    ctx.fillText(line, cx, H * 0.58);
    if (t > 7) {
      ctx.fillStyle = `rgba(255,255,255,${clamp((t - 7) * 2, 0, 1) * 0.9})`;
      ctx.font = `600 ${Math.round(14 * U)}px ${FONT}`;
      ctx.fillText('IT WAS LOOKING FOR YOU.', cx, H * 0.58 + 30 * U);
    }
  }

  function gameOver() {
    setMode('over');
    const isBest = score > best;
    if (isBest) {
      best = score;
      try { localStorage.setItem('atumaa.best', String(best)); } catch (e) { /* storage blocked */ }
    }
    overT = 0; overTick = 0; overBest = isBest && score > 0;
    ui.finalScore.textContent = '0';
    const left = Math.max(1, goal - cleared);
    const sigs = left + ' signal' + (left === 1 ? '' : 's');
    // close to the end of a seat, name what was nearly reached; otherwise name where the run fell
    overLine = left <= 4 && level === 7 ? sigs + ' short of taking the seventh seat'
      : left <= 4 && level < LAST ? sigs + ' short of ' + WORLDS[level].name
      : 'Fell in ' + world().name + (level > LAST ? ', cycle ' + (level - LAST + 1) : '') + ' with ' + left + ' to go';
    if (txMode) {
      overLine = tx.ok + ' of ' + TX_N + ' answered';
      const clean = tx.ok === TX_N;
      txHowI = clean ? 'Clean. ' : tx.flinch ? 'I flinched on the silence. ' : tx.missed ? 'I let ' + tx.missed + ' slip past. ' : '';
      ui.finalDetail.textContent = txName() + ' · ' + (clean ? 'A clean transmission.' : tx.flinch ? 'You flinched on the silence.' : tx.missed ? tx.missed + ' slipped past.' : 'So close.');
    }
    ui.overTitle.textContent = overLine;
    if (!txMode) ui.finalDetail.textContent = 'Reached ' + seatLabel() + ' · ' + world().name;
    const rows = [['Answered', runStats.hit], ['Missed', runStats.missed], ['Wrong moves', runStats.wrong], ['Clean', accuracy(runStats) + '%'], ['Best streak', bestCombo], ['Interval acts', memories]];
    ui.finalStats.innerHTML = rows.map((r) => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
    buildCard();
    played = true;
    try { localStorage.setItem('atumaa.played', '1'); } catch (e) { /* storage blocked */ }
    ui.daily2.hidden = !!(signal && signal.daily === today());
    ui.bestOver.textContent = overBest ? 'New best!' : 'Best ' + best.toLocaleString();
    // a signal run ends with its mark, how it went against the sender, and a way to send it on
    const sig = signal;
    ui.glyphOver.hidden = ui.signalResult.hidden = ui.free.hidden = !sig;
    ui.share.textContent = 'Share this run';
    ui.shareNote.textContent = '';
    if (sig) {
      drawGlyph(ui.glyphOver, sig);
      let dayBest = 0;
      if (sig.daily) {
        dayBest = Math.max(dailyBest(sig.daily), score);
        try { localStorage.setItem('atumaa.daily.' + sig.daily, String(dayBest)); } catch (e) { /* storage blocked */ }
      }
      // one human line first: how it went against the person who sent it
      const them = sig.theirs;
      const cmp = !them ? ''
        : tx.ok > them.r ? 'They answered ' + them.r + '. You answered ' + tx.ok + '. You win.'
        : tx.ok < them.r ? 'They answered ' + them.r + '. You answered ' + tx.ok + '. Rematch?'
        : score > them.p ? 'You both answered ' + tx.ok + '. You waited longer and won by ' + (score - them.p) + '.'
        : score < them.p ? 'You both answered ' + tx.ok + '. They waited longer and won by ' + (them.p - score) + '.'
        : 'A dead heat: ' + tx.ok + ' answered and ' + score + ' points each.';
      ui.signalResult.textContent = cmp || (sig.daily ? 'The same ' + TX_N + ' signals for everyone. Your best is ' + dayBest.toLocaleString() + '.' + (sig.daily === today() ? ' A new one arrives at ' + resetTime() + '.' : '')
        : sig.mine ? 'Your signal is ready. Send it and see who can answer it.'
        : 'Send it on and see who can match you.');
      ui.share.textContent = them ? 'Send it back' : sig.mine ? 'Send this signal' : 'Challenge a friend';
    }
    const canRetry = !txMode && retries > 0;
    ui.retry.hidden = !canRetry;
    if (canRetry) ui.retry.textContent = 'Replay ' + seatLabel() + ' · ' + retries + ' left';
    ui.again.textContent = sig ? 'Rematch' : canRetry ? 'Start over' : 'Try again';
    ui.again.className = canRetry ? 'secondary' : 'primary';
    // finishing today's transmission keeps the daily streak going and opens the board
    const isToday = !!(sig && sig.daily === today());
    ui.streak.hidden = !isToday;
    if (isToday) ui.streak.textContent = 'Daily streak: ' + days(bumpStreak());
    ui.board.hidden = !(isToday && BOARD_URL);
    if (isToday && BOARD_URL) {
      ui.post.disabled = false;
      ui.post.textContent = 'Take a seat';
      ui.boardList.textContent = '';
      ui.boardCount.textContent = '';
      loadBoard();
    }
    sfx.over();
    buzz(HAPTIC.over);
  }

  /* ---------- Update ---------- */
  function update(dt) {
    time += dt;
    const playing = mode === 'play';
    const speed = fallSpeed();

    // press-and-hold fills a ring, then fires
    if (holding && playing) {
      // the ring only charges when the signal in front is a Lock, so a slow tap can never turn into one
      const f = aimed();
      const lock = !!(f && !f.shade && !f.bonus && needOf(f) === 'hold');
      const was = holdT;
      holdT = lock ? holdT + dt / HOLD_S : 0;
      if (lock) for (const m of [0.3, 0.6, 0.9]) if (was < m && holdT >= m) buzz(HAPTIC.holdTick);
      if (holdT >= 1) {
        holding = false;
        holdT = 0;
        if (ptr) ptr.done = true;
        gesture('hold');
      }
    } else if (!holding) holdT = 0;

    if (playing) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && cleared + targets.length < goal) {
        spawnTarget();
        // in the last seats two signals sometimes arrive together, in different lanes
        if (level >= 10 && cleared + targets.length < goal && rng() < 0.22) spawnTarget(targets[targets.length - 1].lane);
        spawnTimer = spawnGap();
      }
    }

    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      t.y += speed * dt;
      if (t.shade) t.ph += dt * 3;
      t.wob = Math.max(0, t.wob - dt);
      if (playing && t.y >= field.heartY - 30 * U) {
        targets.splice(i, 1);
        if (t.bonus) {
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'It faded', life: 1, rgb: '200,190,160', size: 16 });
          continue;
        }
        if (t.shade) {
          // resisting the urge to touch is the right answer
          combo++;
          bestCombo = Math.max(bestCombo, combo);
          learned.void++;
          if (txMode && !t.touched) tx.ok++;
          tallyUp('hit');
          buzz(HAPTIC.letGo);
          const pts = 25 * multiplier();
          score += pts;
          burst(field.cx, field.heartY, '150,110,210', 16, 200);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Let go  +' + pts, life: 1, rgb: '200,180,255', size: 18 });
          sfx.pass();
        } else if (useShield(field.cx, field.heartY)) {
          tallyUp('hit');
        } else {
          light -= Math.min(0.2, 0.1 + 0.03 * speedLevel()); // gentler while the first seats are being learned
          flash = 1;
          combo = 0;
          tallyUp('missed');
          if (txMode) tx.missed++;
          buzz(HAPTIC.missed);
          shake = 0.35;
          heartPulse = 1;
          burst(field.cx, field.heartY, '255,120,110', 24, 260);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Missed', life: 1, rgb: '255,150,140', size: 18 });
          sfx.leak();
        }
        clearedOne();
        if (mode !== 'play') break;
      }
    }

    if (playing) light -= (dt * (1 + 0.08 * (speedLevel() - 1))) / 90;
    if (txMode) light = 1; // a transmission always plays to the end
    if (playing && light <= 0) { light = 0; gameOver(); }
    if (mode === 'interlude') {
      interlude -= dt;
      if (interlude <= 0) {
        setMode('play');
        setupLevel(level + 1);
      }
    }

    // feed motion: steady drift plus the kick from each swipe
    scrollY += (speed * 0.55 + scrollKick) * dt;
    scrollKick *= Math.pow(0.004, dt);
    jolt *= Math.pow(0.0006, dt);
    heartPulse = Math.max(0, heartPulse - dt * 2.5);
    shake = Math.max(0, shake - dt);
    flash = Math.max(0, flash - dt * 3.5);

    for (let i = ghosts.length - 1; i >= 0; i--) {
      const g = ghosts[i];
      g.life -= dt;
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (Math.random() < dt * 60) particles.push({ x: g.x, y: g.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.4, max: 0.4, rgb: ELEMENTS[g.el].rgb, size: rand(1.5, 3.5) * U });
      if (g.life <= 0) {
        if (g.vy > 0) burst(field.cx, field.heartY, ELEMENTS[g.el].rgb, 12, 160);
        ghosts.splice(i, 1);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy *= 0.96;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      r.r += (r.max - r.r) * Math.min(1, dt * 6);
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      texts[i].life -= dt;
      texts[i].y -= 30 * U * dt;
      if (texts[i].life <= 0) texts.splice(i, 1);
    }
  }

  /* ---------- HUD ---------- */
  const HINTS = TOUCH
    ? ['Pulse: swipe up', 'Echo: swipe down', 'Flare: double-tap', 'Lock: press and hold']
    : ['Pulse: swipe up, scroll, or press ↑', 'Echo: swipe down, scroll back, or press ↓', 'Flare: double-click or press Space', 'Lock: hold the mouse button or Shift'];
  let lastHint = '', lastPips = '', lastClock = '';
  function updateHud() {
    ui.score.textContent = score.toLocaleString();
    ui.light.style.width = (light * 100).toFixed(1) + '%';
    const secs = Math.ceil(clamp(light, 0, 1) * 321);
    const clock = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    if (clock !== lastClock) { lastClock = clock; ui.clock.textContent = clock; }
    ui.light.classList.toggle('low', light < 0.25 && mode === 'play');
    const pips = 'Signal ' + Math.min(cleared + 1, goal) + ' of ' + goal;
    if (pips !== lastPips) { lastPips = pips; ui.pips.textContent = pips; }
    let hint = '';
    if (mode === 'play') {
      const t = aimed() || front();
      if (t) {
        if (lanes() > 1 && learned.aim < 4) hint = TOUCH ? "Aim: make your move in the signal's own lane" : 'Aim with ← →, then answer';
        else if (t.tip) hint = t.tip;
        else if (t.bonus) hint = (t.act === 'metro' ? 'The metronome' : t.act === 'heart' ? 'A heartbeat' : 'A Memory') + '. Any move opens it';
        else if (t.shade) { if (learned.void < 2) hint = 'A Gap: missing time. Do not touch. Let it scroll past'; }
        else if (isCloaked(t)) { if (learned.cloak < 2) hint = 'Cloaked: it shows itself close to the seat'; }
        else if (t.mirror) { if (learned.mirror < 3) hint = 'Mirrored: swipe the opposite way'; }
        else if (learned[t.seq[t.done]] < 3) hint = HINTS[t.seq[t.done]];
        else if (t.seq.length > 1 && learned.bound < 4) hint = 'Bound signals: answer each one in turn';
      }
    }
    if (hint !== lastHint) {
      lastHint = hint;
      ui.hint.textContent = hint;
      ui.hint.hidden = !hint;
    }
  }

  /* ---------- Drawing ---------- */
  // glyphs read as their gesture: arrow up, arrow down, starburst, ring
  function iconPath(el, r) {
    ctx.beginPath();
    if (el === 0 || el === 1) {
      const s = el === 0 ? -1 : 1;
      ctx.moveTo(0, s * r);
      ctx.lineTo(r * 0.95, -s * r * 0.15);
      ctx.lineTo(r * 0.38, -s * r * 0.15);
      ctx.lineTo(r * 0.38, -s * r);
      ctx.lineTo(-r * 0.38, -s * r);
      ctx.lineTo(-r * 0.38, -s * r * 0.15);
      ctx.lineTo(-r * 0.95, -s * r * 0.15);
      ctx.closePath();
    } else if (el === 2) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.55 : r * 1.05;
        if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    } else {
      ctx.arc(0, 0, r, 0, TAU);
      ctx.moveTo(r * 0.58, 0);
      ctx.arc(0, 0, r * 0.58, 0, TAU, true);
      ctx.moveTo(r * 0.26, 0);
      ctx.arc(0, 0, r * 0.26, 0, TAU);
    }
  }

  function drawIcon(el, x, y, r, alpha) {
    ctx.save();
    ctx.translate(x, y);
    iconPath(el, r);
    ctx.fillStyle = `rgba(${ELEMENTS[el].rgb},${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  function glow(x, y, r, rgb, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function orbBody(x, y, r, rgb, alpha) {
    glow(x, y, r * 2.4, rgb, 0.36 * alpha);
    ctx.fillStyle = `rgba(6,10,18,${0.9 * alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 2 * U;
    ctx.stroke();
  }

  function drawOrb(el, x, y, r, alpha) {
    orbBody(x, y, r, ELEMENTS[el].rgb, alpha);
    drawIcon(el, x, y, r * 0.58, alpha);
  }

  function chevrons(x, y, dir, rgb, alpha) {
    // dir -1 points up, +1 points down
    ctx.lineWidth = 3 * U;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 2; i++) {
      const k = (time * 1.6 + i * 0.5) % 1;
      const yy = y + dir * (i * 11 + k * 8) * U;
      ctx.strokeStyle = `rgba(${rgb},${alpha * (1 - k * 0.7)})`;
      ctx.beginPath();
      ctx.moveTo(x - 10 * U, yy - dir * 7 * U);
      ctx.lineTo(x, yy);
      ctx.lineTo(x + 10 * U, yy - dir * 7 * U);
      ctx.stroke();
    }
  }

  // the cue around a signal shows which thumb gesture answers it
  function drawCue(el, x, y, r, strong, hold) {
    const rgb = ELEMENTS[el].rgb, a = strong ? 1 : 0.45;
    if (el === 0) chevrons(x, y - r - 12 * U, -1, rgb, a);
    else if (el === 1) chevrons(x, y + r + 12 * U, 1, rgb, a);
    else if (el === 2) {
      ctx.lineWidth = 2 * U;
      for (let i = 0; i < 2; i++) {
        const k = (time * 1.4 + i * 0.28) % 1;
        ctx.strokeStyle = `rgba(${rgb},${a * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(x, y, r + (5 + k * 16) * U, 0, TAU);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = 3 * U;
      ctx.setLineDash([5 * U, 7 * U]);
      ctx.strokeStyle = `rgba(${rgb},${a * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, r + 9 * U, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      if (strong && hold > 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4 * U;
        ctx.beginPath();
        ctx.arc(x, y, r + 9 * U, -Math.PI / 2, -Math.PI / 2 + Math.min(1, hold) * TAU);
        ctx.stroke();
      }
    }
  }

  function drawVoid(x, y, ph, barred) {
    const r = 27 * U;
    glow(x, y, r * 2.8, '90,40,140', 0.5);
    ctx.fillStyle = '#020104';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    // a tilted, wobbling halo around nothing
    ctx.lineWidth = 2.5 * U;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${i === 1 ? '230,200,255' : '160,110,230'},${0.85 - i * 0.22})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (1.28 + i * 0.16), r * (0.42 + i * 0.07 + Math.sin(ph + i) * 0.05), -0.35 + Math.sin(ph * 0.5) * 0.08, 0, TAU);
      ctx.stroke();
    }
    if (barred) {
      const q = (r + 16 * U) * 0.7;
      ctx.strokeStyle = 'rgba(255,150,140,0.8)';
      ctx.lineWidth = 2.5 * U;
      ctx.beginPath();
      ctx.arc(x, y, r + 16 * U, 0, TAU);
      ctx.moveTo(x - q, y - q);
      ctx.lineTo(x + q, y + q);
      ctx.stroke();
    }
  }

  function drawTarget(t, isFront) {
    const wob = t.wob > 0 ? Math.sin(t.wob * 60) * 6 * U * (t.wob / 0.35) : 0;
    const fadeIn = clamp((t.y - (field.top - 40 * U)) / (70 * U), 0, 1);
    // the front one follows the thumb a little while dragging, like a reel being pulled
    const mine = t === aimed();
    const drag = mine && !t.shade ? clamp(dragY, -SWIPE_PX, SWIPE_PX) * 0.7 : 0;
    const x = targetX(t) + wob, y = t.y + jolt + drag;
    const r = 27 * U;
    ctx.globalAlpha = fadeIn;
    if (t.bonus) {
      // a slowly turning golden screen
      glow(x, y, r * 2.8, '230,196,106', 0.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * 2) * 0.12);
      ctx.fillStyle = '#0b0906';
      ctx.strokeStyle = 'rgba(230,196,106,1)';
      ctx.lineWidth = 2.5 * U;
      ctx.beginPath();
      ctx.roundRect(-r * 1.15, -r * 0.82, r * 2.3, r * 1.64, 6 * U);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(230,196,106,${0.75 + Math.sin(time * 6) * 0.25})`;
      ctx.font = `700 ${Math.round(26 * U)}px ${FONT}`;
      ctx.textAlign = 'center';
      if (t.act === 'memory') ctx.fillText('?', 0, 9 * U);
      else {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2.5 * U;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (t.act === 'metro') {
          ctx.moveTo(-10 * U, 14 * U); ctx.lineTo(-4 * U, -14 * U); ctx.lineTo(4 * U, -14 * U); ctx.lineTo(10 * U, 14 * U); ctx.closePath();
          ctx.moveTo(0, 10 * U); ctx.lineTo(9 * U, -12 * U);
        } else {
          ctx.moveTo(-20 * U, 2 * U); ctx.lineTo(-8 * U, 2 * U); ctx.lineTo(-3 * U, -14 * U); ctx.lineTo(3 * U, 14 * U); ctx.lineTo(8 * U, 2 * U); ctx.lineTo(20 * U, 2 * U);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (t.shade) {
      drawVoid(x, y, t.ph, isFront);
    } else if (isCloaked(t)) {
      orbBody(x, y, r, '170,175,190', 0.9);
      ctx.fillStyle = 'rgba(220,225,240,0.9)';
      ctx.font = `600 ${Math.round(26 * U)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('?', x, y + 9 * U);
      // shrinking ring counts down to the reveal
      const k = clamp((revealY() - t.y) / (revealY() - field.top), 0, 1);
      ctx.strokeStyle = 'rgba(255,220,130,0.7)';
      ctx.lineWidth = 2 * U;
      ctx.beginPath();
      ctx.arc(x, y, r + (4 + k * 22) * U, 0, TAU);
      ctx.stroke();
    } else {
      // bound signals trail above the current one, waiting their turn
      for (let i = t.seq.length - 1; i > t.done; i--) {
        const k = i - t.done;
        ctx.strokeStyle = 'rgba(255,243,196,0.25)';
        ctx.lineWidth = 2 * U;
        ctx.beginPath();
        ctx.moveTo(x, y - (k - 1) * 46 * U);
        ctx.lineTo(x, y - k * 46 * U);
        ctx.stroke();
        drawOrb(t.seq[i], x, y - k * 46 * U - 4 * U, 16 * U, 0.85);
      }
      const el = t.seq[t.done];
      drawOrb(el, x, y, r, 1);
      if (t.mirror) {
        // no helpful chevrons: a split magenta frame says "do the opposite"
        ctx.strokeStyle = 'rgba(255,120,235,0.95)';
        ctx.lineWidth = 3 * U;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(x, y, r + 9 * U, s > 0 ? 0.25 : Math.PI + 0.25, s > 0 ? Math.PI - 0.25 : TAU - 0.25);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x - r - 16 * U, y);
        ctx.lineTo(x + r + 16 * U, y);
        ctx.stroke();
      } else {
        drawCue(el, x, y, r, isFront, mine ? holdT : 0);
      }
      if (isFront) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5 * U;
        ctx.beginPath();
        ctx.arc(x, y, r + 4 * U, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  // the seat: a beacon at the bottom of the lane that everything is rushing at
  function drawSeat() {
    const hx = field.cx, hy = field.heartY, acc = world().accent;
    const pulse = 1 + heartPulse * 0.35 + Math.sin(time * 3) * 0.04;
    const life = mode === 'intro' ? 1 : clamp(light, 0, 1);
    const gutter = life < 0.25 && Math.sin(time * 22) > 0 ? 0.45 : 1;
    glow(hx, hy, 70 * U * pulse * (0.55 + 0.45 * life), acc, (0.12 + 0.45 * life) * gutter);
    ctx.strokeStyle = `rgba(${acc},0.4)`;
    ctx.lineWidth = 1.5 * U;
    ctx.beginPath();
    ctx.ellipse(hx, hy + 6 * U, field.path * 0.8, 14 * U, 0, 0, TAU);
    ctx.stroke();
    // seven marks around the core, lit for each seat reached
    const lit = Math.min(7, seatOf(level));
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i / 7) * TAU + time * 0.25;
      ctx.fillStyle = i < lit ? `rgba(${acc},0.95)` : 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * 24 * U * pulse, hy + Math.sin(a) * 24 * U * pulse, 2.6 * U, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#fffbe6';
    ctx.beginPath();
    ctx.arc(hx, hy, 12 * U * pulse * (0.55 + 0.45 * life), 0, TAU);
    ctx.fill();
  }

  function prizeIcon(kind, x, y, r, rgb) {
    ctx.strokeStyle = ctx.fillStyle = `rgb(${rgb})`;
    ctx.lineWidth = 3 * U;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (kind === 'time') {
      ctx.arc(x, y, r, 0, TAU);
      ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y); ctx.lineTo(x + r * 0.45, y + r * 0.25);
      ctx.stroke();
    } else if (kind === 'score') {
      ctx.save(); ctx.translate(x, y); iconPath(2, r); ctx.fill(); ctx.restore();
    } else if (kind === 'skip') {
      for (const o of [-0.45, 0.35]) {
        ctx.moveTo(x - r * 0.8, y + r * (o + 0.4)); ctx.lineTo(x, y + r * (o - 0.4)); ctx.lineTo(x + r * 0.8, y + r * (o + 0.4));
      }
      ctx.stroke();
    } else if (kind === 'shield') {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.85, y - r * 0.6);
      ctx.quadraticCurveTo(x + r * 0.85, y + r * 0.6, x, y + r);
      ctx.quadraticCurveTo(x - r * 0.85, y + r * 0.6, x - r * 0.85, y - r * 0.6);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y);
      ctx.stroke();
    }
  }

  function drawBonus() {
    const b = bonus;
    ctx.fillStyle = `rgba(2,3,7,${0.78 * clamp(b.t * 4, 0, 1)})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.textAlign = 'center';
    const top = b.tiles[0].y;
    ctx.fillStyle = 'rgb(230,196,106)';
    ctx.font = `700 ${Math.round(22 * U)}px ${FONT}`;
    ctx.fillText('A MEMORY SURFACES', field.cx, top - 44 * U);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `600 ${Math.round(13 * U)}px ${FONT}`;
    const picked = b.picked >= 0 ? b.tiles[b.picked] : null;
    ctx.fillText(picked ? (picked.open > 0.5 ? PRIZES[picked.prize].label.toUpperCase() + (picked.prize === 'score' ? ' +' + 500 * level : '') : '') : 'TAP ONE SCREEN', field.cx, top - 20 * U);
    b.tiles.forEach((tile, i) => {
      const appear = ease(clamp(b.t * 3 - i * 0.12, 0, 1));
      const mine = i === b.picked, p = PRIZES[tile.prize];
      const flip = tile.open; // 0 closed .. 1 open; squash horizontally through the middle
      const sx = Math.abs(1 - flip * 2) * 0.96 + 0.04;
      const showFace = flip > 0.5;
      ctx.save();
      ctx.translate(tile.x + tile.w / 2, tile.y + tile.h / 2);
      ctx.scale(sx * appear, appear);
      ctx.globalAlpha = appear * (showFace && !mine ? 0.55 : 1);
      ctx.fillStyle = showFace ? '#0c0e16' : '#14100a';
      ctx.strokeStyle = mine ? 'rgb(230,196,106)' : showFace ? `rgba(${p.rgb},0.7)` : 'rgba(230,196,106,0.55)';
      ctx.lineWidth = (mine ? 3.5 : 1.8) * U;
      ctx.beginPath();
      ctx.roundRect(-tile.w / 2, -tile.h / 2, tile.w, tile.h, 8 * U);
      ctx.fill();
      ctx.stroke();
      if (showFace) {
        prizeIcon(tile.prize, 0, -tile.h * 0.1, tile.h * 0.22, p.rgb);
        ctx.fillStyle = `rgb(${p.rgb})`;
        ctx.font = `600 ${Math.round(10.5 * U)}px ${FONT}`;
        const words = tile.prize === 'score' ? '+' + 500 * level : tile.prize === 'shield' ? 'Shield' : tile.prize === 'skip' ? 'Skip seat' : tile.prize === 'time' ? 'Full signal' : 'Nothing';
        ctx.fillText(words.toUpperCase(), 0, tile.h * 0.36);
      } else {
        // closed screens flicker like the wall in the corridor
        ctx.fillStyle = `rgba(230,196,106,${0.1 + 0.08 * Math.sin(time * 5 + i * 1.7)})`;
        for (let k = 0; k < 4; k++) ctx.fillRect(-tile.w * 0.4, -tile.h * 0.32 + k * tile.h * 0.2, tile.w * 0.8, tile.h * 0.06);
        ctx.fillStyle = 'rgba(230,196,106,0.95)';
        ctx.font = `700 ${Math.round(tile.h * 0.36)}px ${FONT}`;
        ctx.fillText(TOUCH ? '?' : String(i + 1), 0, tile.h * 0.13);
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function beatShape(d, kind) {
    const g = (c, w) => Math.exp(-(((d - c) / w) ** 2));
    const rest = 8 * g(-34, 9) + 14 * g(42, 13);
    if (kind === 0) return rest + 95 * g(0, 5) - 22 * g(10, 5);        // a true beat
    if (kind === 1) return rest - 72 * g(0, 5) + 16 * g(10, 5);        // the wrong one: upside down
    return rest + 62 * g(-7, 4) + 62 * g(7, 4) - 18 * g(0, 3);         // later seats: a split peak
  }

  function drawAct() {
    const a = act, cx = field.cx, gold = '230,196,106';
    ctx.fillStyle = `rgba(2,3,7,${0.8 * clamp((a.t + 0.6) * 4, 0, 1)})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.textAlign = 'center';
    const titleY = Math.max(field.top + 60 * U, H * 0.5 - 200 * U);
    ctx.fillStyle = `rgb(${gold})`;
    ctx.font = `700 ${Math.round(22 * U)}px ${FONT}`;
    ctx.fillText(a.type === 'metro' ? 'THE METRONOME' : 'THE HEARTBEAT', cx, titleY);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `600 ${Math.round(12.5 * U)}px ${FONT}`;

    if (a.type === 'metro') {
      const k = Math.floor(a.t / a.beat);
      ctx.fillText(a.end >= 0 ? '' : k < 2 ? 'LISTEN' : 'TAP ON EVERY TICK', cx, titleY + 24 * U);
      const by = H * 0.5 + 120 * U, py = by - 26 * U, len = 196 * U;
      ctx.fillStyle = '#140e08';
      ctx.strokeStyle = `rgba(${gold},0.9)`;
      ctx.lineWidth = 2.5 * U;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 74 * U, by); ctx.lineTo(cx - 24 * U, by - 236 * U); ctx.lineTo(cx + 24 * U, by - 236 * U); ctx.lineTo(cx + 74 * U, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // the centre mark lights up on each tick
      const onBeat = Math.abs(a.t - Math.round(a.t / a.beat) * a.beat) < 0.07 && a.t > 0 && a.end < 0;
      ctx.strokeStyle = onBeat ? '#fff' : `rgba(${gold},0.35)`;
      ctx.lineWidth = (onBeat ? 4 : 2) * U;
      ctx.beginPath();
      ctx.moveTo(cx, by - 220 * U); ctx.lineTo(cx, py - 20 * U);
      ctx.stroke();
      const ang = a.end >= 0 ? 0 : 0.62 * Math.sin((Math.PI * a.t) / a.beat);
      const tx = cx + Math.sin(ang) * len, ty = py - Math.cos(ang) * len;
      ctx.strokeStyle = '#f3ead2';
      ctx.lineWidth = 4 * U;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, py); ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = `rgb(${gold})`;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(ang) * len * 0.62, py - Math.cos(ang) * len * 0.62, 11 * U, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, py, 6 * U, 0, TAU);
      ctx.fill();
      // six lamps, one per scored tick
      for (let i = 3; i <= a.n; i++) {
        const r = a.res[i], x = cx + (i - 5.5) * 26 * U, y = by + 34 * U;
        ctx.beginPath();
        ctx.arc(x, y, 8 * U, 0, TAU);
        if (r) { ctx.fillStyle = r === 'perfect' ? `rgb(${gold})` : r === 'good' ? 'rgb(125,220,132)' : 'rgb(255,120,110)'; ctx.fill(); }
        else { ctx.strokeStyle = k >= i ? 'rgba(255,120,110,0.7)' : 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2 * U; ctx.stroke(); }
      }
      if (a.end < 0 && a.t - a.noteT < 0.45) {
        ctx.fillStyle = a.note === 'Off' ? 'rgb(255,150,140)' : '#fffbe6';
        ctx.font = `700 ${Math.round(20 * U)}px ${FONT}`;
        ctx.fillText(a.note.toUpperCase(), cx, by + 76 * U);
      }
    } else {
      ctx.fillText(a.end >= 0 ? '' : 'TAP WHEN THE WRONG BEAT CROSSES THE LINE', cx, titleY + 24 * U);
      const pw = Math.min(W - 24, 720 * U), ph = 250 * U, px = cx - pw / 2, cy = H * 0.5 + 10 * U, py = cy - ph / 2;
      ctx.fillStyle = '#03130f';
      ctx.strokeStyle = 'rgba(90,235,190,0.5)';
      ctx.lineWidth = 2 * U;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 18 * U);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(90,235,190,0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = px; x < px + pw; x += 28 * U) { ctx.moveTo(x, py); ctx.lineTo(x, py + ph); }
      for (let y = py; y < py + ph; y += 28 * U) { ctx.moveTo(px, y); ctx.lineTo(px + pw, y); }
      ctx.stroke();
      const x0 = beatX(0), base = cy + 30 * U;
      ctx.strokeStyle = 'rgb(110,245,200)';
      ctx.lineWidth = 2.5 * U;
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(90,235,190,0.9)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = px; x <= px + pw; x += 2) {
        const i = Math.round((x - x0) / a.spacing);
        const v = i >= 0 && i < a.n ? beatShape((x - x0 - i * a.spacing) / U, i === a.odd ? (a.subtle ? 2 : 1) : 0) : 0;
        if (x === px) ctx.moveTo(x, base - v * U); else ctx.lineTo(x, base - v * U);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (a.end >= 0) {
        // ring the wrong beat, the way it is circled on the scope in the film
        ctx.strokeStyle = a.good ? `rgb(${gold})` : 'rgb(255,120,110)';
        ctx.lineWidth = 3 * U;
        ctx.beginPath();
        ctx.ellipse(beatX(a.odd), base - 10 * U, 44 * U, 84 * U, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = `rgba(${gold},0.9)`;
      ctx.lineWidth = 2 * U;
      ctx.beginPath();
      ctx.moveTo(cx, py - 8 * U); ctx.lineTo(cx, py + ph + 8 * U);
      ctx.stroke();
      ctx.fillStyle = `rgb(${gold})`;
      for (const s of [-1, 1]) {
        const y = s < 0 ? py - 8 * U : py + ph + 8 * U;
        ctx.beginPath();
        ctx.moveTo(cx - 8 * U, y + s * 10 * U); ctx.lineTo(cx + 8 * U, y + s * 10 * U); ctx.lineTo(cx, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (a.end >= 0) {
      const y = H * 0.5 + 200 * U;
      ctx.fillStyle = a.good ? `rgb(${gold})` : 'rgb(255,150,140)';
      ctx.font = `700 ${Math.round(24 * U)}px ${FONT}`;
      ctx.fillText(a.msg.toUpperCase(), cx, Math.min(y, H - 70));
      ctx.fillStyle = '#fff';
      ctx.font = `600 ${Math.round(14 * U)}px ${FONT}`;
      ctx.fillText(a.sub.toUpperCase(), cx, Math.min(y, H - 70) + 26 * U);
    }
  }

  function drawThumb(x, y, pressed, alpha) {
    ctx.fillStyle = `rgba(255,255,255,${(pressed ? 0.38 : 0.14) * alpha})`;
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * alpha})`;
    ctx.lineWidth = 2 * U;
    ctx.beginPath();
    ctx.arc(x, y, (pressed ? 20 : 24) * U, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  // ten-second opening: the premise in one line, then each gesture shown once
  function drawIntro() {
    let t = introT, i = 0;
    while (i < INTRO.length - 1 && t >= INTRO[i].dur) { t -= INTRO[i].dur; i++; }
    const beat = INTRO[i], k = clamp(t / beat.dur, 0, 1);
    const cx = field.cx, r = 27 * U;
    const y0 = field.top + 130 * U, yMid = lerp(y0, field.heartY, 0.42);
    const base = Math.min(field.heartY - 56 * U, yMid + 190 * U);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(200,215,255,0.8)';
    ctx.font = `700 ${Math.round(Math.min(11.5 * U, W / 36))}px ${FONT}`;
    ctx.fillText('NOVEMBER 2026. ASTEROID 1998 KY26 IS ACCELERATING.', cx, field.top - 14 * U);
    ctx.fillStyle = 'rgba(230,196,106,0.95)';
    ctx.fillText('IT IS SENDING A SIGNAL. ANSWER IT.', cx, field.top + 6 * U);
    const capA = clamp(Math.min(k * 6, (1 - k) * 6), 0, 1);
    ctx.fillStyle = `rgba(255,251,230,${capA})`;
    ctx.font = `600 ${Math.round(30 * U)}px ${FONT}`;
    ctx.fillText(TOUCH ? beat.touch : beat.desk, cx, field.top + 62 * U);
    for (let d = 0; d < INTRO.length; d++) {
      ctx.fillStyle = d === i ? '#fffbe6' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx + (d - 2) * 14 * U, field.top + 84 * U, 3 * U, 0, TAU);
      ctx.fill();
    }

    drawSeat();
    if (beat.el < 0) {
      // the void drifts all the way down while the thumb stays lifted
      const y = lerp(y0, field.heartY - 34 * U, k);
      ctx.globalAlpha = clamp((1 - k) * 8, 0, 1);
      drawVoid(cx, y, time * 3, true);
      ctx.globalAlpha = 1;
      drawThumb(cx + 86 * U, base - 30 * U, false, 0.7);
      ctx.strokeStyle = 'rgba(255,150,140,0.9)';
      ctx.lineWidth = 3 * U;
      ctx.beginPath();
      ctx.moveTo(cx + 68 * U, base - 48 * U); ctx.lineTo(cx + 104 * U, base - 12 * U);
      ctx.moveTo(cx + 104 * U, base - 48 * U); ctx.lineTo(cx + 68 * U, base - 12 * U);
      ctx.stroke();
      return;
    }
    const el = beat.el, rgb = ELEMENTS[el].rgb;
    const act = clamp((k - 0.36) / 0.3, 0, 1);  // the gesture itself
    const out = clamp((k - 0.66) / 0.26, 0, 1); // the signal's reaction
    let y = lerp(y0, yMid, ease(k / 0.3)), alpha = 1, scale = 1;
    if (el === 0) { y -= out * out * H * 0.7; }
    else if (el === 1) { y = lerp(y, field.heartY, out * out); alpha = 1 - out * 0.3; }
    else if (el === 2) { scale = 1 + out * 0.5; alpha = 1 - out; }
    else { scale = 1 - out * 0.8; alpha = 1 - out; }
    ctx.globalAlpha = clamp(alpha, 0, 1) * clamp(k * 8, 0, 1);
    if (alpha > 0.02) {
      drawOrb(el, cx, y, r * scale, 1);
      if (out === 0) drawCue(el, cx, y, r, true, el === 3 ? act : 0);
    }
    ctx.globalAlpha = 1;
    if (el === 2 && out > 0 && out < 1) {
      ctx.strokeStyle = `rgba(${rgb},${1 - out})`;
      ctx.lineWidth = 3 * U;
      ctx.beginPath();
      ctx.arc(cx, y, r * (1 + out * 2.4), 0, TAU);
      ctx.stroke();
    }

    // ghost thumb acting out the gesture
    const tA = clamp((k - 0.22) * 8, 0, 1) * clamp((0.82 - k) * 8, 0, 1);
    if (tA > 0) {
      const travel = 120 * U;
      if (el === 0 || el === 1) {
        const from = el === 0 ? base : base - travel, to = el === 0 ? base - travel : base;
        const ty = lerp(from, to, ease(act));
        ctx.strokeStyle = `rgba(255,255,255,${0.3 * tA})`;
        ctx.lineWidth = 12 * U;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, from); ctx.lineTo(cx, ty);
        ctx.stroke();
        drawThumb(cx, ty, true, tA);
      } else if (el === 2) {
        const tapA = act > 0.05 && act < 0.3, tapB = act > 0.5 && act < 0.75;
        drawThumb(cx, base - 60 * U, tapA || tapB, tA);
        if (tapA || tapB) {
          const q = tapA ? (act - 0.05) / 0.25 : (act - 0.5) / 0.25;
          ctx.strokeStyle = `rgba(255,255,255,${(1 - q) * tA})`;
          ctx.lineWidth = 2 * U;
          ctx.beginPath();
          ctx.arc(cx, base - 60 * U, (22 + q * 26) * U, 0, TAU);
          ctx.stroke();
        }
      } else {
        drawThumb(cx, base - 60 * U, act > 0, tA);
        ctx.strokeStyle = `rgba(${rgb},${tA})`;
        ctx.lineWidth = 4 * U;
        ctx.beginPath();
        ctx.arc(cx, base - 60 * U, 30 * U, -Math.PI / 2, -Math.PI / 2 + act * TAU);
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (shake > 0) ctx.translate(rand(-1, 1) * shake * 18 * U, rand(-1, 1) * shake * 18 * U);
    ctx.drawImage(ground, 0, 0, W, H);
    const off = (((scrollY + clamp(dragY, -60, 60) * 0.5) % H) + H) % H;
    ctx.drawImage(scenery, 0, off, W, H);
    ctx.drawImage(scenery, 0, off - H, W, H);

    if (mode === 'intro') { drawIntro(); return; }
    if (mode === 'title' || mode === 'compose') return;
    if (mode === 'story') { drawStory(); return; }
    if (mode === 'ending') { drawEnding(); return; }

    const hx = field.cx, hy = field.heartY;
    const f = front();

    // thread from the seat to the signal that is next
    if (f && mode === 'play') {
      ctx.strokeStyle = 'rgba(255,243,196,0.16)';
      ctx.lineWidth = 2 * U;
      ctx.setLineDash([4 * U, 8 * U]);
      ctx.beginPath();
      ctx.moveTo(hx, hy - 30 * U);
      ctx.lineTo(targetX(f), f.y + 30 * U);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // on the last seat, a faint line marks where cloaked signals show themselves
    if (ruleLevel() >= 7 && mode === 'play') {
      ctx.strokeStyle = 'rgba(255,220,130,0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2 * U, 10 * U]);
      ctx.beginPath();
      ctx.moveTo(hx - field.path, revealY());
      ctx.lineTo(hx + field.path, revealY());
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // lanes: a column for each, the aimed one lit, and a pad under the thumb
    if (lanes() > 1 && (mode === 'play' || mode === 'interlude')) {
      const gap = laneGap(), acc = world().accent, list = lanes() === 2 ? [-1, 1] : [-1, 0, 1];
      for (const l of list) {
        const x = hx + l * gap, on = l === aimLane;
        const col = ctx.createLinearGradient(0, field.top, 0, hy);
        col.addColorStop(0, `rgba(${acc},0)`);
        col.addColorStop(1, `rgba(${acc},${on ? 0.2 : 0.05})`);
        ctx.fillStyle = col;
        ctx.fillRect(x - gap * 0.44, field.top, gap * 0.88, hy - field.top);
        const py = hy + 22 * U;
        ctx.fillStyle = `rgba(${acc},${on ? 0.3 : 0.07})`;
        ctx.strokeStyle = `rgba(${acc},${on ? 0.95 : 0.4})`;
        ctx.lineWidth = (on ? 2.5 : 1.5) * U;
        ctx.beginPath();
        ctx.roundRect(x - gap * 0.42, py, gap * 0.84, 46 * U, 14 * U);
        ctx.fill();
        ctx.stroke();
      }
    }

    // the glow: answers made inside this band are worth far more
    if (mode === 'play') {
      const zy = lerp(field.top, field.heartY, 0.7), zb = field.heartY - 30 * U;
      const wait = !!(f && f.wait && f.y < zy);
      const a = wait ? 0.3 + 0.12 * Math.sin(time * 8) : 0.15;
      const g = ctx.createLinearGradient(0, zy, 0, zb);
      g.addColorStop(0, 'rgba(230,196,106,0)');
      g.addColorStop(1, `rgba(230,196,106,${a})`);
      ctx.fillStyle = g;
      ctx.fillRect(hx - field.path, zy, field.path * 2, zb - zy);
      ctx.strokeStyle = `rgba(230,196,106,${Math.min(1, a * 2.4)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx - field.path, zy);
      ctx.lineTo(hx + field.path, zy);
      ctx.stroke();
    }

    for (const r of rings) {
      ctx.strokeStyle = `rgba(${r.rgb},${Math.min(1, r.life * 2)})`;
      ctx.lineWidth = 3 * U;
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0.1, r.r), 0, TAU);
      ctx.stroke();
    }

    drawSeat();

    // draw far ones first so the front signal sits on top
    const order = targets.slice().sort((a, b) => a.y - b.y);
    const fronts = lanes() > 1 ? [frontIn(-1), frontIn(0), frontIn(1)] : [f];
    for (const t of order) drawTarget(t, fronts.includes(t));

    for (const g of ghosts) drawOrb(g.el, g.x, g.y, g.r, clamp(g.life / g.max + 0.3, 0, 1));

    for (const p of particles) {
      ctx.fillStyle = `rgba(${p.rgb},${p.life / p.max})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }

    // a mistake flashes the edges red, so it lands even where the phone cannot vibrate
    if (flash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.12, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, `rgba(255,60,50,${0.16 * flash})`);
      g.addColorStop(1, `rgba(255,50,40,${0.85 * flash})`);
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, W + 80, H + 80);
    }
    // the dark closes in as time runs out
    const dark = clamp(1 - light, 0, 1) * 0.72;
    if (dark > 0.02) {
      const g = ctx.createRadialGradient(hx, hy, 60 * U, hx, hy, H);
      g.addColorStop(0, 'rgba(1,2,6,0)');
      g.addColorStop(0.5, `rgba(1,2,6,${dark * 0.75})`);
      g.addColorStop(1, `rgba(1,2,6,${dark})`);
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, W + 80, H + 80);
    }

    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.font = `600 ${Math.round(t.size * U)}px ${FONT}`;
      ctx.fillStyle = `rgba(${t.rgb},${Math.min(1, t.life * 1.6)})`;
      ctx.fillText(t.text, clamp(t.x, 70, W - 70), t.y);
    }

    if (shield > 0) {
      ctx.strokeStyle = `rgba(${PRIZES.shield.rgb},0.9)`;
      ctx.lineWidth = 2.5 * U;
      ctx.beginPath();
      ctx.arc(hx, hy, 40 * U, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    if (mode === 'bonus' && bonus) drawBonus();
    if (mode === 'act' && act) drawAct();
    if (combo >= 3 && mode === 'play') {
      ctx.textAlign = 'left';
      ctx.font = `${Math.round(15 * U)}px ${FONT}`;
      ctx.fillStyle = 'rgba(255,243,196,0.85)';
      ctx.fillText('Streak ' + combo + (multiplier() > 1 ? '  ×' + multiplier() : ''), 14, field.top + 22 * U);
    }
  }

  /* ---------- Loop ---------- */
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (mode === 'play' || mode === 'interlude') { if (hitStop > 0) hitStop -= dt; else update(dt); music(); }
    else if (mode === 'bonus') updateBonus(dt);
    else if (mode === 'act') updateAct(dt);
    else if (mode === 'story') { time += dt; storyT += dt; if (storyT > 7) endStory(); }
    else if (mode === 'ending') { time += dt; endT += dt; scrollY += H * 0.04 * dt; if (endT > 8.2 && ui.endless.hidden) ui.endless.hidden = false; }
    else if (mode === 'intro') {
      time += dt;
      introT += dt;
      scrollY += H * 0.14 * dt;
      if (introT >= INTRO_TOTAL) startGame();
    } else if (mode === 'title' || mode === 'over' || mode === 'compose') { time += dt; scrollY += H * 0.06 * dt; }
    if (mode === 'over' && overT < 1) {
      // the score counts up with a ticking tally once the falling tones have played
      overT = Math.min(1, overT + dt / 1.3);
      const k = clamp((overT - 0.35) / 0.65, 0, 1);
      ui.finalScore.textContent = Math.round(score * ease(k)).toLocaleString();
      overTick -= dt;
      if (k > 0 && k < 1 && overTick <= 0 && score > 0) { overTick = 0.055; sfx.tally(k); buzz(HAPTIC.tally); }
      if (overT >= 1 && overBest) { sfx.best(); buzz(HAPTIC.seat); }
    }
    if (bannerT > 0 && mode !== 'pause') {
      bannerT -= dt;
      if (bannerT <= 0) ui.banner.hidden = true;
    }
    tickSong(dt);
    updateHud();
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- Input ---------- */
  function togglePause() {
    if (mode === 'play') setMode('pause');
    else if (mode === 'pause') { last = performance.now(); setMode('play'); }
  }
  function toggleSound() {
    muted = !muted;
    syncToggles();
  }
  function endHold() { holding = false; holdT = 0; }
  function syncToggles() {
    ui.sound.classList.toggle('off', muted);
    ui.haptic.classList.toggle('off', !hapticsOn);
    ui.sound2.textContent = 'Sound: ' + (muted ? 'off' : 'on');
    ui.haptic2.textContent = 'Vibration: ' + (hapticsOn ? 'on' : 'off');
  }
  function toggleHaptics() {
    hapticsOn = !hapticsOn;
    syncToggles();
    try { localStorage.setItem('atumaa.haptics', hapticsOn ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    buzz(HAPTIC.like);
  }

  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    initHaptics();
    if (mode === 'story') { endStory(); return; }
    if (mode === 'act') { actTap(); return; }
    if (mode === 'bonus' && bonus) {
      const i = bonus.tiles.findIndex((q) => e.clientX >= q.x && e.clientX <= q.x + q.w && e.clientY >= q.y && e.clientY <= q.y + q.h);
      if (i >= 0) pickBonus(i);
      return;
    }
    if (ptr || e.button > 0) return;
    buzz(HAPTIC.touch);
    ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), done: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    if (mode === 'play' && lanes() > 1) aimLane = laneAt(e.clientX); // where the thumb lands is the aim
    dragY = 0;
    holding = true;
    holdT = 0;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!ptr || e.pointerId !== ptr.id || ptr.done) return;
    const dx = e.clientX - ptr.x0, dy = e.clientY - ptr.y0;
    dragY = dy;
    if (Math.hypot(dx, dy) > TAP_PX) endHold();
    // fire as soon as the thumb has travelled far enough, without waiting for the lift
    if (Math.hypot(dx, dy) >= SWIPE_PX && Math.abs(dx) <= Math.abs(dy) * SWIPE_CONE) {
      ptr.done = true;
      dragY = 0;
      gesture(dy < 0 ? 'up' : 'down');
    }
  });
  function pointerEnd(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const now = performance.now();
    const moved = Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0);
    if (!ptr.done && e.type === 'pointerup' && moved <= TAP_PX && now - ptr.t0 < TAP_MS) {
      if (now - lastTap < DOUBLE_MS) { lastTap = 0; if (mode === 'play' && !front()) buzz(HAPTIC.tap); gesture('like'); }
      else lastTap = now; // no click, no buzz: the thumb has not done anything yet
    }
    ptr = null;
    dragY = 0;
    if (!keyHold) endHold();
  }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // mouse wheel and trackpad: one gesture per flick, ignoring the inertia tail
  window.addEventListener('wheel', (e) => {
    if (mode !== 'play') return;
    e.preventDefault();
    const now = performance.now(), mag = Math.abs(e.deltaY);
    const fresh = now - lastWheelT > 130 || mag > lastWheelMag * 1.6 + 4;
    if (mag >= 4 && fresh && now - lastWheelT > 60) gesture(e.deltaY > 0 ? 'up' : 'down');
    lastWheelT = now;
    lastWheelMag = mag;
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter') postBoard(); return; } // typing a name is not playing
    if (e.repeat) { if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); return; }
    const k = e.key;
    if (mode === 'compose') {
      // Space taps the rhythm until the signal is made; after that it is free to press the buttons
      if (k === ' ' && !draft) { e.preventDefault(); composeTap(); }
      else if (k === 'Escape') setMode(composeFrom);
      return;
    }
    if (mode === 'title') { if (k === ' ' || k === 'Enter') { e.preventDefault(); startGame(); } return; }
    if (mode === 'over') { if (k === ' ' || k === 'Enter') { e.preventDefault(); startGame(); } return; }
    if (mode === 'intro') { if (k === ' ' || k === 'Enter' || k === 'Escape') { e.preventDefault(); startGame(); } return; }
    if (mode === 'story') { if (k === ' ' || k === 'Enter' || k === 'Escape') { e.preventDefault(); endStory(); } return; }
    if (mode === 'bonus') { if (k >= '1' && k <= '6') pickBonus(+k - 1); return; }
    if (mode === 'act') { if (k === ' ' || k === 'Enter' || k.startsWith('Arrow')) { e.preventDefault(); actTap(); } return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      const dir = k === 'ArrowLeft' || k === 'a' || k === 'A' ? -1 : 1;
      if (lanes() === 2) aimLane = dir; else if (lanes() === 3) aimLane = clamp(aimLane + dir, -1, 1);
      return;
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); gesture('up'); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); gesture('down'); }
    else if (k === ' ') { e.preventDefault(); if (mode === 'pause') togglePause(); else gesture('like'); }
    else if (k === 'Shift') { keyHold = true; holding = true; holdT = 0; }
    else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
    else if (k === 'm' || k === 'M') toggleSound();
    else if (k === 'v' || k === 'V') toggleHaptics();
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Shift') { keyHold = false; endHold(); } });
  window.addEventListener('blur', () => { keyHold = false; endHold(); if (mode === 'play') setMode('pause'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setMode('pause'); });

  $('btn-start').addEventListener('click', () => startGame(startSeat));
  ui.retry.addEventListener('click', retrySeat);
  $('btn-aim').addEventListener('click', () => { signal = null; startGame(8); });
  $('btn-how').addEventListener('click', startIntro);
  $('btn-again').addEventListener('click', () => startGame());
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause').addEventListener('click', togglePause);
  ui.skip.addEventListener('click', startGame);
  ui.sound.addEventListener('click', toggleSound);
  ui.haptic.addEventListener('click', () => { initHaptics(); toggleHaptics(); });
  ui.sound2.addEventListener('click', toggleSound);
  ui.haptic2.addEventListener('click', () => { initHaptics(); toggleHaptics(); });
  ui.daily.addEventListener('click', playDaily);
  ui.daily2.addEventListener('click', playDaily);
  ui.post.addEventListener('click', postBoard);
  try { ui.boardName.value = cleanName(localStorage.getItem('atumaa.name')); } catch (e) { /* storage blocked */ }
  ui.endless.addEventListener('click', () => { setMode('play'); setupLevel(8); });
  syncToggles();
  for (const id of ['btn-start', 'btn-again', 'btn-resume', 'btn-skip', 'btn-signal', 'btn-compose', 'btn-play-signal', 'btn-share', 'btn-daily', 'btn-daily2']) $(id).addEventListener('pointerdown', () => { initHaptics(); buzz(HAPTIC.tap); });

  // send a signal
  $('btn-signal').addEventListener('click', openCompose);
  $('btn-compose').addEventListener('click', openCompose);
  $('btn-back').addEventListener('click', () => setMode(composeFrom));
  ui.tapPad.addEventListener('pointerdown', (e) => { e.preventDefault(); composeTap(); });
  ui.tapPad.addEventListener('click', (e) => e.preventDefault());
  ui.playSignal.addEventListener('click', playDraft);
  ui.redo.addEventListener('click', () => { taps = []; draft = null; renderCompose(); });
  ui.share.addEventListener('click', shareSignal);
  ui.free.addEventListener('click', () => { signal = null; startGame(); });
  // ?seat=8 starts a run at that seat, for trying a world without playing up to it
  let startSeat = 1;
  try { const v = parseInt(new URLSearchParams(location.search).get('seat') || '', 10); if (v >= 1 && v <= WORLDS.length) startSeat = v; } catch (e) { /* no query */ }
  loadStill(1);
  loadStill(startSeat);
  ui.glyphTitle.addEventListener('click', () => { if (signal) { initAudio(); playMotif(signal); } });
  window.addEventListener('resize', resize);

  /* ---------- Boot ---------- */
  try { played = best > 0 || localStorage.getItem('atumaa.played') === '1'; } catch (e) { played = best > 0; }
  if (best > 0) ui.bestTitle.textContent = 'Best ' + best.toLocaleString();
  // opened from a friend's link: their signal is waiting on the title screen
  signal = signalFromUrl();
  if (signal) {
    ui.glyphTitle.hidden = false;
    drawGlyph(ui.glyphTitle, signal);
    ui.premise.textContent = signal.theirs ? 'A friend answered ' + signal.theirs.r + ' of ' + TX_N + '. Same signals, same timing. Your turn.'
      : (signal.daily ? dayLabel(signal.daily) : 'A transmission') + ' is waiting: ' + TX_N + ' signals, the same for everyone. Answer it.';
    ui.start.textContent = 'Answer it';
  }
  resize();
  setMode('title');
  requestAnimationFrame(frame);
})();
