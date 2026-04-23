/* ========= LEVELS =========
 * Tile ids referenced by 'collect' objectives:
 *   wizardhat, wand, potion, snitch, spellbook, crystalball
 *
 * Objective types:
 *   { type:'score',   target: N }
 *   { type:'collect', tile:<id>, count: N }
 *   { type:'jinx',    count: N }
 *   { type:'golden',  count: N }   -- drop golden snitches to the bottom row
 */

window.NUTS = window.NUTS || {};

NUTS.levels = [
  /* Level 1 -- very gentle tutorial. Big move budget, tiny score target. */
  { id: 1,  name: "Ollivander's Orchard",  moves: 35, scoreStars: [1500, 3500, 6000],
    objectives: [{ type:'score', target: 1500 }] },

  { id: 2,  name: "Diagon Alley",          moves: 28, scoreStars: [4000, 7000, 11000],
    objectives: [{ type:'score', target: 4000 }] },

  { id: 3,  name: "Gringotts Grove",       moves: 24, scoreStars: [6000, 10000, 15000],
    objectives: [{ type:'collect', tile:'wizardhat', count: 12 }] },

  { id: 4,  name: "The Burrow Thicket",    moves: 24, scoreStars: [7000, 11000, 16000],
    objectives: [{ type:'collect', tile:'wand', count: 15 }] },

  { id: 5,  name: "Forbidden Forest",      moves: 22, scoreStars: [8000, 12000, 18000],
    objectives: [{ type:'jinx', count: 5 }],
    jinxSeeds: 5 },

  { id: 6,  name: "Hogsmeade Hollow",      moves: 22, scoreStars: [9000, 14000, 20000],
    objectives: [
      { type:'collect', tile:'potion', count: 12 },
      { type:'collect', tile:'snitch', count: 12 },
    ] },

  { id: 7,  name: "Great Hall Pantry",     moves: 22, scoreStars: [9000, 14000, 20000],
    objectives: [{ type:'golden', count: 2 }],
    goldenSeeds: 2 },

  { id: 8,  name: "Dumbledore's Study",    moves: 22, scoreStars: [10000, 16000, 24000],
    objectives: [{ type:'jinx', count: 8 }],
    jinxSeeds: 8 },

  { id: 9,  name: "Room of Requirement",   moves: 22, scoreStars: [11000, 17000, 25000],
    objectives: [
      { type:'collect', tile:'spellbook', count: 18 },
      { type:'score', target: 11000 },
    ] },

  { id: 10, name: "Chamber of Secrets",    moves: 22, scoreStars: [12000, 18000, 28000],
    objectives: [
      { type:'jinx', count: 6 },
      { type:'golden', count: 2 },
    ],
    jinxSeeds: 6, goldenSeeds: 2 },

  { id: 11, name: "Prefects' Parlour",     moves: 22, scoreStars: [13000, 20000, 30000],
    objectives: [{ type:'collect', tile:'crystalball', count: 20 }] },

  { id: 12, name: "Knockturn Alley",       moves: 22, scoreStars: [14000, 22000, 32000],
    objectives: [{ type:'jinx', count: 12 }],
    jinxSeeds: 12 },

  { id: 13, name: "Quidditch Pitch",       moves: 22, scoreStars: [15000, 23000, 34000],
    objectives: [
      { type:'collect', tile:'wizardhat', count: 18 },
      { type:'collect', tile:'wand', count: 18 },
    ] },

  { id: 14, name: "The Pensieve's Pool",   moves: 22, scoreStars: [16000, 25000, 36000],
    objectives: [
      { type:'golden', count: 3 },
      { type:'score', target: 16000 },
    ],
    goldenSeeds: 3 },

  { id: 15, name: "Azkaban Keep",          moves: 22, scoreStars: [17000, 26000, 38000],
    objectives: [
      { type:'jinx', count: 10 },
      { type:'collect', tile:'crystalball', count: 16 },
    ],
    jinxSeeds: 10 },

  { id: 16, name: "Department of Mysteries", moves: 22, scoreStars: [18000, 28000, 42000],
    objectives: [
      { type:'jinx', count: 10 },
      { type:'golden', count: 3 },
    ],
    jinxSeeds: 10, goldenSeeds: 3 },

  { id: 17, name: "Ministry of Magic",     moves: 22, scoreStars: [20000, 30000, 45000],
    objectives: [
      { type:'collect', tile:'potion', count: 22 },
      { type:'collect', tile:'spellbook', count: 22 },
    ] },

  { id: 18, name: "Spinner's End",         moves: 22, scoreStars: [22000, 32000, 48000],
    objectives: [
      { type:'jinx', count: 16 },
      { type:'score', target: 22000 },
    ],
    jinxSeeds: 16 },

  { id: 19, name: "Charles's Cauldron",    moves: 24, scoreStars: [24000, 35000, 52000],
    objectives: [
      { type:'golden', count: 4 },
      { type:'jinx', count: 10 },
      { type:'score', target: 24000 },
    ],
    jinxSeeds: 10, goldenSeeds: 4 },

  { id: 20, name: "Brandon's Boss Keep",   moves: 24, scoreStars: [28000, 42000, 60000],
    objectives: [
      { type:'jinx', count: 14 },
      { type:'golden', count: 4 },
      { type:'collect', tile:'snitch', count: 18 },
    ],
    jinxSeeds: 14, goldenSeeds: 4 },
];
