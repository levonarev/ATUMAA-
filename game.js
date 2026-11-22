/* Atumaa — Wake the Grove. Plain canvas, no dependencies. */
(() => {
  'use strict';

  const ELEMENTS = [
    { name: 'Leaf', color: '#7ddc84', rgb: '125,220,132', note: 392.0 },
    { name: 'Water', color: '#5fc9f3', rgb: '95,201,243', note: 440.0 },
    { name: 'Sun', color: '#ffc857', rgb: '255,200,87', note: 523.25 },
    { name: 'Moon', color: '#b9a0ff', rgb: '185,160,255', note: 587.33 },
  ];
  const TAIL_MAX = 4;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const TAU = Math.PI * 2;

  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const ui = {
    hud: $('hud'), grove: $('grove'), pips: $('pips'), light: $('light'), score: $('score'),
    hint: $('hint'), banner: $('banner'), release: $('btn-release'),
    title: $('screen-title'), pause: $('screen-pause'), over: $('screen-over'),
    finalScore: $('final-score'), finalDetail: $('final-detail'),
    bestTitle: $('best-title'), bestOver: $('best-over'),
    sound: $('btn-sound'),
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const roman = (n) => ROMAN[n - 1] || String(n);

  /* ---------- Layout ---------- */
  let W = 0, H = 0, U = 1, DPR = 1;
  const field = { cx: 0, cy: 0, rx: 0, ry: 0, top: 60 };
  let backdrop = null;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    U = clamp(Math.min(W, H) / 620, 0.55, 1.5);
    field.cx = W / 2;
    // a stone and its floating request reach ~95 units above its base, so leave room under the HUD
    const headroom = 98 * U, footroom = 34 * U;
    field.ry = Math.max(80, (H - field.top - headroom - footroom) / 2);
    field.cy = field.top + headroom + field.ry;
    field.rx = Math.max(80, Math.min(W / 2 - 46 * U, field.ry * 1.6));
    placeTotems();
    buildBackdrop();
  }

  function buildBackdrop() {
    backdrop = document.createElement('canvas');
    backdrop.width = canvas.width;
    backdrop.height = canvas.height;
    const b = backdrop.getContext('2d');
    b.scale(DPR, DPR);
    const g = b.createRadialGradient(field.cx, field.cy, 20, field.cx, field.cy, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#1d3a2a');
    g.addColorStop(0.45, '#10241a');
    g.addColorStop(1, '#050b08');
    b.fillStyle = g;
    b.fillRect(0, 0, W, H);

    // moss speckles
    for (let i = 0; i < 260; i++) {
      b.fillStyle = `rgba(${Math.random() < 0.5 ? '125,220,132' : '200,230,170'},${rand(0.03, 0.11)})`;
      b.beginPath();
      b.arc(rand(0, W), rand(0, H), rand(0.6, 2.2) * U, 0, TAU);
      b.fill();
    }

    // ritual rings on the ground
    b.strokeStyle = 'rgba(190,230,190,0.07)';
    b.lineWidth = 1.5;
    for (const k of [1, 0.66, 0.33]) {
      b.beginPath();
      b.ellipse(field.cx, field.cy, field.rx * k, field.ry * k, 0, 0, TAU);
      b.stroke();
    }
    b.setLineDash([3, 9]);
    b.beginPath();
    b.ellipse(field.cx, field.cy, field.rx * 0.83, field.ry * 0.83, 0, 0, TAU);
    b.stroke();
    b.setLineDash([]);

    // tree silhouettes around the rim
    const trees = Math.round((W + H) / 26);
    for (let i = 0; i < trees; i++) {
      const a = (i / trees) * TAU + rand(-0.03, 0.03);
      const d = rand(1.12, 1.5);
      const x = field.cx + Math.cos(a) * Math.max(field.rx * d, W * 0.5 * rand(0.92, 1.05));
      const y = field.cy + Math.sin(a) * Math.max(field.ry * d, (H - field.top) * 0.5 * rand(0.92, 1.05));
      const s = rand(26, 58) * U;
      b.fillStyle = `rgba(${rand(3, 9) | 0},${rand(14, 26) | 0},${rand(10, 18) | 0},0.92)`;
      for (let k = 0; k < 3; k++) {
        const ww = s * (0.75 - k * 0.17), top = y - s * (0.55 + k * 0.42);
        b.beginPath();
        b.moveTo(x - ww, top + s * 0.62);
        b.lineTo(x, top);
        b.lineTo(x + ww, top + s * 0.62);
        b.closePath();
        b.fill();
      }
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
    pickup: (el) => tone(ELEMENTS[el].note, 0.18, 'sine', 0.09),
    deliver: (el) => { tone(ELEMENTS[el].note * 2, 0.22, 'triangle', 0.09); },
    wrong: () => tone(150, 0.12, 'square', 0.03),
    drop: () => tone(300, 0.14, 'sine', 0.06, 0, 180),
    awaken: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.08, i * 0.07)),
    hit: () => { tone(120, 0.4, 'sawtooth', 0.09, 0, 50); tone(90, 0.3, 'square', 0.04, 0.03, 45); },
    dawn: () => [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.8, 'sine', 0.07, i * 0.11)),
    over: () => [392, 329.63, 261.63, 196].forEach((f, i) => tone(f, 0.7, 'triangle', 0.08, i * 0.22)),
  };

  /* ---------- State ---------- */
  let mode = 'title'; // title | play | pause | interlude | over
  let time = 0, level = 1, score = 0, light = 1, combo = 0, lastAwaken = -99;
  let awakened = 0, goal = 4, totalAwakened = 0, interlude = 0;
  let spawnTimer = 0, wrongTimer = 0, deliverTimer = 0, shake = 0;
  let best = 0;
  try { best = parseInt(localStorage.getItem('atumaa.best') || '0', 10) || 0; } catch (e) { /* storage blocked */ }

  const wisp = { x: 0, y: 0, vx: 0, vy: 0, safe: 0 };
  let tail = [];      // {el,x,y}; index 0 is nearest the wisp and is offered first
  let motes = [];     // {el,x,y,vx,vy,age,life,noPick,ph}
  let totems = [];    // {a,x,y,req,done,state,timer,wob,glow}
  let shades = [];    // {x,y,vx,vy,out,ph,wa}
  let particles = []; // {x,y,vx,vy,life,max,rgb,size}
  let rings = [];     // {x,y,r,max,life,rgb}
  let texts = [];     // {x,y,text,life,rgb}
  let fireflies = [];

  const pointer = { x: 0, y: 0, active: false };
  const keys = new Set();

  function placeTotems() {
    for (const t of totems) {
      t.x = field.cx + Math.cos(t.a) * field.rx;
      t.y = field.cy + Math.sin(t.a) * field.ry;
    }
  }

  function elementCount() { return level < 3 ? 3 : 4; }

  function newRequest() {
    const lo = level < 3 ? 1 : 2;
    const hi = Math.min(TAIL_MAX, 2 + Math.floor(level / 2));
    const n = totalAwakened < 2 ? 1 : (lo + Math.floor(Math.random() * (hi - lo + 1)));
    const req = [];
    for (let i = 0; i < n; i++) req.push((Math.random() * elementCount()) | 0);
    return req;
  }

  function setupLevel(n) {
    level = n;
    awakened = 0;
    goal = 3 + level;
    const count = Math.min(3 + Math.floor((level - 1) / 2), 6);
    const offset = -Math.PI / 2 + (level % 2 ? 0 : Math.PI / count);
    totems = [];
    for (let i = 0; i < count; i++) {
      totems.push({ a: offset + (i / count) * TAU, x: 0, y: 0, req: newRequest(), done: 0, state: 'asking', timer: 0, wob: 0, glow: 0 });
    }
    placeTotems();
    const shadeCount = Math.min(1 + Math.floor(level / 2), 6);
    shades = [];
    for (let i = 0; i < shadeCount; i++) shades.push(spawnShade({ out: 2 + i * 1.5 }));
    ui.grove.textContent = 'Grove ' + roman(level);
    ui.pips.innerHTML = '';
    for (let i = 0; i < goal; i++) ui.pips.appendChild(document.createElement('i'));
  }

  function spawnShade(s) {
    // enters from the rim, on the side away from the wisp
    const away = Math.atan2(field.cy - wisp.y, field.cx - wisp.x) + rand(-1, 1);
    s.x = field.cx + Math.cos(away) * (field.rx + 60 * U);
    s.y = field.cy + Math.sin(away) * (field.ry + 60 * U);
    s.vx = 0; s.vy = 0;
    s.ph = rand(0, TAU);
    s.wa = rand(0, TAU);
    if (s.out == null) s.out = 0;
    return s;
  }

  function startGame() {
    initAudio();
    score = 0; light = 1; combo = 0; lastAwaken = -99; totalAwakened = 0;
    tail = []; motes = []; particles = []; rings = []; texts = [];
    wisp.x = field.cx; wisp.y = field.cy; wisp.vx = wisp.vy = 0; wisp.safe = 1;
    pointer.active = false;
    setupLevel(1);
    for (let i = 0; i < 5; i++) spawnMote();
    setMode('play');
  }

  function setMode(m) {
    mode = m;
    const playing = m === 'play' || m === 'interlude';
    ui.title.hidden = m !== 'title';
    ui.pause.hidden = m !== 'pause';
    ui.over.hidden = m !== 'over';
    ui.hud.hidden = m === 'title';
    ui.release.hidden = !playing;
    if (!playing) ui.hint.hidden = true;
    canvas.style.cursor = playing ? 'none' : 'default';
  }

  /* ---------- Spawning ---------- */
  function neededElements() {
    // signs the stones still want that are not already in the trail or on the field
    const want = [];
    for (const t of totems) if (t.state === 'asking') for (let i = t.done; i < t.req.length; i++) want.push(t.req[i]);
    const have = tail.map((n) => n.el).concat(motes.map((m) => m.el));
    for (const el of have) {
      const i = want.indexOf(el);
      if (i >= 0) want.splice(i, 1);
    }
    return want;
  }

  function spawnMote() {
    const need = neededElements();
    const el = need.length && Math.random() < 0.75 ? pick(need) : (Math.random() * elementCount()) | 0;
    let x = 0, y = 0;
    for (let tries = 0; tries < 12; tries++) {
      const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 0.78;
      x = field.cx + Math.cos(a) * field.rx * r;
      y = field.cy + Math.sin(a) * field.ry * r;
      if (Math.hypot(x - wisp.x, y - wisp.y) > 90 * U) break;
    }
    const d = rand(0, TAU), sp = rand(5, 14) * U;
    motes.push({ el, x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, age: 0, life: rand(15, 22), noPick: 0, ph: rand(0, TAU) });
  }

  function burst(x, y, rgb, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.25, 1) * speed * U;
      const life = rand(0.35, 0.9);
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, rgb, size: rand(1.2, 3.2) * U });
    }
  }

  /* ---------- Actions ---------- */
  function releaseFront() {
    if (mode !== 'play' || !tail.length) return;
    const n = tail.shift();
    const sp = Math.hypot(wisp.vx, wisp.vy);
    // toss it behind the direction of travel so it is easy to circle back for
    const a = sp > 20 ? Math.atan2(-wisp.vy, -wisp.vx) + rand(-0.5, 0.5) : rand(0, TAU);
    motes.push({ el: n.el, x: wisp.x, y: wisp.y, vx: Math.cos(a) * 130 * U, vy: Math.sin(a) * 130 * U, age: 1, life: 16, noPick: 0.7, ph: rand(0, TAU) });
    sfx.drop();
  }

  function awaken(t) {
    const len = t.req.length;
    combo = time - lastAwaken < 7 ? Math.min(combo + 1, 9) : 1;
    lastAwaken = time;
    const gain = 100 * len * combo;
    score += gain;
    light = Math.min(1, light + 0.14 + 0.05 * len);
    t.state = 'awake';
    t.timer = 2.6;
    awakened++;
    totalAwakened++;
    const reach = 165 * U;
    rings.push({ x: t.x, y: t.y - 24 * U, r: 10, max: reach, life: 0.7, rgb: '255,220,140' });
    burst(t.x, t.y - 30 * U, '255,220,140', 34, 260);
    texts.push({ x: t.x, y: t.y - 96 * U, text: '+' + gain + (combo > 1 ? '  ×' + combo : ''), life: 1.3, rgb: '255,243,196' });
    for (const s of shades) {
      if (s.out <= 0 && Math.hypot(s.x - t.x, s.y - t.y) < reach) {
        burst(s.x, s.y, '150,110,210', 18, 180);
        s.out = 4;
        score += 50;
      }
    }
    sfx.awaken();
    const pip = ui.pips.children[awakened - 1];
    if (pip) pip.className = 'on';
    if (awakened >= goal) startInterlude();
  }

  function startInterlude() {
    mode = 'interlude';
    interlude = 2.4;
    light = Math.min(1, light + 0.35);
    score += 250 * level;
    for (const s of shades) {
      if (s.out <= 0) burst(s.x, s.y, '150,110,210', 16, 180);
      s.out = 99;
    }
    rings.push({ x: field.cx, y: field.cy, r: 20, max: Math.max(W, H), life: 1.6, rgb: '255,230,160' });
    ui.banner.innerHTML = 'Dawn breaks<small>Grove ' + roman(level) + ' restored · +' + 250 * level + '</small>';
    ui.banner.hidden = false;
    ui.hint.hidden = true;
    sfx.dawn();
  }

  function hitByShade(s) {
    light -= 0.2;
    combo = 0;
    wisp.safe = 1.6;
    shake = 0.35;
    for (const n of tail) {
      const a = rand(0, TAU);
      motes.push({ el: n.el, x: n.x, y: n.y, vx: Math.cos(a) * 170 * U, vy: Math.sin(a) * 170 * U, age: 1, life: 12, noPick: 0.9, ph: rand(0, TAU) });
    }
    tail = [];
    burst(wisp.x, wisp.y, '190,150,255', 26, 240);
    const a = Math.atan2(s.y - wisp.y, s.x - wisp.x);
    s.vx = Math.cos(a) * 260 * U;
    s.vy = Math.sin(a) * 260 * U;
    sfx.hit();
  }

  function gameOver() {
    setMode('over');
    const isBest = score > best;
    if (isBest) {
      best = score;
      try { localStorage.setItem('atumaa.best', String(best)); } catch (e) { /* storage blocked */ }
    }
    ui.finalScore.textContent = score.toLocaleString();
    ui.finalDetail.textContent = 'Reached Grove ' + roman(level) + ' · ' + totalAwakened + ' stone' + (totalAwakened === 1 ? '' : 's') + ' woken';
    ui.bestOver.textContent = isBest && score > 0 ? 'New best!' : 'Best ' + best.toLocaleString();
    sfx.over();
  }

  /* ---------- Update ---------- */
  function update(dt) {
    time += dt;
    const playing = mode === 'play';

    // wisp steering
    let dx = 0, dy = 0;
    if (keys.has('left')) dx -= 1;
    if (keys.has('right')) dx += 1;
    if (keys.has('up')) dy -= 1;
    if (keys.has('down')) dy += 1;
    const maxSp = 340 * U;
    let tx = 0, ty = 0;
    if (dx || dy) {
      const l = Math.hypot(dx, dy);
      tx = (dx / l) * maxSp; ty = (dy / l) * maxSp;
      pointer.active = false;
    } else if (pointer.active) {
      const px = pointer.x - wisp.x, py = pointer.y - wisp.y;
      const d = Math.hypot(px, py);
      if (d > 1) {
        const sp = Math.min(maxSp, d * 9);
        tx = (px / d) * sp; ty = (py / d) * sp;
      }
    }
    const k = Math.min(1, dt * 11);
    wisp.vx += (tx - wisp.vx) * k;
    wisp.vy += (ty - wisp.vy) * k;
    wisp.x = clamp(wisp.x + wisp.vx * dt, 12 * U, W - 12 * U);
    wisp.y = clamp(wisp.y + wisp.vy * dt, field.top + 4, H - 12 * U);
    wisp.safe = Math.max(0, wisp.safe - dt);

    // trail follows like a chain
    let px = wisp.x, py = wisp.y;
    const gap = 21 * U;
    for (const n of tail) {
      const ddx = n.x - px, ddy = n.y - py;
      const d = Math.hypot(ddx, ddy) || 1;
      if (d > gap) { n.x = px + (ddx / d) * gap; n.y = py + (ddy / d) * gap; }
      px = n.x; py = n.y;
    }

    // motes
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      m.age += dt;
      m.noPick = Math.max(0, m.noPick - dt);
      const sp = Math.hypot(m.vx, m.vy);
      if (sp > 16 * U) { const f = Math.pow(0.04, dt); m.vx *= f; m.vy *= f; }
      m.x += m.vx * dt; m.y += m.vy * dt;
      // keep inside the grove
      const ex = (m.x - field.cx) / (field.rx * 0.92), ey = (m.y - field.cy) / (field.ry * 0.92);
      if (ex * ex + ey * ey > 1) {
        m.vx += (field.cx - m.x) * dt * 1.5;
        m.vy += (field.cy - m.y) * dt * 1.5;
      }
      if (m.age > m.life) { motes.splice(i, 1); continue; }
      if (playing && !m.noPick && tail.length < TAIL_MAX && Math.hypot(m.x - wisp.x, m.y - wisp.y) < 22 * U) {
        tail.push({ el: m.el, x: m.x, y: m.y });
        burst(m.x, m.y, ELEMENTS[m.el].rgb, 8, 120);
        sfx.pickup(m.el);
        motes.splice(i, 1);
      }
    }
    if (playing) {
      spawnTimer -= dt;
      const want = Math.min(10, 4 + totems.length);
      if (spawnTimer <= 0 && motes.length < want) {
        spawnMote();
        spawnTimer = motes.length < 3 ? 0.25 : 0.8;
      }
    }

    // stones
    wrongTimer = Math.max(0, wrongTimer - dt);
    deliverTimer = Math.max(0, deliverTimer - dt);
    for (const t of totems) {
      t.wob = Math.max(0, t.wob - dt);
      if (t.state === 'awake') {
        t.glow = Math.min(1, t.glow + dt * 4);
        t.timer -= dt;
        if (t.timer <= 0 && mode === 'play') { t.state = 'asking'; t.req = newRequest(); t.done = 0; }
        continue;
      }
      t.glow = Math.max(0, t.glow - dt * 1.5);
      if (!playing || !tail.length) continue;
      if (Math.hypot(wisp.x - t.x, wisp.y - (t.y - 22 * U)) < 44 * U) {
        const front = tail[0];
        if (front.el === t.req[t.done]) {
          if (deliverTimer > 0) continue;
          tail.shift();
          t.done++;
          deliverTimer = 0.14;
          score += 10 * Math.max(1, combo);
          light = Math.min(1, light + 0.02);
          burst(t.x, t.y - 60 * U, ELEMENTS[front.el].rgb, 12, 150);
          sfx.deliver(front.el);
          if (t.done >= t.req.length) awaken(t);
          if (mode !== 'play') break;
        } else if (wrongTimer <= 0) {
          t.wob = 0.35;
          wrongTimer = 0.7;
          sfx.wrong();
        }
      }
    }

    // shades
    const shadeSp = Math.min(118, 40 + 8 * level) * U;
    for (const s of shades) {
      if (s.out > 0) {
        if (mode === 'play') { s.out -= dt; if (s.out <= 0) spawnShade(s); }
        continue;
      }
      s.ph += dt * 3;
      s.wa += rand(-1, 1) * dt * 2.5;
      let ax = Math.cos(s.wa) * 0.55, ay = Math.sin(s.wa) * 0.55;
      if (wisp.safe <= 0) {
        const d = Math.hypot(wisp.x - s.x, wisp.y - s.y) || 1;
        ax += (wisp.x - s.x) / d; ay += (wisp.y - s.y) / d;
      } else {
        ax += (field.cx - s.x) / (field.rx * 2); ay += (field.cy - s.y) / (field.ry * 2);
      }
      // shades keep apart from each other
      for (const o of shades) {
        if (o === s || o.out > 0) continue;
        const d = Math.hypot(s.x - o.x, s.y - o.y);
        if (d > 0 && d < 70 * U) { ax += ((s.x - o.x) / d) * 0.9; ay += ((s.y - o.y) / d) * 0.9; }
      }
      const al = Math.hypot(ax, ay) || 1;
      const kk = Math.min(1, dt * 1.8);
      s.vx += ((ax / al) * shadeSp - s.vx) * kk;
      s.vy += ((ay / al) * shadeSp - s.vy) * kk;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (playing && wisp.safe <= 0 && Math.hypot(wisp.x - s.x, wisp.y - s.y) < 25 * U) hitByShade(s);
    }

    // light and progression
    if (playing) {
      light -= (0.024 + 0.003 * level) * dt;
      if (time - lastAwaken > 7) combo = 0;
      if (light <= 0) { light = 0; gameOver(); }
    } else if (mode === 'interlude') {
      interlude -= dt;
      if (interlude <= 0) {
        ui.banner.hidden = true;
        setupLevel(level + 1);
        setMode('play');
      }
    }

    // effects
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
      r.r += (r.max - r.r) * Math.min(1, dt * 5);
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      texts[i].life -= dt;
      texts[i].y -= 26 * U * dt;
      if (texts[i].life <= 0) texts.splice(i, 1);
    }
    shake = Math.max(0, shake - dt);
    if (Math.random() < dt * 14 && (Math.abs(wisp.vx) + Math.abs(wisp.vy)) > 40) {
      particles.push({ x: wisp.x + rand(-4, 4), y: wisp.y + rand(-4, 4), vx: rand(-12, 12), vy: rand(-12, 12), life: 0.6, max: 0.6, rgb: '255,243,196', size: rand(1, 2.4) * U });
    }
  }

  /* ---------- HUD ---------- */
  let lastHint = '';
  function updateHud() {
    ui.score.textContent = score.toLocaleString();
    ui.light.style.width = (light * 100).toFixed(1) + '%';
    ui.light.classList.toggle('low', light < 0.25 && mode === 'play');
    let hint = '';
    if (mode === 'play' && level === 1) {
      if (!tail.length) hint = 'Drift into a glowing mote to gather it';
      else {
        const front = tail[0].el;
        const wanted = totems.some((t) => t.state === 'asking' && t.req[t.done] === front);
        hint = wanted
          ? 'Carry your ' + ELEMENTS[front].name + ' mote to the stone asking for that sign'
          : 'No stone wants ' + ELEMENTS[front].name + ' next. Release it to reach the mote behind';
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

  function drawIcon(el, x, y, r, filled, alpha) {
    const e = ELEMENTS[el];
    ctx.save();
    ctx.translate(x, y);
    if (el === 0) ctx.rotate(0.6);
    iconPath(el, r);
    if (filled) {
      ctx.fillStyle = `rgba(${e.rgb},${alpha})`;
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(${e.rgb},${alpha * 0.16})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${e.rgb},${alpha})`;
      ctx.lineWidth = 1.6 * U;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
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
    const e = ELEMENTS[el];
    glow(x, y, r * 2.6, e.rgb, 0.38 * alpha);
    ctx.fillStyle = `rgba(8,20,14,${0.85 * alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${e.rgb},${alpha})`;
    ctx.lineWidth = 1.5 * U;
    ctx.stroke();
    drawIcon(el, x, y, r * 0.62, true, alpha);
  }

  function drawTotem(t) {
    const awake = t.glow;
    const wob = t.wob > 0 ? Math.sin(t.wob * 60) * 3 * U * (t.wob / 0.35) : 0;
    const x = t.x + wob, y = t.y;
    const hw = 16 * U, hh = 52 * U;

    // shadow and aura
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * U, hw * 1.5, hw * 0.5, 0, 0, TAU);
    ctx.fill();
    if (awake > 0) glow(x, y - hh * 0.5, 80 * U, '255,210,120', 0.45 * awake);

    // the stone
    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x - hw * 0.78, y - hh * 0.8);
    ctx.quadraticCurveTo(x - hw * 0.5, y - hh * 1.04, x, y - hh);
    ctx.quadraticCurveTo(x + hw * 0.6, y - hh * 0.98, x + hw * 0.82, y - hh * 0.75);
    ctx.lineTo(x + hw, y);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - hw, 0, x + hw, 0);
    g.addColorStop(0, awake > 0.5 ? '#8f8a6a' : '#566a5e');
    g.addColorStop(1, awake > 0.5 ? '#4f4a36' : '#26342c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,220,150,${0.18 + awake * 0.7})`;
    ctx.lineWidth = 1.5 * U;
    ctx.stroke();

    // carved spiral
    ctx.strokeStyle = awake > 0 ? `rgba(255,236,170,${0.35 + awake * 0.65})` : 'rgba(190,230,190,0.28)';
    ctx.lineWidth = 1.6 * U;
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = i * 0.42, rr = (1 + i * 0.26) * U;
      const sx = x + Math.cos(a) * rr, sy = y - hh * 0.52 + Math.sin(a) * rr;
      if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
    }
    ctx.stroke();

    // the request, floating above
    if (t.state === 'asking') {
      const n = t.req.length, r = 9.5 * U, step = 25 * U;
      const y0 = y - hh - 24 * U;
      const x0 = x - ((n - 1) * step) / 2;
      ctx.fillStyle = 'rgba(4,10,7,0.62)';
      ctx.beginPath();
      ctx.roundRect(x0 - 16 * U, y0 - 15 * U, (n - 1) * step + 32 * U, 30 * U, 15 * U);
      ctx.fill();
      for (let i = 0; i < n; i++) {
        const xi = x0 + i * step;
        if (i < t.done) {
          drawIcon(t.req[i], xi, y0, r, true, 0.3);
        } else if (i === t.done) {
          const p = 1 + Math.sin(time * 6) * 0.12;
          glow(xi, y0, r * 2.4, ELEMENTS[t.req[i]].rgb, 0.4);
          drawIcon(t.req[i], xi, y0, r * p, true, 1);
        } else {
          drawIcon(t.req[i], xi, y0, r * 0.85, false, 0.8);
        }
      }
    }
  }

  function drawShade(s) {
    const r = 17 * U;
    glow(s.x, s.y, r * 3, '60,20,90', 0.5);
    ctx.fillStyle = '#0b0612';
    ctx.strokeStyle = 'rgba(160,110,230,0.75)';
    ctx.lineWidth = 1.5 * U;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * TAU;
      const rr = r * (1 + Math.sin(a * 5 + s.ph) * 0.14 + Math.sin(a * 3 - s.ph * 1.3) * 0.1);
      const px = s.x + Math.cos(a) * rr, py = s.y + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // eyes look where it is heading
    const d = Math.hypot(s.vx, s.vy) || 1;
    const ex = (s.vx / d) * 4 * U, ey = (s.vy / d) * 4 * U;
    ctx.fillStyle = '#e9d8ff';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s.x + ex + side * 5.5 * U, s.y + ey - 2 * U, 2.6 * U, 3.6 * U, 0, 0, TAU);
      ctx.fill();
    }
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (shake > 0) ctx.translate(rand(-1, 1) * shake * 18 * U, rand(-1, 1) * shake * 18 * U);
    ctx.drawImage(backdrop, 0, 0, W, H);

    // fireflies
    for (const f of fireflies) {
      const a = 0.25 + 0.25 * Math.sin(time * f.s + f.p);
      ctx.fillStyle = `rgba(220,255,170,${a})`;
      ctx.beginPath();
      ctx.arc((f.x * W + Math.sin(time * 0.3 * f.s + f.p) * 26) % W, (f.y * H + Math.cos(time * 0.24 * f.s + f.p) * 22) % H, 1.4 * U, 0, TAU);
      ctx.fill();
    }

    if (mode !== 'title') {
      for (const r of rings) {
        ctx.strokeStyle = `rgba(${r.rgb},${Math.min(1, r.life * 1.6)})`;
        ctx.lineWidth = 3 * U;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, TAU);
        ctx.stroke();
      }

      for (const t of totems) drawTotem(t);

      for (const m of motes) {
        const fadeIn = Math.min(1, m.age * 2.2), fadeOut = Math.min(1, (m.life - m.age) / 3);
        const bob = Math.sin(time * 2.2 + m.ph) * 3 * U;
        drawOrb(m.el, m.x, m.y + bob, 12 * U, fadeIn * fadeOut);
      }

      // trail
      if (tail.length) {
        ctx.strokeStyle = 'rgba(255,243,196,0.22)';
        ctx.lineWidth = 2 * U;
        ctx.beginPath();
        ctx.moveTo(wisp.x, wisp.y);
        for (const n of tail) ctx.lineTo(n.x, n.y);
        ctx.stroke();
        for (let i = tail.length - 1; i >= 0; i--) {
          const n = tail[i];
          drawOrb(n.el, n.x, n.y, (i === 0 ? 11.5 : 9.5) * U, 1);
          if (i === 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.5 * U;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 15 * U, 0, TAU);
            ctx.stroke();
          }
        }
      }

      // the wisp
      const blink = wisp.safe > 0 && Math.sin(time * 30) > 0 ? 0.35 : 1;
      glow(wisp.x, wisp.y, 46 * U, '255,236,170', 0.5 * blink);
      ctx.fillStyle = `rgba(255,250,225,${blink})`;
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, 8.5 * U, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,200,87,${0.9 * blink})`;
      ctx.lineWidth = 1.5 * U;
      for (let i = 0; i < 3; i++) {
        const a = time * 2.4 + (i * TAU) / 3;
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 13 * U, a, a + 1.1);
        ctx.stroke();
      }

      for (const s of shades) if (s.out <= 0) drawShade(s);

      for (const p of particles) {
        ctx.fillStyle = `rgba(${p.rgb},${p.life / p.max})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }

      // night closes in as the light fades; the wisp keeps a pool of light
      const dark = clamp(1 - light, 0, 1) * 0.78;
      if (dark > 0.02) {
        const g = ctx.createRadialGradient(wisp.x, wisp.y, 50 * U, wisp.x, wisp.y, Math.max(W, H) * 0.8);
        g.addColorStop(0, 'rgba(2,5,10,0)');
        g.addColorStop(0.45, `rgba(2,5,10,${dark * 0.8})`);
        g.addColorStop(1, `rgba(2,5,10,${dark})`);
        ctx.fillStyle = g;
        ctx.fillRect(-40, -40, W + 80, H + 80);
      }

      ctx.font = `${Math.round(20 * U)}px Palatino, Georgia, serif`;
      ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.fillStyle = `rgba(${t.rgb},${Math.min(1, t.life * 1.5)})`;
        ctx.fillText(t.text, t.x, t.y);
      }
    }
  }

  /* ---------- Loop ---------- */
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (mode === 'play' || mode === 'interlude') update(dt);
    else if (mode === 'title' || mode === 'over') time += dt;
    updateHud();
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- Input ---------- */
  const KEYMAP = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
  };

  function togglePause() {
    if (mode === 'play') setMode('pause');
    else if (mode === 'pause') { last = performance.now(); setMode('play'); }
  }
  function toggleSound() {
    muted = !muted;
    ui.sound.classList.toggle('off', muted);
  }

  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.key]) { keys.add(KEYMAP[e.key]); e.preventDefault(); return; }
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      if (mode === 'play') releaseFront();
      else if (mode === 'title' || mode === 'over') startGame();
      else if (mode === 'pause') togglePause();
    } else if (e.key === 'Enter' && (mode === 'title' || mode === 'over')) startGame();
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    else if (e.key === 'm' || e.key === 'M') toggleSound();
  });
  window.addEventListener('keyup', (e) => { if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]); });
  window.addEventListener('blur', () => { keys.clear(); if (mode === 'play') setMode('pause'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setMode('pause'); });

  function aim(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }
  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    if (e.button === 2) { releaseFront(); return; }
    aim(e);
  });
  canvas.addEventListener('pointermove', aim);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  ui.release.addEventListener('pointerdown', (e) => { e.preventDefault(); releaseFront(); });
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
