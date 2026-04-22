/* ========= LEVELS =========
 * Each level:
 *   id:         number
 *   name:       display name
 *   moves:      allowed moves
 *   scoreStars: [one-star, two-star, three-star] thresholds
 *   objectives: array of objective objects
 *
 * Objective types:
 *   { type:'score', target: N }                    -- reach N points
 *   { type:'collect', tile:'acorn', count: N }     -- match N of a specific tile
 *   { type:'jinx',   count: N }                    -- clear N jinxed tiles
 *   { type:'golden', count: N }                    -- drop N golden acorns to bottom row
 *
 * A level is WON when every objective is met before moves run out.
 */

window.NUTS = window.NUTS || {};

NUTS.levels = [
  { id: 1,  name: "Ollivander's Orchard",  moves: 25, scoreStars: [3000, 5000, 8000],
    objectives: [{ type:'score', target: 3000 }] },

  { id: 2,  name: "Diagon Alley",          moves: 24, scoreStars: [5000, 8000, 12000],
    objectives: [{ type:'score', target: 5000 }] },

  { id: 3,  name: "Gringotts Grove",       moves: 22, scoreStars: [6000, 10000, 15000],
    objectives: [{ type:'collect', tile:'acorn', count: 15 }] },

  { id: 4,  name: "The Burrow Thicket",    moves: 22, scoreStars: [7000, 11000, 16000],
    objectives: [{ type:'collect', tile:'walnut', count: 18 }] },

  { id: 5,  name: "Forbidden Forest",      moves: 20, scoreStars: [8000, 12000, 18000],
    objectives: [{ type:'jinx', count: 6 }],
    jinxSeeds: 6 },

  { id: 6,  name: "Hogsmeade Hollow",      moves: 22, scoreStars: [9000, 14000, 20000],
    objectives: [
      { type:'collect', tile:'chestnut', count: 12 },
      { type:'collect', tile:'hazelnut', count: 12 },
    ] },

  { id: 7,  name: "Great Hall Pantry",     moves: 20, scoreStars: [9000, 14000, 20000],
    objectives: [{ type:'golden', count: 2 }],
    goldenSeeds: 2 },

  { id: 8,  name: "Dumbledore's Study",    moves: 20, scoreStars: [10000, 16000, 24000],
    objectives: [{ type:'jinx', count: 10 }],
    jinxSeeds: 10 },

  { id: 9,  name: "Room of Requirement",   moves: 22, scoreStars: [11000, 17000, 25000],
    objectives: [
      { type:'collect', tile:'pecan', count: 20 },
      { type:'score', target: 11000 },
    ] },

  { id: 10, name: "Chamber of Snacks",     moves: 20, scoreStars: [12000, 18000, 28000],
    objectives: [
      { type:'jinx', count: 6 },
      { type:'golden', count: 2 },
    ],
    jinxSeeds: 6, goldenSeeds: 2 },

  { id: 11, name: "Prefects' Pantry",      moves: 22, scoreStars: [13000, 20000, 30000],
    objectives: [{ type:'collect', tile:'almond', count: 24 }] },

  { id: 12, name: "Knockturn Nuttery",     moves: 20, scoreStars: [14000, 22000, 32000],
    objectives: [{ type:'jinx', count: 14 }],
    jinxSeeds: 14 },

  { id: 13, name: "Quidditch Pitch Stash", moves: 22, scoreStars: [15000, 23000, 34000],
    objectives: [
      { type:'collect', tile:'acorn', count: 20 },
      { type:'collect', tile:'walnut', count: 20 },
    ] },

  { id: 14, name: "The Pensieve's Pool",   moves: 22, scoreStars: [16000, 25000, 36000],
    objectives: [
      { type:'golden', count: 3 },
      { type:'score', target: 16000 },
    ],
    goldenSeeds: 3 },

  { id: 15, name: "Azkaban Almond Tower",  moves: 20, scoreStars: [17000, 26000, 38000],
    objectives: [
      { type:'jinx', count: 12 },
      { type:'collect', tile:'almond', count: 18 },
    ],
    jinxSeeds: 12 },

  { id: 16, name: "Department of Morsels", moves: 22, scoreStars: [18000, 28000, 42000],
    objectives: [
      { type:'jinx', count: 10 },
      { type:'golden', count: 3 },
    ],
    jinxSeeds: 10, goldenSeeds: 3 },

  { id: 17, name: "Ministry of Munchies",  moves: 20, scoreStars: [20000, 30000, 45000],
    objectives: [
      { type:'collect', tile:'chestnut', count: 24 },
      { type:'collect', tile:'pecan', count: 24 },
    ] },

  { id: 18, name: "Spinner's End Silo",    moves: 20, scoreStars: [22000, 32000, 48000],
    objectives: [
      { type:'jinx', count: 18 },
      { type:'score', target: 22000 },
    ],
    jinxSeeds: 18 },

  { id: 19, name: "Charles's Cauldron",    moves: 22, scoreStars: [24000, 35000, 52000],
    objectives: [
      { type:'golden', count: 4 },
      { type:'jinx', count: 10 },
      { type:'score', target: 24000 },
    ],
    jinxSeeds: 10, goldenSeeds: 4 },

  { id: 20, name: "Brandon's Boss Keep",   moves: 22, scoreStars: [28000, 42000, 60000],
    objectives: [
      { type:'jinx', count: 16 },
      { type:'golden', count: 4 },
      { type:'collect', tile:'hazelnut', count: 20 },
    ],
    jinxSeeds: 16, goldenSeeds: 4 },
];
