# Atumaa — The Seventh Seat

A one-thumb sci-fi arcade puzzle for the browser, made for [atumaa.com](https://atumaa.com)
and set in the world of the feature *The Seventh Seat*.

The game is played with the same thumb gestures people use to scroll reels and shorts. Signals
rush down a lane toward the seat you are holding, and each is answered by a different gesture.
The whole world scrolls with every swipe, like a feed.

| Signal | Gesture (touch) | Keyboard / mouse |
| --- | --- | --- |
| Pulse | Swipe up | ↑ or W, scroll wheel, drag up |
| Echo | Swipe down | ↓ or S, scroll wheel back, drag down |
| Flare | Double-tap | Space, double-click |
| Lock | Press and hold | Hold Shift, hold mouse button |
| Gap (missing time) | Do nothing, let it pass | — |

The meter is time: a full bar is the 5 minutes 21 seconds each of the six is missing.

Play starts at once. A ten-second briefing, reached from How to play on the title screen, gives the premise from the trailer (November 2026, asteroid 1998 KY26 is
accelerating, it is sending a signal) and shows every gesture. Then seven seats, each a place
from the trailer that adds one complication on top of the last:

| Seat | World | When | Adds |
| --- | --- | --- | --- |
| I | The Listening Room | November 2026 | Pulse and Echo |
| II | First Contact | July 2031 | Flare |
| III | The Notebook | Three days later | Gaps of missing time |
| IV | Launch | 2032 | Lock |
| V | Day 212 | At 1998 KY26 | Bound signals (several gestures in a row) |
| VI | The Corridor | Inside | Mirrored signals (swipe the opposite way) |
| VII | The Seventh Seat | The chamber | Cloaked signals (revealed late) |

The first time a seat is reached, a story card appears before the signals: a still from the
film (`story/1.jpg` to `story/10.jpg`), the date and two or three lines of story. The text lives
in the `WORLDS` table at the top of `game.js`. A fall is not the end of a run: the seat can be
replayed up to three times, with the score put back to what it was at the start of that seat.
`?seat=8` (any number from 1 to 10) starts a run at that seat, and the title screen has a
link straight to the aiming seats.

After Seat VII the game continues in faster cycles. Story text is kept in the `WORLDS`, `INTRO`
and `ELEMENTS` tables at the top of `game.js`.

## Interval acts

Once per seat a golden signal comes down the lane. Any move opens it and the run pauses for a
short act. A signal you fail to touch simply fades, with no penalty. The three acts rotate:

- **Memory** (seats I, IV, VII): a wall of six screens. Tap one, see what it held, then watch
  the others open. Behind them: skip to the next seat, full time, a score bonus, a shield that
  forgives one mistake, and two empty screens.
- **The Metronome** (seats II, V): two ticks to listen, then six to tap along with. Points for
  every tick in time; five or more restores the time; six perfect ones add a shield.
- **The Heartbeat** (seats III, VI): a trace scrolls across a scope. One beat is wrong. Tap as
  it crosses the line for points and time back; an exact tap adds a shield. Tapping a true beat
  ends the act with nothing. From seat IV the wrong beat is subtler.

## Send a signal

From the title or end screen a player can tap six times in any rhythm. The five gaps between
the taps become a five-character code that seeds the run, sets the rhythm the signals fall in,
and draws the signal's own mark. After playing it, the player shares a link
(`?s=<code>&p=<score>`); whoever opens it gets the same run and a mark to beat. Nothing is
sent to a server: the whole signal lives in the link.

## The gamble, and the first four signals

A signal can be answered early and safely, or left to come close to the seat for about three
times the points. A faint gold band marks the close zone; a close answer sends a gold wave back
up the lane, adds a fifth to the note and is labelled "close". On a player's very first run the
first four signals teach this one at a time: swipe up; wait for the glow; your call; then a
silence to let pass.

## Transmissions (head to head)

Any signal run, daily or sent by a friend, is a transmission: thirteen signals, identical in
order and timing for everyone who opens the link, with no time meter, prizes or interval acts.
The link carries the sender's result (`&p=<score>&r=<answered>`), so the recipient sees
"A friend answered 12 of 13" and the end screen compares the two and offers a rematch.

## Beyond the seventh seat: aiming

After the ending the game goes on to three more seats where signals come down separate lanes
and a move only counts in the lane it is made in. Where the thumb lands is the aim; on a
keyboard, ← → move the aim. A move in an empty lane costs a little signal, and a Gap is only
dangerous in its own lane. Speed and the mix of signals drop back when aiming is introduced.

| Seat | World | Adds |
| --- | --- | --- |
| VIII | Twin Suns | Two lanes, slow, simple signals |
| IX | The Field | Three lanes; bound and mirrored signals return |
| X | The Shore | Everything, and sometimes two signals at once |

After Seat X the last seat repeats in faster cycles.

## Daily streak and the board

- **Daily streak:** finishing today's transmission extends a streak kept on the device; missing
  a day resets it. It shows on the end screen and on the title button.
- **The seventh seat today:** a worldwide board for today's transmission. It needs the small
  server in `backend/` (a Cloudflare Worker; see `backend/README.md`). Until that server's
  address is put in `BOARD_URL` in `game.js`, the board is hidden and nothing is sent anywhere.

## The ending

Clearing Seat VII stops the action: the signal goes back, six seats answer one by one, and the
seventh answers with the last notes the player played. Endless play continues from there.

## Today's signal and sharing

- **Today's signal:** one run a day, the same for everyone, made by hashing the date into a
  signal code. The best score for the day is kept on the device. Links carry the date (`?daily=2026-11-23`), so a shared result always opens the run it was
  played on. The day turns over at 00:00 UTC and the end screen shows that time on the player's clock.
- **Share this run:** every run ends with a share button. Where the phone supports it, it
  shares a 9:16 card (seat reached, score, clean percentage, the signal's mark) with a result
  line such as `ATUMAA IV · 96% clean · 12,340 · 3 signals short of The Corridor`; otherwise it
  shares or copies the text and link.
- **Link previews:** `og.png`, `manifest.webmanifest` and the app icons give shared links a
  proper card and let the game be added to a home screen.

## Difficulty

Time now runs down by itself (about 90 seconds from full in Seat I, faster later). Every answer
gives a little back and each cleared seat gives a quarter. A missed signal costs less in the
first seats than later. A Gap appears once in Seat I so it is met early.

## Feel and sound

- **Haptics:** every event has its own light vibration: touch, tap, swipe, each kind of hit, a
  wrong move, a missed signal, a streak, a seat cleared and the end of a run. Android browsers
  use the Vibration API. iOS Safari has no such API, so the game toggles a hidden switch control
  to get the system tick (iOS 17.4 or later; single ticks only). Toggle with the ≋ button or V.
- **Sound:** all synthesised in the browser: a different hit per signal, wrong-move and miss
  sounds, a tally at the end of each seat and a counting score at the end of a run. Toggle with
  the ♪ button or M.
- **Summaries:** each seat ends with accuracy and misses; the end screen lists answered,
  missed, wrong moves, accuracy and best streak.

## Run locally

It is a static site with no build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

## Files

- `index.html` — page, HUD and menus
- `style.css` — styling
- `game.js` — the whole game (canvas rendering, gestures, audio)
- `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `og.png` — install and link-preview assets
- `story/` — one still per seat, taken from the film's episodes
- `backend/` — the board server and how to deploy it (not served as part of the game)
- `CNAME` — custom domain for GitHub Pages
