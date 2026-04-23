# Charles & Brandon's Wizarding World of Nuts

A spellbound match-3 adventure built in vanilla HTML / CSS / JavaScript. No build step, no dependencies required to play. Ships as a static site, a Progressive Web App (installable to iOS / Android home screens), a Docker container for Unraid, and a Capacitor scaffold for building real Android APKs and iOS apps.

![Title screen](game/screenshots/title.svg)

## Quick play

```bash
# Open straight off disk:
open game/index.html

# Or serve locally (recommended for full PWA + audio behaviour):
cd game && python3 -m http.server 8000
# then visit http://localhost:8000
```

## Screenshots

### Gameplay
![Gameplay](game/screenshots/gameplay.svg)

### Level Map
![Map](game/screenshots/map.svg)

> Above are SVG preview cards. Replace with real PNG captures any time — drop them at `game/screenshots/<name>.png` and update the README links.

## Features

- **6 hand-drawn SVG tile types**: Wizard Hat, Magic Wand, Glowing Potion, Golden Snitch, Ancient Spellbook, Crystal Ball — crisp at any resolution
- **Animated castle scene**: Hogwarts-style silhouette with towers, bridge, waterfall, clock tower with moving hands, flickering windows, floating candles, aurora shimmer, shooting stars and lightning
- **20 hand-crafted levels** along The Enchanted Nut Path, each with star ratings (1–3 ⭐). Level 1 is a gentle tutorial (35 moves, 1,500 pts)
- **Four objective types**: score, collect-N-of-tile, clear jinxed tiles, drop golden snitches to the bottom row
- **Match-3 engine** with cascading drops, chain combos, and screen shake on big chains
- **Special tiles**: Bombarda (match 4 → row/column clear), Patronus (match 5 → clear all of one colour), Patronus + Patronus → whole-board clear
- **Obstacles**: jinxed tiles (purple-hexed; weakened by adjacent matches), golden snitches (drop to bottom)
- **3D board**: CSS perspective with lift-on-hover and idle "breathing" animation
- **Cinematic title**: staggered letter fade-in with animated specular sweep
- **FX**: 14-particle bursts per match, coloured shockwave rings on every special, full-screen lightning on 4+ combos and Patronus activations, rotating rune ring around the board
- **Cinematic music**: four-voice looping score in A minor — sweeping saw pad, triangle arpeggios, lead + sub bass + synth drums. All pure Web Audio, no files
- **localStorage save**, **responsive mobile+desktop**, **offline PWA**, installable to iOS and Android home screens

---

## Hosting on Unraid (one container, prebuilt image)

The container is **published to GHCR automatically** by `.github/workflows/docker-publish.yml` on every push to `main` and `claude/**`. Multi-arch (`amd64` + `arm64`).

```
ghcr.io/btoth525/wizarding-nuts:latest
```

### Easiest install — Unraid template

```bash
# On your Unraid box (one-time):
wget -O /boot/config/plugins/dockerMan/templates-user/wizarding-nuts.xml \
  https://raw.githubusercontent.com/btoth525/CandyCrushGame/claude/match-3-game-SHJ92/deploy/unraid-template.xml
```

Then in the Unraid web UI: **Docker tab → Add Container → Template dropdown → Wizarding-Nuts**. Set `ADMIN_TOKEN` to a random string (`openssl rand -hex 32` to generate). Hit Apply. Visit `http://<unraid-ip>:8080`.

> **One-time GHCR setting**: after the first GitHub Actions run, the container package starts as **private**. Visit https://github.com/users/btoth525/packages/container/wizarding-nuts/settings → Danger Zone → Change visibility → **Public**. That lets Unraid pull anonymously. (If you'd rather keep it private, set up an Unraid Docker Hub-style credential pointing at `ghcr.io` with username `btoth525` and a personal access token with `read:packages` scope.)

### Plain Docker (anywhere)

```bash
docker run -d --name wizarding-nuts \
  -p 8080:3000 \
  -v /mnt/user/appdata/wizarding-nuts:/data \
  -e ADMIN_TOKEN=$(openssl rand -hex 32) \
  --restart unless-stopped \
  ghcr.io/btoth525/wizarding-nuts:latest
```

