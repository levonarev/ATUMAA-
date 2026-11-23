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
  const WORLDS = [
    { name: 'The Listening Room', adds: 'Pulse and Echo: swipe up, swipe down', bg: '#040a0c', glow: '18,70,72', speck: '255,190,120', side: [10, 34, 38], shape: 'girders', accent: '90,235,190' },
    { name: 'Launch', adds: 'Flare: double-tap', bg: '#120b08', glow: '120,70,48', speck: '255,220,190', side: [50, 28, 20], shape: 'pillars', accent: '255,190,140' },
    { name: 'The Crossing', adds: 'Gaps of missing time: never touch them', bg: '#030408', glow: '30,36,60', speck: '220,225,255', side: [26, 28, 36], shape: 'crystals', accent: '200,210,255' },
    { name: '1998 KY26', adds: 'Lock: press and hold', bg: '#070605', glow: '92,66,26', speck: '255,215,150', side: [36, 32, 28], shape: 'shards', accent: '255,196,110' },
    { name: 'The Corridor', adds: 'Bound signals: answer each in turn', bg: '#04070a', glow: '30,70,90', speck: '255,200,140', side: [86, 62, 40], shape: 'screens', accent: '255,190,120' },
    { name: 'Twin Suns', adds: 'Mirrored signals: swipe the opposite way', bg: '#0a0612', glow: '110,60,150', speck: '255,180,230', side: [44, 22, 60], shape: 'dunes', accent: '255,140,170' },
    { name: 'The Seventh Seat', adds: 'Cloaked signals: revealed at the last moment', bg: '#050505', glow: '70,60,40', speck: '255,220,150', side: [24, 24, 26], shape: 'pillars', accent: '255,214,130' },
  ];
  const INTRO = [
    { el: 0, dur: 2.1, touch: 'Swipe up', desk: 'Swipe up  ·  ↑' },
    { el: 1, dur: 2.1, touch: 'Swipe down', desk: 'Swipe down  ·  ↓' },
    { el: 2, dur: 2.1, touch: 'Double-tap', desk: 'Double-tap  ·  Space' },
    { el: 3, dur: 2.1, touch: 'Press and hold', desk: 'Hold  ·  Shift' },
    { el: -1, dur: 1.6, touch: 'Never touch a Gap', desk: 'Never touch a Gap' },
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
    clock: $('clock'), hint: $('hint'), banner: $('banner'), skip: $('btn-skip'),
    title: $('screen-title'), pause: $('screen-pause'), over: $('screen-over'),
    finalScore: $('final-score'), finalStats: $('final-stats'), haptic: $('btn-haptic'), finalDetail: $('final-detail'),
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
    if (!hapticsOn) return;
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
  const HAPTIC = {
    touch: 3, tap: 5, swipe: 7,
    up: 12, down: [6, 18, 10], like: [8, 28, 8], hold: 22,
    wrong: [24, 45, 24], lostTime: [30, 40, 30, 40, 30], missed: [45, 40, 80],
    letGo: 6, streak: [6, 30, 6, 30, 6], seat: [10, 55, 10, 55, 28], over: [70, 70, 150], tally: 3,
  };

  const sfx = {
    tap: () => tone(880, 0.035, 'sine', 0.03),
    tally: (k) => tone(900 + k * 500, 0.03, 'square', 0.018),
    perfect: () => [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, 0.35, 'sine', 0.06, 0.75 + i * 0.07)),
    best: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.07, i * 0.09)),
    hit: (el, step) => {
      noise(0.05, 0.1, el === 3 ? 500 : 1900, 0, 1.2);
      const f = ELEMENTS[el].note * (1 + Math.min(step, 12) * 0.03);
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
    over: () => [392, 329.63, 261.63, 196].forEach((f, i) => tone(f, 0.7, 'triangle', 0.08, i * 0.22)),
  };

  /* ---------- State ---------- */
  let mode = 'title'; // title | intro | play | pause | interlude | over
  let time = 0, level = 1, score = 0, light = 1, introT = 0, bannerT = 0;
  let combo = 0, bestCombo = 0, cleared = 0, goal = 13, totalCleared = 0, spawned = 0;
  let spawnTimer = 0, interlude = 0, shake = 0, lastVoid = false;
  let scrollY = 0, scrollKick = 0, jolt = 0, heartPulse = 0;
  const seatStats = { hit: 0, wrong: 0, missed: 0 }, runStats = { hit: 0, wrong: 0, missed: 0 };
  let overT = 0, overTick = 0, overBest = false;
  const tallyUp = (k) => { seatStats[k]++; runStats[k]++; };
  const accuracy = (st) => { const n = st.hit + st.wrong + st.missed; return n ? Math.round((st.hit / n) * 100) : 100; };
  let best = 0;
  try { best = parseInt(localStorage.getItem('atumaa.best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }

  // interval act: a Memory signal opens a wall of six screens; pick one, then all are revealed
  const PRIZES = {
    skip: { label: 'Skip to next seat', rgb: '230,196,106' },
    time: { label: 'Time restored', rgb: '95,201,243' },
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
    seatStats.hit = seatStats.wrong = seatStats.missed = 0;
    bonusDone = false;
    bonusAt = Math.floor((10 + 3 * n) * rand(0.35, 0.65));
    goal = 10 + 3 * level;
    spawnTimer = 1.2;
    ui.grove.textContent = seatLabel();
    buildBackdrop();
    showBanner(world().name + '<small>' + seatLabel() + (level <= 7 ? ' · ' + world().adds : ' · faster') + '</small>', 2.4);
  }

  function resetRun() {
    score = 0; light = 1; combo = 0; bestCombo = 0; totalCleared = 0; spawned = 0; level = 1;
    targets = []; ghosts = []; particles = []; rings = []; texts = [];
    for (const k in learned) learned[k] = 0;
    runStats.hit = runStats.wrong = runStats.missed = 0;
    bonus = null; act = null; shield = 0; memories = 0;
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
    const t = { shade: false, bonus: false, seq: [], done: 0, mirror: false, cloak: false, y: field.top - 40 * U, ph: rand(0, TAU), wob: 0 };
    if (!bonusDone && cleared + targets.length >= bonusAt) {
      bonusDone = true;
      t.bonus = true;
      t.act = ACTS[(level - 1) % ACTS.length];
      lastVoid = false;
      targets.push(t);
      return;
    }
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
    if (!t) { buzz(HAPTIC.swipe); return; }
    if (t.bonus) { if (t.act === 'memory') openBonus(t); else startAct(t, t.act); return; }
    if (t.shade) {
      if (g === 'hold') return;
      t.wob = 0.35;
      penalty(0.12, 'You lost time', targetX(t), t.y, HAPTIC.lostTime);
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
      if (prize === 'skip') { cleared = goal; startInterlude(); }
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
      act = { type, t: 0, spacing, speed: spacing / period, odd: 2 + ((Math.random() * 5) | 0), n: 9, blip: -1, end: -1, subtle: level >= 4 };
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
        finishAct(exact ? 'Exact' : 'Found it', '+' + pts + ' · time back' + (exact ? ' · shield' : ''), true);
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
        if (hits >= 5) { light = 1; sub += ' · time restored'; }
        if (perfect === 6) { shield++; sub += ' · shield'; }
        finishAct(hits + ' of 6 in time', sub, hits >= 3);
      }
    } else {
      const crossed = Math.floor((field.cx - beatX(0)) / a.spacing);
      if (crossed > a.blip && crossed >= 0 && crossed < a.n) {
        a.blip = crossed;
        tone(880, 0.06, 'sine', 0.06);
        buzz(HAPTIC.touch);
      }
      if (beatX(a.odd) < field.cx - a.spacing * 0.5) finishAct('It slipped past', 'No prize', false);
    }
  }

  function clearedOne() {
    cleared++;
    totalCleared++;
    if (cleared >= goal) startInterlude();
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
    for (const t of targets) burst(targetX(t), t.y, t.shade ? '150,110,210' : ELEMENTS[t.seq[t.done]].rgb, 16, 220);
    targets = [];
    rings.push({ x: field.cx, y: field.heartY, r: 20, max: Math.max(W, H) * 1.1, life: 1.6, rgb: world().accent });
    scrollKick = 2600 * U;
    showBanner(level === 7 ? 'The seventh seat is taken<small>It was looking for you · ' + acc + '% clean · +' + bonus + '</small>'
      : world().name + '<small>' + seatLabel() + ' answered · ' + (perfect ? 'perfect signal' : acc + '% clean · ' + seatStats.missed + ' missed') + ' · +' + bonus + '</small>', 3);
    buzz(HAPTIC.seat);
    if (perfect) sfx.perfect();
    for (let i = 0; i < 6; i++) setTimeout(() => { if (mode === 'interlude') sfx.tally(i / 6); }, 900 + i * 70);
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
    overT = 0; overTick = 0; overBest = isBest && score > 0;
    ui.finalScore.textContent = '0';
    ui.finalDetail.textContent = 'Reached ' + seatLabel() + ' · ' + world().name;
    const rows = [['Answered', runStats.hit], ['Missed', runStats.missed], ['Wrong moves', runStats.wrong], ['Clean', accuracy(runStats) + '%'], ['Best streak', bestCombo], ['Interval acts', memories]];
    ui.finalStats.innerHTML = rows.map((r) => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
    ui.bestOver.textContent = overBest ? 'New best!' : 'Best ' + best.toLocaleString();
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
        if (t.bonus) {
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'It faded', life: 1, rgb: '200,190,160', size: 16 });
          continue;
        }
        if (t.shade) {
          // resisting the urge to touch is the right answer
          combo++;
          bestCombo = Math.max(bestCombo, combo);
          learned.void++;
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
          light -= 0.2;
          combo = 0;
          tallyUp('missed');
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
    const pips = cleared + ' / ' + goal;
    if (pips !== lastPips) { lastPips = pips; ui.pips.textContent = pips; }
    let hint = '';
    if (mode === 'play') {
      const t = front();
      if (t) {
        if (t.bonus) hint = (t.act === 'metro' ? 'The metronome' : t.act === 'heart' ? 'A heartbeat' : 'A Memory') + '. Any move opens it';
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
    const drag = isFront && !t.shade ? clamp(dragY, -SWIPE_PX, SWIPE_PX) * 0.7 : 0;
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
        const words = tile.prize === 'score' ? '+' + 500 * level : tile.prize === 'shield' ? 'Shield' : tile.prize === 'skip' ? 'Skip seat' : tile.prize === 'time' ? 'Full time' : 'Nothing';
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
    if (mode === 'play' || mode === 'interlude') update(dt);
    else if (mode === 'bonus') updateBonus(dt);
    else if (mode === 'act') updateAct(dt);
    else if (mode === 'intro') {
      time += dt;
      introT += dt;
      scrollY += H * 0.14 * dt;
      if (introT >= INTRO_TOTAL) startGame();
    } else if (mode === 'title' || mode === 'over') { time += dt; scrollY += H * 0.06 * dt; }
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
  function toggleHaptics() {
    hapticsOn = !hapticsOn;
    ui.haptic.classList.toggle('off', !hapticsOn);
    try { localStorage.setItem('atumaa.haptics', hapticsOn ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    buzz(HAPTIC.like);
  }

  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    initHaptics();
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
      if (now - lastTap < DOUBLE_MS) { lastTap = 0; if (mode === 'play' && !front()) buzz(HAPTIC.tap); gesture('like'); }
      else { lastTap = now; sfx.tap(); buzz(HAPTIC.tap); }
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
    if (mode === 'bonus') { if (k >= '1' && k <= '6') pickBonus(+k - 1); return; }
    if (mode === 'act') { if (k === ' ' || k === 'Enter' || k.startsWith('Arrow')) { e.preventDefault(); actTap(); } return; }
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

  $('btn-start').addEventListener('click', startIntro);
  $('btn-again').addEventListener('click', startGame);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause').addEventListener('click', togglePause);
  ui.skip.addEventListener('click', startGame);
  ui.sound.addEventListener('click', toggleSound);
  ui.haptic.addEventListener('click', () => { initHaptics(); toggleHaptics(); });
  ui.haptic.classList.toggle('off', !hapticsOn);
  for (const id of ['btn-start', 'btn-again', 'btn-resume', 'btn-skip']) $(id).addEventListener('pointerdown', () => { initHaptics(); buzz(HAPTIC.tap); });
  window.addEventListener('resize', resize);

  /* ---------- Boot ---------- */
  if (best > 0) ui.bestTitle.textContent = 'Best ' + best.toLocaleString();
  resize();
  setMode('title');
  requestAnimationFrame(frame);
})();
