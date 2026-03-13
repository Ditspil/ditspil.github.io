# ditspil.github.io

A vanilla HTML/CSS/JavaScript reimplementation of the classic **2048** puzzle game, hosted on GitHub Pages.

## About the game

Slide numbered tiles on a 4×4 grid. When two tiles with the same number collide they merge into one, doubling their value. The goal is to create a tile with the value **2048**. After reaching 2048 you can keep going for a higher score.

The original 2048 was created by [Gabriele Cirulli](https://gabrielecirulli.com) in 2014.

## Features

- Smooth sliding and merge animations
- Score tracker with persistent **best score** (stored in `localStorage`)
- Win overlay with a "Keep going" option to play past 2048
- Game-over detection when no moves remain
- Responsive layout — scales to any screen size
- **Keyboard** support: Arrow keys or WASD
- **Touch/swipe** support for mobile

## File structure

```
2048.html   — markup
2048.css    — styles and animations
2048.js     — game logic
```

No build tools, no dependencies, no frameworks. Open `2048.html` directly in any modern browser to play.

## How to play

| Input | Action |
|---|---|
| `←` / `A` | Slide left |
| `→` / `D` | Slide right |
| `↑` / `W` | Slide up |
| `↓` / `S` | Slide down |
| Swipe | Slide in swipe direction |

## Running locally

```bash
# Clone the repo
git clone https://github.com/Ditspil/ditspil.github.io.git
cd ditspil.github.io

# Open in browser (macOS)
open 2048.html
```

No server or install step required.

## License

This project is open source. The 2048 concept and original implementation are by [Gabriele Cirulli](https://github.com/gabrielecirulli/2048), released under the MIT licence.
