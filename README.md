# Atumaa — Scroll the Grove

A one-thumb mythic arcade puzzle for the browser, made for [atumaa.com](https://atumaa.com).

The game is played with the same thumb gestures people use to scroll reels and shorts. Signs
rush down a forest path toward the heart of the grove, and each one is answered by a different
gesture. The whole grove scrolls with every swipe, like a feed.

| Sign | Gesture (touch) | Keyboard / mouse |
| --- | --- | --- |
| Leaf | Swipe up | ↑ or W, scroll wheel, drag up |
| Water | Swipe down | ↓ or S, scroll wheel back, drag down |
| Sun | Double-tap | Space, double-click |
| Moon | Press and hold | Hold Shift, hold mouse button |
| Shade | Do nothing, let it pass | — |

Answer the sign nearest the heart first. A wrong gesture or a missed sign costs light; touching a
shade costs more. Answering close to the heart scores higher, and streaks raise a multiplier.
Later groves are faster and add bound signs that need several gestures in a row. P pauses, M mutes.

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