That's it. One container holds:
- The match-3 game frontend
- The admin panel
- The Express API (accounts, leaderboards, cloud save, daily challenge)
- The SQLite database, persisted to `/data`

### Build locally instead of pulling

```bash
docker compose up -d --build           # server mode (default)
docker compose --profile static up -d  # legacy static-only mode
```

The `static` profile is the old nginx-only image (no leaderboards). Useful if you want a single-player deploy without a Node process running.

### Option B — Unraid Docker tab template

1. Build and push the image to a registry (one time):
   ```bash
   docker build -t YOURDOCKERHUB/wizarding-nuts:latest .
   docker push YOURDOCKERHUB/wizarding-nuts:latest
   ```
2. Edit `deploy/unraid-template.xml` and replace `yourname/wizarding-nuts:latest` with your repository.
3. Copy the file to your Unraid server at `/boot/config/plugins/dockerMan/templates-user/`.
4. Open the Docker tab → **Add Container** → choose **Wizarding-Nuts**.
5. Pick a port and hit Apply.

### Option C — Pure Docker

```bash
docker build -t wizarding-nuts .
docker run -d --name wizarding-nuts -p 8080:80 --restart unless-stopped wizarding-nuts
```

The container is **stateless** — no volumes needed. All save data lives in the player's browser via `localStorage`.

---

## Cross-platform: iOS & Android

The game is a PWA out of the box, so the **easiest cross-platform path** is "Add to Home Screen."

### Path 1 — PWA (zero extra work)

After hosting the site on your Unraid box (or anywhere with HTTPS):

- **iOS / iPadOS**: open the URL in **Safari** → tap Share → **Add to Home Screen**. Launches fullscreen, no browser chrome, custom icon, works offline.
- **Android (Chrome / Edge / Brave)**: open the URL → menu → **Install app**. Lands as a real launcher icon, fullscreen.
- **Desktop (Chrome / Edge)**: install icon appears in the address bar.

This is the recommended path because:
- No app store review
- Updates ship instantly (just push new files; the service worker picks them up)
- Works on iOS without a Mac or Apple Developer account
- Works on Android without Google Play

> **Note for iOS:** PWAs only get the full home-screen install experience from Safari (not Chrome on iOS). The site must be served over **HTTPS** on a real domain (or `localhost` for testing) — plain `http://192.168.x.x` will not let you install. Easiest options on Unraid: SWAG / NPM (Nginx Proxy Manager) reverse proxy with a Let's Encrypt cert.

### Path 2 — Real Android APK (Capacitor)

If you want a sideloadable `.apk` (or to publish to the Play Store), the repo includes a Capacitor scaffold.

