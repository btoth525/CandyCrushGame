/* ========= TEXTURES =========
 * This is the ONE file you edit to re-skin the game.
 *
 * For each tile:
 *   - glyph: the emoji/text used if no image is provided
 *   - image: path to a PNG/SVG in ./assets/ (preferred over glyph when set)
 *   - color: the tile's background tint
 *   - bg:    a darker rim color for contrast
 *
 * Tile images should be square, transparent-background PNGs, ideally 128x128
 * or larger. The engine scales them to fit automatically.
 *
 * To add more tile types just append more entries (minimum 5).
 */

window.NUTS = window.NUTS || {};

NUTS.tileTypes = [
  {
    id: 'acorn',
    label: 'Enchanted Acorn',
    glyph: '🌰',
    image: 'assets/acorn.png',
    color: '#8b5a2b',
    bg: '#3a2416',
  },
  {
    id: 'walnut',
    label: 'Bewitched Walnut',
    glyph: '🥜',
    image: 'assets/walnut.png',
    color: '#c08552',
    bg: '#402a15',
  },
  {
    id: 'chestnut',
    label: "Merlin's Chestnut",
    glyph: '🟤',
    image: 'assets/chestnut.png',
    color: '#6b3410',
    bg: '#2b1a0c',
  },
  {
    id: 'hazelnut',
    label: "Hermione's Hazelnut",
    glyph: '🟠',
    image: 'assets/hazelnut.png',
    color: '#d97706',
    bg: '#4a2a0a',
  },
  {
    id: 'pecan',
    label: 'Patronus Pecan',
    glyph: '🟡',
    image: 'assets/pecan.png',
    color: '#eab308',
    bg: '#4a3a0a',
  },
  {
    id: 'almond',
    label: 'Alchemist Almond',
    glyph: '⚪',
    image: 'assets/almond.png',
    color: '#e0d4b8',
    bg: '#3a3428',
  },
];

/* Special tile overlays -- normally you don't need to edit these */
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
};
