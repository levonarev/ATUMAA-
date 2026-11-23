// Atumaa board: a Cloudflare Worker that keeps one small leaderboard per day.
// Bindings: a KV namespace bound as BOARD. Optional variable ALLOW_ORIGIN (default https://atumaa.com).
//
//   GET  /board?day=YYYY-MM-DD   -> { day, count, top: [{ name, ok, score }] }
//   POST /board  { day, name, ok, score } -> the same shape, after recording the entry

const TX_N = 13;        // signals in a transmission
const MAX_SCORE = 600;  // a perfect transmission cannot score more than this
const KEEP = 50;        // entries stored per day
const SHOW = 10;        // entries returned

const utcDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

function clean(name) {
  return String(name || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'cache-control': 'no-store',
    },
  });
}

async function read(env, day) {
  const data = await env.BOARD.get('day:' + day, 'json');
  return data && Array.isArray(data.entries) ? data : { entries: [], count: 0 };
}

const view = (day, data) => ({ day, count: data.count, top: data.entries.slice(0, SHOW) });

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || 'https://atumaa.com';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return reply({}, 200, origin);
    if (url.pathname !== '/board') return reply({ error: 'not found' }, 404, origin);

    if (request.method === 'GET') {
      const day = url.searchParams.get('day') || utcDay();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return reply({ error: 'bad day' }, 400, origin);
      return reply(view(day, await read(env, day)), 200, origin);
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) { return reply({ error: 'bad json' }, 400, origin); }
      const day = String(body.day || ''), name = clean(body.name);
      const ok = Number(body.ok), score = Number(body.score);
      // only today's transmission can be posted (yesterday is allowed for runs finished around midnight UTC)
      if (day !== utcDay() && day !== utcDay(-1)) return reply({ error: 'that day is closed' }, 400, origin);
      if (!name) return reply({ error: 'a name is needed' }, 400, origin);
      if (!Number.isInteger(ok) || ok < 0 || ok > TX_N) return reply({ error: 'bad result' }, 400, origin);
      if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return reply({ error: 'bad score' }, 400, origin);

      const data = await read(env, day);
      const mine = data.entries.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (!mine) { data.entries.push({ name, ok, score }); data.count++; }
      else if (ok > mine.ok || (ok === mine.ok && score > mine.score)) { mine.ok = ok; mine.score = score; }
      data.entries.sort((a, b) => b.ok - a.ok || b.score - a.score);
      data.entries = data.entries.slice(0, KEEP);
      await env.BOARD.put('day:' + day, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 14 });
      return reply(view(day, data), 200, origin);
    }
    return reply({ error: 'method not allowed' }, 405, origin);
  },
};
