class EncounterGenerator {
    constructor() {
        this.monsters = [];
        this.currentEncounter = [];
        this.currentLoot = null;
        this.initializeEventListeners();
        this.initializeXPBudgets();
        this.initializeMonsterEcology();
    }

    initializeEventListeners() {
        document.getElementById('generate-encounter-btn').addEventListener('click', () => {
            this.generateEncounter();
        });

        document.getElementById('clear-encounter-btn').addEventListener('click', () => {
            this.clearEncounter();
        });

        document.getElementById('generate-loot-btn').addEventListener('click', () => {
            this.generateLoot();
        });

        document.getElementById('save-encounter-btn').addEventListener('click', () => {
            this.saveEncounterToCampaign();
        });

        // Update XP budget when party settings change
        document.getElementById('party-level').addEventListener('change', () => {
            this.updateXPBudget();
        });

        document.getElementById('party-size').addEventListener('change', () => {
            this.updateXPBudget();
        });

        document.getElementById('encounter-difficulty').addEventListener('change', () => {
            this.updateXPBudget();
        });

        // Listen for terrain selector changes
        document.getElementById('terrain-selector').addEventListener('change', () => {
            this.updateTerrainDisplay();
        });
    }

    initializeXPBudgets() {
        // Official PF2e Encounter Budget Table (Table 10-1)
        // Base XP budget per threat level (for 4 characters)
        this.baseBudgets = {
            trivial: 40,    // 40 or less
            low: 60,        // 60
            moderate: 80,   // 80  
            severe: 120,    // 120
            extreme: 160    // 160
        };

        // Character adjustment values for party size scaling
        this.characterAdjustments = {
            trivial: 10,    // 10 or less per additional character
            low: 20,        // 20 per additional character
            moderate: 20,   // 20 per additional character
            severe: 30,     // 30 per additional character
            extreme: 40     // 40 per additional character
        };

        // Official PF2e creature XP by level relative to party
        // Based on the official Creature Level vs XP table
        this.creatureXPByLevel = {
            '-4': { xp: 10, role: 'Low-threat lackey' },
            '-3': { xp: 15, role: 'Low- or moderate-threat lackey' },
            '-2': { xp: 20, role: 'Any lackey or standard creature' },
            '-1': { xp: 30, role: 'Any standard creature' },
            '0': { xp: 40, role: 'Any standard creature or low-threat boss' },
            '+1': { xp: 60, role: 'Low- or moderate-threat boss' },
            '+2': { xp: 80, role: 'Moderate- or severe-threat boss' },
            '+3': { xp: 120, role: 'Severe- or extreme-threat boss' },
            '+4': { xp: 160, role: 'Extreme-threat solo boss' }
        };

        this.updateXPBudget();
        
        // Initialize environmental atmosphere details
        this.initializeEnvironmentalAtmosphere();
    }

    initializeEnvironmentalAtmosphere() {
        // Environmental atmosphere details for more immersive encounters
        this.environmentalDetails = {
            'aquatic': {
                sights: ['choppy water', 'rolling waves', 'sunlight glinting', 'the curve of the horizon', 'driftwood'],
                sounds: ['waves lapping against a ship', 'seabirds\' cries', 'fluttering sails', 'creatures breaching the surface'],
                smells: ['salt water', 'crisp fresh air', 'dead fish'],
                textures: ['frigid water', 'slimy seaweed', 'crusty salt collecting on surfaces'],
                weather: ['powerful winds', 'oncoming storms']
            },
            'arctic': {
                sights: ['blinding reflected sunlight', 'snowy plains', 'distant glaciers', 'deep crevasses', 'rocky cliffs', 'ice floes and bergs', 'animal tracks in snow'],
                sounds: ['howling winds', 'drips of melting ice', 'utter quiet'],
                smells: ['clean air', 'half-frozen bog', 'lichen', 'seaweed'],
                textures: ['crunching snow', 'hard ice'],
                weather: ['frigid gales', 'light snowfall', 'pounding blizzards']
            },
            'forest': {
                sights: ['towering trees', 'dense undergrowth', 'verdant canopies', 'colorful wildlife', 'dappled sunlight through the trees', 'mossy tree trunks', 'twisted roots'],
                sounds: ['rustling leaves', 'snapping branches', 'animal calls'],
                smells: ['decomposing vegetation', 'flowering plants', 'pine trees', 'earthy mushrooms'],
                textures: ['leaves crunching underfoot', 'scraping branches', 'water dripping from above', 'rough bark'],
                weather: ['still air', 'cool shade', 'sporadic breeze', 'rain on the canopy', 'branches coated in thick snow']
            },
            'mountain': {
                sights: ['bare cliffs', 'snow caps', 'hardy trees', 'slopes littered with scree', 'birds flying on currents', 'fog among the peaks'],
                sounds: ['howling wind', 'falling rocks', 'clear echoes', 'crunch of rocks underfoot', 'distant avalanche'],
                smells: ['blowing dust', 'pine trees', 'fresh snow'],
                textures: ['rough stone', 'powdery snow', 'unstable rubble'],
                weather: ['swirling clouds', 'chill of high altitude', 'direct sunlight', 'powerful wind and rain']
            },
            'plains': {
                sights: ['grass waving gently', 'scattered wildflowers', 'rocky outcroppings or boulders', 'the curve of the horizon'],
                sounds: ['rustling wind', 'birdsong', 'distant sounds carried far'],
                smells: ['fresh air', 'earthy soil', 'distant carcasses'],
                textures: ['touch of tall grass', 'rasp of scrub brush', 'crunch of dry dirt'],
                weather: ['cooling of gentle wind', 'heat of direct sunlight', 'massive black thunderclouds']
            },
            'swamp': {
                sights: ['lush leaves', 'clouds of gnats', 'algae-coated water', 'shacks on stilts', 'darting fish'],
                sounds: ['croaking frogs', 'chirping insects', 'bubbling', 'splashing'],
                smells: ['rich moss and algae', 'pungent swamp gases'],
                textures: ['pushing through floating detritus', 'tangling creepers', 'thick mud'],
                weather: ['oppressive humidity', 'still air', 'pouring rain', 'rays of sunlight']
            },
            'underground': {
                sights: ['winding passages', 'sputtering yellow torchlight', 'uneven or cracked floors', 'ancient writings or architecture', 'stalagmites and stalactites'],
                sounds: ['dripping condensation', 'scurrying rats or insects', 'distant clunks of machinery', 'tinny echoes of your voices and footsteps'],
                smells: ['staleness of still air', 'sulfur', 'tang of metal deposits'],
                textures: ['rough rock walls', 'erosion-smoothed stone', 'cobwebs'],
                weather: ['chill of underground air', 'geothermal heat']
            },
            'desert': {
                sights: ['endless sand dunes', 'scorching sun', 'distant mirages', 'rocky outcroppings', 'sparse vegetation', 'ancient ruins'],
                sounds: ['whistling wind', 'shifting sand', 'distant thunder', 'eerie silence'],
                smells: ['dry air', 'sun-baked earth', 'sage brush'],
                textures: ['hot sand', 'rough stone', 'thorny plants'],
                weather: ['blazing heat', 'sandstorms', 'cool nights', 'rare rainfall']
            },
            'urban': {
                sights: ['busy streets', 'towering buildings', 'market stalls', 'crowds of people', 'stone architecture'],
                sounds: ['chatter of crowds', 'clanging of smiths', 'cart wheels on cobblestones', 'street vendors calling'],
                smells: ['cooking food', 'sewage', 'smoke from chimneys', 'perfumes and spices'],
                textures: ['smooth cobblestones', 'rough brick walls', 'polished door handles'],
                weather: ['heat trapped between buildings', 'rain echoing in alleys', 'wind tunnels']
            },
            'coastal': {
                sights: ['crashing waves', 'seabirds in flight', 'rocky tide pools', 'ships on the horizon', 'driftwood'],
                sounds: ['waves on rocks', 'seagull cries', 'distant fog horns', 'wind through sea grass'],
                smells: ['salt spray', 'kelp and seaweed', 'fresh ocean breeze'],
                textures: ['wet rocks', 'fine sand', 'sea spray', 'smooth shells'],
                weather: ['ocean breezes', 'sudden squalls', 'thick fog', 'bright sun']
            },
            'volcanic': {
                sights: ['glowing lava flows', 'ash-covered landscape', 'steaming vents', 'obsidian formations', 'sulfur deposits'],
                sounds: ['rumbling earth', 'hissing steam', 'crackling lava', 'distant eruptions'],
                smells: ['sulfur', 'hot rock', 'volcanic gases'],
                textures: ['rough volcanic rock', 'warm ground', 'sharp obsidian'],
                weather: ['ash-filled air', 'extreme heat', 'toxic gases']
            }
        };
    }

    initializeMonsterEcology() {
        // Initialize creature relationships for logical encounters
        this.initializeCreatureRelationships();
        
        // Initialize encounter templates
        this.initializeEncounterTemplates();
        
        // Define creature types and their compatibility
        this.creatureTypes = {
            // Humanoids - can work with most types
            humanoid: ['humanoid', 'construct', 'undead', 'fiend', 'aberration'],
            
            // Animals - work well with other animals, fey, and some humanoids
            animal: ['animal', 'beast', 'fey', 'humanoid'],
            
            // Undead - work with other undead, fiends, and some humanoids
            undead: ['undead', 'fiend', 'humanoid', 'aberration'],
            
            // Fiends - work with undead, other fiends, and evil humanoids
            fiend: ['fiend', 'undead', 'humanoid', 'aberration'],
            
            // Fey - work with animals, plants, and nature-aligned creatures
            fey: ['fey', 'animal', 'beast', 'plant'],
            
            // Dragons - usually solitary but can command humanoids
            dragon: ['dragon', 'humanoid', 'construct'],
            
            // Aberrations - work with other aberrations and sometimes undead/fiends
            aberration: ['aberration', 'undead', 'fiend', 'humanoid'],
            
            // Constructs - work with their creators (usually humanoids)
            construct: ['construct', 'humanoid'],
            
            // Celestials - work with good humanoids and other celestials
            celestial: ['celestial', 'humanoid'],
            
            // Elementals - work with other elementals and some constructs
            elemental: ['elemental', 'construct'],
            
            // Plants - work with fey, animals, and nature creatures
            plant: ['plant', 'fey', 'animal', 'beast'],
            
            // Beasts - similar to animals
            beast: ['beast', 'animal', 'fey', 'humanoid']
        };

        // Define environment types and creature preferences
        this.environments = {
            forest: ['animal', 'beast', 'fey', 'plant', 'humanoid'],
            swamp: ['undead', 'aberration', 'beast', 'humanoid'],
            mountain: ['dragon', 'humanoid', 'beast', 'elemental'],
            desert: ['undead', 'fiend', 'humanoid', 'elemental'],
            ocean: ['beast', 'aberration', 'elemental', 'humanoid'],
            underground: ['aberration', 'undead', 'humanoid', 'construct'],
            urban: ['humanoid', 'construct', 'undead', 'fiend'],
            arctic: ['beast', 'elemental', 'undead', 'humanoid'],
            plains: ['humanoid', 'beast', 'animal', 'fey']
        };

        // Initialize comprehensive terrain association system
        this.initializeTerrainSystem();
    }

