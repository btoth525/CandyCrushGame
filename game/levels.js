/* ========= LEVELS =========
 * Tile ids referenced by 'collect' objectives:
 *   wizardhat, wand, potion, snitch, spellbook, crystalball
 *
 * Objective types:
 *   { type:'score',   target: N }
 *   { type:'collect', tile:<id>, count: N }
 *   { type:'jinx',    count: N }
 *   { type:'golden',  count: N }   -- drop golden snitches to the bottom row
 *
 * Story lines (intro/win/lose) are editable from the Admin Panel
 * Levels tab. They support the placeholder {name} which expands to
 * the player's wizard name.
 */

window.NUTS = window.NUTS || {};

NUTS.levels = [
  { id: 1, name: "Ollivander's Orchard", moves: 35, scoreStars: [1500, 3500, 6000],
    objectives: [{ type:'score', target: 1500 }],
    story: {
      intro: "First day of wizarding school, {name}. Try not to set your own robes on fire. Match three wands, hats, or potions to cast a spell.",
      win:   "The wand chose you. Or it just liked your aim. Either way, smashing start.",
      lose:  "Even the great wizards once set their eyebrows ablaze. Have another go."
    }},

  { id: 2, name: "Diagon Alley", moves: 28, scoreStars: [4000, 7000, 11000],
    objectives: [{ type:'score', target: 4000 }],
    story: {
      intro: "Crowded alley, pickpocket gnomes everywhere. Keep your coin pouch closed and your combos open.",
      win:   "You haggled like a goblin. Merchants wept. Coins pouch: heavier.",
      lose:  "A gnome sold you a wand made of spaghetti. Try the real shop this time."
    }},

  { id: 3, name: "Gringotts Grove", moves: 24, scoreStars: [6000, 10000, 15000],
    objectives: [{ type:'collect', tile:'wizardhat', count: 12 }],
    story: {
      intro: "Twelve pointy hats in the goblin vaults. Collect them before the guard dragon wakes.",
      win:   "You out-foxed a goblin and a dragon. Very few wizards can claim that.",
      lose:  "The dragon yawned. The dragon YAWNED. Humiliating, {name}."
    }},

  { id: 4, name: "The Burrow Thicket", moves: 24, scoreStars: [7000, 11000, 16000],
    objectives: [{ type:'collect', tile:'wand', count: 15 }],
    story: {
      intro: "A cozy thicket full of runaway wands. Fifteen of them need rounding up. Please don't start a duel.",
      win:   "Wands up, {name}. You're a natural at sheepherding the magical kind.",
      lose:  "You confused Lumos with Reducto. The thicket has some notes for you."
    }},

  { id: 5, name: "Forbidden Forest", moves: 22, scoreStars: [8000, 12000, 18000],
    objectives: [{ type:'jinx', count: 5 }], jinxSeeds: 5,
    story: {
      intro: "Five jinxed tiles lurk in the dark. Match tiles NEXT to them to break the curse.",
      win:   "Jinxes broken, dignity (mostly) intact. The centaurs are impressed.",
      lose:  "The forest reclaims those who cannot match three. Also: dignity: gone."
    }},

  { id: 6, name: "Hogsmeade Hollow", moves: 22, scoreStars: [9000, 14000, 20000],
    objectives: [
      { type:'collect', tile:'potion', count: 12 },
      { type:'collect', tile:'snitch', count: 12 },
    ],
    story: {
      intro: "The pub needs twelve potions and twelve snitches for the house special. Don't ask what's in it.",
      win:   "Butterbeer for everyone! Pretty sure you didn't sign a tab though.",
      lose:  "The bartender raised an eyebrow. THE eyebrow. That one. You know the one."
    }},

  { id: 7, name: "Great Hall Pantry", moves: 22, scoreStars: [9000, 14000, 20000],
    objectives: [{ type:'golden', count: 2 }], goldenSeeds: 2,
    story: {
      intro: "Drop two golden snitches to the bottom row. The house-elves are very particular about this.",
      win:   "The chefs applauded. Pudding privileges: granted for life.",
      lose:  "The cauldron belched soot. You're banned from the kitchens until Tuesday."
    }},

  { id: 8, name: "Dumbledore's Study", moves: 22, scoreStars: [10000, 16000, 24000],
    objectives: [{ type:'jinx', count: 8 }], jinxSeeds: 8,
    story: {
      intro: "The headmaster left eight jinxes to untangle. He believes in you. Mostly.",
      win:   "The portraits gave a standing ovation. Yes. The portraits.",
      lose:  "The phoenix shed a single feather. Very subtle. Very pointed."
    }},

  { id: 9, name: "Room of Requirement", moves: 22, scoreStars: [11000, 17000, 25000],
    objectives: [
      { type:'collect', tile:'spellbook', count: 18 },
      { type:'score', target: 11000 },
    ],
    story: {
      intro: "Need eighteen spellbooks AND a high score? The room provides. Eventually. If it feels like it.",
      win:   "Knowledge is power. Power is points. Points are knowledge. It's a wheel.",
      lose:  "The room turned into a broom cupboard out of pity. Retry with vigor."
    }},

  { id: 10, name: "Chamber of Secrets", moves: 22, scoreStars: [12000, 18000, 28000],
    objectives: [
      { type:'jinx', count: 6 },
      { type:'golden', count: 2 },
    ], jinxSeeds: 6, goldenSeeds: 2,
    story: {
      intro: "Six jinxes and two golden snitches. Whatever you do, don't open anything you can't close.",
      win:   "The chamber gave a small nod of respect. Or it was settling. Probably settling.",
      lose:  "Something hissed. Probably the cat. Definitely the cat. Right?"
    }},

  { id: 11, name: "Prefects' Parlour", moves: 22, scoreStars: [13000, 20000, 30000],
    objectives: [{ type:'collect', tile:'crystalball', count: 20 }],
    story: {
      intro: "Twenty crystal balls to inspect. Divination homework: match them into groups of three or more.",
      win:   "The future is bright, {name}. The present is too. Solid work.",
      lose:  "The crystal balls all showed your retry button. Harsh but fair."
    }},

  { id: 12, name: "Knockturn Alley", moves: 22, scoreStars: [14000, 22000, 32000],
    objectives: [{ type:'jinx', count: 12 }], jinxSeeds: 12,
    story: {
      intro: "Twelve jinxes on a shady street. Don't make eye contact with the shopkeepers.",
      win:   "Even the crooked shop signs bowed. You are now feared in three districts.",
      lose:  "A shopkeeper saw your moves and smirked. Pride: cracked in four places."
    }},

  { id: 13, name: "Quidditch Pitch", moves: 22, scoreStars: [15000, 23000, 34000],
    objectives: [
      { type:'collect', tile:'wizardhat', count: 18 },
      { type:'collect', tile:'wand', count: 18 },
    ],
    story: {
      intro: "Eighteen hats, eighteen wands. The crowd is chanting your name. Mostly correctly.",
      win:   "Goal! Wait, wrong sport entirely. Whatever it was, you won it.",
      lose:  "The bludgers found you. The bludgers ALWAYS find you. Learn to duck, {name}."
    }},

  { id: 14, name: "The Pensieve's Pool", moves: 22, scoreStars: [16000, 25000, 36000],
    objectives: [
      { type:'golden', count: 3 },
      { type:'score', target: 16000 },
    ], goldenSeeds: 3,
    story: {
      intro: "Drop three snitches into the memory pool while scoring big. Your future self will watch this replay. Make it count.",
      win:   "Future generations will remember this moment. The database is eternal.",
      lose:  "The Pensieve sighed. SIGHED. The memory pool has never sighed before."
    }},

  { id: 15, name: "Azkaban Keep", moves: 22, scoreStars: [17000, 26000, 38000],
    objectives: [
      { type:'jinx', count: 10 },
      { type:'collect', tile:'crystalball', count: 16 },
    ], jinxSeeds: 10,
    story: {
      intro: "Ten jinxes in the cellblocks. Sixteen crystal balls upstairs. And no singing. The dementors hate singing.",
      win:   "The dementors gave a slow clap. Slowly. It's the nicest thing they've ever done.",
      lose:  "Everything confiscated. Imaginary points included. That's a first."
    }},

  { id: 16, name: "Department of Mysteries", moves: 22, scoreStars: [18000, 28000, 42000],
    objectives: [
      { type:'jinx', count: 10 },
      { type:'golden', count: 3 },
    ], jinxSeeds: 10, goldenSeeds: 3,
    story: {
      intro: "Ten jinxes, three golden snitches. Mind the prophecy shelves. They fall at the slightest embarrassment.",
      win:   "Mystery solved: you are suspiciously good at this, {name}.",
      lose:  "A prophecy shattered. It was almost certainly about you. Can't prove it."
    }},

  { id: 17, name: "Ministry of Magic", moves: 22, scoreStars: [20000, 30000, 45000],
    objectives: [
      { type:'collect', tile:'potion', count: 22 },
      { type:'collect', tile:'spellbook', count: 22 },
    ],
    story: {
      intro: "Ministry orders: twenty-two potions, twenty-two spellbooks. In triplicate. Obviously.",
      win:   "All forms filed correctly! Somewhere a tiny ministry bell dings in approval.",
      lose:  "Form 38-B was wrong. It's ALWAYS Form 38-B, {name}."
    }},

  { id: 18, name: "Spinner's End", moves: 22, scoreStars: [22000, 32000, 48000],
    objectives: [
      { type:'jinx', count: 16 },
      { type:'score', target: 22000 },
    ], jinxSeeds: 16,
    story: {
      intro: "Sixteen jinxes. A brutal score target. The professor watches from the shadows, disappointed in advance.",
      win:   "'Acceptable.' Around here, that's basically a parade.",
      lose:  "Detention. With Filch. The mop awaits."
    }},

  { id: 19, name: "Charles's Cauldron", moves: 24, scoreStars: [24000, 35000, 52000],
    objectives: [
      { type:'golden', count: 4 },
      { type:'jinx', count: 10 },
      { type:'score', target: 24000 },
    ], jinxSeeds: 10, goldenSeeds: 4,
    story: {
      intro: "Charles himself set this challenge, {name}. Four snitches, ten jinxes, a big number. He's smiling. Be careful.",
      win:   "Charles tips his hat. THE Charles. The tipping kind.",
      lose:  "Charles muttered something about 'kids these days'. The disrespect was palpable."
    }},

  { id: 20, name: "Brandon's Boss Keep", moves: 24, scoreStars: [28000, 42000, 60000],
    objectives: [
      { type:'jinx', count: 14 },
      { type:'golden', count: 4 },
      { type:'collect', tile:'snitch', count: 18 },
    ], jinxSeeds: 14, goldenSeeds: 4,
    story: {
      intro: "Brandon's final test, {name}. Fourteen jinxes. Four snitches dropped. Eighteen more collected. Become the wizard you were meant to be.",
      win:   "LEGENDARY. Brandon weeps with pride. Charles claims credit anyway.",
      lose:  "Brandon will remember this. Brandon NEVER forgets."
    }},
];

/* ========= TUTORIAL SLIDES (first-run) =========
 * Also editable from the Admin Panel "Stories" section. {name}
 * expands to the player's wizard name.
 */
NUTS.tutorial = [
  { title: "Welcome, {name}!",
    body:  "You've been accepted to the Wizarding World of Nuts -- a match-3 academy of the arcane. Let's get you started." },
  { title: "How to cast",
    body:  "Tap a tile, then tap an adjacent tile to swap them. Line up three or more of the same item to cast a spell." },
  { title: "Spells to summon",
    body:  "Match 4 in a row -> Bombarda (clears a whole row or column). Match 5 -> Patronus (banishes every tile of one colour)." },
  { title: "Objectives",
    body:  "Each chapter has objectives at the top. Clear them before your moves run out. Stars are earned by your final score." },
  { title: "Now go.",
    body:  "The Enchanted Nut Path awaits. Break jinxes. Drop golden snitches. Score big. Make Charles and Brandon proud." },
];
