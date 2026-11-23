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

A ten-second opening gives the premise from the trailer (November 2026, asteroid 1998 KY26 is
accelerating, it is sending a signal) and shows every gesture. Then seven seats, each a place
from the trailer that adds one complication on top of the last:

| Seat | World | Adds |
| --- | --- | --- |
| I | The Listening Room | Pulse and Echo |
| II | Launch | Flare |
| III | The Crossing | Gaps of missing time |
| IV | 1998 KY26 | Lock |
| V | The Corridor | Bound signals (several gestures in a row) |
| VI | Twin Suns | Mirrored signals (swipe the opposite way) |
| VII | The Seventh Seat | Cloaked signals (revealed late) |

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
- `CNAME` — custom domain for GitHub Pages