    initializeCreatureRelationships() {
        // Creature relationship database for logical encounters
        this.creatureRelationships = {
            // Predators and Pack Animals
            "Wolf": {
                packsWith: ["Dire Wolf", "Winter Wolf", "Worg"],
                leaderOf: ["Wolf"],
                huntsWith: ["Forest Druid", "Ranger"],
                territorial: true,
                packSize: [2, 6],
                domesticated: false
            },
            
            "Dire Wolf": {
                packsWith: ["Wolf", "Winter Wolf"],
                leaderOf: ["Wolf"],
                territorial: true,
                packSize: [1, 3],
                domesticated: false
            },
            
            "Bear": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 2],
                domesticated: false
            },
            
            "War Horse": {
                packsWith: [],
                domesticated: true,
                requires: ["Humanoid"],
                packSize: [1, 4],
                territorial: false
            },
            
            // Humanoid Groups
            "Goblin": {
                packsWith: ["Goblin", "Hobgoblin", "Bugbear"],
                leaderOf: [],
                followsLeader: ["Goblin Chief", "Hobgoblin", "Bugbear", "Orc"],
                packSize: [4, 12],
                domesticated: false
            },
            
            "Goblin Chief": {
                packsWith: ["Goblin", "Hobgoblin"],
                leaderOf: ["Goblin", "Goblin Warrior"],
                followsLeader: ["Hobgoblin", "Bugbear", "Orc"],
                packSize: [1, 2],
                domesticated: false
            },
            
            "Hobgoblin": {
                packsWith: ["Hobgoblin", "Goblin", "Bugbear", "Orc"],
                leaderOf: ["Goblin", "Goblin Chief", "Goblin Warrior"],
                followsLeader: ["Hobgoblin Captain", "Bugbear", "Orc"],
                packSize: [2, 6],
                domesticated: false
            },
            
            "Bugbear": {
                packsWith: ["Bugbear", "Goblin", "Hobgoblin", "Orc"],
                leaderOf: ["Goblin", "Goblin Chief", "Hobgoblin"],
                followsLeader: ["Bugbear Chief", "Orc Captain"],
                packSize: [1, 4],
                domesticated: false
            },
            
            "Orc": {
                packsWith: ["Orc", "Ogre"],
                leaderOf: [],
                followsLeader: ["Orc Captain", "Orc Warchief"],
                packSize: [3, 8],
                domesticated: false
            },
            
            "Bandit": {
                packsWith: ["Bandit", "Rogue"],
                leaderOf: [],
                followsLeader: ["Bandit Captain"],
                packSize: [3, 10],
                domesticated: false
            },
            
            "Bandit Captain": {
                packsWith: ["Bandit", "Rogue"],
                leaderOf: ["Bandit"],
                packSize: [1, 1],
                domesticated: false
            },
            
            // Undead
            "Skeleton": {
                packsWith: ["Skeleton", "Zombie"],
                leaderOf: [],
                followsLeader: ["Skeleton Champion", "Necromancer"],
                packSize: [4, 12],
                domesticated: false
            },
            
            "Zombie": {
                packsWith: ["Zombie", "Skeleton"],
                leaderOf: [],
                followsLeader: ["Zombie Lord", "Necromancer"],
                packSize: [3, 8],
                domesticated: false
            },
            
            // Fey
            "Dryad": {
                packsWith: ["Unicorn", "Satyr"],
                territorial: true,
                protects: ["Forest"],
                packSize: [1, 2],
                domesticated: false
            },
            
            "Pixie": {
                packsWith: ["Pixie", "Sprite"],
                territorial: true,
                packSize: [2, 8],
                domesticated: false
            },
            
