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

## Interval act: Memories

Once per seat a golden Memory signal comes down the lane. Any move opens it. The run pauses
and a wall of six screens appears; tap one, see what it held, then watch the other five open.
Behind them: skip to the next seat, full time, a score bonus, a shield that forgives one
mistake, and two empty screens. A Memory you fail to touch simply fades, with no penalty.

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
- `CNAME` — custom domain for GitHub Pages
