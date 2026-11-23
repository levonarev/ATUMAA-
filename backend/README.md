# Atumaa board backend

A small Cloudflare Worker that stores each day's board for Today's transmission. The free
Cloudflare plan is enough.

## Deploy (about ten minutes, no command line)

1. Create a free account at https://dash.cloudflare.com and open **Workers & Pages**.
2. **Storage & Databases → KV → Create a namespace**, name it `atumaa-board`.
3. **Workers & Pages → Create → Worker**, name it `atumaa-board`, click **Deploy**.
4. Open the worker, click **Edit code**, replace everything with the contents of `worker.js`,
   then **Deploy**.
5. In the worker's **Settings → Bindings → Add → KV namespace**: variable name `BOARD`,
   namespace `atumaa-board`. Save and deploy.
6. Copy the worker's address (it looks like `https://atumaa-board.<your-name>.workers.dev`).
7. Put that address in `BOARD_URL` near the top of the board section in `game.js`.

## What it does and does not do

- Accepts a name (letters, digits, spaces, `_` and `-`, up to 12), the number answered (0–13)
  and the score (0–600) for today's date only, keeps each name's best, and returns the top ten
  plus how many people posted that day.
- It only accepts requests from pages on `https://atumaa.com` in browsers. Set the variable
  `ALLOW_ORIGIN` to change that.
- It does not verify that a score was really played. Impossible values are refused, but a
  determined person can still post a made-up result within the allowed range.
- Days are deleted after two weeks.