            // Dragons - All dragon types are solitary and territorial
            "Dragon": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Humanoid", "Construct"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Ancient Dragon": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Humanoid", "Construct", "Dragon"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Adult Dragon": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Humanoid", "Construct"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Young Dragon": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 1],
                domesticated: false
            },
            
            "Wyvern": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 2],
                domesticated: false
            },
            
            "Drake": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 1],
                domesticated: false
            },
            
            // Other apex predators
            "Tiger": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 1],
                domesticated: false
            },
            
            "Lion": {
                packsWith: ["Lion"],
                territorial: true,
                packSize: [2, 6], // Lions can form prides
                domesticated: false
            },
            
            "Owlbear": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 2],
                domesticated: false
            },
            
            // Giants
            "Giant": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 1],
                domesticated: false
            },
            
            "Storm Giant": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Elemental", "Giant"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Cloud Giant": {
                packsWith: [],
                territorial: true,
                solitary: true,
                packSize: [1, 1],
                domesticated: false
            },
            
            "Fire Giant": {
                packsWith: ["Fire Giant"],
                territorial: true,
                packSize: [1, 3], // Fire giants sometimes work in small groups
                domesticated: false
            },
            
            "Frost Giant": {
                packsWith: ["Frost Giant"],
                territorial: true,
                packSize: [1, 4],
                domesticated: false
            },
            
            // High-level threats
            "Lich": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Undead", "Construct"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Vampire": {
                packsWith: [],
                territorial: true,
                solitary: true,
                commands: ["Undead", "Humanoid"],
                packSize: [1, 1],
                domesticated: false
            },
            
            "Kobold": {
                packsWith: ["Kobold"],
                leaderOf: [],
                followsLeader: ["Kobold Chieftain"],
                serves: ["Dragon"],
                packSize: [6, 20],
                domesticated: false
            }
        };
        
        // Social behaviors
        this.socialBehaviors = {
            pack: ["Wolf", "Dire Wolf", "Goblin", "Orc", "Bandit", "Lion", "Kobold"],
            herd: ["Horse", "Deer", "Cattle"],
            solitary: ["Bear", "Dragon", "Ancient Dragon", "Adult Dragon", "Young Dragon", 
                      "Wyvern", "Drake", "Tiger", "Owlbear", "Giant", "Storm Giant", 
                      "Cloud Giant", "Lich", "Vampire"],
            territorial: ["Bear", "Dragon", "Ancient Dragon", "Adult Dragon", "Young Dragon",
                         "Wyvern", "Drake", "Tiger", "Lion", "Owlbear", "Giant", 
                         "Storm Giant", "Cloud Giant", "Fire Giant", "Frost Giant",
                         "Dryad", "Lich", "Vampire"],
            domesticated: ["War Horse", "Dog", "Cat"],
            undead_horde: ["Skeleton", "Zombie", "Ghoul"],
            commanded: ["Construct", "Summoned"]
        };
        
        // Ecological conflicts - creatures that compete for territory
        this.ecologicalConflicts = {
            // Dragons are highly territorial and solitary
            "Dragon": ["Dragon", "Giant", "Chimera", "Manticore", "Sphinx", "Wyvern", "Drake"],
            "Ancient Dragon": ["Dragon", "Ancient Dragon", "Adult Dragon", "Young Dragon"],
            "Adult Dragon": ["Dragon", "Ancient Dragon", "Adult Dragon", "Young Dragon"],
            "Young Dragon": ["Dragon", "Ancient Dragon", "Adult Dragon", "Young Dragon"],
            "Wyvern": ["Dragon", "Wyvern", "Drake"],
            "Drake": ["Dragon", "Wyvern", "Drake"],
            
            // Apex predators don't share territory
            "Bear": ["Wolf", "Dire Wolf", "Owlbear", "Tiger", "Lion", "Bulezau"],
            "Dire Bear": ["Wolf", "Dire Wolf", "Owlbear", "Tiger", "Lion", "Bear"],
            "Owlbear": ["Bear", "Wolf", "Dire Wolf", "Giant", "Tiger", "Lion"],
            "Tiger": ["Bear", "Lion", "Owlbear", "Wolf", "Dire Wolf"],
            "Lion": ["Bear", "Tiger", "Owlbear", "Wolf", "Dire Wolf"],
            "Bulezau": ["Bear", "Tiger", "Lion", "Wolf", "Dire Wolf"],
            
            // Pack predators vs solitary
            "Wolf": ["Bear", "Owlbear", "Tiger", "Lion", "Bulezau"],
            "Dire Wolf": ["Bear", "Dire Bear", "Owlbear", "Tiger", "Lion"],
            
            // Giants are territorial
            "Giant": ["Dragon", "Giant", "Ogre", "Cyclops", "Ettin"],
            "Storm Giant": ["Giant", "Cloud Giant", "Fire Giant", "Frost Giant"],
            "Cloud Giant": ["Giant", "Storm Giant", "Fire Giant", "Frost Giant"],
            "Fire Giant": ["Giant", "Storm Giant", "Cloud Giant", "Frost Giant"],
            "Frost Giant": ["Giant", "Storm Giant", "Cloud Giant", "Fire Giant"],
            "Ogre": ["Giant", "Ogre", "Troll", "Ettin"],
            "Troll": ["Ogre", "Troll", "Giant"],
            "Ettin": ["Giant", "Ogre", "Troll"],
            "Cyclops": ["Giant", "Cyclops"],
            
            // Fiends have complex hierarchies and conflicts
            "Demon": ["Devil", "Angel", "Archon", "Azata"],
            "Devil": ["Demon", "Angel", "Archon", "Azata"],
            "Balor": ["Devil", "Pit Fiend", "Angel", "Solar"],
            "Pit Fiend": ["Demon", "Balor", "Angel", "Solar"],
            
            // Celestials vs fiends
            "Angel": ["Demon", "Devil", "Undead", "Fiend"],
            "Archon": ["Demon", "Devil", "Undead", "Fiend"],
            "Azata": ["Demon", "Devil", "Undead", "Fiend"],
            "Solar": ["Balor", "Pit Fiend", "Lich", "Vampire"],
            
            // Undead conflicts
            "Lich": ["Vampire", "Angel", "Archon", "Solar", "Mummy"],
            "Vampire": ["Lich", "Angel", "Archon", "Mummy", "Wraith"],
            "Mummy": ["Vampire", "Lich", "Angel", "Archon"],
            "Wraith": ["Vampire", "Angel", "Archon"],
            
            // Elemental conflicts (opposing elements)
            "Fire Elemental": ["Water Elemental", "Ice Elemental", "Frost Giant"],
            "Water Elemental": ["Fire Elemental", "Fire Giant"],
            "Air Elemental": ["Earth Elemental"],
            "Earth Elemental": ["Air Elemental"],
            "Ice Elemental": ["Fire Elemental", "Fire Giant"],
            
            // Aberrations vs natural creatures
            "Mind Flayer": ["Dragon", "Giant", "Angel", "Demon", "Devil"],
            "Beholder": ["Dragon", "Giant", "Mind Flayer", "Angel"],
            "Aboleth": ["Dragon", "Kraken", "Angel", "Solar"],
            
            // Constructs vs living creatures (some conflicts)
            "Golem": ["Rust Monster", "Ooze"],
            "Animated Object": ["Rust Monster"],
            
            // Special predator relationships
            "Rust Monster": ["Golem", "Animated Object", "Construct"],
            "Gelatinous Cube": ["Ooze", "Slime"],
            "Black Pudding": ["Ooze", "Gelatinous Cube"],
            
            // Intelligent evil humanoids vs good
            "Drow": ["Elf", "Dwarf", "Angel"],
            "Duergar": ["Dwarf", "Angel", "Archon"],
            "Orc": ["Elf", "Dwarf"], // Traditional enemies
            "Hobgoblin": ["Elf", "Dwarf"],
            
            // Fey conflicts
            "Hag": ["Angel", "Archon", "Unicorn", "Dryad"],
            "Redcap": ["Angel", "Archon", "Unicorn", "Good Fey"],
            
            // Nature vs unnatural
            "Unicorn": ["Hag", "Undead", "Fiend", "Demon", "Devil"],
            "Dryad": ["Hag", "Undead", "Fire Elemental"],
            "Treant": ["Fire Elemental", "Hag", "Undead"]
        };
    }

    initializeEncounterTemplates() {
        // Logical encounter templates organized by narrative theme
        this.encounterTemplates = {
            // Bandit encounters
            "bandit_ambush": {
                name: "Bandit Ambush",
                description: "Bandits lying in wait for travelers",
                terrain: ["forest", "mountain", "plains"],
                structure: [
                    { role: "leader", creatures: ["Bandit Captain"], count: 1 },
                    { role: "elite", creatures: ["Bandit", "Rogue"], count: [2, 3] },
                    { role: "minion", creatures: ["Bandit"], count: [3, 6] }
                ],
                motivation: "robbery",
                setup: "hidden_ambush"
            },
            
            "bandit_camp": {
                name: "Bandit Camp",
                description: "A fortified bandit encampment",
                terrain: ["forest", "mountain"],
                structure: [
                    { role: "leader", creatures: ["Bandit Captain"], count: 1 },
                    { role: "lieutenant", creatures: ["Bandit"], count: [2, 4] },
                    { role: "guard", creatures: ["Bandit"], count: [4, 8] }
                ],
                motivation: "territorial",
                setup: "fortified"
            },
            
            // Wolf pack encounters
            "wolf_pack_hunting": {
                name: "Wolf Pack Hunt",
                description: "A pack of wolves on the prowl",
                terrain: ["forest", "mountain", "plains"],
                structure: [
                    { role: "alpha", creatures: ["Dire Wolf"], count: 1 },
                    { role: "pack", creatures: ["Wolf"], count: [3, 6] }
                ],
                motivation: "hunting",
                setup: "stalking"
            },
            
            "dire_wolf_territory": {
                name: "Dire Wolf Territory",
                description: "Dire wolves defending their territory",
                terrain: ["forest", "mountain"],
                structure: [
                    { role: "alpha", creatures: ["Dire Wolf"], count: [1, 2] },
                    { role: "pack", creatures: ["Wolf"], count: [2, 4] }
                ],
                motivation: "territorial",
                setup: "defending"
            },
            
            // Goblin encounters
            "goblin_raid": {
                name: "Goblin Raiding Party",
                description: "Goblins raiding for supplies",
                terrain: ["forest", "mountain", "plains"],
                structure: [
                    { role: "leader", creatures: ["Goblin Chief"], count: 1 },
                    { role: "warrior", creatures: ["Goblin"], count: [2, 4] },
                    { role: "scout", creatures: ["Goblin"], count: [3, 6] }
                ],
                motivation: "raiding",
                setup: "mobile"
            },
            
            "goblin_warren": {
                name: "Goblin Warren",
                description: "A goblin settlement under threat",
                terrain: ["forest", "underground", "mountain"],
                structure: [
                    { role: "chief", creatures: ["Goblin Chief"], count: 1 },
                    { role: "shaman", creatures: ["Goblin"], count: 1 },
                    { role: "warrior", creatures: ["Goblin"], count: [4, 8] },
                    { role: "civilian", creatures: ["Goblin"], count: [6, 12] }
                ],
                motivation: "defensive",
                setup: "fortified"
            },
            
            // Undead encounters
            "undead_patrol": {
                name: "Undead Patrol",
                description: "Undead guardians on patrol",
                terrain: ["swamp", "underground", "urban"],
                structure: [
                    { role: "commander", creatures: ["Skeleton Champion"], count: 1 },
                    { role: "guard", creatures: ["Skeleton"], count: [4, 6] },
                    { role: "minion", creatures: ["Skeleton"], count: [6, 10] }
                ],
                motivation: "patrol",
                setup: "organized"
            },
            
            "zombie_horde": {
                name: "Zombie Horde",
                description: "A shambling mass of undead",
                terrain: ["swamp", "urban", "plains"],
                structure: [
                    { role: "horde", creatures: ["Zombie"], count: [8, 16] }
                ],
                motivation: "mindless",
                setup: "wandering"
            },
            
            // Fey encounters
            "forest_guardians": {
                name: "Forest Guardians",
                description: "Fey protecting their woodland home",
                terrain: ["forest"],
                structure: [
                    { role: "guardian", creatures: ["Dryad"], count: 1 },
                    { role: "sprite", creatures: ["Pixie"], count: [4, 8] },
                    { role: "ally", creatures: ["Unicorn"], count: [0, 1] }
                ],
                motivation: "protection",
                setup: "territorial"
            },
            
            // Dragon encounters
            "dragon_lair": {
                name: "Dragon's Lair",
                description: "A dragon with its servants",
                terrain: ["mountain", "underground", "swamp"],
                structure: [
                    { role: "dragon", creatures: ["Dragon"], count: 1 },
                    { role: "servant", creatures: ["Kobold"], count: [6, 12] },
                    { role: "guard", creatures: ["Construct"], count: [2, 4] }
                ],
                motivation: "territorial",
                setup: "lair"
            },
            
            // Wild animal encounters
            "territorial_bear": {
                name: "Territorial Bear",
                description: "A bear protecting its territory",
                terrain: ["forest", "mountain"],
                structure: [
                    { role: "guardian", creatures: ["Bear"], count: 1 },
                    { role: "cubs", creatures: ["Bear"], count: [0, 2] }
                ],
                motivation: "territorial",
                setup: "defending"
            },
            
            // Mounted encounters
            "cavalry_patrol": {
                name: "Cavalry Patrol",
                description: "Mounted soldiers on patrol",
                terrain: ["plains", "urban"],
                structure: [
                    { role: "captain", creatures: ["Human"], count: 1 },
                    { role: "cavalry", creatures: ["Human"], count: [3, 6] },
                    { role: "mount", creatures: ["War Horse"], count: [4, 7] }
                ],
                motivation: "patrol",
                setup: "mobile",
                mounted: true
            }
        };
    }

    initializeTerrainSystem() {
        // Advanced terrain keyword database for description parsing
        this.terrainKeywords = {
            forest: {
                primary: ['forest', 'woodland', 'grove', 'canopy', 'undergrowth', 'sylvan'],
                secondary: ['tree', 'oak', 'pine', 'birch', 'foliage', 'thicket', 'druid', 'ranger'],
                exclusions: ['dead forest', 'petrified forest']
            },
            desert: {
                primary: ['desert', 'arid', 'wasteland', 'badlands', 'dunes'],
                secondary: ['sand', 'oasis', 'mirage', 'scorching', 'parched', 'nomad'],
                exclusions: ['frozen desert', 'arctic desert']
            },
            arctic: {
                primary: ['arctic', 'tundra', 'glacier', 'permafrost', 'boreal'],
                secondary: ['ice', 'snow', 'frozen', 'cold', 'frigid', 'blizzard', 'frost'],
                exclusions: ['ice cave', 'frozen swamp']
            },
            mountain: {
                primary: ['mountain', 'peak', 'summit', 'alpine', 'highland'],
                secondary: ['cliff', 'crag', 'precipice', 'ridge', 'slope', 'elevation'],
                exclusions: ['underwater mountain', 'mountain cave']
            },
            aquatic: {
                primary: ['aquatic', 'oceanic', 'marine', 'underwater', 'abyssal'],
                secondary: ['water', 'sea', 'ocean', 'lake', 'river', 'current', 'depths'],
                exclusions: ['mountain lake', 'desert spring']
            },
            swamp: {
                primary: ['swamp', 'marsh', 'bog', 'wetland', 'bayou', 'fen'],
                secondary: ['murky', 'stagnant', 'mire', 'quagmire', 'muddy', 'damp'],
                exclusions: ['frozen swamp', 'dried swamp']
            },
            underground: {
                primary: ['underground', 'subterranean', 'cavern', 'tunnel', 'depths'],
                secondary: ['cave', 'deep', 'buried', 'mining', 'vault', 'chamber'],
                exclusions: ['sky vault', 'tree cavity']
            },
            urban: {
                primary: ['urban', 'city', 'metropolis', 'settlement', 'civilized'],
                secondary: ['town', 'village', 'street', 'building', 'market', 'guard'],
                exclusions: ['ruined city', 'abandoned town']
            },
            plains: {
                primary: ['plains', 'grassland', 'prairie', 'steppe', 'savanna'],
                secondary: ['field', 'meadow', 'pasture', 'grazing', 'open', 'rolling'],
                exclusions: ['salt plains', 'ice plains']
            },
            coastal: {
                primary: ['coastal', 'shoreline', 'seaside', 'littoral', 'tidal'],
                secondary: ['beach', 'shore', 'bay', 'inlet', 'reef', 'tide', 'salt'],
                exclusions: ['inland sea', 'mountain shore']
            },
            volcanic: {
                primary: ['volcanic', 'magma', 'lava', 'molten', 'igneous'],
                secondary: ['volcano', 'crater', 'ash', 'sulfur', 'ember', 'fire'],
                exclusions: ['dormant volcano', 'cold lava']
            }
        };

        // Mechanical trait associations
        this.terrainTraits = {
            aquatic: ['aquatic', 'water', 'swim'],
            desert: ['fire', 'heat', 'arid'],
            arctic: ['cold', 'ice', 'frost'],
            underground: ['earth', 'burrow', 'tunnel'],
            volcanic: ['fire', 'heat', 'lava'],
            forest: ['plant', 'nature', 'wood'],
            mountain: ['air', 'climb', 'altitude'],
            swamp: ['poison', 'disease', 'decay'],
            urban: ['construct', 'civilized', 'guard'],
            plains: ['mounted', 'herd', 'migration'],
            coastal: ['salt', 'tide', 'maritime']
        };

        // Movement type associations
        this.terrainMovement = {
            aquatic: ['swim'],
            underground: ['burrow'],
            mountain: ['climb'],
            desert: ['burrow', 'sand'],
            arctic: ['ice', 'snow'],
            forest: ['climb'],
            swamp: ['swim'],
            volcanic: ['lava'],
            urban: ['none'],
            plains: ['none'],
            coastal: ['swim']
        };
    }

    getMonsterType(monster) {
        // Extract creature type from monster data
        const traits = monster.system?.traits?.value || monster.traits || [];
        
        // Check for specific creature types
        const typeKeywords = {
            'humanoid': ['humanoid', 'human', 'elf', 'dwarf', 'orc', 'goblin', 'hobgoblin', 'merfolk'],
            'undead': ['undead', 'zombie', 'skeleton', 'ghost', 'wraith', 'lich', 'vampire', 'mummy'],
            'fiend': ['fiend', 'demon', 'devil', 'daemon', 'evil', 'balor', 'pit fiend'],
            'fey': ['fey', 'fairy', 'dryad', 'satyr', 'nymph', 'redcap', 'hag', 'pixie', 'sprite'],
            'dragon': ['dragon', 'drake', 'wyvern', 'wyrm', 'ancient', 'adult', 'young'],
            'aberration': ['aberration', 'mind flayer', 'beholder', 'aboleth', 'owlbear'],
            'construct': ['construct', 'golem', 'automaton', 'animated', 'clockwork'],
            'celestial': ['celestial', 'angel', 'archon', 'azata', 'solar', 'deva'],
            'elemental': ['elemental', 'air', 'earth', 'fire', 'water', 'magma', 'ice'],
            'animal': ['animal', 'wolf', 'bear', 'lion', 'tiger', 'shark', 'moray', 'eagle', 'hawk'],
            'beast': ['beast', 'dire', 'giant'],
            'plant': ['plant', 'treant', 'shambling', 'dryad', 'leshy', 'mandragora']
        };

        const name = monster.name.toLowerCase();
        const traitString = traits.join(' ').toLowerCase();
        
        for (const [type, keywords] of Object.entries(typeKeywords)) {
            if (keywords.some(keyword => name.includes(keyword) || traitString.includes(keyword))) {
                return type;
            }
        }
        
        return 'humanoid'; // Default fallback
    }

    getMonsterTerrain(monster) {
        const name = monster.name.toLowerCase();
        const description = (monster.system?.details?.publicNotes || 
                           monster.system?.details?.description || 
                           monster.description || '').toLowerCase();
        const traits = monster.system?.traits?.value || monster.traits || [];
        const traitString = traits.join(' ').toLowerCase();
        
        const terrainScores = {};
        
        // Initialize all terrain scores to 0
        for (const terrain in this.terrainKeywords) {
            terrainScores[terrain] = 0;
        }

        // Score based on description keywords
        for (const [terrain, keywords] of Object.entries(this.terrainKeywords)) {
            // Primary keywords (high weight)
            keywords.primary.forEach(keyword => {
                if (name.includes(keyword) || description.includes(keyword)) {
                    terrainScores[terrain] += 10;
                }
            });
            
            // Secondary keywords (medium weight)
            keywords.secondary.forEach(keyword => {
                if (name.includes(keyword) || description.includes(keyword)) {
                    terrainScores[terrain] += 5;
                }
            });
            
            // Exclusions (negative weight)
            keywords.exclusions.forEach(exclusion => {
                if (name.includes(exclusion) || description.includes(exclusion)) {
                    terrainScores[terrain] -= 15;
                }
            });
        }

        // Score based on mechanical traits
        for (const [terrain, terrainTraits] of Object.entries(this.terrainTraits)) {
            terrainTraits.forEach(trait => {
                if (traitString.includes(trait)) {
                    terrainScores[terrain] += 7;
                }
            });
        }

        // Score based on movement types
        const speedData = monster.system?.attributes?.speed || {};
        const otherSpeeds = speedData.otherSpeeds || [];
        
        otherSpeeds.forEach(speed => {
            const speedType = speed.type.toLowerCase();
            for (const [terrain, movements] of Object.entries(this.terrainMovement)) {
                if (movements.includes(speedType)) {
                    terrainScores[terrain] += 6;
                }
            }
        });

        // Special case: aquatic trait = strong aquatic association
        if (traitString.includes('aquatic')) {
            terrainScores.aquatic += 15;
        }
        
        // Special aquatic creature detection
        const aquaticNames = ['shark', 'moray', 'eel', 'octopus', 'squid', 'whale', 'dolphin', 
                             'sea', 'ocean', 'reef', 'deep', 'marine', 'merfolk', 'sahuagin'];
        for (const aquaticName of aquaticNames) {
            if (name.includes(aquaticName)) {
                terrainScores.aquatic += 20;
                // Reduce non-aquatic scores for pure aquatic creatures
                terrainScores.forest -= 10;
                terrainScores.desert -= 10;
                terrainScores.mountain -= 10;
                terrainScores.plains -= 10;
            }
        }
        
        // Special forest creature detection
        const forestNames = ['redcap', 'dryad', 'treant', 'leshy', 'woodland', 'forest', 'grove', 'tree'];
        for (const forestName of forestNames) {
            if (name.includes(forestName)) {
                terrainScores.forest += 20;
                // Reduce aquatic scores for pure forest creatures
                terrainScores.aquatic -= 15;
                terrainScores.desert -= 10;
            }
        }

        // Find the terrain with the highest score
        let bestTerrain = 'plains';
        let bestScore = 0;
        
        for (const [terrain, score] of Object.entries(terrainScores)) {
            if (score > bestScore) {
                bestScore = score;
                bestTerrain = terrain;
            }
        }

        // If no terrain scored above 0, fall back to creature type associations
        if (bestScore === 0) {
            const creatureType = this.getMonsterType(monster);
            // Use existing environment system as fallback
            for (const [env, types] of Object.entries(this.environments)) {
                if (types.includes(creatureType)) {
                    return env;
                }
            }
        }

        return bestTerrain;
    }

    // Keep the old method for backward compatibility
    getMonsterEnvironment(monster) {
        return this.getMonsterTerrain(monster);
    }

    // Enhanced ecological logic validation methods
    getCreatureBaseName(monsterName) {
        // Extract base creature name for relationship lookups
        const baseName = monsterName.replace(/\s*\(.*?\)/, '') // Remove parentheses
            .replace(/\s+(Elite|Weak|Greater|Lesser|Young|Ancient|Adult)$/, '') // Remove modifiers
            .replace(/^(Greater|Lesser|Young|Ancient|Adult)\s+/, '') // Remove prefixes
            .trim();
        
        // Check for exact matches first
        if (this.creatureRelationships[baseName]) {
            return baseName;
        }
        
        // Check for partial matches
        for (const creatureName of Object.keys(this.creatureRelationships)) {
            if (baseName.includes(creatureName) || creatureName.includes(baseName)) {
                return creatureName;
            }
        }
        
        return baseName;
    }

    isCreatureDomesticated(monster) {
        const baseName = this.getCreatureBaseName(monster.name);
        const relationship = this.creatureRelationships[baseName];
        return relationship ? relationship.domesticated : false;
    }

    isCreatureTerritorial(monster) {
        const baseName = this.getCreatureBaseName(monster.name);
        const relationship = this.creatureRelationships[baseName];
        return relationship ? relationship.territorial : false;
    }

    isCreatureSolitary(monster) {
        const baseName = this.getCreatureBaseName(monster.name);
        const relationship = this.creatureRelationships[baseName];
        return relationship ? relationship.solitary : false;
    }

    getCreaturePackSize(monster) {
        const baseName = this.getCreatureBaseName(monster.name);
        const relationship = this.creatureRelationships[baseName];
        return relationship ? relationship.packSize : [1, 4];
    }

    canCreaturesCoexist(monster1, monster2) {
        const baseName1 = this.getCreatureBaseName(monster1.name);
        const baseName2 = this.getCreatureBaseName(monster2.name);
        
        // Same creature types can usually coexist (unless specifically conflicted)
        if (baseName1 === baseName2) {
            return true;
        }
        
        // Check for direct ecological conflicts
        const conflicts1 = this.ecologicalConflicts[baseName1] || [];
        const conflicts2 = this.ecologicalConflicts[baseName2] || [];
        
        // Direct name conflicts
        if (conflicts1.includes(baseName2) || conflicts2.includes(baseName1)) {
            return false;
        }
        
        // Check for partial name matches in conflicts (for broader categories)
        for (const conflict of conflicts1) {
            if (baseName2.includes(conflict) || conflict.includes(baseName2)) {
                return false;
            }
        }
        
        for (const conflict of conflicts2) {
            if (baseName1.includes(conflict) || conflict.includes(baseName1)) {
                return false;
            }
        }
        
        // Check creature types for fundamental incompatibilities
        const type1 = this.getMonsterType(monster1);
        const type2 = this.getMonsterType(monster2);
        
        // Fundamental type conflicts
        const typeConflicts = {
            'celestial': ['fiend', 'undead', 'demon', 'devil'],
            'fiend': ['celestial', 'angel'],
            'demon': ['devil', 'celestial', 'angel'],
            'devil': ['demon', 'celestial', 'angel'],
            'undead': ['celestial', 'angel'],
            'dragon': ['dragon'], // Dragons don't work with other dragons unless same family
        };
        
        if (typeConflicts[type1]?.includes(type2) || typeConflicts[type2]?.includes(type1)) {
            return false;
        }
        
        // Check for territorial conflicts between different species
        if (this.isCreatureTerritorial(monster1) && 
            this.isCreatureTerritorial(monster2) && 
            baseName1 !== baseName2) {
            return false;
        }
        
        // Check for solitary creatures (they don't group with others)
        if (this.isCreatureSolitary(monster1) && baseName1 !== baseName2) {
            return false;
        }
        
        if (this.isCreatureSolitary(monster2) && baseName1 !== baseName2) {
            return false;
        }
        
        // Additional intelligent creature logic
        if (this.isIntelligentCreature(monster1) && this.isIntelligentCreature(monster2)) {
            // Check alignment conflicts for intelligent creatures
            if (this.hasAlignmentConflict(monster1, monster2)) {
                return false;
            }
        }
        
        return true;
    }
    
    isIntelligentCreature(monster) {
        const name = monster.name.toLowerCase();
        const intelligentTypes = ['humanoid', 'fiend', 'celestial', 'dragon', 'fey'];
        const creatureType = this.getMonsterType(monster);
        
        return intelligentTypes.includes(creatureType) || 
               name.includes('captain') || name.includes('chief') || 
               name.includes('wizard') || name.includes('priest');
    }
    
    hasAlignmentConflict(monster1, monster2) {
        // Simplified alignment conflict check
        const name1 = monster1.name.toLowerCase();
        const name2 = monster2.name.toLowerCase();
        
        const goodKeywords = ['angel', 'archon', 'azata', 'paladin', 'good'];
        const evilKeywords = ['demon', 'devil', 'undead', 'evil', 'dark'];
        
        const isGood1 = goodKeywords.some(keyword => name1.includes(keyword));
        const isEvil1 = evilKeywords.some(keyword => name1.includes(keyword));
        const isGood2 = goodKeywords.some(keyword => name2.includes(keyword));
        const isEvil2 = evilKeywords.some(keyword => name2.includes(keyword));
        
        // Good and evil creatures typically don't work together
        return (isGood1 && isEvil2) || (isEvil1 && isGood2);
    }

    canCreaturesPack(monster1, monster2) {
        const baseName1 = this.getCreatureBaseName(monster1.name);
        const baseName2 = this.getCreatureBaseName(monster2.name);
        
        const relationship1 = this.creatureRelationships[baseName1];
        const relationship2 = this.creatureRelationships[baseName2];
        
        if (!relationship1 || !relationship2) return false;
        
        // Check if they can pack together
        const canPack = relationship1.packsWith?.includes(baseName2) || 
                       relationship2.packsWith?.includes(baseName1);
        
        return canPack;
    }

    canCreatureLeadOthers(leader, follower) {
        const leaderName = this.getCreatureBaseName(leader.name);
        const followerName = this.getCreatureBaseName(follower.name);
        
        const leaderRelationship = this.creatureRelationships[leaderName];
        const followerRelationship = this.creatureRelationships[followerName];
        
        if (!leaderRelationship || !followerRelationship) return false;
        
        // Check if leader can lead this type of creature
        const canLead = leaderRelationship.leaderOf?.includes(followerName);
        
        // Check if follower accepts this type of leader
        const acceptsLeader = followerRelationship.followsLeader?.includes(leaderName);
        
        return canLead || acceptsLeader;
    }

    validateEncounterLogic(encounters) {
        // Validate the ecological logic of an encounter group
        const validationResults = {
            valid: true,
            warnings: [],
            errors: []
        };
        
        // Check for domesticated creatures in wild environments
        const domesticated = encounters.filter(e => this.isCreatureDomesticated(e.monster));
        if (domesticated.length > 0) {
            const terrain = document.getElementById('terrain-selector').value;
            if (terrain === 'forest' || terrain === 'swamp' || terrain === 'mountain') {
                validationResults.warnings.push(
                    `Domesticated creatures (${domesticated.map(e => e.monster.name).join(', ')}) unlikely in wild ${terrain}`
                );
            }
        }
        
        // Check for territorial conflicts
        const territorial = encounters.filter(e => this.isCreatureTerritorial(e.monster));
        if (territorial.length > 1) {
            const different = territorial.filter((e, i) => 
                territorial.findIndex(t => this.getCreatureBaseName(t.monster.name) === 
                                         this.getCreatureBaseName(e.monster.name)) !== i
            );
            if (different.length > 0) {
                validationResults.errors.push(
                    `Multiple territorial species cannot coexist: ${different.map(e => e.monster.name).join(', ')}`
                );
                validationResults.valid = false;
            }
        }
        
        // Check pack size logic
        encounters.forEach(encounter => {
            const packSize = this.getCreaturePackSize(encounter.monster);
            if (encounter.count < packSize[0] || encounter.count > packSize[1]) {
                validationResults.warnings.push(
                    `${encounter.monster.name} pack size (${encounter.count}) unusual (typical: ${packSize[0]}-${packSize[1]})`
                );
            }
        });
        
        // Check for coexistence conflicts
        for (let i = 0; i < encounters.length; i++) {
            for (let j = i + 1; j < encounters.length; j++) {
                if (!this.canCreaturesCoexist(encounters[i].monster, encounters[j].monster)) {
                    validationResults.errors.push(
                        `${encounters[i].monster.name} and ${encounters[j].monster.name} are natural enemies`
                    );
                    validationResults.valid = false;
                }
            }
        }
        
        return validationResults;
    }

    getEncounterTemplateInfo() {
        // Try to deduce which template was used based on the encounter structure
        if (!this.currentEncounter || this.currentEncounter.length === 0) return null;
        
        const roles = this.currentEncounter.map(entry => entry.role).filter(role => role);
        const creatures = this.currentEncounter.map(entry => this.getCreatureBaseName(entry.monster.name));
        
        // Check each template to see if it matches our encounter
        for (const [templateId, template] of Object.entries(this.encounterTemplates)) {
            const templateRoles = template.structure.map(s => s.role);
            const templateCreatures = template.structure.flatMap(s => s.creatures);
            
            // Check if roles match
            const rolesMatch = roles.every(role => templateRoles.includes(role));
            
            // Check if creatures match
            const creaturesMatch = creatures.some(creature => 
                templateCreatures.some(templateCreature => 
                    creature.includes(templateCreature) || templateCreature.includes(creature)
                )
            );
            
            if (rolesMatch && creaturesMatch) {
                return template;
            }
        }
        
        return null;
    }

    areMonsterCompatible(monster1, monster2) {
        // First check if they can coexist (this handles major conflicts)
        if (!this.canCreaturesCoexist(monster1, monster2)) {
            return false;
        }
        
        // Check terrain compatibility - must be strict for natural encounters
        const terrain1 = this.getMonsterTerrain(monster1);
        const terrain2 = this.getMonsterTerrain(monster2);
        
        if (!this.areTerrainCompatible(terrain1, terrain2)) {
            return false;
        }
        
        // Check creature type compatibility
        const type1 = this.getMonsterType(monster1);
        const type2 = this.getMonsterType(monster2);
        
        if (!this.areCreatureTypesCompatible(type1, type2)) {
            return false;
        }
        
        // Check for specific creature incompatibilities
        if (this.areSpecificEnemies(monster1, monster2)) {
            return false;
        }
        
        return true;
    }

    areTerrainCompatible(terrain1, terrain2) {
        // Exact terrain match is always compatible
        if (terrain1 === terrain2) return true;
        
        // Define terrain incompatibilities
        const terrainConflicts = {
            'aquatic': ['desert', 'volcanic', 'arctic'], // Water vs dry/hot/frozen
            'desert': ['aquatic', 'swamp', 'arctic'], // Hot/dry vs wet/cold
            'arctic': ['desert', 'volcanic', 'swamp'], // Cold vs hot/warm
            'volcanic': ['aquatic', 'arctic'], // Hot vs cold/water
            'swamp': ['desert', 'arctic'], // Wet vs dry/cold
            'underground': [], // Underground can connect to most terrains
            'forest': [], // Forests can border most terrains
            'mountain': [], // Mountains can have various climates
            'plains': [], // Plains can border most terrains
            'coastal': ['desert'], // Coastal areas are wet
            'urban': [] // Cities can be in various terrains
        };
        
        const conflicts1 = terrainConflicts[terrain1] || [];
        const conflicts2 = terrainConflicts[terrain2] || [];
        
        // Check if terrains are incompatible
        if (conflicts1.includes(terrain2) || conflicts2.includes(terrain1)) {
            return false;
        }
        
        // Define terrain adjacencies (compatible neighbors)
        const adjacentTerrains = {
            'forest': ['plains', 'mountain', 'swamp', 'coastal'],
            'plains': ['forest', 'mountain', 'desert', 'coastal', 'urban'],
            'mountain': ['forest', 'plains', 'arctic', 'volcanic', 'desert'],
            'swamp': ['forest', 'coastal', 'plains'],
            'coastal': ['plains', 'forest', 'swamp', 'urban'],
            'urban': ['plains', 'coastal'],
            'underground': ['mountain', 'swamp', 'volcanic'], // Caves connect
            'aquatic': ['coastal'], // Only borders coastal
            'desert': ['plains', 'mountain'], // Hot, dry areas
            'volcanic': ['mountain', 'underground'], // Volcanic areas
            'arctic': ['mountain'] // Cold, isolated
        };
        
        const adjacent1 = adjacentTerrains[terrain1] || [];
        const adjacent2 = adjacentTerrains[terrain2] || [];
        
        // Compatible if terrains are adjacent to each other
        return adjacent1.includes(terrain2) || adjacent2.includes(terrain1);
    }

    areCreatureTypesCompatible(type1, type2) {
        // Same types are usually compatible
        if (type1 === type2) return true;
        
        // Define type incompatibilities
        const typeConflicts = {
            'celestial': ['fiend', 'undead', 'aberration'],
            'fiend': ['celestial', 'angel'],
            'undead': ['celestial', 'animal', 'plant'],
            'aberration': ['celestial', 'animal', 'plant', 'fey'],
            'construct': ['animal', 'plant'], // Artificial vs natural
            'dragon': [], // Dragons are solitary but handled elsewhere
            'fey': ['aberration', 'undead'], // Natural vs unnatural
            'animal': ['undead', 'aberration', 'construct'],
            'plant': ['undead', 'aberration', 'construct']
        };
        
        const conflicts1 = typeConflicts[type1] || [];
        const conflicts2 = typeConflicts[type2] || [];
        
        return !conflicts1.includes(type2) && !conflicts2.includes(type1);
    }

    areSpecificEnemies(monster1, monster2) {
        const name1 = monster1.name.toLowerCase();
        const name2 = monster2.name.toLowerCase();
        
        // Specific creature enmities
        const specificEnemies = {
            'moray': ['redcap', 'dryad', 'treant', 'leshy', 'unicorn'], // Aquatic vs forest
            'redcap': ['moray', 'shark', 'merfolk', 'sea', 'aquatic', 'water'], // Evil fey vs aquatic
            'shark': ['redcap', 'dryad', 'treant', 'forest'], // Aquatic vs forest
            'merfolk': ['redcap', 'goblin', 'orc'], // Good aquatic vs evil land
            'dryad': ['moray', 'shark', 'undead', 'fiend'], // Forest guardian vs unnatural
            'treant': ['fire', 'undead', 'aquatic'], // Tree vs fire/unnatural/water
            'unicorn': ['redcap', 'hag', 'undead', 'fiend'], // Pure vs evil
            'angel': ['demon', 'devil', 'undead', 'fiend'], // Good vs evil
            'demon': ['angel', 'devil', 'celestial'], // Chaos vs order/good
            'devil': ['demon', 'angel', 'celestial'], // Evil vs good/chaos
            'phoenix': ['undead', 'ice', 'frost'], // Fire/life vs death/cold
            'lich': ['angel', 'paladin', 'phoenix'], // Undead vs life/good
            'vampire': ['angel', 'paladin', 'phoenix'], // Undead vs life/good
        };
        
        // Check if either creature has the other as a specific enemy
        for (const [creature, enemies] of Object.entries(specificEnemies)) {
            if (name1.includes(creature)) {
                for (const enemy of enemies) {
                    if (name2.includes(enemy)) return true;
                }
            }
            if (name2.includes(creature)) {
                for (const enemy of enemies) {
                    if (name1.includes(enemy)) return true;
                }
            }
        }
        
        return false;
    }

    getMonsterXP(monster, partyLevel) {
        const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
        const levelDiff = monsterLevel - partyLevel;

        // Clamp the level difference to the supported range
        const clampedDiff = Math.max(-4, Math.min(4, levelDiff));
        
        // Format the key for lookup (handle positive numbers with + prefix)
        const key = clampedDiff >= 0 ? `+${clampedDiff}` : `${clampedDiff}`;
        
        // Use the official PF2e creature XP table
        const xpData = this.creatureXPByLevel[key];
        
        return xpData ? xpData.xp : 40; // Default to party level XP if not found
    }

    getMonsterRole(monster, partyLevel) {
        const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
        const levelDiff = monsterLevel - partyLevel;
        const clampedDiff = Math.max(-4, Math.min(4, levelDiff));
        const key = clampedDiff >= 0 ? `+${clampedDiff}` : `${clampedDiff}`;
        const xpData = this.creatureXPByLevel[key];
        
        return xpData ? xpData.role : 'Standard creature';
    }

    updateXPBudget() {
        const partyLevel = parseInt(document.getElementById('party-level').value);
        const partySize = parseInt(document.getElementById('party-size').value);
        const difficulty = document.getElementById('encounter-difficulty').value;

        // Calculate XP budget using official Table 10-1: Encounter Budget
        let xpBudget = this.baseBudgets[difficulty];
        
        // Adjust for party size (official rule: add/subtract character adjustment per character above/below 4)
        if (partySize !== 4) {
            const characterDifference = partySize - 4;
            const adjustment = this.characterAdjustments[difficulty];
            xpBudget += (characterDifference * adjustment);
        }

        // Ensure trivial encounters don't go below 0 or above 40
        if (difficulty === 'trivial') {
            xpBudget = Math.max(0, Math.min(40, xpBudget));
        }

        document.querySelector('.budget-value').textContent = `${xpBudget} XP`;
        
        // Update difficulty display
        const difficultyElement = document.querySelector('.difficulty-value');
        difficultyElement.textContent = difficulty;
        difficultyElement.className = `difficulty-value ${difficulty}`;

        return xpBudget;
    }

    // Monster Variant Functions

    generateEncounter() {
        // Get monsters from monster viewer
        if (!window.monsterViewer || !window.monsterViewer.monsters || window.monsterViewer.monsters.length === 0) {
            alert('No monsters loaded! Please load monsters in the Monster Viewer first.');
            return;
        }

        // Clear previous loot when generating new encounter
        this.currentLoot = null;
        document.getElementById('encounter-loot-display').innerHTML = '<p class="no-loot">Generate an encounter and click "Generate Loot" to see treasure.</p>';
        
        this.monsters = window.monsterViewer.monsters;
        const partyLevel = parseInt(document.getElementById('party-level').value);
        const selectedTerrain = document.getElementById('terrain-selector').value;
        const monsterVariant = document.getElementById('monster-variant').value;
        const targetXP = this.updateXPBudget();
        
        // Try to generate a logical encounter first
        let logicalEncounter = this.generateLogicalEncounter(partyLevel, selectedTerrain, targetXP, monsterVariant);
        
        if (logicalEncounter && logicalEncounter.length > 0) {
            this.currentEncounter = logicalEncounter;
            this.displayEncounter();
            this.showSaveToCampaignButton();
            return;
        }
        
        // Fallback to original random system if logical generation fails
        this.generateRandomEncounter(partyLevel, selectedTerrain, targetXP, monsterVariant);
        this.showSaveToCampaignButton();
    }

    generateLogicalEncounter(partyLevel, selectedTerrain, targetXP, monsterVariant) {
        // Filter encounter templates by terrain
        const availableTemplates = Object.values(this.encounterTemplates).filter(template => {
            if (selectedTerrain === 'any') return true;
            return template.terrain.includes(selectedTerrain);
        });
        
        if (availableTemplates.length === 0) {
            return null;
        }
        
        // Try multiple templates until we find one that works
        for (let attempt = 0; attempt < 5; attempt++) {
            const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
            const encounter = this.buildEncounterFromTemplate(template, partyLevel, targetXP, monsterVariant);
            
            if (encounter && encounter.length > 0) {
                // Validate the encounter logic
                const validation = this.validateEncounterLogic(encounter);
                if (validation.valid) {
                    return encounter;
                }
            }
        }
        
        return null;
    }

    buildEncounterFromTemplate(template, partyLevel, targetXP, monsterVariant) {
        const encounter = [];
        let currentXP = 0;
        
        // Process each role in the template structure
        for (const role of template.structure) {
            const count = Array.isArray(role.count) ? 
                Math.floor(Math.random() * (role.count[1] - role.count[0] + 1)) + role.count[0] :
                role.count;
            
            if (count === 0) continue;
            
            // Find matching monsters for this role
            const matchingMonsters = this.findMonstersForRole(role, partyLevel);
            if (matchingMonsters.length === 0) continue;
            
            const baseMonster = matchingMonsters[Math.floor(Math.random() * matchingMonsters.length)];
            const selectedMonster = this.selectMonsterVariant(baseMonster, monsterVariant);
            const monsterXP = this.getMonsterXP(selectedMonster, partyLevel);
            
            // Check if adding this group would exceed our XP budget
            const groupXP = monsterXP * count;
            if (currentXP + groupXP > targetXP * 1.15) {
                // Try to fit fewer creatures
                const maxCount = Math.floor((targetXP * 1.15 - currentXP) / monsterXP);
                if (maxCount > 0) {
                    encounter.push({
                        monster: selectedMonster,
                        count: maxCount,
                        xp: monsterXP * maxCount,
                        role: role.role
                    });
                    currentXP += monsterXP * maxCount;
                }
                // Don't break - try to add more creatures with remaining roles
                continue;
            }
            
            encounter.push({
                monster: selectedMonster,
                count: count,
                xp: groupXP,
                role: role.role
            });
            currentXP += groupXP;
        }
        
        // Apply smart leadership logic after building the encounter
        this.applyLeadershipLogic(encounter);
        
        // Check if we're within acceptable XP range
        // Accept encounters that are at least 80% of target and up to 120% (tighter range for better balance)
        if (currentXP >= targetXP * 0.8 && currentXP <= targetXP * 1.2) {
            return encounter;
        }
        
        // If we're close but under budget, try to add one more small creature
        if (currentXP >= targetXP * 0.7 && currentXP < targetXP * 0.8) {
            const remainingXP = targetXP - currentXP;
            const smallCreature = this.findSmallCreatureForBudget(remainingXP, partyLevel);
            if (smallCreature) {
                const smallMonster = this.selectMonsterVariant(smallCreature, monsterVariant);
                const smallXP = this.getMonsterXP(smallMonster, partyLevel);
                if (currentXP + smallXP <= targetXP * 1.2) {
                    encounter.push({
                        monster: smallMonster,
                        count: 1,
                        xp: smallXP,
                        role: 'minion'
                    });
                    return encounter;
                }
            }
        }
        
        return null;
    }

    findSmallCreatureForBudget(remainingXP, partyLevel) {
        // Find a creature that fits in the remaining XP budget
        const maxLevel = partyLevel - 1; // Look for creatures 1 level below party for budget filling
        
        const suitableCreatures = this.monsters.filter(monster => {
            const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
            const monsterXP = this.getMonsterXP(monster, partyLevel);
            
            return monsterLevel <= maxLevel && monsterXP <= remainingXP;
        });
        
        if (suitableCreatures.length === 0) return null;
        
        // Prefer the creature that uses the most of the remaining budget
        suitableCreatures.sort((a, b) => {
            const aXP = this.getMonsterXP(a, partyLevel);
            const bXP = this.getMonsterXP(b, partyLevel);
            return bXP - aXP; // Descending order
        });
        
        return suitableCreatures[0];
    }

    applyLeadershipLogic(encounter) {
        // Sort creatures by natural leadership hierarchy
        encounter.sort((a, b) => {
            const aLevel = a.monster.system?.details?.level?.value || a.monster.level || 1;
            const bLevel = b.monster.system?.details?.level?.value || b.monster.level || 1;
            const aPriority = this.getLeadershipPriority(a.monster);
            const bPriority = this.getLeadershipPriority(b.monster);
            
            // Higher leadership priority first, then higher level
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            return bLevel - aLevel;
        });
        
        // Reassign roles based on sorted order
        for (let i = 0; i < encounter.length; i++) {
            const entry = encounter[i];
            const level = entry.monster.system?.details?.level?.value || entry.monster.level || 1;
            
            if (i === 0) {
                // Highest priority creature becomes leader
                entry.role = this.getLeaderRole(entry.monster);
            } else {
                // Others become appropriate subordinate roles
                entry.role = this.getSubordinateRole(entry, encounter[0]);
            }
        }
    }

    getLeadershipPriority(monster) {
        const name = monster.name.toLowerCase();
        const baseName = this.getCreatureBaseName(monster.name);
        
        // Leadership hierarchy priority (higher = better leader)
        const leadershipRanks = {
            // High-ranking leaders
            'captain': 100, 'chief': 95, 'warchief': 90, 'champion': 85,
            'commander': 80, 'general': 75, 'lord': 70, 'king': 65,
            
            // Mid-tier leaders
            'hobgoblin': 60, 'orc': 55, 'bugbear': 50,
            'sergeant': 45, 'veteran': 40, 'elite': 35,
            
            // Natural pack leaders
            'dire wolf': 30, 'alpha': 25,
            
            // Basic creatures
            'goblin': 20, 'kobold': 15, 'skeleton': 10,
            'zombie': 5, 'minion': 1
        };
        
        // Check for explicit rank keywords
        for (const [keyword, priority] of Object.entries(leadershipRanks)) {
            if (name.includes(keyword) || baseName.toLowerCase().includes(keyword)) {
                return priority;
            }
        }
        
        // Fall back to creature level as tiebreaker
        const level = monster.system?.details?.level?.value || monster.level || 1;
        return level;
    }

    getLeaderRole(monster) {
        const name = monster.name.toLowerCase();
        
        if (name.includes('captain') || name.includes('chief') || name.includes('commander')) {
            return 'leader';
        } else if (name.includes('champion') || name.includes('sergeant') || name.includes('veteran')) {
            return 'lieutenant';
        } else if (name.includes('dire') || name.includes('alpha')) {
            return 'alpha';
        } else {
            return 'leader';
        }
    }

    getSubordinateRole(subordinate, leader) {
        const subName = subordinate.monster.name.toLowerCase();
        const leaderName = leader.monster.name.toLowerCase();
        const subLevel = subordinate.monster.system?.details?.level?.value || subordinate.monster.level || 1;
        const leaderLevel = leader.monster.system?.details?.level?.value || leader.monster.level || 1;
        
        // If subordinate is close in level to leader, make them lieutenant/elite
        if (Math.abs(subLevel - leaderLevel) <= 1 && subLevel >= leaderLevel - 1) {
            if (subName.includes('warrior') || subName.includes('guard') || subName.includes('soldier')) {
                return 'elite';
            } else {
                return 'lieutenant';
            }
        }
        
        // Otherwise, assign based on creature type
        if (subName.includes('warrior') || subName.includes('guard')) {
            return 'warrior';
        } else if (subName.includes('scout') || subName.includes('skulker')) {
            return 'scout';
        } else if (subName.includes('shaman') || subName.includes('priest')) {
            return 'shaman';
        } else {
            return 'minion';
        }
    }

    findMonstersForRole(role, partyLevel) {
        const suitableMonsters = [];
        
        for (const creatureName of role.creatures) {
            const monsters = this.monsters.filter(monster => {
                const baseName = this.getCreatureBaseName(monster.name);
                const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
                
                // Check if the monster matches the creature type
                const nameMatch = baseName === creatureName || 
                                monster.name.toLowerCase().includes(creatureName.toLowerCase()) ||
                                creatureName.toLowerCase().includes(baseName.toLowerCase());
                
                // Check if the level is appropriate
                const levelMatch = monsterLevel >= partyLevel - 4 && monsterLevel <= partyLevel + 4;
                
                return nameMatch && levelMatch;
            });
            
            suitableMonsters.push(...monsters);
        }
        
        return suitableMonsters;
    }

    generateRandomEncounter(partyLevel, selectedTerrain, targetXP, monsterVariant) {
        // Original random encounter generation as fallback
        let availableMonsters = this.monsters;
        if (selectedTerrain !== 'any') {
            availableMonsters = this.filterMonstersByTerrain(this.monsters, selectedTerrain);
            
            if (availableMonsters.length === 0) {
                alert(`No monsters found for ${selectedTerrain} terrain. Try selecting "Any Terrain" or load more monster data.`);
                return;
            }
        }
        
        this.currentEncounter = [];
        let currentXP = 0;
        let attempts = 0;
        const maxAttempts = 100;

        // Select a primary monster first from terrain-filtered list
        const basePrimaryMonster = this.selectRandomMonster(partyLevel, availableMonsters);
        if (!basePrimaryMonster) {
            alert(`No suitable monsters found for this party level in ${selectedTerrain === 'any' ? 'any' : selectedTerrain} terrain.`);
            return;
        }

        // Apply monster variant to primary monster
        const primaryMonster = this.selectMonsterVariant(basePrimaryMonster, monsterVariant);
        const primaryCount = 1;
        const primaryXP = this.getMonsterXP(primaryMonster, partyLevel);
        this.currentEncounter.push({
            monster: primaryMonster,
            count: primaryCount,
            xp: primaryXP * primaryCount
        });
        currentXP += primaryXP * primaryCount;

        // Add compatible monsters until we reach target XP
        while (currentXP < targetXP * 0.95 && attempts < maxAttempts) {
            attempts++;
            
            // Filter for compatible monsters within the terrain constraints
            let compatibleMonsters = availableMonsters.filter(monster => 
                this.areMonsterCompatible(basePrimaryMonster, monster)
            );
            
            // If no compatible monsters in the selected terrain, expand to all terrain
            if (compatibleMonsters.length === 0 && selectedTerrain !== 'any') {
                compatibleMonsters = this.monsters.filter(monster => 
                    this.areMonsterCompatible(basePrimaryMonster, monster)
                );
            }
            
            if (compatibleMonsters.length === 0) break;

            const baseNextMonster = this.selectRandomMonster(partyLevel, compatibleMonsters);
            if (!baseNextMonster) break;

            // Apply monster variant to next monster
            const nextMonster = this.selectMonsterVariant(baseNextMonster, monsterVariant);
            const nextXP = this.getMonsterXP(nextMonster, partyLevel);
            const remainingXP = targetXP - currentXP;
            
            // Determine how many of this monster to add
            let count = Math.min(
                Math.floor(remainingXP / nextXP) || 1,
                Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 3) + 1 // Bias toward smaller groups
            );

            if (count > 0 && currentXP + (nextXP * count) <= targetXP * 1.15) {
                this.currentEncounter.push({
                    monster: nextMonster,
                    count: count,
                    xp: nextXP * count
                });
                currentXP += nextXP * count;
            }

            if (currentXP >= targetXP * 1.0) break;
        }

        this.displayEncounter();
    }

    selectRandomMonster(partyLevel, fromList = null) {
        const monsterPool = fromList || this.monsters;
        
        // Filter monsters within reasonable level range
        const suitableMonsters = monsterPool.filter(monster => {
            const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
            return monsterLevel >= partyLevel - 4 && monsterLevel <= partyLevel + 4;
        });

        if (suitableMonsters.length === 0) return null;

        // Weight selection toward monsters closer to party level
        const weights = suitableMonsters.map(monster => {
            const monsterLevel = monster.system?.details?.level?.value || monster.level || 1;
            const levelDiff = Math.abs(monsterLevel - partyLevel);
            return Math.max(1, 5 - levelDiff); // Higher weight for closer levels
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < suitableMonsters.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return suitableMonsters[i];
            }
        }

        return suitableMonsters[0]; // Fallback
    }

    displayEncounter() {
        const encounterList = document.getElementById('encounter-monster-list');
        
        if (this.currentEncounter.length === 0) {
            encounterList.innerHTML = '<p class="no-encounter">No encounter generated.</p>';
            return;
        }

        const selectedTerrain = document.getElementById('terrain-selector').value;
        let terrainDisplay = '';
        
        if (selectedTerrain !== 'any') {
            const terrainName = document.getElementById('terrain-selector').selectedOptions[0].textContent;
            terrainDisplay = `<div class="encounter-terrain-info">
                <small>🗺️ Encounter for: ${terrainName}</small>
            </div>`;
        }

        // Check if this is a logical encounter with template information
        const hasRoles = this.currentEncounter.some(entry => entry.role);
        if (hasRoles) {
            const templateInfo = this.getEncounterTemplateInfo();
            if (templateInfo) {
                terrainDisplay += `<div class="encounter-template-info">
                    <small>📋 ${templateInfo.name}: ${templateInfo.description}</small>
                </div>`;
            }
        }

        // Validate encounter logic and show warnings/errors
        const validation = this.validateEncounterLogic(this.currentEncounter);
        let validationDisplay = '';
        
        if (validation.warnings.length > 0) {
            validationDisplay += '<div class="encounter-warnings">';
            validation.warnings.forEach(warning => {
                validationDisplay += `<small class="warning">⚠️ ${warning}</small><br>`;
            });
            validationDisplay += '</div>';
        }
        
        if (validation.errors.length > 0) {
            validationDisplay += '<div class="encounter-errors">';
            validation.errors.forEach(error => {
                validationDisplay += `<small class="error">❌ ${error}</small><br>`;
            });
            validationDisplay += '</div>';
        }

        encounterList.innerHTML = terrainDisplay + validationDisplay;

        this.currentEncounter.forEach((entry, index) => {
            const monsterItem = document.createElement('div');
            monsterItem.className = 'encounter-monster-item';
            monsterItem.dataset.index = index;

            const monsterLevel = entry.adjustedLevel || entry.monster.system?.details?.level?.value || entry.monster.level || 1;
            const countText = entry.count > 1 ? ` (×${entry.count})` : '';
            const monsterTerrain = this.getMonsterTerrain(entry.monster);
            const partyLevel = parseInt(document.getElementById('party-level').value);
            const officialRole = this.getMonsterRole(entry.monster, partyLevel);
            const roleText = entry.role ? ` [${entry.role}]` : ` [${officialRole}]`;
            const variantName = entry.variantName || '';

            monsterItem.innerHTML = `
                <div class="encounter-monster-name">${entry.monster.name}${variantName}${countText}${roleText}</div>
                <div class="encounter-monster-info">
                    <span class="monster-level">Level ${monsterLevel}</span>
                    <span class="monster-xp">${entry.xp} XP</span>
                    <span class="monster-terrain" title="Preferred terrain">${monsterTerrain}</span>
                    <select class="monster-variant-selector" data-index="${index}" onclick="event.stopPropagation()">
                        <option value="weak">Weak (-2)</option>
                        <option value="normal" selected>Normal</option>
                        <option value="elite">Elite (+2)</option>
                    </select>
                </div>
            `;

            monsterItem.addEventListener('click', () => {
                this.selectEncounterMonster(index, monsterItem);
            });
            
            // Add event listener for variant selector
            const variantSelector = monsterItem.querySelector('.monster-variant-selector');
            if (variantSelector) {
                variantSelector.addEventListener('change', (e) => {
                    this.changeMonsterVariant(index, e.target.value);
                });
            }

            encounterList.appendChild(monsterItem);
        });

        // Update total XP
        const totalXP = this.currentEncounter.reduce((sum, entry) => sum + entry.xp, 0);
        document.querySelector('.budget-value').textContent = `${totalXP} XP`;
    }

    selectEncounterMonster(index, itemElement) {
        // Remove previous selection
        document.querySelectorAll('.encounter-monster-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        itemElement.classList.add('selected');

        // Display monster details
        const entry = this.currentEncounter[index];
        if (entry && window.monsterViewer) {
            // Find the monster index in the main monster list
            const monsterIndex = window.monsterViewer.monsters.findIndex(m => m.name === entry.monster.name);
            if (monsterIndex !== -1) {
                // Display the monster in the details panel
                this.displayMonsterDetails(entry.monster);
            }
        }
    }

    async displayMonsterDetails(monster) {
        const detailsPanel = document.getElementById('encounter-monster-display');
        
        if (!window.monsterViewer) {
            detailsPanel.innerHTML = '<p class="no-monster-details">Monster viewer not available.</p>';
            return;
        }

        try {
            // Generate statblock HTML directly
            const statblockHTML = await window.monsterViewer.generateStatblockHTML(monster);
            detailsPanel.innerHTML = statblockHTML;
        } catch (error) {
            console.error('Error displaying monster details:', error);
            detailsPanel.innerHTML = '<p class="no-monster-details">Error loading monster details.</p>';
        }
    }

    // Method to add a monster to the current encounter
    addMonsterToEncounter(monster, count = 1) {
        if (!monster) return;

        const partyLevel = parseInt(document.getElementById('party-level').value);
        const monsterXP = this.getMonsterXP(monster, partyLevel);
        
        // Check if monster already exists in encounter
        const existingEntry = this.currentEncounter.find(entry => entry.monster.name === monster.name);
        
        if (existingEntry) {
            // Increase count of existing monster
            existingEntry.count += count;
            existingEntry.xp = this.getMonsterXP(monster, partyLevel) * existingEntry.count;
        } else {
            // Add new monster to encounter
            this.currentEncounter.push({
                monster: monster,
                count: count,
                xp: monsterXP * count
            });
        }
        
        this.displayEncounter();
    }

    filterMonstersByTerrain(monsters, terrain) {
        return monsters.filter(monster => {
            const monsterTerrain = this.getMonsterTerrain(monster);
            return monsterTerrain === terrain;
        });
    }

    updateTerrainDisplay() {
        const selectedTerrain = document.getElementById('terrain-selector').value;
        
        // Update any UI elements that show terrain information
        // This could include showing terrain-specific tips or monster counts
        console.log(`Terrain changed to: ${selectedTerrain}`);
        
        // Optionally, you could show how many monsters are available for this terrain
        if (window.monsterViewer && window.monsterViewer.monsters) {
            if (selectedTerrain === 'any') {
                console.log(`Total monsters available: ${window.monsterViewer.monsters.length}`);
            } else {
                const terrainMonsters = this.filterMonstersByTerrain(window.monsterViewer.monsters, selectedTerrain);
                console.log(`Monsters available for ${selectedTerrain}: ${terrainMonsters.length}`);
            }
        }
    }

    clearEncounter() {
        this.currentEncounter = [];
        this.currentLoot = null;
        document.getElementById('encounter-monster-list').innerHTML = '<p class="no-encounter">Click "Generate Encounter" to create a random encounter.</p>';
        document.getElementById('encounter-monster-display').innerHTML = '<p class="no-monster-details">Select a monster from the encounter to view its details.</p>';
        document.getElementById('encounter-loot-display').innerHTML = '<p class="no-loot">Generate an encounter and click "Generate Loot" to see treasure.</p>';
        this.updateXPBudget();
    }
    
    changeMonsterVariant(index, variant) {
        if (index < 0 || index >= this.currentEncounter.length) return;
        
        const entry = this.currentEncounter[index];
        const baseLevel = entry.monster.system?.details?.level?.value || entry.monster.level || 1;
        
        // Apply variant level adjustment
        let adjustedLevel = baseLevel;
        let variantName = '';
        
        switch (variant) {
            case 'weak':
                adjustedLevel = Math.max(1, baseLevel - 2);
                variantName = ' (Weak)';
                break;
            case 'elite':
                adjustedLevel = baseLevel + 2;
                variantName = ' (Elite)';
                break;
            case 'normal':
            default:
                adjustedLevel = baseLevel;
                variantName = '';
                break;
        }
        
        // Update the encounter entry
        entry.variant = variant;
        entry.adjustedLevel = adjustedLevel;
        entry.variantName = variantName;
        
        // Recalculate XP for this monster
        const partyLevel = parseInt(document.getElementById('party-level').value);
        const levelDiff = adjustedLevel - partyLevel;
        const clampedDiff = Math.max(-4, Math.min(4, levelDiff));
        const key = clampedDiff >= 0 ? `+${clampedDiff}` : `${clampedDiff}`;
        const xpData = this.creatureXPByLevel[key];
        
        entry.xp = xpData ? xpData.xp * entry.count : 40 * entry.count;
        
        // Refresh the encounter display
        this.displayEncounter();
    }

    addMonsterManually(monster) {
        console.log('addMonsterManually called with monster:', monster);
        console.log('Current encounter before adding:', this.currentEncounter);
        
        // Add monster to current encounter
        const encounterEntry = {
            monster: monster,
            count: 1,
            role: 'manually added'
        };
        
        this.currentEncounter.push(encounterEntry);
        console.log('Current encounter after adding:', this.currentEncounter);
        
        // Refresh the encounter display
        this.displayEncounter();
        console.log(`Successfully manually added ${monster.name} to encounter`);
    }

    async generateLoot() {
        if (this.currentEncounter.length === 0) {
            alert('Please generate an encounter first before generating loot!');
            return;
        }

        if (!window.lootGenerator) {
            alert('Loot generator not loaded. Please refresh the page and try again.');
            return;
        }

        console.log('Generating loot for current encounter...');
        
        // Show loading indicator
        document.getElementById('encounter-loot-display').innerHTML = 
            '<p class="loot-loading">⏳ Generating loot...</p>';

        // Get current settings
        const partyLevel = parseInt(document.getElementById('party-level').value);
        const difficulty = document.getElementById('encounter-difficulty').value;
        const terrain = document.getElementById('terrain-selector').value;

        try {
            // Generate loot using the loot generator (now async)
            const lootResult = await window.lootGenerator.generateLootForEncounter(
                this.currentEncounter,
                partyLevel,
                difficulty,
                terrain
            );

            if (lootResult) {
            // Store the generated loot
            this.currentLoot = {
                items: lootResult.items || [],
                totalValue: lootResult.totalValue || 0,
                partyLevel: partyLevel,
                difficulty: difficulty,
                terrain: terrain,
                occasion: 'encounter',
                timestamp: new Date().toISOString()
            };
            
            // Display the generated loot
            this.displayLoot(lootResult);
            console.log('Loot generated successfully:', lootResult);
            console.log('Loot result items:', lootResult?.items);
            console.log('Loot result structure:', Object.keys(lootResult || {}));
            } else {
                console.error('Failed to generate loot');
                this.currentLoot = null;
                document.getElementById('encounter-loot-display').innerHTML = 
                    '<p class="loot-error">Failed to generate loot. Please try again.</p>';
            }
        } catch (error) {
            console.error('Error generating loot:', error);
            this.currentLoot = null;
            document.getElementById('encounter-loot-display').innerHTML = 
                '<p class="loot-error">Error generating loot. Please try again.</p>';
        }
    }

    displayLoot(lootResult) {
        const lootDisplay = document.getElementById('encounter-loot-display');
        console.log('Loot display element:', lootDisplay);
        
        const lootHtml = window.lootGenerator.formatLootForDisplay(lootResult);
        console.log('Generated loot HTML:', lootHtml);
        console.log('HTML length:', lootHtml.length);
        
        lootDisplay.innerHTML = lootHtml;
        console.log('Display innerHTML after setting:', lootDisplay.innerHTML.substring(0, 100));
    }

    // Campaign Integration Methods
    showSaveToCampaignButton() {
        const saveButton = document.getElementById('save-encounter-btn');
        if (window.campaignManager && window.campaignManager.hasActiveCampaign()) {
            saveButton.style.display = 'inline-block';
        } else {
            saveButton.style.display = 'none';
        }
    }

    saveEncounterToCampaign() {
        if (!window.campaignManager || !window.campaignManager.hasActiveCampaign()) {
            alert('No active campaign! Please create or select a campaign first.');
            return;
        }

        if (!this.currentEncounter || this.currentEncounter.length === 0) {
            alert('No encounter to save! Please generate an encounter first.');
            return;
        }

        const partyLevel = parseInt(document.getElementById('party-level').value);
        const difficulty = document.getElementById('encounter-difficulty').value;
        const terrain = document.getElementById('terrain-selector').value;
        const totalXP = this.currentEncounter.reduce((sum, entry) => sum + entry.xp, 0);
        
        const notes = prompt('Add notes for this encounter (optional):') || '';
        
        // Save the encounter
        window.campaignManager.addEncounter(
            this.currentEncounter,
            difficulty,
            totalXP,
            terrain,
            partyLevel,
            notes
        );
        
        let savedItems = ['Encounter'];
        
        // Save loot if it exists
        if (this.currentLoot && this.currentLoot.items && this.currentLoot.items.length > 0) {
            window.campaignManager.addLoot(
                this.currentLoot.items,
                this.currentLoot.totalValue,
                partyLevel,
                'encounter',
                notes ? `Loot from encounter: ${notes}` : 'Loot from encounter'
            );
            savedItems.push('Loot');
        }
        
        alert(`${savedItems.join(' and ')} saved to campaign!`);
    }

    // Monster Variant System
    selectMonsterVariant(baseMonster, variantType) {
        if (!baseMonster) return null;
        
        const variants = ['weak', 'normal', 'elite'];
        let selectedVariant;
        
        switch (variantType) {
            case 'weak':
                selectedVariant = 'weak';
                break;
            case 'normal':
                selectedVariant = 'normal';
                break;
            case 'elite':
                selectedVariant = 'elite';
                break;
            case 'mixed':
            default:
                // Randomly select from all variants with normal being most common
                const weights = [0.25, 0.5, 0.25]; // 25% weak, 50% normal, 25% elite
                const random = Math.random();
                if (random < weights[0]) {
                    selectedVariant = 'weak';
                } else if (random < weights[0] + weights[1]) {
                    selectedVariant = 'normal';
                } else {
                    selectedVariant = 'elite';
                }
                break;
        }
        
        return this.applyMonsterVariant(baseMonster, selectedVariant);
    }

    applyMonsterVariant(monster, variant) {
        if (!monster || variant === 'normal') {
            return monster; // Return unchanged for normal variant
        }
        
        // Create a deep copy of the monster to avoid modifying the original
        const variantMonster = JSON.parse(JSON.stringify(monster));
        
        // Get base level
        const baseLevel = monster.system?.details?.level?.value || monster.level || 1;
        let newLevel = baseLevel;
        let prefix = '';
        
        // Apply variant modifications
        switch (variant) {
            case 'weak':
                newLevel = Math.max(1, baseLevel - 2);
                prefix = 'Weak ';
                break;
            case 'elite':
                newLevel = Math.min(20, baseLevel + 2);
                prefix = 'Elite ';
                break;
        }
        
        // Update the monster's name and level
        variantMonster.name = prefix + monster.name;
        if (variantMonster.system?.details?.level) {
            variantMonster.system.details.level.value = newLevel;
        } else {
            variantMonster.level = newLevel;
        }
        
        // Apply stat adjustments based on new level
        this.adjustMonsterStats(variantMonster, baseLevel, newLevel);
        
        return variantMonster;
    }

    adjustMonsterStats(monster, oldLevel, newLevel) {
        const levelDifference = newLevel - oldLevel;
        
        if (levelDifference === 0) return monster;
        
        // Base adjustment per level difference
        const adjustment = levelDifference;
        
        try {
            // Adjust AC (system.attributes.ac.value)
            if (monster.system?.attributes?.ac?.value) {
                monster.system.attributes.ac.value = Math.max(10, monster.system.attributes.ac.value + adjustment);
            }
            
            // Adjust HP (system.attributes.hp.max)
            if (monster.system?.attributes?.hp?.max) {
                const hpAdjustment = levelDifference * 10; // Rough estimate: 10 HP per level
                monster.system.attributes.hp.max = Math.max(1, monster.system.attributes.hp.max + hpAdjustment);
                monster.system.attributes.hp.value = monster.system.attributes.hp.max;
            }
            
            // Adjust saves (system.saves)
            if (monster.system?.saves) {
                ['fortitude', 'reflex', 'will'].forEach(save => {
                    if (monster.system.saves[save]?.value !== undefined) {
                        monster.system.saves[save].value += adjustment;
                    }
                });
            }
            
            // Adjust attack bonuses (system.actions)
            if (monster.system?.actions) {
                Object.values(monster.system.actions).forEach(action => {
                    if (action.attack?.value !== undefined) {
                        action.attack.value += adjustment;
                    }
                    if (action.damage?.value) {
                        // Increase damage dice for elite, decrease for weak
                        if (levelDifference > 0) {
                            action.damage.value = this.scaleDamageUp(action.damage.value);
                        } else if (levelDifference < 0) {
                            action.damage.value = this.scaleDamageDown(action.damage.value);
                        }
                    }
                });
            }
            
            // Adjust ability scores (system.abilities)
            if (monster.system?.abilities) {
                Object.keys(monster.system.abilities).forEach(ability => {
                    if (monster.system.abilities[ability]?.mod !== undefined) {
                        monster.system.abilities[ability].mod += Math.floor(adjustment / 2);
                    }
                });
            }
            
            // Adjust skills (system.skills)
            if (monster.system?.skills) {
                Object.keys(monster.system.skills).forEach(skill => {
                    if (monster.system.skills[skill]?.value !== undefined) {
                        monster.system.skills[skill].value += adjustment;
                    }
                });
            }
            
            // Adjust perception (system.attributes.perception)
            if (monster.system?.attributes?.perception?.value !== undefined) {
                monster.system.attributes.perception.value += adjustment;
            }
            
        } catch (error) {
            console.warn('Error adjusting monster stats for variant:', error);
        }
        
        return monster;
    }

    scaleDamageUp(damageString) {
        // Simple damage scaling - add +1 to damage rolls
        return damageString.replace(/(\d+d\d+)/g, (match, dice) => {
            return dice + '+1';
        });
    }

    scaleDamageDown(damageString) {
        // Simple damage scaling - subtract 1 from damage rolls (minimum 1)
        return damageString.replace(/(\d+d\d+)(\+\d+)?/g, (match, dice, bonus) => {
            if (bonus) {
                const bonusValue = parseInt(bonus.replace('+', '')) - 1;
                return bonusValue > 0 ? dice + '+' + bonusValue : dice;
            } else {
                return dice + '-1';
            }
        });
    }
}

// Initialize encounter generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.encounterGenerator = new EncounterGenerator();
});