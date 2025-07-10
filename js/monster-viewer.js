class MonsterViewer {
    constructor() {
        this.monsters = [];
        this.currentMonster = null;
        this.isEditing = false;
        this.selectedBooks = new Set(['pathfinder-monster-core']); // Default to Monster Core
        this.actionCache = new Map(); // Cache for loaded action data
        this.referenceParser = new ReferenceParser();
        this.initializeEventListeners();
        this.initializeModal();
        this.initializeTooltips();
    }

    initializeEventListeners() {
        // Monster list is now handled in populateMonsterSelector via individual click listeners

        // Edit controls
        document.getElementById('edit-monster-btn').addEventListener('click', () => {
            this.startEditing();
        });

        document.getElementById('save-monster-btn').addEventListener('click', () => {
            this.saveMonster();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.cancelEditing();
        });

        // Book selection button
        document.getElementById('select-books-btn').addEventListener('click', () => {
            this.showBookSelectionModal();
        });
    }

    initializeModal() {
        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideBookSelectionModal();
        });

        // Close modal when clicking outside
        document.getElementById('book-selection-modal').addEventListener('click', (e) => {
            if (e.target.id === 'book-selection-modal') {
                this.hideBookSelectionModal();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Action buttons
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAllVisible();
        });

        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.clearAllSelections();
        });

        document.getElementById('load-selected-btn').addEventListener('click', () => {
            this.loadSelectedBooks();
        });

        this.populateBookCategories();
    }

    async loadMonsters() {
        try {
            console.log('Loading monsters from selected books...');
            
            this.monsters = [];

            // Load only selected books
            for (const bookId of this.selectedBooks) {
                try {
                    console.log(`Loading from ${bookId}...`);
                    await this.loadSelectedBook(bookId);
                } catch (error) {
                    console.warn(`Failed to load book ${bookId}:`, error);
                }
            }

            console.log(`Successfully loaded ${this.monsters.length} monsters from ${this.selectedBooks.size} books`);
            this.populateMonsterSelector();
        } catch (error) {
            console.error('Error loading monsters:', error);
            this.createSampleMonsters();
        }
    }

    async loadSelectedBook(bookId) {
        const categories = MonsterDatabase.getBookCategories();
        
        // Find the book in categories
        let bookData = null;
        let categoryName = '';
        
        for (const [catName, books] of Object.entries(categories)) {
            if (books[bookId]) {
                bookData = books[bookId];
                categoryName = catName;
                break;
            }
            }
            
            if (!bookData) {
                console.warn(`Book ${bookId} not found in database`);
                return;
            }

        const basePath = `shared-data/packs/${bookId}`;
        
        // Handle books with subdirectories (like adventure paths)
        if (bookData.subdirectories) {
            for (const [subPath, files] of Object.entries(bookData.subdirectories)) {
                console.log(`Loading from ${bookId}/${subPath}...`);
                for (const file of files) {
                    try {
                        const response = await fetch(`${basePath}/${subPath}/${file}`);
                        if (response.ok) {
                            const monsterData = await response.json();
                            if (monsterData.type === 'npc' && monsterData.name) {
                                this.monsters.push(monsterData);
                            }
                        }
                    } catch (error) {
                        // File doesn't exist, continue silently
                    }
                }
            }
        }
        
        // Handle standard book files
        if (bookData.files && bookData.files.length > 0) {
            console.log(`Loading ${bookData.files.length} creatures from ${bookId}...`);
            
            for (const file of bookData.files) {
                try {
                    const response = await fetch(`${basePath}/${file}`);
                    if (response.ok) {
                        const monsterData = await response.json();
                        if (monsterData && 
                            monsterData.type === 'npc' && 
                            monsterData.name && 
                            monsterData.system) {
                            this.monsters.push(monsterData);
                        }
                    }
                } catch (error) {
                    // File doesn't exist, continue silently
                }
            }
        } else {
            // If no files specified, auto-discover all monsters in the directory
            console.log(`Auto-discovering all creatures from ${bookId}...`);
            await this.loadAllFromDirectory(basePath);
        }
    }

    async loadAllFromDirectory(basePath) {
        // For Monster Core, use the pre-generated file list for faster loading
        if (basePath.includes('pathfinder-monster-core')) {
            try {
                const response = await fetch('monster-core-files.txt');
                if (response.ok) {
                    const fileList = await response.text();
                    const monsterFiles = fileList.trim().split('\n').filter(file => file.trim());
                    await this.loadMonstersFromFileList(basePath, monsterFiles);
                    return;
                }
            } catch (error) {
                console.warn('Could not load monster-core-files.txt, using auto-discovery');
            }
        }
        
        // For other directories, try common patterns and auto-discovery
        await this.autoDiscoverMonsters(basePath);
    }
    
    async loadMonstersFromFileList(basePath, monsterFiles) {
        console.log(`Loading all ${monsterFiles.length} monsters from directory...`);
        
        const batchSize = 30;
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < monsterFiles.length; i += batchSize) {
            const batch = monsterFiles.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    const fileName = file.trim();
                    if (!fileName) return null;
                    
                    const monsterResponse = await fetch(`${basePath}/${fileName}`);
                    if (monsterResponse.ok) {
                        const monsterData = await monsterResponse.json();
                        if (monsterData && 
                            monsterData.type === 'npc' && 
                            monsterData.name && 
                            monsterData.system) {
                            successCount++;
                            return monsterData;
                        }
                    }
                    return null;
                } catch (error) {
                    errorCount++;
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(monster => {
                if (monster) this.monsters.push(monster);
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`Loading complete: ${successCount} monsters loaded, ${errorCount} errors`);
    }
    
    async autoDiscoverMonsters(basePath) {
        console.log(`Auto-discovering monsters in ${basePath}...`);
        
        // Try to discover monsters by testing numbered patterns and common names
        const patterns = [];
        
        // Add numbered patterns (many bestiaries use numbered files)
        for (let i = 1; i <= 500; i++) {
            patterns.push(`${i.toString().padStart(3, '0')}.json`);
        }
        
        // Add common monster name patterns
        const commonNames = [
            'goblin', 'orc', 'dragon', 'troll', 'giant', 'skeleton', 'zombie', 'vampire',
            'demon', 'devil', 'angel', 'elemental', 'golem', 'spider', 'wolf', 'bear',
            'kobold', 'gnoll', 'lizardfolk', 'dwarf', 'elf', 'human', 'halfling'
        ];
        
        commonNames.forEach(name => {
            patterns.push(`${name}.json`);
            patterns.push(`${name}-warrior.json`);
            patterns.push(`${name}-scout.json`);
            patterns.push(`${name}-guard.json`);
        });
        
        await this.loadMonstersFromFileList(basePath, patterns);
    }
    
    async loadSampleMonsters(basePath) {
        const sampleMonsters = [
            'aapoph-serpentfolk.json', 'adamantine-dragon-adult.json', 'dire-wolf.json',
            'goliath-spider.json', 'hunting-spider.json', 'skeleton-guard.json',
            'plague-zombie.json', 'aeolaeka.json', 'aesra.json', 'animated-armor.json', 
            'ankhrav.json', 'ankylosaurus.json', 'forest-troll.json', 'troll-warleader.json',
            'air-scamp.json', 'animated-broom.json', 'animated-statue.json', 
            'adamantine-dragon-ancient.json', 'adamantine-dragon-young.json', 'akhana.json'
        ];
        
        for (const file of sampleMonsters) {
            try {
                const response = await fetch(`${basePath}/${file}`);
                if (response.ok) {
                    const monsterData = await response.json();
                    if (monsterData.type === 'npc' && monsterData.name) {
                        this.monsters.push(monsterData);
                    }
                }
            } catch (error) {
                // File doesn't exist, continue silently
            }
        }
    }

    async loadBestiaryDirectory(directoryName) {
        const monsterFiles = MonsterDatabase.getMonsterFiles();
        const subdirectoryFiles = MonsterDatabase.getSubdirectoryFiles();
        
        const basePath = `shared-data/packs/${directoryName}`;
        
        // Handle bestiaries with subdirectories
        if (subdirectoryFiles[directoryName]) {
            const subdirs = subdirectoryFiles[directoryName];
            for (const [subPath, files] of Object.entries(subdirs)) {
                console.log(`Loading from ${directoryName}/${subPath}...`);
                for (const file of files) {
                    try {
                        const response = await fetch(`${basePath}/${subPath}/${file}`);
                        if (response.ok) {
                            const monsterData = await response.json();
                            if (monsterData.type === 'npc' && monsterData.name) {
                                this.monsters.push(monsterData);
                                console.log(`Loaded: ${monsterData.name}`);
                            }
                        }
                    } catch (error) {
                        // File doesn't exist in this path, continue silently
                    }
                }
            }
        }
        
        // Handle standard bestiary files
        const creatures = monsterFiles[directoryName] || [];
        console.log(`Loading ${creatures.length} creatures from ${directoryName}...`);
        
        for (const file of creatures) {
            try {
                const response = await fetch(`${basePath}/${file}`);
                if (response.ok) {
                    const monsterData = await response.json();
                    if (monsterData.type === 'npc' && monsterData.name) {
                        this.monsters.push(monsterData);
                        console.log(`Loaded: ${monsterData.name}`);
                    }
                }
            } catch (error) {
                // File doesn't exist, continue silently
            }
        }
    }

    createSampleMonsters() {
        // Create sample monsters if files can't be loaded
        this.monsters = [
            {
                name: "Sample Goblin",
                system: {
                    details: { level: { value: 1 } },
                    attributes: { 
                        ac: { value: 16 }, 
                        hp: { value: 12 }, 
                        speed: { value: 25 }
                    },
                    abilities: {
                        str: { mod: 0 },
                        dex: { mod: 3 },
                        con: { mod: 1 },
                        int: { mod: 0 },
                        wis: { mod: 1 },
                        cha: { mod: 1 }
                    },
                    traits: { value: ['goblin', 'humanoid'], rarity: 'common' },
                    details: {
                        languages: { value: ['Common', 'Goblin'] },
                        level: { value: 1 }
                    }
                }
            },
            {
                name: "Sample Orc",
                system: {
                    details: { level: { value: 2 } },
                    attributes: { 
                        ac: { value: 18 }, 
                        hp: { value: 28 }, 
                        speed: { value: 30 }
                    },
                    abilities: {
                        str: { mod: 4 },
                        dex: { mod: 2 },
                        con: { mod: 2 },
                        int: { mod: -1 },
                        wis: { mod: 1 },
                        cha: { mod: 0 }
                    },
                    traits: { value: ['orc', 'humanoid'], rarity: 'common' },
                    details: {
                        languages: { value: ['Common', 'Orcish'] },
                        level: { value: 2 }
                    }
                }
            }
        ];
        this.populateMonsterSelector();
    }

    populateMonsterSelector() {
        const monsterList = document.getElementById('monster-list');
        
        // Clear existing list
        monsterList.innerHTML = '';
        
        if (this.monsters.length === 0) {
            monsterList.innerHTML = '<p class="loading-monsters">No monsters loaded</p>';
            return;
        }
        
        // Populate monster list
        this.monsters.forEach((monster, index) => {
            const monsterItem = document.createElement('div');
            monsterItem.className = 'monster-item';
            monsterItem.dataset.index = index;
            
            // Extract level from monster data
            const level = monster.system?.details?.level?.value || monster.level || 'Unknown';
            const cr = monster.system?.details?.cr?.value || monster.cr || '';
            const levelDisplay = cr ? `CR ${cr}` : `Level ${level}`;
            
            // Extract base name and parenthetical text
            const nameMatch = monster.name.match(/^(.*?)\s*(\([^)]*\))?\s*$/);
            const baseName = nameMatch ? nameMatch[1].trim() : monster.name;
            const parenthetical = nameMatch && nameMatch[2] ? nameMatch[2] : '';
            
            const parentheticalHtml = parenthetical ? `<div class="monster-subtitle">${parenthetical}</div>` : '';
            
            monsterItem.innerHTML = `
                <div class="monster-name-container">
                    <div class="monster-name" title="${monster.name}">${baseName}</div>
                    ${parentheticalHtml}
                </div>
                <div class="monster-level-info">${levelDisplay}</div>
                <button class="add-to-encounter-btn" title="Add to encounter">+</button>
            `;
            
            // Add click event listener for monster selection (excluding button clicks)
            monsterItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-encounter-btn')) {
                    return; // Don't select monster when clicking the add button
                }
                this.selectMonsterFromList(index, monsterItem);
            });

            // Add event listener for the add to encounter button
            const addBtn = monsterItem.querySelector('.add-to-encounter-btn');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Add button clicked for monster:', monster.name);
                    this.addMonsterToEncounter(monster);
                });
            } else {
                console.error('Add button not found in monster item');
            }
            
            monsterList.appendChild(monsterItem);
        });
        
        // Initialize search functionality
        this.initializeMonsterSearch();
    }
    
    selectMonsterFromList(index, itemElement) {
        // Remove previous selection
        document.querySelectorAll('.monster-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked item
        itemElement.classList.add('selected');
        
        // Select the monster
        this.selectMonster(index);
    }
    
    initializeMonsterSearch() {
        const searchInput = document.getElementById('monster-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            this.filterMonsters(e.target.value.toLowerCase());
        });
    }
    
    filterMonsters(searchTerm) {
        const monsterItems = document.querySelectorAll('.monster-item');
        
        monsterItems.forEach(item => {
            const monsterName = item.querySelector('.monster-name').textContent.toLowerCase();
            const levelInfo = item.querySelector('.monster-level-info').textContent.toLowerCase();
            
            if (monsterName.includes(searchTerm) || levelInfo.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async selectMonster(index) {
        if (index === '') {
            this.currentMonster = null;
            this.displayNoMonster();
            return;
        }

        this.currentMonster = this.monsters[index];
        await this.displayMonster();
    }

    displayNoMonster() {
        const display = document.getElementById('monster-display');
        display.innerHTML = '<p class="no-monster-selected">Select a monster to view its statblock.</p>';
        document.getElementById('edit-monster-btn').style.display = 'none';
    }

    async generateStatblockHTML(monster) {
        if (!monster) return '<p class="no-monster-selected">No monster provided.</p>';

        // Build statblock HTML
        const level = monster.system?.details?.level?.value || 1;
        const ac = monster.system?.attributes?.ac?.value || 10;
        const hp = monster.system?.attributes?.hp?.value || 10;
        const speed = monster.system?.attributes?.speed?.value || 25;
        const rarity = monster.system?.traits?.rarity || 'common';
        
        const abilities = monster.system?.abilities || {};
        const traits = monster.system?.traits?.value || [];
        const languages = monster.system?.details?.languages?.value || [];

        // Get additional stats for comprehensive display
        const saves = monster.system?.saves || {};
        const perception = monster.system?.perception?.mod || 0;
        const skills = monster.system?.skills || {};
        const immunities = monster.system?.attributes?.immunities || [];
        const resistances = monster.system?.attributes?.resistances || [];
        const weaknesses = monster.system?.attributes?.weaknesses || [];
        const otherSpeeds = monster.system?.attributes?.speed?.otherSpeeds || [];

        const size = monster.system?.traits?.size?.value || 'Medium';
        
        // Temporarily set currentMonster for helper methods
        const originalMonster = this.currentMonster;
        this.currentMonster = monster;
        
        const html = `
            <div class="pf2e-statblock">
                <!-- HEADER SECTION -->
                <div class="statblock-header">
                    <div class="creature-name-level">
                        <h2 class="creature-name">${monster.name}${this.getPublicNotesIcon(monster)}</h2>
                        <span class="creature-level">CREATURE ${level}</span>
                    </div>
                    <div class="creature-traits">
                        ${this.formatTraitsLine(size, traits, rarity)}
                    </div>
                </div>

                <!-- STATBLOCK BODY -->
                <div class="statblock-body">
                    <!-- DEFENSES -->
                    <div class="defense-section">
                        <div class="ac-hp-line">
                            <div class="defense-left">
                                <span><strong>AC</strong> ${ac}</span>
                                <span><strong>HP</strong> ${hp}</span>
                            </div>
                            <div class="defense-center">
                                <strong>Fort</strong> ${this.formatModifier(saves.fortitude?.totalModifier || saves.fortitude?.value)}, 
                                <strong>Ref</strong> ${this.formatModifier(saves.reflex?.totalModifier || saves.reflex?.value)}, 
                                <strong>Will</strong> ${this.formatModifier(saves.will?.totalModifier || saves.will?.value)}
                            </div>
                            <div class="defense-right">
                                <span><strong>Speed</strong> ${speed} feet${this.formatOtherSpeeds(otherSpeeds)}</span>
                            </div>
                        </div>
                        ${this.formatDefensiveAbilities(immunities, resistances, weaknesses)}
                    </div>

                    <!-- ABILITY SCORES -->
                    <div class="ability-scores">
                        <div class="ability-line">
                            <span class="ability-score"><strong>Str</strong> ${this.formatModifier(abilities.str?.mod)}</span>
                            <span class="ability-score"><strong>Dex</strong> ${this.formatModifier(abilities.dex?.mod)}</span>
                            <span class="ability-score"><strong>Con</strong> ${this.formatModifier(abilities.con?.mod)}</span>
                            <span class="ability-score"><strong>Int</strong> ${this.formatModifier(abilities.int?.mod)}</span>
                            <span class="ability-score"><strong>Wis</strong> ${this.formatModifier(abilities.wis?.mod)}</span>
                            <span class="ability-score"><strong>Cha</strong> ${this.formatModifier(abilities.cha?.mod)}</span>
                        </div>
                    </div>

                    <!-- PERCEPTION & LANGUAGES -->
                    <div class="statblock-section">
                        <div class="statblock-line">
                            <span class="stat-label">Perception</span> ${this.formatModifier(perception)}${this.getSpecialSenses(monster)}
                        </div>
                        <div class="statblock-line">
                            <span class="stat-label">Languages</span> ${languages.length > 0 ? languages.join(', ') : '—'}
                        </div>
                        <div class="statblock-line">
                            <span class="stat-label">Skills</span> ${this.formatSkills(skills)}
                        </div>
                    </div>

                    <!-- ACTIONS -->
                    ${await this.renderActionsSections()}
                </div>
            </div>
        `;
        
        // Restore original monster
        this.currentMonster = originalMonster;
        
        return html;
    }

    async displayMonster() {
        if (!this.currentMonster) return;

        const display = document.getElementById('monster-display');
        display.innerHTML = await this.generateStatblockHTML(this.currentMonster);
        document.getElementById('edit-monster-btn').style.display = 'inline-block';
    }

    formatTraitsLine(size, traits, rarity) {
        const formattedTraits = [];
        
        // Add rarity if not common
        if (rarity !== 'common') {
            const rarityCapitalized = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            formattedTraits.push(`<span class="trait rarity-${rarity}">${rarityCapitalized}</span>`);
        }
        
        // Add size
        formattedTraits.push(`<span class="trait size-${size.toLowerCase()}">${size}</span>`);
        
        // Add creature type traits with appropriate styling
        traits.forEach(trait => {
            const traitLower = trait.toLowerCase();
            let traitClass = 'trait';
            
            // Alignment traits
            if (['lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'].includes(traitLower)) {
                traitClass += ` alignment-${traitLower}`;
            }
            // Creature type traits
            else if (['humanoid', 'fey', 'fiend', 'celestial', 'undead', 'construct', 'elemental', 'dragon', 'beast', 'plant', 'aberration', 'giant', 'goblinoid'].includes(traitLower)) {
                traitClass += ' creature-type';
            }
            
            formattedTraits.push(`<span class="${traitClass}">${trait.toUpperCase()}</span>`);
        });
        
        return formattedTraits.join(' ');
    }

    getSpecialSenses(monster) {
        // Add special senses like darkvision, etc. from monster data
        const senses = monster.system?.perception?.senses || [];
        if (senses.length > 0) {
            return '; ' + senses.map(sense => sense.type).join(', ');
        }
        return '';
    }

    formatSkills(skills) {
        if (Object.keys(skills).length === 0) return '—';
        return Object.entries(skills)
            .map(([skill, data]) => `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${this.formatModifier(data.totalModifier || data.base || 0)}`)
            .join(', ');
    }

    formatDefensiveAbilities(immunities, resistances, weaknesses) {
        let result = '';
        if (immunities.length > 0) {
            result += `<div class="defensive-line"><strong>Immunities</strong> ${immunities.map(i => i.type || i).join(', ')}</div>`;
        }
        if (resistances.length > 0) {
            result += `<div class="defensive-line"><strong>Resistances</strong> ${resistances.map(r => `${r.type} ${r.value || ''}`).join(', ')}</div>`;
        }
        if (weaknesses.length > 0) {
            result += `<div class="defensive-line"><strong>Weaknesses</strong> ${weaknesses.map(w => `${w.type} ${w.value || ''}`).join(', ')}</div>`;
        }
        return result;
    }

    formatOtherSpeeds(otherSpeeds) {
        if (otherSpeeds.length === 0) return '';
        return ', ' + otherSpeeds.map(s => `${s.type} ${s.value} feet`).join(', ');
    }

    async renderActionsSections() {
        if (!this.currentMonster?.items) return '';

        const actions = this.currentMonster.items.filter(item => 
            item.type === 'action' || item.type === 'melee' || item.type === 'ranged');
        
        if (actions.length === 0) return '';

        // Group actions by type
        const meleeActions = actions.filter(item => item.type === 'melee');
        const rangedActions = actions.filter(item => item.type === 'ranged');
        const specialActions = actions.filter(item => item.type === 'action');

        if (meleeActions.length === 0 && rangedActions.length === 0 && specialActions.length === 0) {
            return '';
        }

        let leftColumn = '';
        let rightColumn = '';

        // Melee section (left column)
        if (meleeActions.length > 0) {
            leftColumn += `<div class="actions-section">
                <div class="section-title">Melee</div>
                ${await this.renderActionsList(meleeActions)}
            </div>`;
        }

        // Ranged section (left column if no melee, otherwise right)
        if (rangedActions.length > 0) {
            const rangedSection = `<div class="actions-section">
                <div class="section-title">Ranged</div>
                ${await this.renderActionsList(rangedActions)}
            </div>`;
            
            if (leftColumn === '') {
                leftColumn += rangedSection;
            } else {
                rightColumn += rangedSection;
            }
        }

        // Special abilities section (right column preferably)
        if (specialActions.length > 0) {
            const specialSection = `<div class="actions-section">
                <div class="section-title">Special Abilities</div>
                ${await this.renderActionsList(specialActions)}
            </div>`;
            
            if (rightColumn === '') {
                rightColumn += specialSection;
            } else {
                leftColumn += specialSection;
            }
        }

        return `<div class="actions-container">
            <div class="actions-column">${leftColumn}</div>
            <div class="actions-column">${rightColumn}</div>
        </div>`;
    }

    async renderActionsList(actions) {
        const actionElements = await Promise.all(actions.map(async action => {
            const isWeaponAttack = action.type === 'melee' || action.type === 'ranged';
            const isSpecialAbility = action.type === 'action' && !isWeaponAttack;
            
            let inlineStats = '';
            let eventHandlers = '';
            
            if (isWeaponAttack) {
                const weaponData = this.getWeaponAttackData(action);
                const attackBonus = weaponData.attackBonus >= 0 ? `+${weaponData.attackBonus}` : `${weaponData.attackBonus}`;
                inlineStats = ` ${attackBonus} (${weaponData.damage} ${weaponData.damageType})`;
                eventHandlers = `data-weapon-data='${JSON.stringify(weaponData).replace(/'/g, "&apos;")}' onmouseenter="showWeaponTooltip(event); showTooltipAndClearTimeout()" onmouseleave="hideReferenceTooltipDelayed()" title="Click for weapon details"`;
            } else if (isSpecialAbility) {
                const abilityData = this.getAbilityData(action);
                eventHandlers = `data-ability-data='${JSON.stringify(abilityData).replace(/'/g, "&apos;")}' onmouseenter="showAbilityTooltip(event); showTooltipAndClearTimeout()" onmouseleave="hideReferenceTooltipDelayed()" title="Click for ability details"`;
            }

            const actionCost = action.system?.actions?.value ? ` ${this.getActionIcon(action.system.actions.value)}` : '';
            const reactionIcon = action.system?.actionType?.value === 'reaction' ? ' ⚡' : '';

            return `<div class="action-line">
                <span class="action-name-statblock" ${eventHandlers}>
                    ${action.name}${inlineStats}${actionCost}${reactionIcon}
                </span>
            </div>`;
        }));

        return actionElements.join('');
    }

    async renderActions() {
        if (!this.currentMonster?.items) return '';

        const actions = this.currentMonster.items.filter(item => 
            item.type === 'action' || item.type === 'melee' || item.type === 'ranged');
        
        if (actions.length === 0) return '';

        const actionElements = await Promise.all(actions.map(async action => {
            const processedDescription = action.system?.description?.value ? 
                await this.processReferences(action.system.description.value) : '';
            
            // Create a temporary div to unescape HTML entities and handle newlines
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = processedDescription;
            let finalDescriptionHtml = tempDiv.innerHTML.replace(/\n/g, '<br />');
            
            const isWeaponAttack = action.type === 'melee' || action.type === 'ranged';
            const isSpecialAbility = action.type === 'action' && !isWeaponAttack;
            
            let cssClass = '';
            let eventHandlers = '';
            let titleText = '';
            let inlineWeaponStats = '';
            
            if (isWeaponAttack) {
                const weaponData = this.getWeaponAttackData(action);
                cssClass = 'weapon-attack';
                eventHandlers = `data-weapon-data='${JSON.stringify(weaponData).replace(/'/g, "&apos;")}' onmouseenter="showWeaponTooltip(event); showTooltipAndClearTimeout()" onmouseleave="hideReferenceTooltipDelayed()"`;
                titleText = 'Click for weapon details';
                
                // Create inline weapon stats
                const attackBonus = weaponData.attackBonus >= 0 ? `+${weaponData.attackBonus}` : `${weaponData.attackBonus}`;
                inlineWeaponStats = `<span class="weapon-stats-inline">${attackBonus} (${weaponData.damage} ${weaponData.damageType})</span>`;
            } else if (isSpecialAbility) {
                const abilityData = this.getAbilityData(action);
                cssClass = 'ability-action';
                eventHandlers = `data-ability-data='${JSON.stringify(abilityData).replace(/'/g, "&apos;")}' onmouseenter="showAbilityTooltip(event); showTooltipAndClearTimeout()" onmouseleave="hideReferenceTooltipDelayed()"`;
                titleText = 'Click for ability details';
            }
                
            return `
                <div class="action">
                    <div class="action-header">
                        <span class="action-name ${cssClass}" 
                              ${eventHandlers}
                              ${titleText ? `title="${titleText}"` : ''}>
                            ${action.name}
                        </span>
                        ${inlineWeaponStats}
                        ${action.system?.actions?.value ? `<span class="action-cost">${this.getActionIcon(action.system.actions.value)}</span>` : ''}
                        ${action.system?.actionType?.value === 'reaction' ? `<span class="action-cost">⚡</span>` : ''}
                    </div>
                    ${(!isSpecialAbility && finalDescriptionHtml) ? `<div class="action-description">${finalDescriptionHtml}</div>` : ''}
                </div>
            `;
        }));

        return `
            <div class="monster-actions">
                <h4>Actions</h4>
                ${actionElements.join('')}
            </div>
        `;
    }

    getActionIcon(actionCount) {
        if (actionCount === 1) return '◆';
        if (actionCount === 2) return '◆◆';
        if (actionCount === 3) return '◆◆◆';
        return '';
    }

    getWeaponAttackData(attack) {
        // Extract weapon attack data for tooltip
        const system = attack.system || {};
        const damageRolls = system.damageRolls || {};
        const damage = Object.values(damageRolls)[0] || {};
        
        return {
            name: attack.name,
            type: attack.type,
            attackBonus: system.bonus?.value || 0,
            damage: damage.damage || '',
            damageType: damage.damageType || '',
            traits: system.traits?.value || [],
            attackEffects: system.attackEffects?.value || [],
            weaponType: system.weaponType?.value || attack.type,
            range: this.extractRange(system.traits?.value || [])
        };
    }

    extractRange(traits) {
        // Extract range from traits like "range-increment-30" or "thrown-20"
        for (const trait of traits) {
            if (trait.startsWith('range-increment-')) {
                return trait.replace('range-increment-', '') + ' ft';
            }
            if (trait.startsWith('thrown-')) {
                return trait.replace('thrown-', '') + ' ft (thrown)';
            }
        }
        return 'Melee';
    }

    getAbilityData(ability) {
        // Extract ability data for tooltip
        const system = ability.system || {};
        const description = system.description?.value || '';
        
        // Parse structured description parts
        const descriptionParts = this.parseAbilityDescription(description);
        
        return {
            name: ability.name,
            actionType: system.actionType?.value || 'action',
            actionCost: system.actions?.value || null,
            category: system.category || 'other',
            traits: system.traits?.value || [],
            frequency: system.frequency || null,
            description: description,
            parsedDescription: descriptionParts,
            rarity: system.traits?.rarity || 'common'
        };
    }

    parseAbilityDescription(html) {
        // Parse HTML description to extract structured parts
        if (!html) return {};
        
        const parts = {};
        
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Extract structured parts like Requirements, Trigger, Effect, etc.
        const paragraphs = temp.querySelectorAll('p');
        
        paragraphs.forEach(p => {
            const text = p.innerHTML;
            
            // Look for bold labels
            if (text.includes('<strong>')) {
                const strongMatch = text.match(/<strong>([^<]+)<\/strong>\s*(.*)/);
                if (strongMatch) {
                    const label = strongMatch[1].toLowerCase();
                    const content = strongMatch[2];
                    
                    if (label === 'requirements') {
                        parts.requirements = content;
                    } else if (label === 'trigger') {
                        parts.trigger = content;
                    } else if (label === 'effect') {
                        parts.effect = content;
                    } else if (label === 'frequency') {
                        parts.frequency = content;
                    }
                }
            }
        });
        
        return parts;
    }

    initializeTooltips() {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'reference-tooltip';
        tooltip.className = 'reference-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        
        // Add hover event listeners to tooltip itself
        tooltip.addEventListener('mouseenter', () => {
            window.clearTooltipTimeout();
            window.tooltipShouldBeVisible = true;
        });
        
        tooltip.addEventListener('mouseleave', () => {
            window.hideReferenceTooltipDelayed();
        });
        
        // Hide tooltip when clicking elsewhere
        document.addEventListener('click', (event) => {
            if (!tooltip.contains(event.target) && 
                !event.target.classList.contains('reference-link') &&
                !event.target.hasAttribute('data-weapon-data') &&
                !event.target.hasAttribute('data-ability-data')) {
                window.hideReferenceTooltip();
            }
        });
    }

    async processReferences(html) {
        if (!html || typeof html !== 'string') return '';
        
        // First use the new PF2e text parser if available
        if (window.pf2eTextParser) {
            html = window.pf2eTextParser.parseText(html);
        }
        
        // Then use the existing reference parser for additional processing
        return await this.referenceParser.parseReferences(html, this.actionCache);
    }

    stripHTML(html) {
        if (!html) return '';
        
        // First process @ references to make them interactive
        this.processReferences(html).then(processedHtml => {
            // This is async, so we'll need to handle this differently
            return processedHtml;
        });
        
        // For now, return basic stripped HTML - we'll improve this
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    formatModifier(mod) {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    startEditing() {
        if (!this.currentMonster) return;

        this.isEditing = true;
        
        // Hide display, show editor
        document.getElementById('monster-display').style.display = 'none';
        document.getElementById('monster-editor').style.display = 'block';
        
        // Update button visibility
        document.getElementById('edit-monster-btn').style.display = 'none';
        document.getElementById('save-monster-btn').style.display = 'inline-block';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';
        
        // Populate form with current values
        this.populateEditForm();
    }

    populateEditForm() {
        const monster = this.currentMonster;
        
        document.getElementById('monster-name').value = monster.name;
        document.getElementById('monster-level').value = monster.system?.details?.level?.value || 1;
        document.getElementById('monster-ac').value = monster.system?.attributes?.ac?.value || 10;
        document.getElementById('monster-hp').value = monster.system?.attributes?.hp?.value || 10;
        document.getElementById('monster-speed').value = monster.system?.attributes?.speed?.value || 25;
        document.getElementById('monster-rarity').value = monster.system?.traits?.rarity || 'common';
        
        // Ability scores
        const abilities = monster.system?.abilities || {};
        document.getElementById('monster-str').value = abilities.str?.mod || 0;
        document.getElementById('monster-dex').value = abilities.dex?.mod || 0;
        document.getElementById('monster-con').value = abilities.con?.mod || 0;
        document.getElementById('monster-int').value = abilities.int?.mod || 0;
        document.getElementById('monster-wis').value = abilities.wis?.mod || 0;
        document.getElementById('monster-cha').value = abilities.cha?.mod || 0;
        
        // Traits and languages
        const traits = monster.system?.traits?.value || [];
        document.getElementById('monster-traits').value = traits.join(', ');
        
        const languages = monster.system?.details?.languages?.value || [];
        document.getElementById('monster-languages').value = languages.join(', ');
    }

    saveMonster() {
        if (!this.currentMonster) return;

        // Get form values
        const name = document.getElementById('monster-name').value;
        const level = parseInt(document.getElementById('monster-level').value);
        const ac = parseInt(document.getElementById('monster-ac').value);
        const hp = parseInt(document.getElementById('monster-hp').value);
        const speed = parseInt(document.getElementById('monster-speed').value);
        const rarity = document.getElementById('monster-rarity').value;
        
        // Ability scores
        const str = parseInt(document.getElementById('monster-str').value);
        const dex = parseInt(document.getElementById('monster-dex').value);
        const con = parseInt(document.getElementById('monster-con').value);
        const int = parseInt(document.getElementById('monster-int').value);
        const wis = parseInt(document.getElementById('monster-wis').value);
        const cha = parseInt(document.getElementById('monster-cha').value);
        
        // Traits and languages
        const traits = document.getElementById('monster-traits').value
            .split(',')
            .map(trait => trait.trim())
            .filter(trait => trait);
        
        const languages = document.getElementById('monster-languages').value
            .split(',')
            .map(lang => lang.trim())
            .filter(lang => lang);

        // Update monster data
        this.currentMonster.name = name;
        
        if (!this.currentMonster.system) this.currentMonster.system = {};
        if (!this.currentMonster.system.details) this.currentMonster.system.details = {};
        if (!this.currentMonster.system.attributes) this.currentMonster.system.attributes = {};
        if (!this.currentMonster.system.abilities) this.currentMonster.system.abilities = {};
        if (!this.currentMonster.system.traits) this.currentMonster.system.traits = {};
        
        this.currentMonster.system.details.level = { value: level };
        this.currentMonster.system.attributes.ac = { value: ac };
        this.currentMonster.system.attributes.hp = { value: hp };
        this.currentMonster.system.attributes.speed = { value: speed };
        this.currentMonster.system.traits.rarity = rarity;
        
        this.currentMonster.system.abilities = {
            str: { mod: str },
            dex: { mod: dex },
            con: { mod: con },
            int: { mod: int },
            wis: { mod: wis },
            cha: { mod: cha }
        };
        
        this.currentMonster.system.traits.value = traits;
        this.currentMonster.system.details.languages = { value: languages };

        // Update selector
        this.populateMonsterSelector();
        
        // Exit editing mode
        this.cancelEditing();
        
        // Refresh display
        this.displayMonster();
    }

    cancelEditing() {
        this.isEditing = false;
        
        // Show display, hide editor
        document.getElementById('monster-display').style.display = 'block';
        document.getElementById('monster-editor').style.display = 'none';
        
        // Update button visibility
        document.getElementById('edit-monster-btn').style.display = 'inline-block';
        document.getElementById('save-monster-btn').style.display = 'none';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }

    // Modal functionality
    showBookSelectionModal() {
        document.getElementById('book-selection-modal').style.display = 'block';
        this.updateSelectedCount();
    }

    hideBookSelectionModal() {
        document.getElementById('book-selection-modal').style.display = 'none';
    }

    populateBookCategories() {
        const categories = MonsterDatabase.getBookCategories();
        const container = document.querySelector('.book-categories');
        
        container.innerHTML = '';
        
        for (const [categoryName, books] of Object.entries(categories)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'book-category';
            categoryDiv.dataset.category = categoryName;
            
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <h3 class="category-title">${categoryName}</h3>
                <button class="category-toggle">−</button>
            `;
            
            const booksDiv = document.createElement('div');
            booksDiv.className = 'category-books';
            
            for (const [bookId, bookData] of Object.entries(books)) {
                const bookItem = document.createElement('div');
                bookItem.className = 'book-item';
                
                const fileCount = bookData.files ? bookData.files.length : 
                                 (bookData.subdirectories ? Object.values(bookData.subdirectories).flat().length : 0);
                
                bookItem.innerHTML = `
                    <input type="checkbox" class="book-checkbox" data-book-id="${bookId}" 
                           ${this.selectedBooks.has(bookId) ? 'checked' : ''}>
                    <div class="book-info">
                        <div class="book-name">${bookData.name}</div>
                        <div class="book-description">${bookData.description}</div>
                        <div class="book-count">~${fileCount} creatures</div>
                    </div>
                `;
                
                // Add event listener to checkbox
                const checkbox = bookItem.querySelector('.book-checkbox');
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedBooks.add(checkbox.dataset.bookId);
                    } else {
                        this.selectedBooks.delete(checkbox.dataset.bookId);
                    }
                    this.updateSelectedCount();
                });
                
                booksDiv.appendChild(bookItem);
            }
            
            // Category toggle functionality
            header.querySelector('.category-toggle').addEventListener('click', (e) => {
                booksDiv.classList.toggle('collapsed');
                e.target.textContent = booksDiv.classList.contains('collapsed') ? '+' : '−';
            });
            
            categoryDiv.appendChild(header);
            categoryDiv.appendChild(booksDiv);
            container.appendChild(categoryDiv);
        }
    }

    setActiveFilter(filter) {
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Show/hide categories based on filter
        document.querySelectorAll('.book-category').forEach(category => {
            if (filter === 'all' || category.dataset.category === filter) {
                category.style.display = 'block';
            } else {
                category.style.display = 'none';
            }
        });
    }

    selectAllVisible() {
        const visibleCategories = document.querySelectorAll('.book-category:not([style*="display: none"])');
        visibleCategories.forEach(category => {
            const checkboxes = category.querySelectorAll('.book-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                this.selectedBooks.add(checkbox.dataset.bookId);
            });
        });
        this.updateSelectedCount();
    }

    clearAllSelections() {
        document.querySelectorAll('.book-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.selectedBooks.clear();
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const count = this.selectedBooks.size;
        document.getElementById('selected-books-count').textContent = 
            `${count} book${count !== 1 ? 's' : ''} selected`;
    }

    async loadSelectedBooks() {
        if (this.selectedBooks.size === 0) {
            alert('Please select at least one book to load monsters from.');
            return;
        }
        
        this.hideBookSelectionModal();
        await this.loadMonsters();
    }

    addMonsterToEncounter(monster) {
        console.log('addMonsterToEncounter called with:', monster.name);
        console.log('window.encounterGenerator exists:', !!window.encounterGenerator);
        
        // Check if encounter generator exists and add monster to it
        if (window.encounterGenerator) {
            try {
                window.encounterGenerator.addMonsterManually(monster);
                console.log(`Successfully added ${monster.name} to encounter`);
                
                // Show visual feedback
                this.showAddToEncounterFeedback(monster.name);
            } catch (error) {
                console.error('Error adding monster to encounter:', error);
                alert(`Error adding ${monster.name} to encounter: ${error.message}`);
            }
        } else {
            console.warn('Encounter generator not available');
            alert('Encounter generator not loaded. Please refresh the page and try again.');
        }
    }

    showAddToEncounterFeedback(monsterName) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'add-monster-notification';
        notification.textContent = `Added ${monsterName} to encounter!`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: bold;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    getPublicNotesIcon(monster) {
        // Check if monster has public notes
        const publicNotes = monster.system?.details?.publicNotes;
        if (!publicNotes || publicNotes.trim() === '') {
            return '';
        }

        // Clean up the HTML content for tooltip display
        const cleanNotes = publicNotes
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            .replace(/<hr\s*\/?>/g, '\n---\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();

        // Create a tooltip icon
        return `<span class="public-notes-icon" title="${cleanNotes}" style="margin-left: 8px; cursor: pointer; color: #8B4513;">ℹ️</span>`;
    }
}

// Reference Parser Class for handling @ references
class ReferenceParser {
    constructor() {
        this.actionPaths = [
            'shared-data/packs/actions/skill-actions/',
            'shared-data/packs/actions/basic-actions/',
            'shared-data/packs/actions/'
        ];
    }

    async parseReferences(html, actionCache) {
        if (!html) return '';

        // First, process /gmr dice notation
        html = this.processGmrDiceNotation(html);

        const universalPattern = /@(\w+)\[((?:[^\[\]]+|\[[^\]]*\])*)\](?:\{([^}]+)\})?/g;
        
        let processedHtml = html;
        const foundReferences = [];
        
        let match;
        while ((match = universalPattern.exec(html)) !== null) {
            foundReferences.push({
                fullMatch: match[0],
                type: match[1],
                content: match[2],
                displayText: match[3] || null,
                index: match.index
            });
        }
        
        universalPattern.lastIndex = 0;
        
        const uniqueTypes = [...new Set(foundReferences.map(ref => ref.type))];
        if (uniqueTypes.length > 0) {
            // console.log('parseReferences: Found @ reference types:', uniqueTypes); // Removed log
        }

        for (const ref of foundReferences) {
            try {
                // console.log('parseReferences: Processing reference:', ref.fullMatch); // Removed log
                const processedReference = await this.processReference(ref, actionCache);
                if (processedReference && processedReference !== ref.fullMatch) {
                    processedHtml = processedHtml.replace(ref.fullMatch, processedReference);
                    // console.log('parseReferences: Replaced with:', processedReference); // Removed log
                } else {
                    // console.log('parseReferences: No replacement for:', ref.fullMatch); // Removed log
                }
            } catch (error) {
                console.warn(`parseReferences: Failed to process reference: ${ref.fullMatch}`, error);
            }
        }
        // console.log('parseReferences: Returning processed HTML:', processedHtml); // Removed log
        return processedHtml;
    }

    processGmrDiceNotation(html) {
        // Pattern to match [[/gmr dice_expression #label]]{display_text}
        const gmrPattern = /\[\[\/gmr\s+([^#]+)\s*#([^\]]+)\]\]\{([^}]+)\}/g;
        
        return html.replace(gmrPattern, (match, diceExpression, label, displayText) => {
            const cleanDice = diceExpression.trim();
            const cleanLabel = label.trim();
            const cleanDisplay = displayText.trim();
            
            // Generate a unique ID for this dice roll
            const rollId = `roll-${Math.random().toString(36).substr(2, 9)}`;
            
            return `<span class="dice-roll" data-dice="${cleanDice}" data-label="${cleanLabel}" data-roll-id="${rollId}" data-original-text="${cleanDisplay}" onclick="rollDice('${cleanDice}', '${cleanLabel}', '${rollId}')" title="Click to roll ${cleanDice}">${cleanDisplay}</span>`;
        });
    }

    async processReference(ref, actionCache) {
        // console.log('processReference: Processing ref object:', ref); // Removed log
        if (!ref || !ref.type || !ref.content) {
            console.warn('processReference: Invalid reference object:', ref);
            return null;
        }
        
        const { type, content, fullMatch, displayText } = ref;
        
        const classification = this.classifyReference(type, content, displayText);
        
        if (!classification) {
            console.warn('processReference: Failed to classify reference:', ref);
            return null;
        }
        
        let result = null; // Initialize result
        switch (classification.category) {
            case 'action':
                result = await this.processActionReference(classification, actionCache);
                break;
            
            case 'condition':
                result = this.processConditionReference(classification);
                break;
            
            case 'damage':
                result = this.processDamageReference(classification);
                break;
            
            case 'check':
                result = this.processCheckReference(classification);
                break;
            
            case 'glossary':
                result = this.processGlossaryReference(classification);
                break;
            
            case 'template':
                result = this.processTemplateReference(classification);
                break;
            
            case 'spell':
                result = this.processSpellReference(classification);
                break;
            
            case 'unknown':
            default:
                result = this.processUnknownReference(classification);
                break;
        }
        // console.log('processReference: Returning result:', result); // Removed log
        return result;
    }
    
    classifyReference(type, content, displayText = null) {
        const lowerType = type.toLowerCase();
        
        if (lowerType === 'uuid') {
            if (content.includes('Compendium.pf2e.actionspf2e.Item')) {
                const actionName = content.split('.').pop();
                return { category: 'action', type, content, actionName, displayText };
            }
            if (content.includes('Compendium.pf2e.conditionitems.Item')) {
                const conditionName = content.split('.').pop();
                return { category: 'condition', type, content, conditionName, displayText };
            }
            if (content.includes('Compendium.pf2e.spells-srd.Item')) {
                const spellName = content.split('.').pop();
                return { category: 'spell', type, content, spellName, displayText };
            }
            if (content.includes('Compendium.pf2e.equipment-srd.Item')) {
                const itemName = content.split('.').pop();
                return { category: 'item', type, content, itemName, displayText };
            }
            return { category: 'unknown', type, content, subtype: 'uuid', displayText };
        }
        
        if (lowerType === 'action') {
            return { category: 'action', type, content, actionName: content, displayText };
        }
        
        if (lowerType === 'damage') {
            return { category: 'damage', type, content, displayText };
        }
        
        if (lowerType === 'check') {
            return { category: 'check', type, content, displayText };
        }
        
        if (lowerType === 'localize') {
            if (content.includes('PF2E.NPC.Abilities.Glossary')) {
                return { category: 'glossary', type, content, displayText };
            }
            return { category: 'unknown', type, content, subtype: 'localize', displayText };
        }
        
        if (lowerType === 'template') {
            return { category: 'template', type, content, displayText };
        }
        
        return { category: 'unknown', type, content, displayText };
    }
    
    async processActionReference(classification, actionCache) {
        const { actionName, displayText } = classification;
        try {
            const actionData = await this.loadActionData(actionName, actionCache);
            if (actionData) {
                return this.createInteractiveSpan(displayText || actionData.name || actionName, actionData, 'action');
            } else {
                return `<span class="reference-link unknown-action" data-action="${actionName}">${this.formatActionName(displayText || actionName)}</span>`;
            }
        } catch (error) {
            console.warn(`Failed to load action: ${actionName}`, error);
            return `<span class="reference-link unknown-action">${this.formatActionName(displayText || actionName)}</span>`;
        }
    }
    
    processConditionReference(classification) {
        const { conditionName, displayText } = classification;
        const displayName = displayText || this.formatConditionName(conditionName);
        
        // console.log('Processing condition:', { conditionName, displayText, displayName }); // Removed log
        
        // Use the display text to get condition data (includes value like "Enfeebled 1")
        const conditionData = this.getConditionData(displayText || conditionName);
        
        // console.log('Condition data:', conditionData); // Removed log
        
        if (conditionData) {
            return this.createInteractiveSpan(displayName, conditionData, 'condition');
        } else {
            return `<span class="reference-link unknown-condition" data-condition="${conditionName}">${displayName}</span>`;
        }
    }
    
    processDamageReference(classification) {
        const { content } = classification;
        const damageData = this.parseDamageParameters(content);
        if (damageData) {
            return this.createInteractiveSpan(content, damageData, 'damage');
        } else {
            return `<span class="reference-link unknown-damage" data-damage="${content}">damage</span>`;
        }
    }
    
    processCheckReference(classification) {
        const { content } = classification;
        const checkData = this.parseCheckParameters(content);
        if (checkData) {
            return this.createInteractiveSpan(content, checkData, 'check');
        } else {
            return `<span class="reference-link unknown-check" data-check="${content}">Check</span>`;
        }
    }
    
    processGlossaryReference(classification) {
        const { content } = classification;
        const glossaryData = this.getGlossaryData(content);
        if (glossaryData) {
            return this.createInteractiveSpan(content, glossaryData, 'glossary');
        } else {
            const termName = content.split('.').pop();
            return `<span class="reference-link unknown-term" data-term="${content}">${termName}</span>`;
        }
    }
    
    processTemplateReference(classification) {
        const { content } = classification;
        // Parse template references like "cone|distance:30"
        const parts = content.split('|');
        const shape = parts[0];
        let distance = '';
        
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith('distance:')) {
                distance = parts[i].substring(9);
                break;
            }
        }
        
        const templateData = {
            shape: shape,
            distance: distance,
            displayText: distance ? `${distance}-foot ${shape}` : shape
        };
        
        return this.createInteractiveSpan(content, templateData, 'template');
    }
    
    processSpellReference(classification) {
        const { spellName, displayText } = classification;
        const displayName = displayText || this.formatSpellName(spellName);
        
        // For now, create a basic spell link since we don't have spell data loading
        const spellData = {
            name: displayName,
            description: 'Spell information not yet available. This feature is under development.',
            school: 'Unknown',
            level: 'Unknown'
        };
        
        return `<span class="reference-link spell-reference" data-spell="${spellName}" title="Spell: ${displayName}">${displayName}</span>`;
    }
    
    processUnknownReference(classification) {
        const { type, content, subtype } = classification;
        console.log(`Unknown reference type: @${type}[${content}]`);
        
        // Create a generic interactive link for unknown types
        let displayText = type;
        if (subtype === 'uuid') {
            // Try to extract a meaningful name from UUID
            const parts = content.split('.');
            displayText = parts[parts.length - 1] || type;
        } else if (content) {
            // Use content if it looks like a simple name
            if (content.length < 50 && !content.includes('|')) {
                displayText = content;
            }
        }
        
        return `<span class="reference-link unknown-reference" data-type="${type}" data-content="${content}" title="Unknown reference type: @${type}">${displayText}</span>`;
    }

    async loadActionData(actionName, cache) {
        // Check cache first
        if (cache.has(actionName)) {
            return cache.get(actionName);
        }

        // Convert action name to likely filename
        const filename = this.actionNameToFilename(actionName);
        
        // Try different paths
        for (const basePath of this.actionPaths) {
            try {
                const response = await fetch(`${basePath}${filename}`);
                if (response.ok) {
                    const actionData = await response.json();
                    cache.set(actionName, actionData);
                    return actionData;
                }
            } catch (error) {
                // Continue to next path
            }
        }

        // Action not found
        cache.set(actionName, null);
        return null;
    }

    actionNameToFilename(actionName) {
        // Convert "Demoralize" to "demoralize.json"
        return actionName.toLowerCase().replace(/\s+/g, '-') + '.json';
    }

    formatActionName(actionName) {
        // Convert "Demoralize" to "Demoralize" (capitalize first letter)
        return actionName.charAt(0).toUpperCase() + actionName.slice(1).toLowerCase();
    }

    parseCheckParameters(checkParams) {
        // Parse "fortitude|dc:22|basic" format
        const parts = checkParams.split('|');
        
        if (parts.length < 2) return null;
        
        const checkType = parts[0].trim();
        let dc = null;
        let modifier = null;
        let isBasic = false;
        
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part.startsWith('dc:')) {
                dc = parseInt(part.substring(3));
            } else if (part === 'basic') {
                isBasic = true;
            } else {
                // Could be a modifier or other parameter
                modifier = part;
            }
        }
        
        return {
            type: checkType,
            dc: dc,
            modifier: modifier,
            isBasic: isBasic,
            description: this.getCheckDescription(checkType, isBasic)
        };
    }
    
    getCheckDescription(checkType, isBasic) {
        const checkDescriptions = {
            'fortitude': 'A save against physical effects, disease, and poison',
            'reflex': 'A save against effects you can dodge or avoid',
            'will': 'A save against mental effects and illusions',
            'perception': 'A check to notice hidden or obscured things',
            'athletics': 'Physical activities like climbing, jumping, and swimming',
            'acrobatics': 'Balance, tumbling, and agile movement',
            'stealth': 'Moving unseen and unheard',
            'thievery': 'Picking locks, disabling devices, and sleight of hand',
            'deception': 'Lying, creating false identities, and misdirection',
            'diplomacy': 'Negotiating, making requests, and gathering information',
            'intimidation': 'Frightening others through threats and shows of force',
            'performance': 'Entertaining others through acting, music, or other arts'
        };
        
        let description = checkDescriptions[checkType.toLowerCase()] || `A ${checkType} check`;
        
        if (isBasic) {
            description += '. This is a basic save (critical success negates, success halves damage, failure takes full damage, critical failure takes double damage).';
        }
        
        return description;
    }

    parseDamageParameters(damageParams) {
        // Parse "1d4[poison]" or "2d6[fire],1d4[persistent,fire]"
        const damageComponents = [];
        const parts = damageParams.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            
            // Match pattern like "1d4[poison]" or "5[bludgeoning]"
            const match = trimmed.match(/^(\d*d?\d+)\[([^\]]+)\]$/);
            if (match) {
                const diceExpression = match[1];
                const typeAndTraits = match[2].split(',').map(t => t.trim());
                const damageType = typeAndTraits[0];
                const traits = typeAndTraits.slice(1);
                
                damageComponents.push({
                    dice: diceExpression,
                    type: damageType,
                    traits: traits,
                    isPersistent: traits.includes('persistent')
                });
            }
        }
        
        if (damageComponents.length === 0) return null;
        
        return {
            components: damageComponents,
            totalExpression: damageParams,
            displayText: this.formatDamageDisplay(damageComponents)
        };
    }
    
    formatDamageDisplay(components) {
        return components.map(comp => {
            let text = comp.dice;
            if (comp.isPersistent) {
                text += ` persistent ${comp.type}`;
            } else {
                text += ` ${comp.type}`;
            }
            return text;
        }).join(' + ');
    }
    
    getConditionData(conditionName) {
        // console.log('getConditionData called with:', conditionName); // Removed log
        
        // Parse condition name that might include value like "Enfeebled 1"
        const parts = conditionName.split(/\s+/); // Split on any whitespace
        const cleanName = parts[0].toLowerCase();
        const value = parts[1] || '';
        
        // console.log('Parsed condition:', { cleanName, value }); // Removed log
        
        const conditions = {
            'enfeebled': {
                name: 'Enfeebled',
                description: 'You\'re physically weakened. Enfeebled always includes a value. When you are enfeebled, you take a status penalty equal to the condition value to Strength-based rolls and DCs, including Strength-based melee attack rolls, Strength-based damage rolls, and Athletics checks.',
                type: 'debuff',
                traits: []
            },
            'frightened': {
                name: 'Frightened',
                description: 'You\'re gripped by fear and struggle to control your nerves. The frightened condition always includes a value. You take a status penalty equal to this value to all your checks and DCs. At the end of each of your turns, the value decreases by 1.',
                type: 'debuff',
                traits: ['mental', 'fear', 'emotion']
            },
            'stunned': {
                name: 'Stunned',
                description: 'You\'ve become senseless. You can\'t act while stunned. Stunned usually includes a value, which indicates how many total actions you lose.',
                type: 'debuff',
                traits: ['mental']
            },
            'poisoned': {
                name: 'Poisoned',
                description: 'You\'ve been affected by a poison. You take a status penalty to all your checks and DCs equal to the condition value.',
                type: 'debuff',
                traits: ['poison']
            },
            'fascinated': {
                name: 'Fascinated',
                description: 'You are compelled to focus your attention on something, distracting you from whatever else is going on around you.',
                type: 'debuff',
                traits: ['mental', 'emotion']
            },
            'paralyzed': {
                name: 'Paralyzed',
                description: 'Your body is frozen in place. You are flat-footed and can\'t act except to Recall Knowledge and use actions that require only mental components.',
                type: 'debuff',
                traits: ['incapacitation']
            }
        };
        
        const conditionData = conditions[cleanName];
        if (conditionData) {
            return {
                ...conditionData,
                value: value,
                displayName: value ? `${conditionData.name} ${value}` : conditionData.name
            };
        }
        
        return null;
    }
    
    formatConditionName(conditionName) {
        // Convert URL-encoded condition names like "Enfeebled%201" to "Enfeebled 1"
        return conditionName.replace(/%20/g, ' ');
    }

    formatSpellName(spellName) {
        // Convert "Translocate" to proper case
        return spellName.charAt(0).toUpperCase() + spellName.slice(1).toLowerCase();
    }

    createInteractiveSpan(reference, data, type) {
        const id = `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let displayName;
        
        if (type === 'action') {
            displayName = data.name || this.formatActionName(reference);
        } else if (type === 'check') {
            displayName = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} DC ${data.dc}${data.isBasic ? ' (basic)' : ''}`;
        } else if (type === 'damage') {
            displayName = data.displayText + ' damage';
        } else if (type === 'condition') {
            displayName = data.displayName;
        } else if (type === 'template') {
            displayName = data.displayText;
        } else {
            displayName = reference.split('.').pop();
        }
        
        return `<span class="reference-link interactive ${type}-reference" 
                     data-reference="${reference}" 
                     data-type="${type}"
                     data-tooltip-id="${id}"
                     onmouseenter="showReferenceTooltip(event); showTooltipAndClearTimeout()"
                     onmouseleave="hideReferenceTooltipDelayed()"
                     title="Click for more details">${displayName}</span>`;
    }

    getGlossaryData(term) {
        // Basic glossary data for common terms
        const glossary = {
            'PF2E.NPC.Abilities.Glossary.Tremorsense': {
                name: 'Tremorsense',
                description: 'A creature with tremorsense can automatically pinpoint the location of anything that is in contact with the ground and within the specified range.'
            },
            'PF2E.NPC.Abilities.Glossary.Telepathy': {
                name: 'Telepathy',
                description: 'This monster can communicate telepathically with any creature within the listed radius that knows a language. This doesn\'t give any ability to understand the creature\'s language.'
            },
            'PF2E.NPC.Abilities.Glossary.Darkvision': {
                name: 'Darkvision',
                description: 'A creature with darkvision can see perfectly well in areas of darkness and dim light, though such vision is in black and white only.'
            },
            'PF2E.NPC.Abilities.Glossary.Scent': {
                name: 'Scent',
                description: 'Scent allows a creature to detect approaching enemies, sniff out hidden foes, and track by sense of smell.'
            },
            'PF2E.NPC.Abilities.Glossary.ReactiveStrike': {
                name: 'Reactive Strike',
                description: 'Trigger: A creature within your reach uses a manipulate action or a move action, makes a ranged attack, or leaves a square during a move action it\'s using. You lash out at a foe that leaves an opening. Make a melee Strike against the triggering creature. If your attack is a critical hit and the trigger was a manipulate action, you disrupt that action. This Strike doesn\'t count toward your multiple attack penalty, and your multiple attack penalty doesn\'t apply to this Strike.'
            },
            'PF2E.NPC.Abilities.Glossary.AttackOfOpportunity': {
                name: 'Attack of Opportunity',
                description: 'Trigger: A creature within your reach uses a manipulate action or a move action, makes a ranged attack, or leaves a square during a move action it\'s using. You lash out at a foe that leaves an opening. Make a melee Strike against the triggering creature. If your attack is a critical hit and the trigger was a manipulate action, you disrupt that action. This Strike doesn\'t count toward your multiple attack penalty, and your multiple attack penalty doesn\'t apply to this Strike.'
            },
            'PF2E.NPC.Abilities.Glossary.Grab': {
                name: 'Grab',
                description: 'Requirements: The monster\'s last action was a success with a Strike that lists Grab in its damage entry, or it has a creature grabbed using this ability. Effect: The monster automatically Grabs the target until the end of the monster\'s next turn. The creature is grabbed by whichever body part the monster attacked with, and that body part can\'t be used to Strike creatures until the grab is released. Using Grab extends the duration of the monster\'s Grab until the end of its next turn for all creatures grabbed by it. A grabbed creature can use the Escape action to get out of the grab, and the Grab ends for a grabbed creatures if the monster moves away from it.'
            },
            'PF2E.NPC.Abilities.Glossary.Knockdown': {
                name: 'Knockdown',
                description: 'Requirements: The monster\'s last action was a success with a Strike that lists Knockdown in its damage entry. Effect: The monster knocks the target prone.'
            },
            'PF2E.NPC.Abilities.Glossary.Push': {
                name: 'Push',
                description: 'Requirements: The monster\'s last action was a success with a Strike that lists Push in its damage entry. Effect: The monster pushes the target away from the monster. Unless otherwise noted in the ability description, the creature is pushed 5 feet, or 10 feet if the Strike was a critical hit.'
            }
        };

        return glossary[term] || null;
    }
}

// Global tooltip functions for reference links
window.showReferenceTooltip = async function(event) {
    const tooltip = document.getElementById('reference-tooltip');
    const element = event.target;
    const reference = element.dataset.reference;
    const type = element.dataset.type;
    
    if (type === 'action') {
        const actionName = monsterViewer.referenceParser.formatActionName(reference);
        const actionData = monsterViewer.actionCache.get(reference);
        
        if (actionData) {
            const traits = actionData.system?.traits?.value || [];
            const actions = actionData.system?.actions?.value;
            const description = actionData.system?.description?.value || '';
            
            const processedDescription = await window.monsterViewer.processReferences(description);
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${actionData.name || actionName}</h4>
                    ${actions ? `<span class="action-cost">${getActionIcon(actions)}</span>` : ''}
                </div>
                <div class="tooltip-traits">
                    ${traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
                </div>
                <div class="tooltip-description">
                    ${processedDescription}
                </div>
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${actionName}</h4>
                </div>
                <div class="tooltip-description">
                    Action data not available. Click to search for more information.
                </div>
            `;
        }
    } else if (type === 'check') {
        const checkData = monsterViewer.referenceParser.parseCheckParameters(reference);
        
        if (checkData) {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${checkData.type.charAt(0).toUpperCase() + checkData.type.slice(1)} Check</h4>
                    <span class="check-dc">DC ${checkData.dc}</span>
                </div>
                ${checkData.isBasic ? '<div class="tooltip-traits"><span class="trait">Basic Save</span></div>' : ''}
                <div class="tooltip-description">
                    ${checkData.description}
                </div>
                ${checkData.isBasic ? `
                    <div class="check-outcomes">
                        <div class="outcome"><strong>Critical Success:</strong> No effect</div>
                        <div class="outcome"><strong>Success:</strong> Half damage</div>
                        <div class="outcome"><strong>Failure:</strong> Full damage</div>
                        <div class="outcome"><strong>Critical Failure:</strong> Double damage</div>
                    </div>
                ` : ''}
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>Check</h4>
                </div>
                <div class="tooltip-description">
                    Check information not available.
                </div>
            `;
        }
    } else if (type === 'damage') {
        const damageData = monsterViewer.referenceParser.parseDamageParameters(reference);
        
        if (damageData) {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>Damage</h4>
                    <span class="damage-expression">${damageData.displayText}</span>
                </div>
                <div class="damage-components">
                    ${damageData.components.map(comp => `
                        <div class="damage-component">
                            <span class="damage-dice">${comp.dice}</span>
                            <span class="damage-type">${comp.type}</span>
                            ${comp.isPersistent ? '<span class="trait">Persistent</span>' : ''}
                            ${comp.traits.filter(t => t !== 'persistent').map(trait => `<span class="trait">${trait}</span>`).join('')}
                        </div>
                    `).join('')}
                </div>
                <div class="tooltip-description">
                    ${damageData.components.length > 1 ? 'Multiple damage types are applied separately.' : ''}
                    ${damageData.components.some(c => c.isPersistent) ? 'Persistent damage continues each round until healed or conditions are met.' : ''}
                </div>
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>Damage</h4>
                </div>
                <div class="tooltip-description">
                    Damage information not available.
                </div>
            `;
        }
    } else if (type === 'condition') {
        // console.log('Tooltip condition reference:', reference); // Removed log
        const conditionData = monsterViewer.referenceParser.getConditionData(reference);
        // console.log('Tooltip condition data:', conditionData); // Removed log
        
        if (conditionData) {
            const tooltipHTML = `
                <div class="tooltip-header">
                    <h4>${conditionData.displayName}</h4>
                    <span class="condition-type">${conditionData.type}</span>
                </div>
                <div class="tooltip-traits">
                    ${conditionData.traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
                </div>
                <div class="tooltip-description">
                    ${conditionData.description}
                </div>
            `;
            // console.log('Setting tooltip HTML:', tooltipHTML); // Removed log
            tooltip.innerHTML = tooltipHTML;
            
            // Debug tooltip positioning
            // console.log('Tooltip element:', tooltip); // Removed log
            // console.log('Tooltip styles:', window.getComputedStyle(tooltip)); // Removed log
        } else {
            const conditionName = monsterViewer.referenceParser.formatConditionName(reference);
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${conditionName}</h4>
                </div>
                <div class="tooltip-description">
                    Condition information not available.
                </div>
            `;
        }
    } else if (type === 'template') {
        const content = element.dataset.reference; // Get the raw content directly
        const parts = content.split('|');
        const shape = parts[0];
        let distance = '';
        
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].startsWith('distance:')) {
                distance = parts[i].substring(9);
                break;
            }
        }
        
        tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>Area Template</h4>
                    <span class="template-shape">${shape.charAt(0).toUpperCase() + shape.slice(1)}</span>
                </div>
                <div class="tooltip-description">
                    ${distance ? `A ${distance}-foot ${shape} area of effect.` : `A ${shape} area of effect.`}
                    ${shape === 'cone' ? 'Cone areas extend from the origin point in a specific direction.' : ''}
                    ${shape === 'line' ? 'Line areas extend in a straight line from the origin point.' : ''}
                    ${shape === 'burst' ? 'Burst areas extend in all directions from the origin point.' : ''}
                </div>
            `;
    } else if (type === 'unknown') {
        const element = event.target;
        const referenceType = element.dataset.type || 'unknown';
        const content = element.dataset.content || reference;
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>Unknown Reference</h4>
                <span class="reference-type">@${referenceType}</span>
            </div>
            <div class="tooltip-description">
                This reference type is not yet supported by the tooltip system.
                <br><br>
                <strong>Type:</strong> @${referenceType}<br>
                <strong>Content:</strong> ${content}
            </div>
        `;
    } else if (type === 'glossary') {
        const termData = monsterViewer.referenceParser.getGlossaryData(reference);
        
        if (termData) {
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${termData.name}</h4>
                </div>
                <div class="tooltip-description">
                    ${termData.description}
                </div>
            `;
        } else {
            const termName = reference.split('.').pop();
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <h4>${termName}</h4>
                </div>
                <div class="tooltip-description">
                    Definition not available.
                </div>
            `;
        }
    }
    
    // console.log('About to position tooltip, type was:', type); // Removed log
    
    // Position and show tooltip with smart positioning
    // console.log('Positioning tooltip...'); // Removed log
    tooltip.style.display = 'block';
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // console.log('Element rect:', rect); // Removed log
    // console.log('Tooltip rect:', tooltipRect); // Removed log
    
    // Calculate horizontal position
    let left = rect.left + window.scrollX;
    
    // Prevent tooltip from going off the right edge
    if (left + tooltipRect.width > viewportWidth + window.scrollX) {
        left = rect.right + window.scrollX - tooltipRect.width;
    }
    
    // Prevent tooltip from going off the left edge
    if (left < window.scrollX) {
        left = window.scrollX + 10;
    }
    
    // Calculate vertical position - prefer below, but flip to above if not enough space
    let top = rect.bottom + window.scrollY + 5;
    
    // If tooltip would go below viewport, position it above the element
    if (rect.bottom + tooltipRect.height + 10 > viewportHeight) {
        top = rect.top + window.scrollY - tooltipRect.height - 5;
        
        // If positioning above would go off the top, position it within viewport
        if (top < window.scrollY) {
            top = window.scrollY + 10;
        }
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    // console.log('Final tooltip position:', { left, top }); // Removed log
    // console.log('Tooltip display style:', tooltip.style.display); // Removed log
};

// Global tooltip timeout variable
window.tooltipTimeout = null;

// Clear any pending tooltip hide timeout
window.clearTooltipTimeout = function() {
    if (window.tooltipTimeout) {
        clearTimeout(window.tooltipTimeout);
        window.tooltipTimeout = null;
    }
};

// Hide tooltip immediately
window.hideReferenceTooltip = function() {
    window.clearTooltipTimeout();
    const tooltip = document.getElementById('reference-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
};

// Hide tooltip with delay
window.hideReferenceTooltipDelayed = function() {
    window.tooltipShouldBeVisible = false;
    window.clearTooltipTimeout();
    window.tooltipTimeout = setTimeout(() => {
        // Only hide if tooltip should not be visible
        if (!window.tooltipShouldBeVisible) {
            const tooltip = document.getElementById('reference-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        }
    }, 300); // 300ms delay
};

// Show tooltip and clear any pending hide
window.showTooltipAndClearTimeout = function() {
    window.clearTooltipTimeout();
    window.tooltipShouldBeVisible = true;
};

// Track if tooltip should be visible
window.tooltipShouldBeVisible = false;

window.showWeaponTooltip = function(event) {
    const tooltip = document.getElementById('reference-tooltip');
    const element = event.target;
    
    try {
        const weaponData = JSON.parse(element.dataset.weaponData);
        
        // Format traits for display
        const traitsHtml = weaponData.traits.length > 0 ? 
            `<div class="tooltip-traits">
                ${weaponData.traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
            </div>` : '';
        
        // Format attack effects
        const effectsHtml = weaponData.attackEffects.length > 0 ?
            `<div class="weapon-effects">
                <strong>Effects:</strong> ${weaponData.attackEffects.join(', ')}
            </div>` : '';
        
        // Format attack bonus
        const attackBonus = weaponData.attackBonus >= 0 ? `+${weaponData.attackBonus}` : `${weaponData.attackBonus}`;
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${weaponData.name}</h4>
                <span class="weapon-type">${weaponData.weaponType.charAt(0).toUpperCase() + weaponData.weaponType.slice(1)}</span>
            </div>
            ${traitsHtml}
            <div class="weapon-stats">
                <div class="stat-line">
                    <span class="stat-label">Attack:</span>
                    <span class="stat-value">${attackBonus}</span>
                </div>
                <div class="stat-line">
                    <span class="stat-label">Damage:</span>
                    <span class="stat-value">${weaponData.damage} ${weaponData.damageType}</span>
                </div>
                <div class="stat-line">
                    <span class="stat-label">Range:</span>
                    <span class="stat-value">${weaponData.range}</span>
                </div>
            </div>
            ${effectsHtml}
        `;
        
        // Position and show tooltip (using same positioning logic as reference tooltips)
        tooltip.style.display = 'block';
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate horizontal position
        let left = rect.left + window.scrollX;
        
        // Prevent tooltip from going off the right edge
        if (left + tooltipRect.width > viewportWidth + window.scrollX) {
            left = rect.right + window.scrollX - tooltipRect.width;
        }
        
        // Prevent tooltip from going off the left edge
        if (left < window.scrollX) {
            left = window.scrollX + 10;
        }
        
        // Calculate vertical position - prefer below, but flip to above if not enough space
        let top = rect.bottom + window.scrollY + 5;
        
        // If tooltip would go below viewport, position it above the element
        if (rect.bottom + tooltipRect.height + 10 > viewportHeight) {
            top = rect.top + window.scrollY - tooltipRect.height - 5;
            
            // If positioning above would go off the top, position it within viewport
            if (top < window.scrollY) {
                top = window.scrollY + 10;
            }
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
    } catch (error) {
        console.error('Failed to show weapon tooltip:', error);
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>Weapon Attack</h4>
            </div>
            <div class="tooltip-description">
                Weapon data not available.
            }
        `;
        tooltip.style.display = 'block';
    }
};

window.showAbilityTooltip = async function(event) {
    const tooltip = document.getElementById('reference-tooltip');
    const element = event.target;
    
    try {
        const abilityData = JSON.parse(element.dataset.abilityData);
        
        // Format traits for display
        const traitsHtml = abilityData.traits.length > 0 ? 
            `<div class="tooltip-traits">
                ${abilityData.traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
            </div>` : '';
        
        // Format action type and cost
        let actionInfo = '';
        if (abilityData.actionType === 'reaction') {
            actionInfo = '<span class="action-type reaction">⚡ Reaction</span>';
        } else if (abilityData.actionCost) {
            const actionIcons = {
                1: '◆',
                2: '◆◆', 
                3: '◆◆◆'
            };
            actionInfo = `<span class="action-type action">${actionIcons[abilityData.actionCost] || ''} ${abilityData.actionCost} Action${abilityData.actionCost > 1 ? 's' : ''}</span>`;
        }
        
        // Format frequency
        const frequencyHtml = abilityData.frequency ? 
            `<div class="ability-frequency">
                <strong>Frequency:</strong> ${abilityData.frequency.max} per ${abilityData.frequency.per}
            </div>` : '';
        
        // Format structured description parts
        let structuredHtml = '';
        const parts = abilityData.parsedDescription;
        
        // Check if monsterViewer is available before processing references
        if (window.monsterViewer && window.monsterViewer.processReferences) {
            if (parts.requirements) {
                const processedRequirements = await window.monsterViewer.processReferences(parts.requirements);
                structuredHtml += `<div class="ability-section"><strong>Requirements:</strong> ${processedRequirements}</div>`;
            }
            if (parts.trigger) {
                const processedTrigger = await window.monsterViewer.processReferences(parts.trigger);
                structuredHtml += `<div class="ability-section"><strong>Trigger:</strong> ${processedTrigger}</div>`;
            }
            if (parts.effect) {
                const processedEffect = await window.monsterViewer.processReferences(parts.effect);
                structuredHtml += `<div class="ability-section"><strong>Effect:</strong> ${processedEffect}</div>`;
            }
            
            // If no structured parts, show full description
            if (!structuredHtml && abilityData.description) {
                const processedDescription = await window.monsterViewer.processReferences(abilityData.description);
                structuredHtml = `<div class="ability-description">${processedDescription}</div>`;
            }
        } else {
            // Fallback: show raw content without reference processing
            if (parts.requirements) {
                structuredHtml += `<div class="ability-section"><strong>Requirements:</strong> ${parts.requirements}</div>`;
            }
            if (parts.trigger) {
                structuredHtml += `<div class="ability-section"><strong>Trigger:</strong> ${parts.trigger}</div>`;
            }
            if (parts.effect) {
                structuredHtml += `<div class="ability-section"><strong>Effect:</strong> ${parts.effect}</div>`;
            }
            
            // If no structured parts, show full description
            if (!structuredHtml && abilityData.description) {
                structuredHtml = `<div class="ability-description">${abilityData.description}</div>`;
            }
        }
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${abilityData.name}</h4>
                ${actionInfo}
            </div>
            ${traitsHtml}
            ${frequencyHtml}
            <div class="ability-details">
                ${structuredHtml}
            </div>
        `;
        
        // Position and show tooltip
        tooltip.style.display = 'block';
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate horizontal position
        let left = rect.left + window.scrollX;
        
        // Prevent tooltip from going off the right edge
        if (left + tooltipRect.width > viewportWidth + window.scrollX) {
            left = rect.right + window.scrollX - tooltipRect.width;
        }
        
        // Prevent tooltip from going off the left edge
        if (left < window.scrollX) {
            left = window.scrollX + 10;
        }
        
        // Calculate vertical position - prefer below, but flip to above if not enough space
        if (rect.bottom + tooltipRect.height + 10 > viewportHeight) {
            top = rect.top + window.scrollY - tooltipRect.height - 5;
            
            // If positioning above would go off the top, position it within viewport
            if (top < window.scrollY) {
                top = window.scrollY + 10;
            }
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
    } catch (error) {
        console.error('Failed to show ability tooltip:', error);
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>Ability</h4>
            </div>
            <div class="tooltip-description">
                Ability data not available.
            }
        `;
        tooltip.style.display = 'block';
    }
};

// Global dice rolling function
window.rollDice = function(diceExpression, label, rollId) {
    try {
        // Parse dice expression like "1d4", "2d6", etc.
        const diceMatch = diceExpression.match(/(\d+)d(\d+)(?:\+(\d+))?/);
        if (!diceMatch) {
            console.error('Invalid dice expression:', diceExpression);
            return;
        }
        
        const numDice = parseInt(diceMatch[1]);
        const diceSize = parseInt(diceMatch[2]);
        const modifier = diceMatch[3] ? parseInt(diceMatch[3]) : 0;
        
        // Roll the dice
        let total = 0;
        let rolls = [];
        
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceSize) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        total += modifier;
        
        // Format the result
        const rollsText = rolls.join(', ');
        const modifierText = modifier > 0 ? ` + ${modifier}` : '';
        const resultText = `${rollsText}${modifierText} = ${total}`;
        
        // Update the element with the roll result
        const rollElement = document.querySelector(`[data-roll-id="${rollId}"]`);
        if (rollElement) {
            // Add animation class
            rollElement.classList.add('rolling');
            
            // Show result after brief animation
            setTimeout(() => {
                rollElement.innerHTML = `<strong>${total}</strong> <small>(${resultText})</small>`;
                rollElement.classList.remove('rolling');
                rollElement.classList.add('rolled');
                
                // Reset after 5 seconds
                setTimeout(() => {
                    rollElement.innerHTML = rollElement.getAttribute('data-original-text') || rollElement.getAttribute('data-original-text');
                    rollElement.classList.remove('rolled');
                }, 5000);
            }, 300);
        }
        
        // Also log to console for GM reference
        console.log(`🎲 ${label}: ${diceExpression} = ${resultText}`);
        
    } catch (error) {
        console.error('Error rolling dice:', error);
    }
};

try {
    window.monsterViewer = new MonsterViewer();
    console.log('monsterViewer successfully instantiated and assigned to window.');
} catch (e) {
    console.error('Error instantiating MonsterViewer:', e);
}