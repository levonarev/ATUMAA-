/* Atumaa — Scroll the Grove. One-thumb reel gestures, plain canvas, no dependencies. */
(() => {
  'use strict';

  // Each sign is answered with one of the gestures people already use on short-video feeds.
  const ELEMENTS = [
    { name: 'Leaf', rgb: '125,220,132', note: 392.0, gesture: 'up' },
    { name: 'Water', rgb: '95,201,243', note: 440.0, gesture: 'down' },
    { name: 'Sun', rgb: '255,200,87', note: 523.25, gesture: 'like' },
    { name: 'Moon', rgb: '185,160,255', note: 587.33, gesture: 'hold' },
  ];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const TAU = Math.PI * 2;
  const SWIPE_PX = 34, TAP_PX = 12, TAP_MS = 300, DOUBLE_MS = 340, HOLD_S = 0.38;
  const TOUCH = window.matchMedia && window.matchMedia('(hover: none)').matches;

  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const ui = {
    hud: $('hud'), grove: $('grove'), pips: $('pips'), light: $('light'), score: $('score'),
    hint: $('hint'), banner: $('banner'),
    title: $('screen-title'), pause: $('screen-pause'), over: $('screen-over'),
    finalScore: $('final-score'), finalDetail: $('final-detail'),
    bestTitle: $('best-title'), bestOver: $('best-over'),
    sound: $('btn-sound'),
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const roman = (n) => ROMAN[n - 1] || String(n);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, U = 1, DPR = 1;
  const field = { cx: 0, top: 64, heartY: 0, path: 0 };
  let ground = null, forest = null;

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

  function buildBackdrop() {
    // fixed ground with a lit path up the middle
    ground = document.createElement('canvas');
    ground.width = canvas.width;
    ground.height = canvas.height;
    const b = ground.getContext('2d');
    b.scale(DPR, DPR);
    b.fillStyle = '#060d09';
    b.fillRect(0, 0, W, H);
    const g = b.createLinearGradient(field.cx - field.path * 1.9, 0, field.cx + field.path * 1.9, 0);
    g.addColorStop(0, 'rgba(16,36,26,0)');
    g.addColorStop(0.5, 'rgba(34,66,46,0.95)');
    g.addColorStop(1, 'rgba(16,36,26,0)');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);

    // one screen-tall forest tile that wraps vertically, so it can scroll forever
    forest = document.createElement('canvas');
    forest.width = canvas.width;
    forest.height = canvas.height;
    const f = forest.getContext('2d');
    f.scale(DPR, DPR);
    const wrapped = (y, pad, fn) => { for (const o of [-H, 0, H]) if (y + o > -pad && y + o < H + pad) fn(y + o); };

    for (let i = 0; i < Math.round((W * H) / 3200); i++) {
      const x = rand(0, W), y = rand(0, H), r = rand(0.6, 2.1) * U;
      f.fillStyle = `rgba(${Math.random() < 0.5 ? '125,220,132' : '200,230,170'},${rand(0.04, 0.13)})`;
      wrapped(y, 4, (yy) => { f.beginPath(); f.arc(x, yy, r, 0, TAU); f.fill(); });
    }
    // rune arcs across the path, like rungs you scroll past
    f.strokeStyle = 'rgba(190,230,190,0.09)';
    f.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const y = (i + 0.5) * (H / 4);
      wrapped(y, 40, (yy) => {
        f.beginPath();
        f.ellipse(field.cx, yy, field.path * 0.9, 16 * U, 0, Math.PI, TAU);
        f.stroke();
      });
    }
    // trees on both banks
    const sideW = Math.max(30, field.cx - field.path);
    const trees = Math.round((sideW * 2 * H) / 5200) + 10;
    for (let i = 0; i < trees; i++) {
      const side = i % 2 ? 1 : -1;
      const x = field.cx + side * (field.path + rand(0.05, 1) * sideW);
      const y = rand(0, H);
      const s = rand(26, 56) * U;
      const col = `rgba(${rand(3, 9) | 0},${rand(15, 28) | 0},${rand(10, 19) | 0},0.94)`;
      wrapped(y, s * 2, (yy) => {
        f.fillStyle = col;
        for (let k = 0; k < 3; k++) {
          const ww = s * (0.75 - k * 0.17), top = yy - s * (0.55 + k * 0.42);
          f.beginPath();
          f.moveTo(x - ww, top + s * 0.62);
          f.lineTo(x, top);
          f.lineTo(x + ww, top + s * 0.62);
          f.closePath();
          f.fill();
        }
      });
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
  let mode = 'title'; // title | play | pause | interlude | over
  let time = 0, level = 1, score = 0, light = 1;
  let combo = 0, bestCombo = 0, cleared = 0, goal = 14, totalCleared = 0, spawned = 0;
  let spawnTimer = 0, interlude = 0, shake = 0, lastShade = false;
  let scrollY = 0, scrollKick = 0, jolt = 0, heartPulse = 0;
  let best = 0;
  try { best = parseInt(localStorage.getItem('atumaa.best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }

  let targets = [];   // {shade,seq,done,y,ph,wob}; they fall toward the heart, lowest one is the front
  let ghosts = [];    // answered signs flying off: {el,x,y,vx,vy,life,max,r}
  let particles = []; // {x,y,vx,vy,life,max,rgb,size}
  let rings = [];     // {x,y,r,max,life,rgb}
  let texts = [];     // {x,y,text,life,rgb,size}
  let fireflies = [];
  const learned = [0, 0, 0, 0];
  let shadeLearned = 0;

  // input
  let ptr = null;     // {id,x0,y0,t0,done}
  let dragY = 0, holding = false, holdT = 0, lastTap = 0, keyHold = false;
  let lastWheelT = 0, lastWheelMag = 0;

  function fallSpeed() { return Math.min(0.62, 0.25 * (1 + 0.085 * (level - 1))) * H; }
  function spawnGap() { return Math.max(0.44, 1.18 - 0.075 * level) * rand(0.82, 1.2); }
  function multiplier() { return Math.min(6, 1 + Math.floor(combo / 8)); }
  function targetX(t) { return field.cx + Math.sin(t.ph + t.y * 0.008) * field.path * 0.42; }

  function setupLevel(n) {
    level = n;
    cleared = 0;
    goal = 10 + 4 * level;
    spawnTimer = 0.5;
    ui.grove.textContent = 'Grove ' + roman(level);
  }

  function startGame() {
    initAudio();
    score = 0; light = 1; combo = 0; bestCombo = 0; totalCleared = 0; spawned = 0;
    targets = []; ghosts = []; particles = []; rings = []; texts = [];
    learned.fill(0); shadeLearned = 0; lastShade = false;
    ptr = null; dragY = 0; holding = false; keyHold = false;
    setupLevel(1);
    setMode('play');
  }

  function setMode(m) {
    mode = m;
    const playing = m === 'play' || m === 'interlude';
    ui.title.hidden = m !== 'title';
    ui.pause.hidden = m !== 'pause';
    ui.over.hidden = m !== 'over';
    ui.hud.hidden = m === 'title';
    if (!playing) ui.hint.hidden = true;
  }

  /* ---------- Spawning ---------- */
  function spawnTarget() {
    spawned++;
    const t = { shade: false, seq: [], done: 0, y: field.top - 40 * U, ph: rand(0, TAU), wob: 0 };
    const signs = level >= 4 ? 4 : level >= 2 ? 3 : spawned > 4 ? 2 : 1;
    if (level >= 3 && !lastShade && Math.random() < Math.min(0.24, 0.12 + 0.02 * level)) {
      t.shade = true;
    } else {
      let len = 1;
      if (level >= 5 && Math.random() < Math.min(0.5, 0.2 + 0.06 * (level - 5))) len = level >= 7 && Math.random() < 0.4 ? 3 : 2;
      for (let i = 0; i < len; i++) t.seq.push((Math.random() * signs) | 0);
      // show a sign the first time it becomes available so the player meets it early
      if (len === 1) {
        if (level === 2 && cleared === 0) t.seq[0] = 2;
        if (level === 4 && cleared === 0) t.seq[0] = 3;
      }
    }
    lastShade = t.shade;
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
    // the whole grove scrolls with the thumb, like a feed
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
    const el = t.seq[t.done];
    if (ELEMENTS[el].gesture === g) answer(t, el);
    else if (g !== 'hold') {
      t.wob = 0.35;
      penalty(0.07, 'Wrong sign', targetX(t), t.y);
    }
  }

  function answer(t, el) {
    const x = targetX(t), y = t.y;
    const near = clamp((y - field.top) / (field.heartY - field.top), 0, 1);
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    const pts = Math.round((10 + 20 * near) * multiplier());
    score += pts;
    light = Math.min(1, light + (el === 1 ? 0.03 : 0.012));
    learned[el]++;
    sfx.hit(el, combo);
    const rgb = ELEMENTS[el].rgb, r = 27 * U;
    if (el === 0) ghosts.push({ el, x, y, vx: rand(-60, 60) * U, vy: -1500 * U, life: 0.5, max: 0.5, r });
    else if (el === 1) {
      const d = Math.max(60, field.heartY - y);
      ghosts.push({ el, x, y, vx: ((field.cx - x) / d) * 1300 * U, vy: 1300 * U, life: Math.min(0.5, d / (1300 * U)), max: 0.5, r });
      heartPulse = 1;
    } else if (el === 2) {
      rings.push({ x, y, r: r, max: r * 3.4, life: 0.5, rgb });
      rings.push({ x, y, r: r * 0.5, max: r * 2.3, life: 0.4, rgb: '255,243,196' });
      burst(x, y, rgb, 22, 300);
    } else {
      rings.push({ x, y, r: r * 2.6, max: r * 0.3, life: 0.45, rgb });
      burst(x, y, rgb, 14, 90);
    }
    burst(x, y, rgb, 8, 160);
    texts.push({ x: x + 46 * U, y: y - 8 * U, text: '+' + pts, life: 0.9, rgb: '255,243,196', size: 18 });
    if (combo > 0 && combo % 8 === 0 && multiplier() <= 6) {
      texts.push({ x: field.cx, y: H * 0.42, text: 'Streak ' + combo + '  ×' + multiplier(), life: 1.3, rgb, size: 26 });
    }
    t.done++;
    if (t.done >= t.seq.length) {
      targets.splice(targets.indexOf(t), 1);
      clearedOne();
    } else {
      t.wob = 0;
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
    rings.push({ x: field.cx, y: field.heartY, r: 20, max: Math.max(W, H) * 1.1, life: 1.6, rgb: '255,230,160' });
    scrollKick = 2600 * U;
    ui.banner.innerHTML = 'Dawn breaks<small>Grove ' + roman(level) + ' restored · +' + bonus + '</small>';
    ui.banner.hidden = false;
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
    ui.finalDetail.textContent = 'Reached Grove ' + roman(level) + ' · ' + totalCleared + ' answered · best streak ' + bestCombo;
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
      t.ph += dt * (t.shade ? 3 : 0);
      t.wob = Math.max(0, t.wob - dt);
      if (playing && t.y >= field.heartY - 30 * U) {
        targets.splice(i, 1);
        if (t.shade) {
          // resisting the urge to touch is the right answer
          combo++;
          bestCombo = Math.max(bestCombo, combo);
          shadeLearned++;
          const pts = 25 * multiplier();
          score += pts;
          burst(field.cx, field.heartY, '150,110,210', 16, 200);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Let go  +' + pts, life: 1, rgb: '200,180,255', size: 18 });
          sfx.pass();
          clearedOne();
        } else {
          light -= 0.2;
          combo = 0;
          shake = 0.35;
          heartPulse = 1;
          burst(field.cx, field.heartY, '255,120,110', 24, 260);
          texts.push({ x: field.cx, y: field.heartY - 60 * U, text: 'Missed', life: 1, rgb: '255,150,140', size: 18 });
          sfx.leak();
          clearedOne();
        }
        if (mode !== 'play') break;
      }
    }

    if (playing && light <= 0) { light = 0; gameOver(); }
    if (mode === 'interlude') {
      interlude -= dt;
      if (interlude <= 0) {
        ui.banner.hidden = true;
        setupLevel(level + 1);
        setMode('play');
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
        if (g.el === 1) burst(field.cx, field.heartY, ELEMENTS[1].rgb, 12, 160);
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
    ? ['Swipe up to send the Leaf onward', 'Swipe down to draw the Water in', 'Double-tap to kindle the Sun', 'Press and hold to still the Moon']
    : ['Swipe up, scroll, or press ↑ for Leaf', 'Swipe down, scroll back, or press ↓ for Water', 'Double-click or press Space for Sun', 'Hold the mouse button or Shift for Moon'];
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
        if (t.shade) { if (shadeLearned < 2) hint = 'A shade. Do not touch. Let it scroll past'; }
        else if (learned[t.seq[t.done]] < 3) hint = HINTS[t.seq[t.done]];
        if (!hint && !t.shade && t.seq.length > 1 && level < 7) hint = 'Bound signs: answer each one in turn';
      }
    }
    if (hint !== lastHint) {
      lastHint = hint;
      ui.hint.textContent = hint;
      ui.hint.hidden = !hint;
    }
  }

  /* ---------- Drawing ---------- */
  function iconPath(el, r) {
    ctx.beginPath();
    if (el === 0) { // leaf
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.95, -r * 0.45, r * 0.95, r * 0.45, 0, r);
      ctx.bezierCurveTo(-r * 0.95, r * 0.45, -r * 0.95, -r * 0.45, 0, -r);
    } else if (el === 1) { // water drop
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.2, -r * 0.4, r * 0.85, 0, r * 0.75, r * 0.4);
      ctx.arc(0, r * 0.3, r * 0.76, 0.13, Math.PI - 0.13);
      ctx.bezierCurveTo(-r * 0.85, 0, -r * 0.2, -r * 0.4, 0, -r);
    } else if (el === 2) { // sun
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.62 : r * 1.05;
        if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
    } else { // crescent moon
      ctx.moveTo(r * 0.35, -r * 0.95);
      ctx.bezierCurveTo(-r * 1.25, -r * 0.85, -r * 1.25, r * 0.85, r * 0.35, r * 0.95);
      ctx.bezierCurveTo(-r * 0.4, r * 0.5, -r * 0.4, -r * 0.5, r * 0.35, -r * 0.95);
    }
  }

  function drawIcon(el, x, y, r, alpha) {
    ctx.save();
    ctx.translate(x, y);
    if (el === 0) ctx.rotate(0.6);
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

  function drawOrb(el, x, y, r, alpha) {
    const rgb = ELEMENTS[el].rgb;
    glow(x, y, r * 2.4, rgb, 0.36 * alpha);
    ctx.fillStyle = `rgba(8,20,14,${0.88 * alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 2 * U;
    ctx.stroke();
    drawIcon(el, x, y, r * 0.6, alpha);
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

  // the cue around a sign shows which thumb gesture answers it
  function drawCue(el, x, y, r, strong) {
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
      if (strong && holdT > 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4 * U;
        ctx.beginPath();
        ctx.arc(x, y, r + 9 * U, -Math.PI / 2, -Math.PI / 2 + holdT * TAU);
        ctx.stroke();
      }
    }
  }

  function drawShade(x, y, ph, isFront) {
    const r = 27 * U;
    glow(x, y, r * 2.6, '70,25,105', 0.55);
    ctx.fillStyle = '#0b0612';
    ctx.strokeStyle = 'rgba(160,110,230,0.8)';
    ctx.lineWidth = 2 * U;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * TAU;
      const rr = r * (1 + Math.sin(a * 5 + ph) * 0.13 + Math.sin(a * 3 - ph * 1.3) * 0.1);
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e9d8ff';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * 9 * U, y + 3 * U, 4 * U, 5.5 * U, 0, 0, TAU);
      ctx.fill();
    }
    if (isFront) {
      // a barred ring: hands off
      ctx.strokeStyle = 'rgba(255,150,140,0.75)';
      ctx.lineWidth = 2.5 * U;
      ctx.beginPath();
      ctx.arc(x, y, r + 12 * U, 0, TAU);
      ctx.moveTo(x - (r + 12 * U) * 0.7, y - (r + 12 * U) * 0.7);
      ctx.lineTo(x + (r + 12 * U) * 0.7, y + (r + 12 * U) * 0.7);
      ctx.stroke();
    }
  }

  function drawTarget(t, isFront) {
    const wob = t.wob > 0 ? Math.sin(t.wob * 60) * 6 * U * (t.wob / 0.35) : 0;
    const fadeIn = clamp((t.y - (field.top - 40 * U)) / (70 * U), 0, 1);
    // the front one follows the thumb a little while dragging, like a reel being pulled
    const drag = isFront && !t.shade ? clamp(dragY, -SWIPE_PX, SWIPE_PX) * 0.7 : 0;
    const x = targetX(t) + wob, y = t.y + jolt + drag;
    ctx.globalAlpha = fadeIn;
    if (t.shade) {
      drawShade(x, y, t.ph, isFront);
    } else {
      const r = 27 * U;
      // bound signs trail above the current one, waiting their turn
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
      drawCue(el, x, y, r, isFront);
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

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (shake > 0) ctx.translate(rand(-1, 1) * shake * 18 * U, rand(-1, 1) * shake * 18 * U);
    ctx.drawImage(ground, 0, 0, W, H);
    const off = (((scrollY + clamp(dragY, -60, 60) * 0.5) % H) + H) % H;
    ctx.drawImage(forest, 0, off, W, H);
    ctx.drawImage(forest, 0, off - H, W, H);

    for (const f of fireflies) {
      const a = 0.25 + 0.25 * Math.sin(time * f.s + f.p);
      ctx.fillStyle = `rgba(220,255,170,${a})`;
      ctx.beginPath();
      ctx.arc((f.x * W + Math.sin(time * 0.3 * f.s + f.p) * 26) % W, (f.y * H + off * 0.4) % H, 1.4 * U, 0, TAU);
      ctx.fill();
    }

    if (mode !== 'title') {
      const hx = field.cx, hy = field.heartY;
      const f = front();

      // thread from the heart to the sign that is next
      if (f && mode === 'play') {
        ctx.strokeStyle = 'rgba(255,243,196,0.16)';
        ctx.lineWidth = 2 * U;
        ctx.setLineDash([4 * U, 8 * U]);
        ctx.beginPath();
        ctx.moveTo(hx, hy - 20 * U);
        ctx.lineTo(targetX(f), f.y + 30 * U);
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

      // the heart of the grove, where the spirit waits
      const pulse = 1 + heartPulse * 0.35 + Math.sin(time * 3) * 0.04;
      glow(hx, hy, 70 * U * pulse, '255,236,170', 0.5);
      ctx.strokeStyle = 'rgba(255,220,150,0.35)';
      ctx.lineWidth = 1.5 * U;
      ctx.beginPath();
      ctx.ellipse(hx, hy + 6 * U, field.path * 0.8, 14 * U, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,250,225,1)';
      ctx.beginPath();
      ctx.arc(hx, hy, 12 * U * pulse, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,87,0.9)';
      ctx.lineWidth = 2 * U;
      for (let i = 0; i < 3; i++) {
        const a = time * 2.4 + (i * TAU) / 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 19 * U * pulse, a, a + 1.1);
        ctx.stroke();
      }

      // draw far ones first so the front sign sits on top
      const order = targets.slice().sort((a, b) => a.y - b.y);
      for (const t of order) drawTarget(t, t === f);

      for (const g of ghosts) drawOrb(g.el, g.x, g.y, g.r, clamp(g.life / g.max + 0.3, 0, 1));

      for (const p of particles) {
        ctx.fillStyle = `rgba(${p.rgb},${p.life / p.max})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }

      // night closes in as the light fades
      const dark = clamp(1 - light, 0, 1) * 0.7;
      if (dark > 0.02) {
        const g = ctx.createRadialGradient(hx, hy, 60 * U, hx, hy, H);
        g.addColorStop(0, 'rgba(2,5,10,0)');
        g.addColorStop(0.5, `rgba(2,5,10,${dark * 0.75})`);
        g.addColorStop(1, `rgba(2,5,10,${dark})`);
        ctx.fillStyle = g;
        ctx.fillRect(-40, -40, W + 80, H + 80);
      }

      ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.font = `${Math.round(t.size * U)}px Palatino, Georgia, serif`;
        ctx.fillStyle = `rgba(${t.rgb},${Math.min(1, t.life * 1.6)})`;
        ctx.fillText(t.text, clamp(t.x, 50, W - 50), t.y);
      }

      if (combo >= 3 && mode === 'play') {
        ctx.textAlign = 'left';
        ctx.font = `${Math.round(16 * U)}px Palatino, Georgia, serif`;
        ctx.fillStyle = 'rgba(255,243,196,0.85)';
        ctx.fillText('Streak ' + combo + (multiplier() > 1 ? '  ×' + multiplier() : ''), 14, field.top + 22 * U);
      }
    }
  }

  /* ---------- Loop ---------- */
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (mode === 'play' || mode === 'interlude') update(dt);
    else if (mode === 'title' || mode === 'over') { time += dt; scrollY += H * 0.06 * dt; }
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
    if (mode === 'title' || mode === 'over') {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); startGame(); }
      return;
    }
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

  $('btn-start').addEventListener('click', startGame);
  $('btn-again').addEventListener('click', startGame);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause').addEventListener('click', togglePause);
  ui.sound.addEventListener('click', toggleSound);
  window.addEventListener('resize', resize);

  /* ---------- Boot ---------- */
  for (let i = 0; i < 26; i++) fireflies.push({ x: Math.random(), y: Math.random(), s: rand(0.6, 1.8), p: rand(0, TAU) });
  if (best > 0) ui.bestTitle.textContent = 'Best ' + best.toLocaleString();
  resize();
  setMode('title');
  requestAnimationFrame(frame);
})();
