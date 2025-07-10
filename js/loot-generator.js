class LootGenerator {
    constructor() {
        this.lootTables = null;
        this.treasureData = null;
        this.environmentalModifiers = this.initializeEnvironmentalModifiers();
        this.creatureTypeMapping = this.initializeCreatureTypeMapping();
        this.loadLootData();
    }

    async loadLootData() {
        try {
            console.log('🔄 Loading full equipment database...');
            this.isLoading = true;
            
            // Load all equipment files from the packs
            this.equipmentDatabase = await this.loadAllEquipment();
            console.log(`Loaded ${Object.keys(this.equipmentDatabase).length} equipment items`);
            
            // Build categorized loot tables from the equipment
            this.lootTables = this.buildLootTablesFromEquipment();
            console.log('Built loot tables from equipment database');
            
            // Load treasure budget data
            const treasureResponse = await fetch('shared-data/Rules/treasure-per-level.json');
            this.treasureData = await treasureResponse.json();
            
            // Load official PF2e loot composition data
            const compositionResponse = await fetch('shared-data/Rules/treasure-per-level-item-and-currencies.json');
            this.lootCompositionData = await compositionResponse.json();
            
            this.isLoading = false;
            console.log('✅ Loot data loaded successfully!');
        } catch (error) {
            this.isLoading = false;
            console.error('❌ Failed to load loot data:', error);
            // Fallback to basic loot tables
            this.createFallbackLootTables();
        }
    }

    async loadAllEquipment() {
        const equipment = {};
        
        try {
            console.log('Loading equipment from directory scan...');
            
            // Get all available equipment files dynamically
            const allFiles = await this.getAllEquipmentFiles();
            console.log(`Found ${allFiles.length} equipment files`);
            
            // Load files in batches to avoid overwhelming the system
            const batchSize = 100;
            const batches = [];
            
            for (let i = 0; i < allFiles.length; i += batchSize) {
                batches.push(allFiles.slice(i, i + batchSize));
            }
            
            for (const batch of batches) {
                const batchPromises = batch.map(filename => this.loadEquipmentFile(filename));
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        equipment[result.value._id] = this.parseEquipmentData(result.value);
                    }
                });
            }
            
            const totalLoaded = Object.keys(equipment).length;
            console.log(`Successfully loaded ${totalLoaded} equipment items from database`);
            
            // Create a name-based index for easier searching
            this.equipmentByName = {};
            Object.values(equipment).forEach(item => {
                if (item.item_name) {
                    const normalizedName = item.item_name.toLowerCase().replace(/\s+/g, '-');
                    this.equipmentByName[normalizedName] = item;
                }
            });
            
            console.log(`Created name index with ${Object.keys(this.equipmentByName).length} searchable items`);
            
            return equipment;
            
        } catch (error) {
            console.error('Failed to load equipment:', error);
            return this.createFallbackEquipment();
        }
    }

    async getAllEquipmentFiles() {
        try {
            // Load the complete list of actual equipment files
            const response = await fetch('shared-data/packs/equipment-files-list.txt');
            if (response.ok) {
                const fileListText = await response.text();
                const allFiles = fileListText.trim().split('\n').filter(line => line.trim().length > 0);
                console.log(`Found ${allFiles.length} actual equipment files to load`);
                return allFiles;
            } else {
                console.warn('Could not load equipment files list, falling back to subset');
                return this.getFallbackEquipmentFiles();
            }
        } catch (error) {
            console.warn('Error loading equipment files list, falling back to subset:', error);
            return this.getFallbackEquipmentFiles();
        }
    }

    getFallbackEquipmentFiles() {
        // Fallback to a small set of known files if the complete list fails
        return [
            'longsword.json', 'shortsword.json', 'greatsword.json', 'rapier.json', 'scimitar.json',
            'battle-axe.json', 'greataxe.json', 'warhammer.json', 'mace.json', 'dagger.json',
            'spear.json', 'javelin.json', 'shortbow.json', 'longbow.json', 'crossbow.json',
            'leather-armor.json', 'chain-shirt.json', 'chain-mail.json', 'breastplate.json',
            'full-plate.json', 'half-plate.json', 'buckler.json', 'tower-shield.json',
            'healing-potion-minor.json', 'healing-potion-lesser.json', 'healing-potion-moderate.json',
            'antidote-lesser.json', 'alchemists-fire-lesser.json'
        ];
    }

    async loadEquipmentFile(filename) {
        try {
            // Try the correct path first
            const response = await fetch(`shared-data/packs/equipment/${filename}`);
            if (response.ok) {
                const itemData = await response.json();
                if (itemData.system && itemData.name) {
                    return itemData;
                }
            }
        } catch (error) {
            // Try alternative paths if main path fails
            const alternatePaths = [
                `./shared-data/packs/equipment/${filename}`,
                `/shared-data/packs/equipment/${filename}`
            ];
            
            for (const path of alternatePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const itemData = await response.json();
                        if (itemData.system && itemData.name) {
                            return itemData;
                        }
                    }
                } catch (e) {
                    // Continue to next path
                }
            }
        }
        return null;
    }

    // Helper method to find equipment by name from the loaded database
    findEquipmentByName(itemName) {
        if (!this.equipmentByName) return null;
        
        const normalizedName = itemName.toLowerCase().replace(/\s+/g, '-');
        return this.equipmentByName[normalizedName] || null;
    }

    // Helper method to find equipment by partial name match
    findEquipmentByPartialName(partialName) {
        if (!this.equipmentByName) return [];
        
        const normalizedSearch = partialName.toLowerCase();
        return Object.entries(this.equipmentByName)
            .filter(([name, item]) => name.includes(normalizedSearch))
            .map(([name, item]) => item);
    }

    // Wait for loot data to finish loading
    async waitForLootData(maxWaitTime = 30000) {
        const startTime = Date.now();
        
        while (this.isLoading || (!this.lootTables || !this.treasureData)) {
            if (Date.now() - startTime > maxWaitTime) {
                console.error('⏰ Timeout waiting for loot data to load');
                break;
            }
            // Wait 200ms before checking again
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    parseEquipmentData(itemData) {
        const system = itemData.system;
        const traits = system.traits || {};
        
        // Parse description with text parser if available
        let description = system.description?.value || '';
        if (window.pf2eTextParser && description) {
            description = window.pf2eTextParser.enhanceLootDescription(description);
        }
        
        return {
            id: itemData._id,
            item_name: itemData.name,
            description: description,
            value: system.price?.value?.gp || 0,
            item_level: system.level?.value || 1,
            rarity: traits.rarity || 'common',
            type: this.determineItemType(itemData, system, traits),
            traits: traits.value || [],
            bulk: system.bulk?.value || 0,
            category: this.determineItemCategory(itemData, system, traits),
            source: 'equipment_packs'
        };
    }

    determineItemType(itemData, system, traits) {
        const type = itemData.type;
        const category = system.category;
        const group = system.group;
        const itemTraits = traits.value || [];
        const name = itemData.name ? itemData.name.toLowerCase() : '';
        
        // Check for runes first - they're special
        if (name.includes('rune') || category === 'rune' || type === 'rune') return 'rune';
        
        // Determine specific item type
        if (type === 'weapon') return 'weapon';
        if (type === 'armor') return 'armor';
        if (type === 'shield') return 'shield';
        if (type === 'consumable') return 'consumable';
        if (category === 'currency') return 'currency';
        if (itemTraits.includes('alchemical')) return 'alchemical';
        if (itemTraits.includes('magical')) return 'magical_item';
        if (group === 'gem' || name.includes('gem')) return 'gem';
        if (group === 'artObject') return 'art_object';
        if (category === 'adventuring-gear') return 'mundane_gear';
        if (category === 'tools') return 'tool';
        
        return 'misc';
    }

    determineItemCategory(itemData, system, traits) {
        const itemTraits = traits.value || [];
        const category = system.category;
        
        // Broad categories for creature type assignment
        if (itemTraits.includes('alchemical') || itemData.type === 'consumable') return 'consumables';
        if (itemTraits.includes('magical')) return 'magical_items';
        if (category === 'currency' || system.group === 'gem') return 'treasure';
        if (itemTraits.includes('precious') || system.material?.type) return 'rare_materials';
        if (category === 'adventuring-gear' || category === 'tools') return 'mundane_gear';
        
        return 'misc';
    }

    buildLootTablesFromEquipment() {
        const tables = {};
        
        // Initialize creature type tables
        const creatureTypes = ['animal', 'humanoid', 'construct', 'dragon', 'fey', 'undead', 
                              'aberration', 'elemental', 'giant', 'plant', 'vermin', 'other'];
        
        for (const creatureType of creatureTypes) {
            tables[creatureType] = {
                consumables: [],
                magical_items: [],
                treasure: [],
                rare_materials: [],
                mundane_gear: [],
                weapons: [],
                armor: [],
                runes: [],
                gems: [],
                misc: []
            };
        }
        
        // Categorize all equipment into creature-appropriate tables
        for (const [id, item] of Object.entries(this.equipmentDatabase)) {
            const suitableCreatures = this.determineSuitableCreatures(item);
            
            for (const creatureType of suitableCreatures) {
                if (tables[creatureType]) {
                    const categoryKey = this.mapCategoryToTable(item.category, item.type);
                    if (tables[creatureType][categoryKey]) {
                        tables[creatureType][categoryKey].push(item);
                    }
                }
            }
        }
        
        // Log table sizes
        for (const [creatureType, table] of Object.entries(tables)) {
            const totalItems = Object.values(table).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`${creatureType}: ${totalItems} items (weapons: ${table.weapons.length}, armor: ${table.armor.length}, consumables: ${table.consumables.length}, magical: ${table.magical_items.length}, runes: ${table.runes.length}, gems: ${table.gems.length})`);
        }
        
        return tables;
    }

    determineSuitableCreatures(item) {
        const creatures = [];
        const traits = item.traits || [];
        const type = item.type;
        const name = item.item_name.toLowerCase();
        
        // Currency, gems, and consumables can be found with any creature
        if (['currency', 'gem', 'consumable'].includes(type)) {
            return ['animal', 'humanoid', 'construct', 'dragon', 'fey', 'undead', 
                   'aberration', 'elemental', 'giant', 'plant', 'vermin', 'other'];
        }
        
        // Weapons and armor - ONLY for intelligent, humanoid-like creatures that can use them
        if (['weapon', 'armor', 'shield'].includes(type)) {
            // Animals like wolves, bears, etc. don't wear armor or wield weapons
            // Only intelligent creatures that have hands/can wear equipment
            creatures.push('humanoid', 'giant', 'fey', 'undead', 'dragon');
            
            // Some constructs and aberrations might use equipment if they're intelligent
            if (name.includes('golem') || name.includes('automaton')) {
                creatures.push('construct');
            }
            if (name.includes('mind') || name.includes('intellect')) {
                creatures.push('aberration');
            }
        }
        
        // Mundane gear only for creatures with hands and intelligence
        if (type === 'mundane_gear' || type === 'tool') {
            creatures.push('humanoid', 'giant', 'fey', 'undead', 'dragon');
        }
        
        // Magical items for magic-using creatures
        if (traits.includes('magical') || type === 'magical_item') {
            creatures.push('humanoid', 'dragon', 'fey', 'undead', 'aberration', 'elemental');
        }
        
        // Runes - only creatures that can enchant items
        if (type === 'rune' || name.includes('rune')) {
            creatures.push('humanoid', 'dragon', 'fey', 'construct', 'elemental');
        }
        
        // Natural/alchemical items for nature creatures and those who might consume them
        if (traits.includes('alchemical') || name.includes('herb') || name.includes('natural') || name.includes('potion')) {
            creatures.push('animal', 'plant', 'fey', 'humanoid', 'giant');
        }
        
        // Precious materials from earth/crafting creatures
        if (item.category === 'rare_materials' || traits.includes('precious')) {
            creatures.push('construct', 'elemental', 'dragon', 'giant');
        }
        
        // Art objects and valuables - mostly from intelligent creatures
        if (type === 'art_object' || item.category === 'treasure') {
            creatures.push('humanoid', 'dragon', 'fey', 'undead', 'giant');
        }
        
        // Default fallback for misc items
        if (creatures.length === 0) {
            creatures.push('other');
        }
        
        return creatures;
    }

    mapCategoryToTable(category, type) {
        const mapping = {
            'consumables': 'consumables',
            'magical_items': 'magical_items', 
            'treasure': 'treasure',
            'rare_materials': 'rare_materials',
            'mundane_gear': 'mundane_gear',
            'weapon': 'weapons',
            'armor': 'armor',
            'shield': 'armor',
            'rune': 'runes',
            'gem': 'gems'
        };
        
        return mapping[category] || mapping[type] || 'misc';
    }

    createFallbackEquipment() {
        console.log('Creating fallback equipment database...');
        const fallbackEquipment = {};
        
        // Create basic equipment items if files can't be loaded
        const basicItems = [
            // Weapons
            {id: 'fallback-dagger', item_name: 'Dagger', value: 2, type: 'weapon', item_level: 1, rarity: 'common', description: 'A simple dagger.'},
            {id: 'fallback-club', item_name: 'Club', value: 1, type: 'weapon', item_level: 1, rarity: 'common', description: 'A simple wooden club.'},
            {id: 'fallback-shortbow', item_name: 'Shortbow', value: 30, type: 'weapon', item_level: 1, rarity: 'common', description: 'A simple shortbow.'},
            {id: 'fallback-longsword', item_name: 'Longsword', value: 100, type: 'weapon', item_level: 1, rarity: 'common', description: 'A well-balanced longsword.'},
            
            // Armor
            {id: 'fallback-leather', item_name: 'Leather Armor', value: 20, type: 'armor', item_level: 1, rarity: 'common', description: 'Basic leather armor.'},
            {id: 'fallback-chain', item_name: 'Chain Mail', value: 150, type: 'armor', item_level: 1, rarity: 'common', description: 'Interlocking metal rings.'},
            {id: 'fallback-plate', item_name: 'Plate Armor', value: 1500, type: 'armor', item_level: 1, rarity: 'common', description: 'Heavy metal plate armor.'},
            
            // Consumables
            {id: 'fallback-healing-minor', item_name: 'Healing Potion (Minor)', value: 4, type: 'consumable', item_level: 1, rarity: 'common', description: 'Restores 1d8 Hit Points.'},
            {id: 'fallback-healing-lesser', item_name: 'Healing Potion (Lesser)', value: 12, type: 'consumable', item_level: 3, rarity: 'common', description: 'Restores 2d8+5 Hit Points.'},
            {id: 'fallback-antidote', item_name: 'Antidote', value: 5, type: 'consumable', item_level: 1, rarity: 'common', description: 'Counteracts poison.'},
            
            // Tools
            {id: 'fallback-rope', item_name: 'Rope (50 feet)', value: 2, type: 'tool', item_level: 1, rarity: 'common', description: 'Hemp rope, 50 feet long.'},
            {id: 'fallback-torch', item_name: 'Torch', value: 1, type: 'tool', item_level: 1, rarity: 'common', description: 'Provides light for 1 hour.'},
            {id: 'fallback-bedroll', item_name: 'Bedroll', value: 1, type: 'tool', item_level: 1, rarity: 'common', description: 'Simple sleeping gear.'},
            
            // Treasure
            {id: 'fallback-gold', item_name: 'Gold Coins', value: 50, type: 'currency', item_level: 1, rarity: 'common', description: 'Shiny gold coins.'},
            {id: 'fallback-silver', item_name: 'Silver Coins', value: 10, type: 'currency', item_level: 1, rarity: 'common', description: 'Silver coins.'},
            {id: 'fallback-gems', item_name: 'Small Gems', value: 25, type: 'gem', item_level: 1, rarity: 'common', description: 'Collection of small gems.'},
            
            // Magical items
            {id: 'fallback-magic-weapon', item_name: 'Magic Weapon (+1)', value: 350, type: 'weapon', item_level: 2, rarity: 'uncommon', description: 'A weapon with a +1 enhancement bonus.'},
            {id: 'fallback-magic-armor', item_name: 'Magic Armor (+1)', value: 160, type: 'armor', item_level: 2, rarity: 'uncommon', description: 'Armor with a +1 enhancement bonus.'},
            {id: 'fallback-scroll', item_name: 'Scroll of Magic Missile', value: 15, type: 'consumable', item_level: 1, rarity: 'common', description: 'A scroll containing the magic missile spell.'}
        ];
        
        basicItems.forEach(item => {
            fallbackEquipment[item.id] = {
                ...item,
                traits: [],
                bulk: 0.1,
                category: 'mundane_gear',
                source: 'fallback'
            };
        });
        
        return fallbackEquipment;
    }

    createFallbackLootTables() {
        console.log('Creating fallback loot tables...');
        this.lootTables = {
            humanoid: {
                treasure: [
                    {item_name: "Gold Coins", value: 50, rarity: "common", type: "currency", item_level: 1},
                    {item_name: "Silver Coins", value: 10, rarity: "common", type: "currency", item_level: 1}
                ],
                mundane_gear: [
                    {item_name: "Simple Weapon", value: 10, rarity: "common", type: "weapon", item_level: 1},
                    {item_name: "Leather Armor", value: 15, rarity: "common", type: "armor", item_level: 1}
                ],
                consumables: [
                    {item_name: "Healing Potion", value: 4, rarity: "common", type: "consumable", item_level: 1}
                ],
                weapons: [
                    {item_name: "Dagger", value: 2, rarity: "common", type: "weapon", item_level: 1},
                    {item_name: "Longsword", value: 100, rarity: "common", type: "weapon", item_level: 1}
                ],
                armor: [
                    {item_name: "Leather Armor", value: 20, rarity: "common", type: "armor", item_level: 1},
                    {item_name: "Chain Mail", value: 150, rarity: "common", type: "armor", item_level: 1}
                ],
                magical_items: [
                    {item_name: "Magic Weapon (+1)", value: 350, rarity: "uncommon", type: "weapon", item_level: 2}
                ],
                runes: [
                    {item_name: "Striking Rune", value: 65, rarity: "uncommon", type: "rune", item_level: 4},
                    {item_name: "Potency Rune (+1)", value: 35, rarity: "uncommon", type: "rune", item_level: 2}
                ],
                gems: [
                    {item_name: "Ruby Gem", value: 50, rarity: "common", type: "gem", item_level: 1},
                    {item_name: "Diamond Gem", value: 100, rarity: "uncommon", type: "gem", item_level: 2}
                ]
            },
            other: {
                treasure: [
                    {item_name: "Miscellaneous Trinket", value: 5, rarity: "common", type: "misc", item_level: 1}
                ],
                consumables: [
                    {item_name: "Healing Potion", value: 4, rarity: "common", type: "consumable", item_level: 1}
                ],
                gems: [
                    {item_name: "Small Gem", value: 25, rarity: "common", type: "gem", item_level: 1}
                ]
            }
        };
    }

    initializeCreatureTypeMapping() {
        return {
            'animal': ['animal'],
            'beast': ['animal'],
            'humanoid': ['humanoid'],
            'goblin': ['humanoid'],
            'orc': ['humanoid'],
            'human': ['humanoid'],
            'elf': ['humanoid'],
            'dwarf': ['humanoid'],
            'undead': ['undead'],
            'skeleton': ['undead'],
            'zombie': ['undead'],
            'dragon': ['dragon'],
            'fey': ['fey'],
            'construct': ['construct'],
            'golem': ['construct'],
            'aberration': ['aberration'],
            'elemental': ['elemental'],
            'giant': ['giant'],
            'plant': ['plant'],
            'vermin': ['vermin'],
            'fiend': ['humanoid'],
            'celestial': ['humanoid']
        };
    }

    initializeEnvironmentalModifiers() {
        return {
            'forest': {
                increases: ['animal', 'plant', 'fey'],
                decreases: ['construct', 'undead'],
                specialItems: ['herbs', 'berries', 'wooden items']
            },
            'mountain': {
                increases: ['giant', 'elemental', 'dragon'],
                decreases: ['fey', 'plant'],
                specialItems: ['gems', 'metal ores', 'stone tools']
            },
            'urban': {
                increases: ['humanoid', 'construct'],
                decreases: ['animal', 'plant'],
                specialItems: ['coins', 'trade goods', 'crafted items']
            }
        };
    }

    getOfficialLootComposition(partyLevel) {
        if (!this.lootCompositionData) {
            console.warn('Loot composition data not loaded');
            return null;
        }

        const levelData = this.lootCompositionData.treasureProgression?.find(
            data => data.level === partyLevel
        );

        if (!levelData) {
            console.warn(`No loot composition data found for level ${partyLevel}`);
            return null;
        }

        const composition = {
            permanentItems: levelData.permanentItems.itemsByLevel,
            consumables: levelData.consumables.itemsByLevel,
            partyCurrency: levelData.partyCurrencyNumeric,
            totalValue: levelData.totalValueNumeric
        };

        return composition;
    }

    async generateLootForEncounter(encounter, partyLevel, difficulty, terrain = 'any') {
        // Wait for loot data to be loaded if it's still loading
        if (!this.lootTables || !this.treasureData) {
            console.log('Loot data still loading, waiting...');
            await this.waitForLootData();
        }
        
        if (!this.lootTables || !this.treasureData) {
            console.error('Failed to load loot data');
            return null;
        }

        console.log('Generating loot for encounter:', encounter);
        
        const treasureBudget = this.calculateTreasureBudget(partyLevel, difficulty, encounter.length);
        console.log('Treasure budget:', treasureBudget);
        const lootItems = [];
        const creatureTypeSummary = this.analyzeEncounterCreatures(encounter);
        console.log('Creature type summary:', creatureTypeSummary);
        
        for (const [creatureType, count] of Object.entries(creatureTypeSummary)) {
            console.log(`Generating loot for ${count} ${creatureType} creatures`);
            const typeItems = this.generateLootForCreatureType(
                creatureType, 
                count, 
                treasureBudget / Object.keys(creatureTypeSummary).length,
                partyLevel,
                terrain
            );
            console.log(`Generated ${typeItems.length} items for ${creatureType}:`, typeItems);
            lootItems.push(...typeItems);
        }

        lootItems.sort((a, b) => {
            if (a.rarity !== b.rarity) {
                const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'very rare': 4, 'legendary': 5 };
                return (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1);
            }
            return b.value - a.value;
        });

        const result = {
            items: lootItems,
            totalValue: lootItems.reduce((sum, item) => sum + item.value, 0),
            treasureBudget: treasureBudget,
            creatureTypes: Object.keys(creatureTypeSummary),
            terrain: terrain
        };
        
        console.log('Final loot result:', result);
        return result;
    }

    calculateTreasureBudget(partyLevel, difficulty, encounterSize) {
        const officialTreasureTable = {
            1: { trivial: 5, low: 13, moderate: 18, severe: 26, extreme: 35 },
            2: { trivial: 8, low: 23, moderate: 30, severe: 45, extreme: 60 },
            3: { trivial: 13, low: 38, moderate: 50, severe: 75, extreme: 100 },
            4: { trivial: 22, low: 65, moderate: 85, severe: 130, extreme: 170 },
            5: { trivial: 34, low: 100, moderate: 135, severe: 200, extreme: 270 }
        };

        const levelData = officialTreasureTable[Math.min(partyLevel, 5)] || officialTreasureTable[1];
        let baseBudget = levelData[difficulty] || levelData.moderate;
        
        const sizeMultiplier = Math.min(1 + (encounterSize - 1) * 0.1, 1.5);
        return Math.floor(baseBudget * sizeMultiplier);
    }

    analyzeEncounterCreatures(encounter) {
        const creatureTypes = {};
        
        for (const entry of encounter) {
            const monster = entry.monster;
            const count = entry.count || 1;
            
            const detectedTypes = this.detectCreatureTypes(monster);
            
            for (const type of detectedTypes) {
                creatureTypes[type] = (creatureTypes[type] || 0) + count;
            }
        }
        
        return creatureTypes;
    }

    detectCreatureTypes(monster) {
        const traits = monster.system?.traits?.value || [];
        const name = monster.name.toLowerCase();
        const detectedTypes = [];
        
        for (const trait of traits) {
            const traitLower = trait.toLowerCase();
            if (this.creatureTypeMapping[traitLower]) {
                detectedTypes.push(...this.creatureTypeMapping[traitLower]);
            }
        }
        
        for (const [pattern, types] of Object.entries(this.creatureTypeMapping)) {
            if (name.includes(pattern)) {
                detectedTypes.push(...types);
            }
        }
        
        if (detectedTypes.length === 0) {
            detectedTypes.push('other');
        }
        
        return [...new Set(detectedTypes)];
    }

    generateLootForCreatureType(creatureType, count, budget, partyLevel, terrain) {
        const lootTable = this.lootTables[creatureType];
        if (!lootTable) {
            console.warn(`No loot table found for creature type: ${creatureType}`);
            return [];
        }

        const items = [];
        let remainingBudget = budget;
        
        for (let i = 0; i < count && remainingBudget > 0; i++) {
            const creatureItems = this.generateItemsForSingleCreature(
                lootTable,
                remainingBudget / (count - i), 
                partyLevel,
                terrain
            );
            
            items.push(...creatureItems);
            remainingBudget -= creatureItems.reduce((sum, item) => sum + item.value, 0);
        }
        
        return items;
    }

    generateItemsForSingleCreature(lootTable, budget, partyLevel, terrain) {
        const items = [];
        let remainingBudget = budget;
        
        const maxItems = Math.min(Math.floor(budget / 3) + 1, 5);
        let itemCount = 0;
        
        const categories = Object.keys(lootTable);
        let attempts = 0;
        const maxAttempts = 10;
        
        while (remainingBudget > 1 && attempts < maxAttempts && itemCount < maxItems) {
            attempts++;
            
            const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
            let addedItemThisRound = false;
            
            for (const category of shuffledCategories) {
                if (remainingBudget <= 1 || itemCount >= maxItems) break;
                
                const categoryItems = lootTable[category];
                const suitableItems = categoryItems.filter(item => 
                    item.item_level <= partyLevel + 3 && // More lenient level filtering
                    item.value <= remainingBudget &&
                    item.value >= 1 && // Reduced minimum value
                    this.isItemSuitableForTerrain(item, terrain) &&
                    !this.isLowValueNuisanceItem(item)
                );
                
                if (suitableItems.length === 0) continue;
                
                const categoryChance = this.getCategoryChance(category, terrain);
                
                if (Math.random() <= categoryChance) {
                    const selectedItem = suitableItems[Math.floor(Math.random() * suitableItems.length)];
                    items.push({...selectedItem, source: category});
                    remainingBudget -= selectedItem.value;
                    itemCount++;
                    addedItemThisRound = true;
                    break;
                }
            }
            
            if (!addedItemThisRound && remainingBudget > 10) {
                // Force add a valuable item
                const allItems = [];
                for (const category of categories) {
                    const categoryItems = lootTable[category];
                    const valuableItems = categoryItems.filter(item => 
                        item.item_level <= partyLevel + 3 &&
                        item.value <= remainingBudget &&
                        item.value >= 5 &&
                        this.isItemSuitableForTerrain(item, terrain) &&
                        !this.isLowValueNuisanceItem(item)
                    );
                    valuableItems.forEach(item => allItems.push({...item, source: category}));
                }
                
                if (allItems.length > 0) {
                    const selectedItem = allItems[Math.floor(Math.random() * allItems.length)];
                    items.push(selectedItem);
                    remainingBudget -= selectedItem.value;
                    itemCount++;
                }
            }
        }
        
        // Fill remaining budget with currency
        if (remainingBudget > 0) {
            const currencyItems = this.generateCurrencyItems(remainingBudget, partyLevel);
            items.push(...currencyItems);
        }
        
        return items;
    }

    isItemSuitableForTerrain(item, terrain) {
        return true; // Simplified for now
    }

    isLowValueNuisanceItem(item) {
        const nuisanceItems = [
            'candle', 'torch', 'flint', 'tinder', 'string', 'twine', 'pebble', 'stone',
            'stick', 'twig', 'leaf', 'feather', 'small stone', 'iron spike', 'chalk'
        ];
        
        const itemName = item.item_name.toLowerCase();
        return nuisanceItems.some(nuisance => itemName.includes(nuisance));
    }

    getCategoryChance(category, terrain) {
        const baseChances = {
            'consumables': 0.8,
            'weapons': 0.6,
            'armor': 0.4,
            'magical_items': 0.3,
            'treasure': 0.5,
            'mundane_gear': 0.3,
            'rare_materials': 0.2,
            'runes': 0.15,  // Runes are valuable but rare
            'gems': 0.4     // Gems are more common than runes
        };
        
        return baseChances[category] || 0.3;
    }

    generateCurrencyItems(remainingBudget, partyLevel) {
        const currencyItems = [];
        let budget = remainingBudget;
        
        // Add variety to currency - higher level encounters get more valuable currency
        // Lower level encounters get more mixed currency
        
        if (budget >= 1) {
            // For higher value remaining budgets, add gems first
            if (budget >= 25 && Math.random() < 0.4) {
                const gemValues = [25, 50, 100, 250, 500];
                const suitableGems = gemValues.filter(value => value <= budget);
                if (suitableGems.length > 0) {
                    const gemValue = suitableGems[Math.floor(Math.random() * suitableGems.length)];
                    const gemNames = ['ruby', 'emerald', 'sapphire', 'diamond', 'pearl', 'opal', 'garnet', 'topaz'];
                    const gemName = gemNames[Math.floor(Math.random() * gemNames.length)];
                    
                    currencyItems.push({
                        item_name: `${gemName.charAt(0).toUpperCase() + gemName.slice(1)} Gem`,
                        value: gemValue,
                        type: 'gem',
                        rarity: gemValue >= 100 ? 'uncommon' : 'common',
                        item_level: Math.max(1, Math.floor(gemValue / 50)),
                        description: `A valuable ${gemName} gem worth ${gemValue} gold pieces.`,
                        source: 'currency_filler'
                    });
                    budget -= gemValue;
                }
            }
            
            // Convert remaining budget to mixed coins
            if (budget >= 1) {
                const coins = this.distributeCurrency(budget, partyLevel);
                
                // Create currency items for each denomination
                if (coins.platinum > 0) {
                    currencyItems.push({
                        item_name: `${coins.platinum} Platinum Pieces`,
                        value: coins.platinum * 10,
                        type: 'currency',
                        rarity: 'common',
                        item_level: 1,
                        description: `${coins.platinum} platinum pieces.`,
                        source: 'currency_filler'
                    });
                }
                
                if (coins.gold > 0) {
                    currencyItems.push({
                        item_name: `${coins.gold} Gold Pieces`,
                        value: coins.gold,
                        type: 'currency',
                        rarity: 'common',
                        item_level: 1,
                        description: `${coins.gold} gold pieces.`,
                        source: 'currency_filler'
                    });
                }
                
                if (coins.silver > 0) {
                    currencyItems.push({
                        item_name: `${coins.silver} Silver Pieces`,
                        value: coins.silver * 0.1,
                        type: 'currency',
                        rarity: 'common',
                        item_level: 1,
                        description: `${coins.silver} silver pieces.`,
                        source: 'currency_filler'
                    });
                }
                
                if (coins.copper > 0) {
                    currencyItems.push({
                        item_name: `${coins.copper} Copper Pieces`,
                        value: coins.copper * 0.01,
                        type: 'currency',
                        rarity: 'common',
                        item_level: 1,
                        description: `${coins.copper} copper pieces.`,
                        source: 'currency_filler'
                    });
                }
            }
        }
        
        return currencyItems;
    }

    distributeCurrency(totalGoldValue, partyLevel) {
        // Distribute gold value across different coin types
        // Higher level characters get more platinum, lower level get more mixed coins
        
        let remainingValue = totalGoldValue;
        const coins = { platinum: 0, gold: 0, silver: 0, copper: 0 };
        
        // Platinum (10 gp each) - for higher level encounters
        if (partyLevel >= 5 && remainingValue >= 10 && Math.random() < 0.3) {
            const platinumCount = Math.floor(remainingValue / 10);
            const maxPlatinum = Math.min(platinumCount, Math.floor(totalGoldValue * 0.4 / 10));
            coins.platinum = Math.max(0, maxPlatinum);
            remainingValue -= coins.platinum * 10;
        }
        
        // Gold pieces - main currency
        const goldPercent = partyLevel >= 3 ? 0.7 : 0.5;
        coins.gold = Math.floor(remainingValue * goldPercent);
        remainingValue -= coins.gold;
        
        // Convert remaining to silver and copper
        const remainingInCopper = Math.round(remainingValue * 100); // Convert to copper pieces
        
        // Silver pieces (10 cp each)
        coins.silver = Math.floor(remainingInCopper / 10);
        const remainingCopper = remainingInCopper % 10;
        
        // Copper pieces
        coins.copper = remainingCopper;
        
        // Add some randomization for realism
        if (Math.random() < 0.3 && coins.gold > 2) {
            // Sometimes convert some gold to silver for variety
            const goldToConvert = Math.min(2, Math.floor(coins.gold * 0.2));
            coins.gold -= goldToConvert;
            coins.silver += goldToConvert * 10;
        }
        
        return coins;
    }

    formatLootForDisplay(lootResult) {
        console.log('formatLootForDisplay called with:', lootResult);
        
        if (!lootResult || !lootResult.items) {
            console.log('No lootResult or items found');
            return '<div class="no-loot">No notable loot found.</div>';
        }
        
        const { items, totalValue, treasureBudget } = lootResult;
        console.log(`Formatting ${items.length} items for display`);
        
        if (items.length === 0) {
            console.log('No items to display');
            return '<div class="no-loot">No notable loot found.</div>';
        }
        
        // Check first item structure
        console.log('First item structure:', items[0]);
        
        const budgetUtilization = ((totalValue / treasureBudget) * 100).toFixed(1);
        let html = '<div class="loot-summary-compact">';
        html += `<h4>💰 Treasure Found!</h4>`;
        html += `<p><strong>${items.length}</strong> items worth <strong>${totalValue} gp</strong> (${budgetUtilization}% of ${treasureBudget} gp budget)</p>`;
        html += '</div>';
        
        // Add simple currency box
        if (lootResult.coins && (lootResult.coins.copper || lootResult.coins.silver || lootResult.coins.gold || lootResult.coins.platinum)) {
            const coins = lootResult.coins;
            let totalCoinValue = 0;
            
            if (coins.copper) totalCoinValue += coins.copper * 0.01;
            if (coins.silver) totalCoinValue += coins.silver * 0.1;
            if (coins.gold) totalCoinValue += coins.gold * 1;
            if (coins.platinum) totalCoinValue += coins.platinum * 10;
            
            html += '<div class="currency-box">';
            html += `<h4>💰 Currency Found</h4>`;
            html += `<div class="currency-total">${totalCoinValue.toFixed(2)} gp total</div>`;
            html += '</div>';
        }
        
        html += '<div class="loot-items-simple">';
        
        for (const item of items) {
            const rarityClass = item.rarity || 'common';
            
            // Create comprehensive tooltip
            let tooltip = `<strong>${item.item_name}</strong>`;
            tooltip += `<br><em>Value: ${item.value} gp</em>`;
            
            if (item.level !== undefined) {
                tooltip += `<br>Level: ${item.level}`;
            }
            
            if (item.rarity && item.rarity !== 'common') {
                tooltip += `<br>Rarity: ${item.rarity}`;
            }
            
            if (item.type) {
                tooltip += `<br>Type: ${item.type}`;
            }
            
            if (item.description && item.description.length > 0) {
                tooltip += `<br><br>${item.description}`;
            }
            
            // Store item data safely by encoding it
            const itemData = {
                name: item.item_name || '',
                value: item.value || 0,
                level: item.level,
                rarity: item.rarity || 'common',
                type: item.type || '',
                description: (item.description || '').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, ' ')
            };
            
            html += `<div class="loot-item-simple ${rarityClass}" data-tooltip-content="${encodeURIComponent(JSON.stringify(itemData))}">`;
            html += `<span class="item-name">${item.item_name}</span>`;
            html += `<span class="item-value">${item.value} gp</span>`;
            html += `</div>`;
        }
        
        html += '</div>';
        
        // Initialize tooltips after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeLootTooltips();
        }, 100);
        
        return html;
    }

    initializeLootTooltips() {
        const lootItems = document.querySelectorAll('.loot-item-simple[data-tooltip-content]');
        
        lootItems.forEach(item => {
            let tooltip = null;
            
            item.addEventListener('mouseenter', (e) => {
                try {
                    const encodedData = e.target.getAttribute('data-tooltip-content');
                    const data = JSON.parse(decodeURIComponent(encodedData));
                    
                    // Create tooltip element
                    tooltip = document.createElement('div');
                    tooltip.className = 'loot-tooltip';
                    
                    let content = `<strong>${data.name}</strong><br>`;
                    content += `<em>Value: ${data.value} gp</em><br>`;
                    
                    if (data.level !== undefined && data.level !== null) {
                        content += `Level: ${data.level}<br>`;
                    }
                    
                    if (data.rarity && data.rarity !== 'common') {
                        content += `Rarity: ${data.rarity}<br>`;
                    }
                    
                    if (data.type) {
                        content += `Type: ${data.type}<br>`;
                    }
                    
                    if (data.description && data.description.length > 0) {
                        const cleanDescription = data.description.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
                        content += `<br>${cleanDescription}`;
                    }
                    
                    tooltip.innerHTML = content;
                    document.body.appendChild(tooltip);
                    
                    // Position tooltip
                    const rect = e.target.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.top - 10) + 'px';
                    
                } catch (err) {
                    console.error('Error creating tooltip:', err);
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                    tooltip = null;
                }
            });
        });
    }
}

// Initialize loot generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lootGenerator = new LootGenerator();
});