/* Atumaa — The Seventh Seat. One-thumb reel gestures, plain canvas, no dependencies. */
(() => {
  'use strict';

  // Each signal is answered with one of the gestures people already use on short-video feeds.
  const ELEMENTS = [
    { name: 'Pulse', rgb: '125,220,132', note: 392.0, gesture: 'up' },
    { name: 'Draw', rgb: '95,201,243', note: 440.0, gesture: 'down' },
    { name: 'Flare', rgb: '255,200,87', note: 523.25, gesture: 'like' },
    { name: 'Lock', rgb: '185,160,255', note: 587.33, gesture: 'hold' },
  ];

  // The seven seats. Story text lives here so it can be swapped for the film's own names.
  // Each seat adds one complication on top of everything before it.
  const WORLDS = [
    { name: 'Launch Ring', adds: 'Pulse and Draw: swipe up, swipe down', bg: '#05070d', glow: '40,58,96', speck: '190,210,255', side: [18, 24, 40], shape: 'girders', accent: '150,190,255' },
    { name: 'Ice Moon', adds: 'Flare: double-tap', bg: '#050b10', glow: '50,92,112', speck: '200,240,255', side: [20, 44, 58], shape: 'shards', accent: '150,230,255' },
    { name: 'Dust Belt', adds: 'The Void: never touch it', bg: '#0d0805', glow: '104,66,34', speck: '255,214,160', side: [44, 26, 12], shape: 'dunes', accent: '255,180,110' },
    { name: 'Drowned Station', adds: 'Lock: press and hold', bg: '#030c0c', glow: '26,88,84', speck: '160,255,235', side: [8, 40, 40], shape: 'kelp', accent: '110,240,215' },
    { name: 'Green Vault', adds: 'Bound signals: answer each in turn', bg: '#060d09', glow: '34,66,46', speck: '170,235,170', side: [6, 22, 14], shape: 'pines', accent: '150,235,150' },
    { name: 'Mirror Reach', adds: 'Mirrored signals: swipe the opposite way', bg: '#0c0510', glow: '86,40,104', speck: '250,190,255', side: [40, 14, 52], shape: 'crystals', accent: '240,150,255' },
    { name: 'The Seventh Seat', adds: 'Cloaked signals: revealed at the last moment', bg: '#090705', glow: '104,84,34', speck: '255,236,170', side: [26, 20, 8], shape: 'pillars', accent: '255,220,130' },
  ];
  const INTRO = [
    { el: 0, dur: 2.1, touch: 'Swipe up', desk: 'Swipe up  ·  ↑' },
    { el: 1, dur: 2.1, touch: 'Swipe down', desk: 'Swipe down  ·  ↓' },
    { el: 2, dur: 2.1, touch: 'Double-tap', desk: 'Double-tap  ·  Space' },
    { el: 3, dur: 2.1, touch: 'Press and hold', desk: 'Hold  ·  Shift' },
    { el: -1, dur: 1.6, touch: 'Never touch the Void', desk: 'Never touch the Void' },
  ];
  const INTRO_TOTAL = INTRO.reduce((s, b) => s + b.dur, 0); // 10 seconds

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const TAU = Math.PI * 2;
  const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';
  const SWIPE_PX = 34, TAP_PX = 12, TAP_MS = 300, DOUBLE_MS = 340, HOLD_S = 0.38;
  const TOUCH = window.matchMedia && window.matchMedia('(hover: none)').matches;

  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const ui = {
    hud: $('hud'), grove: $('grove'), pips: $('pips'), light: $('light'), score: $('score'),
    hint: $('hint'), banner: $('banner'), skip: $('btn-skip'),
    title: $('screen-title'), pause: $('screen-pause'), over: $('screen-over'),
    finalScore: $('final-score'), finalDetail: $('final-detail'),
    bestTitle: $('best-title'), bestOver: $('best-over'),
    sound: $('btn-sound'),
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const seatOf = (lv) => Math.min(lv, 7);
  const world = () => WORLDS[seatOf(level) - 1];

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

  function buildBackdrop() {
    const w = world();
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
      const k = rand(0.55, 1.25);
      const col = `rgba(${(w.side[0] * k) | 0},${(w.side[1] * k) | 0},${(w.side[2] * k) | 0},0.94)`;
      wrapped(y, s * 2.2, (yy) => sideShape(f, w.shape, x, yy, s, col));
    }
  }

  /* ---------- Audio ---------- */
  let ac = null, muted = false;
  function initAudio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { try { ac = new AC(); } catch (e) { ac = null; } }
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
  const sfx = {
    hit: (el, step) => {
      const f = ELEMENTS[el].note * (1 + Math.min(step, 12) * 0.03);
      if (el === 0) tone(f, 0.16, 'triangle', 0.09, 0, f * 1.6);
      else if (el === 1) tone(f, 0.2, 'sine', 0.1, 0, f * 0.6);
      else if (el === 2) { tone(f, 0.12, 'triangle', 0.08); tone(f * 1.5, 0.22, 'triangle', 0.08, 0.07); }
      else tone(f * 0.5, 0.45, 'sine', 0.11);
    },
    swish: (up) => tone(up ? 220 : 330, 0.09, 'sine', 0.025, 0, up ? 420 : 170),
    wrong: () => tone(140, 0.16, 'square', 0.04),
    leak: () => { tone(120, 0.4, 'sawtooth', 0.09, 0, 50); tone(90, 0.3, 'square', 0.04, 0.03, 45); },
    pass: () => tone(660, 0.25, 'sine', 0.05, 0, 880),
    dawn: () => [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.8, 'sine', 0.07, i * 0.11)),
    over: () => [392, 329.63, 261.63, 196].forEach((f, i) => tone(f, 0.7, 'triangle', 0.08, i * 0.22)),
  };

  /* ---------- State ---------- */
  let mode = 'title'; // title | intro | play | pause | interlude | over
  let time = 0, level = 1, score = 0, light = 1, introT = 0, bannerT = 0;
  let combo = 0, bestCombo = 0, cleared = 0, goal = 13, totalCleared = 0, spawned = 0;
  let spawnTimer = 0, interlude = 0, shake = 0, lastVoid = false;
  let scrollY = 0, scrollKick = 0, jolt = 0, heartPulse = 0;
  let best = 0;
  try { best = parseInt(localStorage.getItem('atumaa.best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }

  let targets = [];   // {shade,seq,done,mirror,cloak,y,ph,wob}; they fall toward the seat, lowest one is the front
  let ghosts = [];    // answered signals flying off: {el,x,y,vx,vy,life,max,r}
  let particles = []; // {x,y,vx,vy,life,max,rgb,size}
  let rings = [];     // {x,y,r,max,life,rgb}
  let texts = [];     // {x,y,text,life,rgb,size}
  const learned = { 0: 0, 1: 0, 2: 0, 3: 0, void: 0, mirror: 0, cloak: 0, bound: 0 };

  // input
  let ptr = null;     // {id,x0,y0,t0,done}
  let dragY = 0, holding = false, holdT = 0, lastTap = 0, keyHold = false;
  let lastWheelT = 0, lastWheelMag = 0;

  function fallSpeed() { return Math.min(0.62, 0.25 * (1 + 0.085 * (level - 1))) * H; }
  function spawnGap() { return Math.max(0.44, 1.18 - 0.075 * level) * rand(0.82, 1.2); }
  function multiplier() { return Math.min(6, 1 + Math.floor(combo / 8)); }
  function targetX(t) { return field.cx + Math.sin(t.ph + t.y * 0.008) * field.path * 0.42; }
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
    return 'Seat ' + ROMAN[s - 1] + (level > 7 ? ' · Cycle ' + (level - 6) : '');
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
    goal = 10 + 3 * level;
    spawnTimer = 1.2;
    ui.grove.textContent = seatLabel();
    buildBackdrop();
    showBanner(seatLabel() + '<small>' + world().name + (level <= 7 ? ' · ' + world().adds : ' · faster') + '</small>', 2.4);
  }

  function resetRun() {
    score = 0; light = 1; combo = 0; bestCombo = 0; totalCleared = 0; spawned = 0; level = 1;
    targets = []; ghosts = []; particles = []; rings = []; texts = [];
    for (const k in learned) learned[k] = 0;
    lastVoid = false;
    ptr = null; dragY = 0; holding = false; keyHold = false;
  }

  function startIntro() {
    initAudio();
    resetRun();
    buildBackdrop();
    introT = 0;
    setMode('intro');
  }

  function startGame() {
    initAudio();
    resetRun();
    setMode('play');
    setupLevel(1);
  }

  function setMode(m) {
    mode = m;
    const playing = m === 'play' || m === 'interlude';
    ui.title.hidden = m !== 'title';
    ui.pause.hidden = m !== 'pause';
    ui.over.hidden = m !== 'over';
    ui.hud.hidden = m === 'title' || m === 'intro';
    ui.skip.hidden = m !== 'intro';
    if (!playing) ui.hint.hidden = true;
    if (m === 'intro' || m === 'over') { ui.banner.hidden = true; bannerT = 0; }
  }

  /* ---------- Spawning ---------- */
  function spawnTarget() {
    spawned++;
    const t = { shade: false, seq: [], done: 0, mirror: false, cloak: false, y: field.top - 40 * U, ph: rand(0, TAU), wob: 0 };
    const signs = level >= 4 ? 4 : level >= 2 ? 3 : spawned > 4 ? 2 : 1;
    if (level >= 3 && !lastVoid && Math.random() < Math.min(0.24, 0.12 + 0.02 * level)) {
      t.shade = true;
    } else {
      let len = 1;
      if (level >= 5 && Math.random() < Math.min(0.5, 0.25 + 0.05 * (level - 5))) len = level >= 7 && Math.random() < 0.4 ? 3 : 2;
      for (let i = 0; i < len; i++) t.seq.push((Math.random() * signs) | 0);
      // meet each new thing early in the seat that introduces it
      const first = cleared + targets.length === 0;
      if (first && level === 2) { t.seq = [2]; len = 1; }
      if (first && level === 4) { t.seq = [3]; len = 1; }
      if (first && level === 5) { t.seq = [0, 1]; len = 2; }
      if (len === 1 && t.seq[0] < 2 && level >= 6 && (first && level === 6 || Math.random() < Math.min(0.45, 0.28 + 0.03 * (level - 6)))) t.mirror = true;
      if (level >= 7 && !t.mirror && (first && level === 7 || Math.random() < Math.min(0.5, 0.3 + 0.04 * (level - 7)))) t.cloak = true;
    }
    if (level === 3 && cleared + targets.length === 1) { t.shade = true; t.seq = []; t.mirror = t.cloak = false; }
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
    if (g === 'up') { scrollKick = 1500 * U; jolt = -22 * U; sfx.swish(true); }
    else if (g === 'down') { scrollKick = -1100 * U; jolt = 22 * U; sfx.swish(false); }
    const t = front();
    if (!t) return;
    if (t.shade) {
      if (g === 'hold') return;
      t.wob = 0.35;
      penalty(0.12, 'It feeds on your touch', targetX(t), t.y);
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
    const pts = Math.round((10 + 20 * near) * multiplier() * (t.mirror || t.cloak ? 1.5 : 1));
    score += pts;
    light = Math.min(1, light + (el === 1 ? 0.03 : 0.012));
    learned[el]++;
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
    texts.push({ x: x + 46 * U, y: y - 8 * U, text: '+' + pts, life: 0.9, rgb: '255,243,196', size: 18 });
    if (combo % 8 === 0) texts.push({ x: field.cx, y: H * 0.42, text: 'Streak ' + combo + '  ×' + multiplier(), life: 1.3, rgb, size: 26 });
    t.done++;
    t.cloak = false;
    if (t.done >= t.seq.length) {
      targets.splice(targets.indexOf(t), 1);
      clearedOne();
    }
  }

  function clearedOne() {
    cleared++;
    totalCleared++;
    if (cleared >= goal) startInterlude();
  }

  function penalty(amount, label, x, y) {
    light -= amount;
    combo = 0;
    shake = 0.2;
    texts.push({ x, y: y - 44 * U, text: label, life: 1, rgb: '255,150,140', size: 17 });
    sfx.wrong();
  }

  function startInterlude() {
    mode = 'interlude';
    interlude = 2.3;
    const bonus = 200 * level;
    light = Math.min(1, light + 0.25);
    score += bonus;
    for (const t of targets) burst(targetX(t), t.y, t.shade ? '150,110,210' : ELEMENTS[t.seq[t.done]].rgb, 16, 220);
    targets = [];
    rings.push({ x: field.cx, y: field.heartY, r: 20, max: Math.max(W, H) * 1.1, life: 1.6, rgb: world().accent });
    scrollKick = 2600 * U;
    showBanner(level === 7 ? 'The Seventh Seat is yours<small>All seven hold · +' + bonus + ' · the dark keeps coming</small>'
      : seatLabel() + ' holds<small>' + world().name + ' secured · +' + bonus + '</small>', 2.3);
    ui.hint.hidden = true;
    sfx.dawn();
  }

  function gameOver() {
    setMode('over');
    const isBest = score > best;
    if (isBest) {
      best = score;
      try { localStorage.setItem('atumaa.best', String(best)); } catch (e) { /* storage blocked */ }
    }
    ui.finalScore.textContent = score.toLocaleString();
    ui.finalDetail.textContent = 'Reached ' + seatLabel() + ', ' + world().name + ' · ' + totalCleared + ' answered · best streak ' + bestCombo;
    ui.bestOver.textContent = isBest && score > 0 ? 'New best!' : 'Best ' + best.toLocaleString();
    sfx.over();
  }

  /* ---------- Update ---------- */
  function update(dt) {
    time += dt;
    const playing = mode === 'play';
    const speed = fallSpeed();

    // press-and-hold fills a ring, then fires
    if (holding && playing) {
      holdT += dt / HOLD_S;
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
        if (t.shade) {
          // resisting the urge to touch is the right answer
          combo++;
          bestCombo = Math.max(bestCombo, combo);
          learned.void++;
          const pts = 25 * multiplier();
          score += pts;
          burst(field.cx, field.heartY, '150,110,210', 16, 200);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Let go  +' + pts, life: 1, rgb: '200,180,255', size: 18 });
          sfx.pass();
        } else {
          light -= 0.2;
          combo = 0;
          shake = 0.35;
          heartPulse = 1;
          burst(field.cx, field.heartY, '255,120,110', 24, 260);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Breach', life: 1, rgb: '255,150,140', size: 18 });
          sfx.leak();
        }
        clearedOne();
        if (mode !== 'play') break;
      }
    }

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
    ? ['Pulse: swipe up', 'Draw: swipe down', 'Flare: double-tap', 'Lock: press and hold']
    : ['Pulse: swipe up, scroll, or press ↑', 'Draw: swipe down, scroll back, or press ↓', 'Flare: double-click or press Space', 'Lock: hold the mouse button or Shift'];
  let lastHint = '', lastPips = '';
  function updateHud() {
    ui.score.textContent = score.toLocaleString();
    ui.light.style.width = (light * 100).toFixed(1) + '%';
    ui.light.classList.toggle('low', light < 0.25 && mode === 'play');
    const pips = cleared + ' / ' + goal;
    if (pips !== lastPips) { lastPips = pips; ui.pips.textContent = pips; }
    let hint = '';
    if (mode === 'play') {
      const t = front();
      if (t) {
        if (t.shade) { if (learned.void < 2) hint = 'The Void. Do not touch. Let it scroll past'; }
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
    const drag = isFront && !t.shade ? clamp(dragY, -SWIPE_PX, SWIPE_PX) * 0.7 : 0;
    const x = targetX(t) + wob, y = t.y + jolt + drag;
    const r = 27 * U;
    ctx.globalAlpha = fadeIn;
    if (t.shade) {
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
        drawCue(el, x, y, r, isFront, holdT);
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
    glow(hx, hy, 70 * U * pulse, acc, 0.5);
    ctx.strokeStyle = `rgba(${acc},0.4)`;
    ctx.lineWidth = 1.5 * U;
    ctx.beginPath();
    ctx.ellipse(hx, hy + 6 * U, field.path * 0.8, 14 * U, 0, 0, TAU);
    ctx.stroke();
    // seven marks around the core, lit for each seat reached
    const lit = seatOf(level);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i / 7) * TAU + time * 0.25;
      ctx.fillStyle = i < lit ? `rgba(${acc},0.95)` : 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * 24 * U * pulse, hy + Math.sin(a) * 24 * U * pulse, 2.6 * U, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#fffbe6';
    ctx.beginPath();
    ctx.arc(hx, hy, 12 * U * pulse, 0, TAU);
    ctx.fill();
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
    ctx.font = `${Math.round(12.5 * U)}px ${FONT}`;
    ctx.fillText('SEVEN SEATS HOLD BACK THE DARK.', cx, field.top - 14 * U);
    ctx.fillText('SIX HAVE FALLEN SILENT. TAKE THEM BACK.', cx, field.top + 6 * U);
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
    if (mode === 'title') return;

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
    if (seatOf(level) === 7 && mode === 'play') {
      ctx.strokeStyle = 'rgba(255,220,130,0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2 * U, 10 * U]);
      ctx.beginPath();
      ctx.moveTo(hx - field.path, revealY());
      ctx.lineTo(hx + field.path, revealY());
      ctx.stroke();
      ctx.setLineDash([]);
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
    for (const t of order) drawTarget(t, t === f);

    for (const g of ghosts) drawOrb(g.el, g.x, g.y, g.r, clamp(g.life / g.max + 0.3, 0, 1));

    for (const p of particles) {
      ctx.fillStyle = `rgba(${p.rgb},${p.life / p.max})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }

    // the dark closes in as power fades
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
    if (mode === 'play' || mode === 'interlude') update(dt);
    else if (mode === 'intro') {
      time += dt;
      introT += dt;
      scrollY += H * 0.14 * dt;
      if (introT >= INTRO_TOTAL) startGame();
    } else if (mode === 'title' || mode === 'over') { time += dt; scrollY += H * 0.06 * dt; }
    if (bannerT > 0 && mode !== 'pause') {
      bannerT -= dt;
      if (bannerT <= 0) ui.banner.hidden = true;
    }
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
    ui.sound.classList.toggle('off', muted);
  }
  function endHold() { holding = false; holdT = 0; }

  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    if (ptr || e.button > 0) return;
    ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), done: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
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
    if (Math.abs(dy) >= SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
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
      if (now - lastTap < DOUBLE_MS) { lastTap = 0; gesture('like'); }
      else lastTap = now;
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
    if (e.repeat) { if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); return; }
    const k = e.key;
    if (mode === 'title') { if (k === ' ' || k === 'Enter') { e.preventDefault(); startIntro(); } return; }
    if (mode === 'over') { if (k === ' ' || k === 'Enter') { e.preventDefault(); startGame(); } return; }
    if (mode === 'intro') { if (k === ' ' || k === 'Enter' || k === 'Escape') { e.preventDefault(); startGame(); } return; }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); gesture('up'); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); gesture('down'); }
    else if (k === ' ') { e.preventDefault(); if (mode === 'pause') togglePause(); else gesture('like'); }
    else if (k === 'Shift') { keyHold = true; holding = true; holdT = 0; }
    else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
    else if (k === 'm' || k === 'M') toggleSound();
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Shift') { keyHold = false; endHold(); } });
  window.addEventListener('blur', () => { keyHold = false; endHold(); if (mode === 'play') setMode('pause'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setMode('pause'); });

  $('btn-start').addEventListener('click', startIntro);
  $('btn-again').addEventListener('click', startGame);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause').addEventListener('click', togglePause);
  ui.skip.addEventListener('click', startGame);
  ui.sound.addEventListener('click', toggleSound);
  window.addEventListener('resize', resize);

  /* ---------- Boot ---------- */
  if (best > 0) ui.bestTitle.textContent = 'Best ' + best.toLocaleString();
  resize();
  setMode('title');
  requestAnimationFrame(frame);
})();
