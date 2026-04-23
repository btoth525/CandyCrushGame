/* ========= TEXTURES =========
 * This is the ONE file you edit to re-skin the game.
 *
 * For each tile:
 *   - id, label: identity
 *   - glyph: emoji fallback used if neither `image` nor `svgArt` is set
 *   - image: path to a PNG/SVG file in ./assets/ (highest priority)
 *   - svgArt: key into NUTS.tileArt -- inline SVG (default path used here)
 *   - color/bg: background tint
 *
 * Priority: image > svgArt > glyph.
 */

window.NUTS = window.NUTS || {};

NUTS.tileTypes = [
  {
    id: 'wizardhat',
    label: 'Wizard Hat',
    glyph: '🎩',
    image: 'assets/wizardhat.png',
    svgArt: 'wizardhat',
    color: '#3a1570',
    bg: '#1a0b38',
  },
  {
    id: 'wand',
    label: 'Magic Wand',
    glyph: '🪄',
    image: 'assets/wand.png',
    svgArt: 'wand',
    color: '#5a3a14',
    bg: '#2a1a08',
  },
  {
    id: 'potion',
    label: 'Glowing Potion',
    glyph: '🧪',
    image: 'assets/potion.png',
    svgArt: 'potion',
    color: '#0a4836',
    bg: '#051a10',
  },
  {
    id: 'snitch',
    label: 'Golden Snitch',
    glyph: '✨',
    image: 'assets/snitch.png',
    svgArt: 'snitch',
    color: '#8b6410',
    bg: '#3d2810',
  },
  {
    id: 'spellbook',
    label: 'Ancient Spellbook',
    glyph: '📖',
    image: 'assets/spellbook.png',
    svgArt: 'spellbook',
    color: '#6b1230',
    bg: '#1a0508',
  },
  {
    id: 'crystalball',
    label: 'Crystal Ball',
    glyph: '🔮',
    image: 'assets/crystalball.png',
    svgArt: 'crystalball',
    color: '#1d3a8a',
    bg: '#0a1840',
  },
];

NUTS.specials = {
  striped_h: { glyph: '', label: 'Bombarda (row)' },
  striped_v: { glyph: '', label: 'Bombarda (column)' },
  wrapped:   { glyph: '💥', label: 'Incendio' },
  colorbomb: { glyph: '✨', label: 'Patronus' },
};

NUTS.branding = {
  title: "Charles & Brandon's Wizarding World of Nuts",
  tagline: "A Match-3 Spellbound Adventure",
  levelNamePrefix: "Chapter",
  /* Drop your OWN castle photo here.
   *   - Put any .jpg/.png in  game/assets/
   *   - Set the path below (e.g. "assets/my-castle.jpg")
   *   - Leave "" to use the built-in animated castle scene
   * The image fades in as the sky backdrop; the animated canvas effects
   * (moon, aurora, lightning, particles, fog) still overlay on top.
   * Use your own photography or a CC0 source (Unsplash / Wikimedia Commons). */
  backgroundImage: "",
  backgroundOverlayOpacity: 0.45,
};