**One-time setup on your dev machine:**
- Install [Node.js 18+](https://nodejs.org)
- Install [Java 17 (Temurin)](https://adoptium.net)
- Install [Android Studio](https://developer.android.com/studio) and let it install the SDK
- Set `$ANDROID_HOME` to the SDK path (Android Studio shows it under Settings → Languages & Frameworks → Android SDK)

**Build the APK:**

```bash
npm install            # one-time
npm run build:apk      # builds android/app/build/outputs/apk/debug/app-debug.apk
```

The script handles `cap add android`, `cap sync`, and `gradlew assembleDebug`. Sideload onto a phone with:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For a release / signed APK or AAB for the Play Store, open the project in Android Studio:

```bash
npm run cap:open-android
```

…and use **Build → Generate Signed Bundle / APK**.

### Path 3 — iOS .ipa (Capacitor, requires a Mac)

Apple's tooling only runs on macOS, so this path needs a Mac with Xcode installed.

```bash
npm install
npm run cap:add-ios
npm run cap:open-ios
```

That opens Xcode. From there you can run on a simulator, sideload onto a connected device (free Apple ID lasts 7 days), or archive for the App Store ($99/year Apple Developer account).

---

## File layout

```
.
├── game/                          # The web app (everything you need to host)
│   ├── index.html
│   ├── styles.css
│   ├── textures.js                # The ONE file you edit to re-skin tiles
│   ├── levels.js                  # Level definitions
│   ├── audio.js                   # WebAudio-synthesised SFX + music
│   ├── game.js                    # Match-3 engine
│   ├── ui.js                      # Screens, modals, HUD
│   ├── main.js                    # State machine + save/load + SW registration
│   ├── manifest.webmanifest       # PWA manifest
│   ├── sw.js                      # Service worker (offline cache)
│   ├── icons/                     # App icons (192/512 PNG, maskable, apple-touch, favicons)
│   ├── assets/                    # Drop tile images here (optional)
│   └── screenshots/               # README preview images
│
├── Dockerfile                     # nginx:alpine + the game/ directory
├── docker-compose.yml             # One-command run for Unraid
├── deploy/
│   ├── nginx.conf                 # PWA-aware nginx config
│   └── unraid-template.xml        # Unraid Docker tab template
│
├── package.json                   # Capacitor deps + npm scripts
├── capacitor.config.json          # Capacitor app config
└── scripts/
    └── build-android.sh           # One-shot APK builder
```

## Server mode — leaderboards, accounts, cloud save, daily

When you run the `server` profile, the title screen sprouts three new buttons (auto-hidden in static mode):

- **🏆 Leaderboards** — global (all-levels combined) and per-level rankings. Filter by all-time / weekly / last-24h. Top 3 get gold/silver/bronze borders. Your row glows gold.
- **🌙 Daily Spell** — a server-seeded level that's the same for every player worldwide that day. Compete for the top score in 24 hours.
- **👤 Wizard Profile** — claim a unique handle, set a display name, sign out.

### How the API works

Single-file Express server in `server/server.js`, SQLite via `better-sqlite3`, no other infra:

| Endpoint | What it does |
|---|---|
| `GET  /api/ping` | Health check (also used by client to detect server mode) |
| `POST /api/auth/register` `{name}` | Claim a unique wizard name, returns a bearer token |
| `GET  /api/me` | Current profile |
| `POST /api/me` `{displayName, house}` | Update profile |
| `POST /api/scores` `{level, score, stars, moves}` | Submit a score, returns your rank |
| `GET  /api/leaderboard?level=N&period=all\|weekly\|daily` | Per-level top-25 |
| `GET  /api/leaderboard/global?period=...` | Sum-of-bests global ranking |
| `GET  /api/save` / `PUT /api/save` | Cloud-sync the localStorage progress blob |
| `GET  /api/daily` | Today's daily challenge level definition |

### Cloud save

When a player logs in on a new device, the game pulls their cloud save and merges it with whatever's local (highest stars and best score per level always win). Every level win pushes the updated save back to the server.

### Anti-cheat (light)

- Auth tokens are SHA-256 hashed in the DB
- Per-IP rate limits on every write endpoint
- Score / level / stars range-validated server-side
- Score submission requires a valid bearer token

This is "casual-friends" anti-cheat, not bank-grade. If you need bullet-proof, add server-side gameplay validation later (replay sigs, etc).

### Backups

Just copy `./data/wizarding.db`. SQLite plays nice with `cp` while the server is running because of WAL mode, but for a guaranteed-consistent backup either stop the container briefly or use `sqlite3 wizarding.db ".backup /path/to/copy.db"`.

## Admin Panel — GUI customisation (no code)

Open **`game/admin.html`** in your browser (or click the **⚙ Admin Panel** button on the title screen). Tabs:

- **🪄 Tiles** — for each of the 6 tiles: edit the name, glyph (emoji), background colour, rim colour. Drag any PNG/JPG straight onto the drop zone to set a custom tile picture; live preview updates instantly.
- **🏰 Branding** — change the game title, tagline, and chapter prefix. Drag a castle photo onto the big drop zone to use it as the sky backdrop. Slider controls how much darkening overlay sits on top.
- **📜 Levels** — edit each level's name, move budget, and 1★/2★/3★ score thresholds.
- **🔊 Audio** — set default SFX/music on/off and volumes for new players.
- **👁 Live Preview** — embedded iframe of the game; reloads on save (Cmd/Ctrl+S also saves).

**Save & Apply** writes everything to your browser's `localStorage`. **Export JSON** downloads a backup file (drop it back in via **Import JSON** anywhere). **Reset Defaults** wipes all customisations.

### Pushing changes to everyone (server mode)

If you're running the **server profile** and you've set the `ADMIN_TOKEN` environment variable on the container, the admin panel sprouts a **📡 Server** tab and a **📡 Push to Server** button.

1. Generate a long random token: `openssl rand -hex 32`
2. Set it as `ADMIN_TOKEN` on the Wizarding-Nuts container (Unraid → edit container → add a variable, or in `docker-compose.yml`)
3. Restart the container
4. Open the admin panel → **📡 Server** tab → paste the token → **Push Current Config to Server**

The container saves your config to `/data/config.json` (lives on your Unraid appdata share). From then on, **every visitor's game fetches that file on boot** and uses it as the base — your tile renames, custom photos, level tweaks, the lot. Each visitor's own browser admin tweaks still layer on top of yours.

You can also **Pull Server Config** to load the live one back into the editor, or **Clear Server Config** to revert everyone to bundled defaults.

If you're not running server mode, the same admin still works — your changes just live in your browser only. Use **Export JSON** and commit the file to `game/config.json` in the repo if you want to ship it.

## Re-skinning the game

Open `game/textures.js`. Each tile is a single object:

```js
{
  id: 'wizardhat',
  label: 'Wizard Hat',
  glyph: '🎩',                      // emoji fallback
  image: 'assets/wizardhat.png',    // highest priority (your own PNG)
  svgArt: 'wizardhat',              // key in tile-art.js (hand-drawn SVG)
  color: '#3a1570',                 // background tint
  bg:    '#1a0b38',                 // contrast rim
}
```

**Priority**: `image` > `svgArt` > `glyph`. The default ships with detailed hand-drawn SVG, so tiles look great out of the box. Drop a square transparent PNG (128×128 or larger) into `game/assets/` to override any tile with your own art.

### Use your own castle photo as the backdrop

The game ships with a fully animated hand-drawn castle scene. If you have a licensed photo you prefer (your own photography, a [Creative Commons image of Alnwick Castle, Neuschwanstein, or Edinburgh Castle](https://commons.wikimedia.org/wiki/Category:Castles) from Wikimedia Commons, or a free CC0 Unsplash / Pexels photo), you can use it as the backdrop:

1. Put the file in `game/assets/` (e.g. `my-castle.jpg`)
2. Open `game/textures.js` and set `backgroundImage: "assets/my-castle.jpg"` in the `NUTS.branding` block
3. Reload

The photo becomes the sky backdrop while the animated canvas effects — moon, aurora, lightning, particles, fog, floating candles, shooting stars — continue to overlay on top for cinematic atmosphere. Adjust `backgroundOverlayOpacity` (0–1) in the same block if the overlay is too dark or too light.

> **Important:** only use images you have the right to use. Hogwarts castle renders from the films and the *Hogwarts Legacy* game are copyright of Warner Bros. / Portkey Games and cannot be redistributed. Real-world castles (Alnwick, Eilean Donan, Neuschwanstein, etc.) have loads of free CC0 / CC-BY photography on Wikimedia Commons and Unsplash — any of those will give you the Hogwarts vibe legitimately.

`NUTS.branding` at the bottom of `textures.js` also controls the title, tagline, and chapter prefix shown in-game.

## Adding levels

Append to the `NUTS.levels` array in `game/levels.js`:

```js
{
  id: 21,
  name: "New Chapter Name",
  moves: 22,
  scoreStars: [10000, 18000, 28000],
  objectives: [
    { type: 'score',   target: 10000 },
    { type: 'collect', tile: 'pecan', count: 20 },
    { type: 'jinx',    count: 8 },
    { type: 'golden',  count: 3 },
  ],
  jinxSeeds: 8,
  goldenSeeds: 3,
}
```

## Controls

- **Click / tap** a tile to select, then click an adjacent tile to swap
- **Pause** button → settings, quit to map, or resume
- **Reset Progress** on the title screen wipes stars and best scores

## Credits

Brewed by **Charles & Brandon** in the Great Nuttery.
