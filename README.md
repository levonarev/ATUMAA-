# Atumaa — The Seventh Seat

A one-thumb sci-fi arcade puzzle for the browser, made for [atumaa.com](https://atumaa.com)
and set in the world of the feature *The Seventh Seat*.

The game is played with the same thumb gestures people use to scroll reels and shorts. Signals
rush down a lane toward the seat you are holding, and each is answered by a different gesture.
The whole world scrolls with every swipe, like a feed.

| Signal | Gesture (touch) | Keyboard / mouse |
| --- | --- | --- |
| Pulse | Swipe up | ↑ or W, scroll wheel, drag up |
| Draw | Swipe down | ↓ or S, scroll wheel back, drag down |
| Flare | Double-tap | Space, double-click |
| Lock | Press and hold | Hold Shift, hold mouse button |
| Void | Do nothing, let it pass | — |

A ten-second opening shows the premise and every gesture. Then seven seats, each a new world
that adds one complication on top of the last:

| Seat | World | Adds |
| --- | --- | --- |
| I | Launch Ring | Pulse and Draw |
| II | Ice Moon | Flare |
| III | Dust Belt | The Void |
| IV | Drowned Station | Lock |
| V | Green Vault | Bound signals (several gestures in a row) |
| VI | Mirror Reach | Mirrored signals (swipe the opposite way) |
| VII | The Seventh Seat | Cloaked signals (revealed late) |

After Seat VII the game continues in faster cycles. World names, the premise line and the
signal names are placeholders kept in the `WORLDS`, `INTRO` and `ELEMENTS` tables at the top of
`game.js`, so they can be replaced with the film's own.

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
