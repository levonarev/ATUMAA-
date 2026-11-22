# Atumaa — Wake the Grove

A mythic arcade puzzle for the browser, made for [atumaa.com](https://atumaa.com).

You are a forest spirit. Gather elemental motes (Leaf, Water, Sun, Moon), which trail behind
you in the order you collect them, and carry them to the standing stones. Each stone asks for
signs in a set sequence and only takes the mote nearest you, so the order you gather in is the
puzzle. Light drains all the time, shades hunt you, and a waking stone banishes shades nearby.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | Mouse, WASD or arrow keys | Drag a finger |
| Release front mote | Space, E or right click | Release button |
| Pause / sound | P or Esc / M | Buttons at top right |

## Run locally

It is a static site with no build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

## Files

- `index.html` — page, HUD and menus
- `style.css` — styling
- `game.js` — the whole game (canvas rendering, input, audio)
- `CNAME` — custom domain for GitHub Pages
