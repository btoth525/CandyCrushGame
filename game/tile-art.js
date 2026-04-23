/* ========= TILE ART =========
 * Inline SVG renderers for every tile type. Each returns a string of SVG
 * markup that gets injected straight into the tile DOM. Vector, scales
 * perfectly on any device, no HTTP requests.
 *
 * To swap a tile's art: replace the SVG string below, or point
 * textures.js at a PNG via the `image` field to override entirely.
 */
window.NUTS = window.NUTS || {};

NUTS.tileArt = {
  /* Wizard Hat -- the iconic pointed hat with stars and buckle */
  wizardhat: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hatG" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#7a3fd9"/>
      <stop offset="0.5" stop-color="#4b1ea0"/>
      <stop offset="1" stop-color="#1a0b38"/>
    </linearGradient>
    <linearGradient id="brimG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a1570"/>
      <stop offset="1" stop-color="#1a0b38"/>
    </linearGradient>
    <radialGradient id="starG" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.4" stop-color="#ffe68a"/>
      <stop offset="1" stop-color="#f4c542"/>
    </radialGradient>
  </defs>
  <!-- hat body with a slight curve -->
  <path d="M 50,6 Q 52,35 60,60 Q 70,76 82,82 L 18,82 Q 30,76 40,60 Q 48,35 50,6 Z"
        fill="url(#hatG)" stroke="#0b0420" stroke-width="2"/>
  <!-- inner shadow on hat -->
  <path d="M 50,6 Q 52,35 60,60 Q 70,76 82,82 L 50,82 Z"
        fill="#000" opacity="0.22"/>
  <!-- brim -->
  <ellipse cx="50" cy="84" rx="42" ry="8" fill="url(#brimG)" stroke="#0b0420" stroke-width="2"/>
  <ellipse cx="50" cy="82" rx="42" ry="4" fill="#5a2ba6" opacity="0.65"/>
  <!-- buckle band -->
  <path d="M 34,72 L 66,72 L 66,80 L 34,80 Z" fill="#2a1454" stroke="#0b0420" stroke-width="1"/>
  <!-- golden buckle -->
  <rect x="44" y="70" width="12" height="12" rx="1.5" fill="#ffd764" stroke="#7a5208" stroke-width="1.2"/>
  <rect x="47" y="72" width="6" height="8" rx="1" fill="none" stroke="#7a5208" stroke-width="1"/>
  <!-- stars -->
  <g fill="url(#starG)">
    <path d="M 40,32 l2,4.5 l4.8,0.6 l-3.5,3.3 l0.9,4.7 l-4.2,-2.4 l-4.2,2.4 l0.9,-4.7 l-3.5,-3.3 l4.8,-0.6 z"/>
    <path d="M 58,48 l1.4,3.2 l3.5,0.5 l-2.6,2.3 l0.7,3.4 l-3,-1.7 l-3,1.7 l0.7,-3.4 l-2.6,-2.3 l3.5,-0.5 z"/>
    <path d="M 45,18 l1,2.2 l2.4,0.3 l-1.7,1.7 l0.4,2.4 l-2.1,-1.2 l-2.1,1.2 l0.4,-2.4 l-1.7,-1.7 l2.4,-0.3 z"/>
  </g>
  <!-- highlight -->
  <path d="M 48,10 Q 46,30 40,50 Q 35,65 26,76" stroke="#c39bff" stroke-width="2" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>`,

  /* Magic Wand -- dark wood with glowing tip */
  wand: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wandG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5a3a14"/>
      <stop offset="0.45" stop-color="#8b6614"/>
      <stop offset="0.55" stop-color="#8b6614"/>
      <stop offset="1" stop-color="#2a1a08"/>
    </linearGradient>
    <radialGradient id="tipGlow" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.2" stop-color="#ffe68a" stop-opacity="0.95"/>
      <stop offset="0.7" stop-color="#f4c542" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#f4c542" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="rotate(-35 50 50)">
    <!-- wand shaft with tapered grip -->
    <path d="M 48,14 L 52,14 L 54,88 L 46,88 Z" fill="url(#wandG)" stroke="#1a0b08" stroke-width="1"/>
    <!-- grip wraps -->
    <rect x="45" y="74" width="10" height="2" fill="#2a1a08"/>
    <rect x="45" y="80" width="10" height="2" fill="#2a1a08"/>
    <rect x="45" y="86" width="10" height="2" fill="#2a1a08"/>
    <!-- carved runes -->
    <circle cx="50" cy="35" r="1.5" fill="#ffd764" opacity="0.9"/>
    <circle cx="50" cy="45" r="1.5" fill="#ffd764" opacity="0.9"/>
    <circle cx="50" cy="55" r="1.5" fill="#ffd764" opacity="0.9"/>
    <!-- glowing tip halo -->
    <circle cx="50" cy="14" r="22" fill="url(#tipGlow)"/>
    <!-- tip core -->
    <circle cx="50" cy="14" r="4" fill="#fff"/>
    <!-- sparkle rays -->
    <g stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.85">
      <line x1="50" y1="2"  x2="50" y2="8"/>
      <line x1="50" y1="20" x2="50" y2="26"/>
      <line x1="38" y1="14" x2="44" y2="14"/>
      <line x1="56" y1="14" x2="62" y2="14"/>
      <line x1="42" y1="6"  x2="46" y2="10"/>
      <line x1="54" y1="18" x2="58" y2="22"/>
      <line x1="42" y1="22" x2="46" y2="18"/>
      <line x1="54" y1="10" x2="58" y2="6"/>
    </g>
  </g>
</svg>`,

  /* Potion Bottle -- glowing green elixir */
  potion: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="potG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6cffca"/>
      <stop offset="0.4" stop-color="#00d4a3"/>
      <stop offset="1" stop-color="#073d2a"/>
    </linearGradient>
    <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="potGlow" cx="0.5" cy="0.7">
      <stop offset="0" stop-color="#6cffca" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#6cffca" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- ambient glow -->
  <circle cx="50" cy="70" r="36" fill="url(#potGlow)"/>
  <!-- bottle body with narrow neck -->
  <path d="M 42,26 L 42,46 Q 24,52 22,74 Q 20,94 50,94 Q 80,94 78,74 Q 76,52 58,46 L 58,26 Z"
        fill="url(#potG)" stroke="#051a10" stroke-width="2"/>
  <!-- glass highlight -->
  <path d="M 42,30 L 42,44 Q 26,50 26,72" stroke="url(#glassG)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- neck glass ring -->
  <rect x="40" y="22" width="20" height="5" rx="1" fill="#1f6b50" stroke="#051a10" stroke-width="1"/>
  <!-- cork -->
  <rect x="42" y="8" width="16" height="16" rx="2" fill="#8b6614" stroke="#3d2810" stroke-width="1.2"/>
  <rect x="43" y="11" width="14" height="2" fill="#6b4610" opacity="0.7"/>
  <rect x="43" y="16" width="14" height="2" fill="#6b4610" opacity="0.7"/>
  <!-- liquid shine -->
  <ellipse cx="38" cy="68" rx="4" ry="10" fill="#fff" opacity="0.35"/>
  <!-- bubbles -->
  <circle cx="50" cy="72" r="2.2" fill="#fff" opacity="0.75"/>
  <circle cx="60" cy="63" r="1.6" fill="#fff" opacity="0.7"/>
  <circle cx="44" cy="80" r="1.8" fill="#fff" opacity="0.8"/>
  <circle cx="65" cy="78" r="1.2" fill="#fff" opacity="0.6"/>
</svg>`,

  /* Golden Snitch -- winged glittering sphere */
  snitch: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="snitchG" cx="0.38" cy="0.28">
      <stop offset="0" stop-color="#fff6d0"/>
      <stop offset="0.35" stop-color="#ffd764"/>
      <stop offset="0.8" stop-color="#a37e1a"/>
      <stop offset="1" stop-color="#5a4208"/>
    </radialGradient>
    <linearGradient id="wingG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#c0c0d8" stop-opacity="0.6"/>
    </linearGradient>
    <radialGradient id="snitchGlow" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#ffd764" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffd764" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- aura -->
  <circle cx="50" cy="50" r="42" fill="url(#snitchGlow)"/>
  <!-- wings -->
  <g>
    <path d="M 32,48 Q 8,30 4,46 Q 6,58 22,56 Q 30,54 34,50 Z" fill="url(#wingG)" stroke="#a0a0b8" stroke-width="1"/>
    <path d="M 68,48 Q 92,30 96,46 Q 94,58 78,56 Q 70,54 66,50 Z" fill="url(#wingG)" stroke="#a0a0b8" stroke-width="1"/>
    <!-- wing veins -->
    <g stroke="#a0a0b8" stroke-width="0.6" fill="none" opacity="0.7">
      <path d="M 10,38 Q 22,46 32,50"/>
      <path d="M 8,46 Q 20,50 32,52"/>
      <path d="M 10,54 Q 22,56 32,54"/>
      <path d="M 90,38 Q 78,46 68,50"/>
      <path d="M 92,46 Q 80,50 68,52"/>
      <path d="M 90,54 Q 78,56 68,54"/>
    </g>
  </g>
  <!-- body -->
  <circle cx="50" cy="52" r="18" fill="url(#snitchG)" stroke="#5a4208" stroke-width="1.5"/>
  <!-- equator ridge -->
  <ellipse cx="50" cy="52" rx="18" ry="3" fill="none" stroke="#5a4208" stroke-width="0.8"/>
  <!-- vertical ridge -->
  <ellipse cx="50" cy="52" rx="3" ry="18" fill="none" stroke="#5a4208" stroke-width="0.5" opacity="0.6"/>
  <!-- wing hinges -->
  <circle cx="34" cy="50" r="2" fill="#a37e1a"/>
  <circle cx="66" cy="50" r="2" fill="#a37e1a"/>
  <!-- shine -->
  <ellipse cx="43" cy="45" rx="4.5" ry="6.5" fill="#fff" opacity="0.65"/>
  <circle cx="56" cy="56" r="1.5" fill="#fff" opacity="0.5"/>
</svg>`,

  /* Spellbook -- crimson tome with golden rune */
  spellbook: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bookG" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#b0294f"/>
      <stop offset="0.5" stop-color="#6b1230"/>
      <stop offset="1" stop-color="#3a0b1a"/>
    </linearGradient>
    <linearGradient id="spineG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b1230"/>
      <stop offset="1" stop-color="#1a0508"/>
    </linearGradient>
  </defs>
  <!-- pages bottom -->
  <rect x="14" y="84" width="72" height="6" fill="#f4e9d1" stroke="#b8a575" stroke-width="0.8"/>
  <rect x="14" y="85" width="72" height="1" fill="#d9c79a"/>
  <!-- cover -->
  <rect x="14" y="12" width="72" height="74" rx="3" fill="url(#bookG)" stroke="#0f0308" stroke-width="2"/>
  <!-- spine shadow -->
  <rect x="14" y="12" width="8" height="74" fill="url(#spineG)"/>
  <!-- decorative border -->
  <rect x="20" y="18" width="60" height="62" rx="1.5" fill="none" stroke="#ffd764" stroke-width="1.2"/>
  <rect x="22" y="20" width="56" height="58" rx="1" fill="none" stroke="#ffd764" stroke-width="0.5" stroke-dasharray="2 2"/>
  <!-- corner flourishes -->
  <g fill="#ffd764">
    <path d="M 22,22 l4,0 l0,1 l-3,0 l0,3 l-1,0 z"/>
    <path d="M 78,22 l-4,0 l0,1 l3,0 l0,3 l1,0 z"/>
    <path d="M 22,78 l4,0 l0,-1 l-3,0 l0,-3 l-1,0 z"/>
    <path d="M 78,78 l-4,0 l0,-1 l3,0 l0,-3 l1,0 z"/>
  </g>
  <!-- pentacle rune -->
  <g transform="translate(50,49)" fill="none" stroke="#ffd764" stroke-width="1.8" stroke-linejoin="round">
    <circle r="14"/>
    <path d="M 0,-14 L 8.3,11.3 L -13.3,-4.3 L 13.3,-4.3 L -8.3,11.3 Z"/>
  </g>
  <circle cx="50" cy="49" r="2.2" fill="#ffd764"/>
  <!-- glow behind rune -->
  <circle cx="50" cy="49" r="16" fill="#ffd764" opacity="0.12"/>
</svg>`,

  /* Crystal Ball -- swirling violet oracle */
  crystalball: `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ballG" cx="0.38" cy="0.32">
      <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
      <stop offset="0.3" stop-color="#d4b8ff" stop-opacity="0.85"/>
      <stop offset="0.7" stop-color="#6b21a8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#1a0838" stop-opacity="0.95"/>
    </radialGradient>
    <linearGradient id="standG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a37518"/>
      <stop offset="0.5" stop-color="#8b6614"/>
      <stop offset="1" stop-color="#3d2810"/>
    </linearGradient>
    <radialGradient id="ballGlow" cx="0.5" cy="0.5">
      <stop offset="0" stop-color="#c99bff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#6b21a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- ambient glow -->
  <circle cx="50" cy="46" r="42" fill="url(#ballGlow)"/>
  <!-- stand base -->
  <ellipse cx="50" cy="88" rx="28" ry="6" fill="#3d2810"/>
  <ellipse cx="50" cy="86" rx="28" ry="6" fill="url(#standG)" stroke="#1a0b08" stroke-width="1"/>
  <!-- stand legs -->
  <path d="M 30,80 L 26,90 L 74,90 L 70,80 Z" fill="url(#standG)" stroke="#1a0b08" stroke-width="1.2"/>
  <!-- stand claws gripping ball -->
  <path d="M 28,76 Q 34,68 42,72" stroke="#8b6614" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 72,76 Q 66,68 58,72" stroke="#8b6614" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M 50,76 L 50,70" stroke="#8b6614" stroke-width="2.5" stroke-linecap="round"/>
  <!-- the ball -->
  <circle cx="50" cy="46" r="32" fill="url(#ballG)" stroke="#0f0520" stroke-width="1.8"/>
  <!-- inner swirl -->
  <g fill="none" stroke="#e8d5ff" stroke-width="1.3" stroke-linecap="round" opacity="0.7">
    <path d="M 38,32 Q 54,44 64,32 Q 70,52 46,58 Q 34,52 38,40"/>
    <path d="M 34,48 Q 50,40 58,54"/>
  </g>
  <!-- stars inside -->
  <g fill="#ffd764">
    <circle cx="45" cy="42" r="1"/>
    <circle cx="58" cy="52" r="0.8"/>
    <circle cx="52" cy="60" r="1"/>
    <circle cx="40" cy="55" r="0.7"/>
  </g>
  <!-- highlight -->
  <ellipse cx="40" cy="34" rx="8" ry="12" fill="#fff" opacity="0.55"/>
  <circle cx="60" cy="58" r="2" fill="#fff" opacity="0.3"/>
</svg>`,
};
