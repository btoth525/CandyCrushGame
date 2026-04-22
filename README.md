# Charles & Brandon's Wizarding World of Nuts

A spellbound match-3 adventure built in vanilla HTML / CSS / JavaScript. No build step, no dependencies, no server required — open `game/index.html` and play.

![Title screen](game/screenshots/title.svg)

## Play it now

```
open game/index.html
```

…or any equivalent on your platform. Works in Chrome, Firefox, Safari, and Edge. Touch and mouse both supported.

If you want to serve it over HTTP (recommended for the best audio behaviour):

```
cd game && python3 -m http.server 8000
# then visit http://localhost:8000
```

## Screenshots

### Gameplay
![Gameplay](game/screenshots/gameplay.svg)

### Level Map
![Map](game/screenshots/map.svg)

> The screenshots above are SVG preview cards that mirror the in-game look. Replace them with real PNG captures any time — just drop them at `game/screenshots/<name>.png` and update the README links.

## Features

- **20 hand-crafted levels** along The Enchanted Nut Path, each with star ratings (1–3 ⭐)
- **Four objective types**: score targets, collect-N-of-tile, clear jinxed tiles, drop golden acorns to the bottom row
- **Match-3 engine** with cascading drops, chain combos, and screen shake on big chains
- **Special tiles**:
  - **Bombarda** (match 4) — clears the entire row or column
  - **Patronus** (match 5) — clears every tile of a chosen colour
  - **Patronus + Patronus** (special-special swap) — clears the whole board
- **Obstacles**:
  - **Jinxed tiles** — purple-hexed; weakened by adjacent matches
  - **Golden acorns** — fall with gravity, scored when they reach the bottom
- **Polish**: particle bursts, floating score popups, animated combo banner, star-reveal on win, level-name bar
- **Settings**: SFX on/off, music on/off, independent volume sliders
- **Synthesised audio** — every sound and the background music are generated live with Web Audio (no asset files to ship)
- **localStorage save** — stars, best scores, and settings persist between sessions
- **Responsive** — desktop and mobile layouts; pointer + touch input

## File layout

```
game/
├── index.html           # Page shell
├── styles.css           # All styling
├── textures.js          # The ONE file you edit to re-skin tiles
├── levels.js            # Level definitions (objectives, moves, star thresholds)
├── audio.js             # WebAudio-synthesised SFX + background music
├── game.js              # Match-3 engine: board, matches, specials, gravity
├── ui.js                # Screens, modals, HUD, objectives chips
├── main.js              # State machine, save/load, event wiring
├── assets/              # Drop tile images here (optional)
└── screenshots/         # Preview images used in this README
```

## Re-skinning the game

Open `game/textures.js`. Each tile is a single object:

```js
{
  id: 'acorn',
  label: 'Enchanted Acorn',
  glyph: '🌰',                  // fallback if image is missing
  image: 'assets/acorn.png',    // preferred when present
  color: '#8b5a2b',             // background tint of the tile
  bg:    '#3a2416',             // contrast rim
}
```

To re-skin:

1. Drop a square, transparent-background PNG (128×128 or larger) into `game/assets/`.
2. Set its path on the matching `image` field.
3. Reload. Done.

The engine prefers `image` when present and silently falls back to `glyph` if the file fails to load.

The `NUTS.branding` block at the bottom of the same file controls the title, tagline, and chapter prefix shown in-game.

## Adding levels

Append to the `NUTS.levels` array in `game/levels.js`. Each level:

```js
{
  id: 21,
  name: "New Chapter Name",
  moves: 22,
  scoreStars: [10000, 18000, 28000],   // 1★ / 2★ / 3★ thresholds
  objectives: [
    { type: 'score', target: 10000 },
    { type: 'collect', tile: 'pecan', count: 20 },
    { type: 'jinx', count: 8 },
    { type: 'golden', count: 3 },
  ],
  jinxSeeds: 8,        // how many jinxed tiles to seed
  goldenSeeds: 3,      // how many golden acorns to seed
}
```

## Controls

- **Click / tap** a tile to select, then click an adjacent tile to swap
- **Pause** button → settings, quit to map, or resume
- **Reset Progress** on the title screen wipes stars and best scores

## Credits

Brewed by **Charles & Brandon** in the Great Nuttery.
