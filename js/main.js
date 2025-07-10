class SuperMegaPF2EApp {
    constructor() {
        this.currentTab = 'character-creator';
        this.initializeApp();
    }

    async initializeApp() {
        console.log('Initializing SuperMegaPF2EApp...');
        
        // Initialize tab navigation
        this.initializeTabNavigation();
        
        // Load all data
        await this.loadAppData();
        
        // Load monsters immediately at startup for better UX
        this.loadMonstersEagerly();
        
        // Initialize character creator
        if (window.characterCreator) {
            window.characterCreator.populateDropdowns();
        }
        
        // Initialize campaign manager and load saved campaigns
        this.initializeCampaignManager();
        
        console.log('App initialized successfully!');
    }

    initializeTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.currentTab = tabName;
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadAppData() {
        try {
            console.log('Loading app data...');
            await dataLoader.loadAllData();
            
            // If no data was loaded, create sample data
            if (dataLoader.getAncestries().length === 0) {
                console.log('No data files found, creating sample data...');
                dataLoader.createSampleData();
            }
            
            // Monsters will be loaded eagerly in initializeApp()
            
            console.log('App data loaded successfully');
        } catch (error) {
            console.error('Error loading app data:', error);
            // Fallback to sample data
            dataLoader.createSampleData();
        }
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'character-creator':
                if (window.characterCreator) {
                    window.characterCreator.populateDropdowns();
                }
                break;
            case 'character-sheet':
                this.loadCharacterSheet();
                break;
            case 'monster-viewer':
                if (window.monsterViewer) {
                    window.monsterViewer.loadMonsters();
                }
                break;
            case 'rules':
                this.loadRules();
                break;
            case 'tools':
                this.loadTools();
                break;
        }
    }

    loadCharacterSheet() {
        const container = document.querySelector('.character-sheet-container');
        const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
        
        // Also check for characters from campaign manager
        let campaignCharacters = [];
        if (window.campaignManager && window.campaignManager.currentCampaign) {
            campaignCharacters = window.campaignManager.currentCampaign.characters || [];
        }
        
        const allCharacters = [...savedCharacters, ...campaignCharacters];
        
        if (allCharacters.length === 0) {
            container.innerHTML = `
                <h2>Character Sheet</h2>
                <div class="no-characters">
                    <p>No characters available. Create a character or load one in Campaign Manager.</p>
                    <button class="btn btn-primary" onclick="app.switchTab('character-creator')">Create Character</button>
                    <button class="btn btn-secondary" onclick="app.switchTab('campaign-manager')">Campaign Manager</button>
                </div>
            `;
        } else {
            // Show character selector if multiple characters
            if (allCharacters.length > 1) {
                this.showCharacterSelector(allCharacters, container);
            } else {
                this.displayCharacterSheet(allCharacters[0]);
            }
        }
    }

    showCharacterSelector(characters, container) {
        container.innerHTML = `
            <h2>Character Sheet</h2>
            <div class="character-selector">
                <h3>Select Character to View</h3>
                <div class="character-list">
                    ${characters.map((char, index) => `
                        <div class="character-option" onclick="app.displayCharacterSheet(${JSON.stringify(char).replace(/"/g, '&quot;')})">
                            <div class="char-name">${char.name}</div>
                            <div class="char-details">Level ${char.level} ${char.class || 'Unknown Class'}</div>
                            <div class="char-ancestry">${char.ancestry || 'Unknown Ancestry'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    displayCharacterSheet(character) {
        const container = document.querySelector('.character-sheet-container');
        
        // Helper function to get character data with fallbacks
        const getData = (path, fallback = '') => {
            const keys = path.split('.');
            let value = character;
            for (const key of keys) {
                value = value?.[key];
                if (value === undefined) break;
            }
            return value !== undefined ? value : fallback;
        };

        // Calculate ability modifiers
        const abilities = getData('abilities') || getData('rawData.build.abilities') || {};
        const getAbilityMod = (score) => Math.floor((score - 10) / 2);
        const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;

        // Get proficiency bonus based on level
        const level = getData('level') || getData('rawData.build.level') || 1;
        const profBonus = Math.floor((level - 1) / 4) + 2;

        container.innerHTML = `
            <div class="official-character-sheet">
                <!-- Character Header -->
                <div class="char-sheet-header">
                    <div class="char-name-level">
                        <h1 class="character-name">${getData('name') || getData('rawData.build.name') || 'Unknown Character'}</h1>
                        <div class="level-exp">
                            <div class="level-box">
                                <label>LEVEL</label>
                                <div class="level-value">${level}</div>
                            </div>
                            <div class="exp-box">
                                <label>EXPERIENCE POINTS</label>
                                <div class="exp-value">${getData('experience') || '0'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="char-basic-info">
                        <div class="info-row">
                            <div class="info-field">
                                <label>ANCESTRY</label>
                                <div class="field-value">${getData('ancestry') || getData('rawData.build.ancestry') || 'Unknown'}</div>
                            </div>
                            <div class="info-field">
                                <label>HERITAGE</label>
                                <div class="field-value">${getData('heritage') || getData('rawData.build.heritage') || 'Unknown'}</div>
                            </div>
                            <div class="info-field">
                                <label>BACKGROUND</label>
                                <div class="field-value">${getData('background') || getData('rawData.build.background') || 'Unknown'}</div>
                            </div>
                            <div class="info-field">
                                <label>CLASS</label>
                                <div class="field-value">${getData('class') || getData('rawData.build.class') || 'Unknown'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Sheet Content -->
                <div class="char-sheet-body">
                    <!-- Core Stats Section -->
                    <div class="core-stats-section">
                        <h2>CORE STATISTICS</h2>
                        <div class="core-stats-grid">
                            <!-- Armor Class -->
                            <div class="core-stat-block">
                                <h3>ARMOR CLASS</h3>
                                <div class="stat-value">${getData('ac') || getData('rawData.acTotal.acTotal') || (10 + getAbilityMod(abilities.dex || 10))}</div>
                                <div class="stat-breakdown">= 10 + Dex + prof + item</div>
                            </div>

                            <!-- Hit Points -->
                            <div class="core-stat-block">
                                <h3>HIT POINTS</h3>
                                <div class="stat-value">${this.calculateHP(character)}</div>
                                <div class="stat-breakdown">Max / Current / Temp</div>
                                <div class="hp-detailed">
                                    <span class="hp-current">${this.calculateHP(character)}</span> / 
                                    <span class="hp-temp">0</span>
                                </div>
                            </div>

                            <!-- Speed -->
                            <div class="core-stat-block">
                                <h3>SPEED</h3>
                                <div class="stat-value">${getData('rawData.build.attributes.speed') || 25}</div>
                                <div class="stat-breakdown">feet</div>
                            </div>

                            <!-- Class DC -->
                            <div class="core-stat-block">
                                <h3>CLASS DC</h3>
                                <div class="stat-value">${10 + profBonus + getAbilityMod(abilities[getData('rawData.build.keyability')] || abilities.str || 10)}</div>
                                <div class="stat-breakdown">= 10 + prof + key ability</div>
                            </div>
                        </div>
                    </div>

                    <!-- Ability Scores Section -->
                    <div class="ability-scores-section">
                        <h2>ABILITY SCORES</h2>
                        <div class="abilities-grid">
                            ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ability => {
                                const score = abilities[ability] || 10;
                                const mod = getAbilityMod(score);
                                const abilityNames = {
                                    str: 'STRENGTH', dex: 'DEXTERITY', con: 'CONSTITUTION',
                                    int: 'INTELLIGENCE', wis: 'WISDOM', cha: 'CHARISMA'
                                };
                                return `
                                    <div class="ability-block">
                                        <div class="ability-name">${abilityNames[ability]}</div>
                                        <div class="ability-score">${score}</div>
                                        <div class="ability-modifier">${formatMod(mod)}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Attacks Section -->
                    <div class="attacks-section">
                        <h2>ATTACKS & SPECIAL ABILITIES</h2>
                        <div class="attacks-content">
                            <!-- Weapons -->
                            <div class="weapons-subsection">
                                <h3>WEAPONS</h3>
                                <div class="weapons-list">
                                    ${this.generateWeaponsList(character, abilities, profBonus)}
                                </div>
                            </div>
                            
                            <!-- Special Attacks -->
                            <div class="special-attacks-subsection">
                                <h3>SPECIAL ATTACKS</h3>
                                <div class="special-attacks-list">
                                    ${this.generateSpecialAttacks(character)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Spells Section -->
                    <div class="spells-section">
                        <h2>SPELLS & MAGIC</h2>
                        <div class="spells-content">
                            ${this.generateSpellsDisplay(character)}
                        </div>
                    </div>

                </div>

                <!-- Character Actions -->
                <div class="character-sheet-actions">
                    <button class="btn btn-primary" onclick="window.print()">🖨️ Print Sheet</button>
                    <button class="btn btn-secondary" onclick="app.exportCharacterSheet('${character.id || 'character'}')">📄 Export PDF</button>
                    <button class="btn btn-info" onclick="app.loadCharacterSheet()">← Back to Character List</button>
                </div>
            </div>
        `;
        
        // Initialize tooltips after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeCharacterSheetTooltips();
        }, 100);
    }

    calculateHP(character) {
        const level = character.level || character.rawData?.build?.level || 1;
        const conMod = Math.floor(((character.abilities?.con || character.rawData?.build?.abilities?.con || 10) - 10) / 2);
        const ancestryHP = character.rawData?.build?.attributes?.ancestryhp || 8;
        const classHP = character.rawData?.build?.attributes?.classhp || 8;
        const bonusHP = character.rawData?.build?.attributes?.bonushp || 0;
        
        return ancestryHP + (classHP + conMod) * level + bonusHP;
    }

    generateSkillsList(character, abilities, profBonus) {
        const skills = [
            { name: 'Acrobatics', ability: 'dex' },
            { name: 'Arcana', ability: 'int' },
            { name: 'Athletics', ability: 'str' },
            { name: 'Crafting', ability: 'int' },
            { name: 'Deception', ability: 'cha' },
            { name: 'Diplomacy', ability: 'cha' },
            { name: 'Intimidation', ability: 'cha' },
            { name: 'Medicine', ability: 'wis' },
            { name: 'Nature', ability: 'wis' },
            { name: 'Occultism', ability: 'int' },
            { name: 'Performance', ability: 'cha' },
            { name: 'Religion', ability: 'wis' },
            { name: 'Society', ability: 'int' },
            { name: 'Stealth', ability: 'dex' },
            { name: 'Survival', ability: 'wis' },
            { name: 'Thievery', ability: 'dex' }
        ];

        return skills.map(skill => {
            const abilityMod = Math.floor(((abilities[skill.ability] || 10) - 10) / 2);
            const skillProf = character.rawData?.build?.proficiencies?.[skill.name.toLowerCase()] || 0;
            const totalMod = abilityMod + (skillProf > 0 ? profBonus : 0);
            const profSymbol = skillProf > 0 ? 'T' : '—';
            
            return `
                <div class="skill-item">
                    <span class="skill-prof">${profSymbol}</span>
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-mod">${totalMod >= 0 ? '+' : ''}${totalMod}</span>
                </div>
            `;
        }).join('');
    }

    generateWeaponsList(character, abilities, profBonus) {
        const weapons = character.rawData?.build?.weapons || [];
        if (weapons.length === 0) {
            return '<div class="no-weapons">No weapons equipped</div>';
        }

        return weapons.map(weapon => {
            const strMod = Math.floor(((abilities.str || 10) - 10) / 2);
            const dexMod = Math.floor(((abilities.dex || 10) - 10) / 2);
            const attackMod = weapon.attack || (strMod + profBonus);
            const damage = `${weapon.die || 'd6'}${weapon.damageBonus ? '+' + weapon.damageBonus : ''}`;
            
            // Create weapon tooltip data
            const weaponData = this.getWeaponData(weapon.name);
            const tooltipData = {
                name: weapon.name,
                attack: `+${attackMod} to hit`,
                damage: `${damage} ${weapon.damageType || 'B'}`,
                traits: weaponData?.traits || [],
                description: weaponData?.description || `${weapon.name} weapon attack`
            };
            
            return `
                <div class="weapon-item" data-tooltip-content="${encodeURIComponent(JSON.stringify(tooltipData))}">
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-attack">+${attackMod} to hit</div>
                    <div class="weapon-damage">${damage} ${weapon.damageType || 'B'}</div>
                </div>
            `;
        }).join('');
    }

    generateEquipmentList(character) {
        const equipment = character.rawData?.build?.equipment || [];
        const money = character.rawData?.build?.money || {};
        
        let html = '';
        
        // Money
        if (Object.values(money).some(v => v > 0)) {
            html += '<div class="money-section"><strong>Money:</strong> ';
            const coins = [];
            if (money.pp > 0) coins.push(`${money.pp} pp`);
            if (money.gp > 0) coins.push(`${money.gp} gp`);
            if (money.sp > 0) coins.push(`${money.sp} sp`);
            if (money.cp > 0) coins.push(`${money.cp} cp`);
            html += coins.join(', ') + '</div>';
        }
        
        // Equipment
        if (equipment.length > 0) {
            html += '<div class="gear-section"><strong>Gear:</strong><ul>';
            equipment.forEach(item => {
                const itemName = Array.isArray(item) ? item[0] : item.name || item;
                const qty = Array.isArray(item) && item[1] ? ` (${item[1]})` : '';
                html += `<li>${itemName}${qty}</li>`;
            });
            html += '</ul></div>';
        }
        
        return html || '<div class="no-equipment">No equipment listed</div>';
    }

    generateSpecialAttacks(character) {
        const specials = character.rawData?.build?.specials || [];
        
        if (specials.length === 0) {
            return '<div class="no-specials">No special attacks or abilities</div>';
        }

        return specials.map(special => {
            // Get feat/special ability data
            const specialData = this.getSpecialAbilityData(special);
            const tooltipData = {
                name: special,
                type: specialData?.type || 'Special Ability',
                description: specialData?.description || `${special} - Special ability or feat`,
                traits: specialData?.traits || [],
                prerequisites: specialData?.prerequisites || ''
            };
            
            return `
                <div class="special-attack-item" data-tooltip-content="${encodeURIComponent(JSON.stringify(tooltipData))}">
                    <div class="special-name">${special}</div>
                </div>
            `;
        }).join('');
    }

    generateSpellsDisplay(character) {
        // Debug: Log character data structure to understand spell storage
        console.log('Character data for spells:', character);
        console.log('Raw data build:', character.rawData?.build);
        
        const spellCasters = character.rawData?.build?.spellCasters || [];
        const focusPoints = character.rawData?.build?.focusPoints || 0;
        const focus = character.rawData?.build?.focus || {};
        
        // Try different possible spell data locations
        const spells = character.rawData?.build?.spells || character.rawData?.spells || {};
        const spellbooks = character.rawData?.build?.spellbooks || character.rawData?.spellbooks || [];
        const cantrips = character.rawData?.build?.cantrips || character.rawData?.cantrips || [];
        
        console.log('Found spell data:', { spells, spellbooks, cantrips, spellCasters, focus, focusPoints });
        
        let html = '';
        
        // Focus Points
        if (focusPoints > 0) {
            html += `
                <div class="focus-points-section">
                    <h3>FOCUS POINTS</h3>
                    <div class="focus-points">
                        <div class="focus-current">${focusPoints}</div>
                        <div class="focus-label">Current</div>
                    </div>
                </div>
            `;
        }
        
        // Focus Spells
        if (Object.keys(focus).length > 0) {
            html += `
                <div class="focus-spells-section">
                    <h3>FOCUS SPELLS</h3>
                    <div class="focus-spells-list">
                        ${Object.entries(focus).map(([level, spells]) => {
                            if (Array.isArray(spells) && spells.length > 0) {
                                return `
                                    <div class="spell-level-group">
                                        <h4>Level ${level}</h4>
                                        ${spells.map(spell => `
                                            <div class="spell-item">
                                                <span class="spell-name">${spell.name || spell}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                            }
                            return '';
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Spell Casters (if any)
        if (spellCasters.length > 0) {
            html += `
                <div class="spellcasters-section">
                    <h3>SPELLCASTING</h3>
                    ${spellCasters.map(caster => `
                        <div class="spellcaster-block">
                            <h4>${caster.name || 'Spellcaster'}</h4>
                            <div class="caster-details">
                                <div class="spell-attack">Spell Attack: +${caster.spellAttack || 0}</div>
                                <div class="spell-dc">Spell DC: ${caster.spellDC || 0}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Regular Spells by Level
        if (Object.keys(spells).length > 0) {
            html += `
                <div class="spells-by-level-section">
                    <h3>SPELL REPERTOIRE</h3>
                    ${Object.entries(spells).map(([level, levelSpells]) => {
                        if (Array.isArray(levelSpells) && levelSpells.length > 0) {
                            return `
                                <div class="spell-level-group">
                                    <h4>Level ${level} ${level === '0' ? '(Cantrips)' : ''}</h4>
                                    <div class="spells-at-level">
                                        ${levelSpells.map(spell => `
                                            <div class="spell-item">
                                                <span class="spell-name">${spell.name || spell}</span>
                                                ${spell.heightened ? `<span class="spell-heightened">(Heightened)</span>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
        }
        
        // Cantrips (if separate from spells)
        if (cantrips.length > 0) {
            html += `
                <div class="cantrips-section">
                    <h3>CANTRIPS</h3>
                    <div class="cantrips-list">
                        ${cantrips.map(cantrip => `
                            <div class="spell-item">
                                <span class="spell-name">${cantrip.name || cantrip}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Spellbooks (if any)
        if (spellbooks.length > 0) {
            html += `
                <div class="spellbooks-section">
                    <h3>SPELLBOOKS</h3>
                    ${spellbooks.map(book => `
                        <div class="spellbook-block">
                            <h4>${book.name || 'Spellbook'}</h4>
                            ${book.spells ? Object.entries(book.spells).map(([level, bookSpells]) => {
                                if (Array.isArray(bookSpells) && bookSpells.length > 0) {
                                    return `
                                        <div class="spell-level-group">
                                            <h5>Level ${level}</h5>
                                            ${bookSpells.map(spell => `
                                                <div class="spell-item">
                                                    <span class="spell-name">${spell.name || spell}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `;
                                }
                                return '';
                            }).join('') : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // If no spells at all
        if (html === '' || html.trim() === '') {
            html = '<div class="no-spells">No spells or magical abilities</div>';
        }
        
        return html;
    }

    getWeaponData(weaponName) {
        // Basic weapon data - in a real implementation, this would query the equipment packs
        const weaponDatabase = {
            'Light Mace': {
                description: 'A light mace is a one-handed simple melee weapon.',
                traits: ['Agile', 'Finesse', 'Shove'],
                damage: '1d4 B',
                bulk: 'L'
            },
            'Spear': {
                description: 'A spear is a two-handed simple melee weapon that can be thrown.',
                traits: ['Thrown 20 ft.'],
                damage: '1d6 P',
                bulk: '1'
            },
            'Longspear': {
                description: 'A longspear is a two-handed simple melee weapon with reach.',
                traits: ['Reach'],
                damage: '1d8 P',
                bulk: '2'
            },
            'Longbow': {
                description: 'A longbow is a two-handed martial ranged weapon.',
                traits: ['Deadly d10', 'Propulsive', 'Volley 30 ft.'],
                damage: '1d8 P',
                range: '100 ft.',
                bulk: '2'
            },
            'Shortsword': {
                description: 'A shortsword is a one-handed martial melee weapon.',
                traits: ['Agile', 'Finesse', 'Versatile S'],
                damage: '1d6 P',
                bulk: 'L'
            },
            'Rapier': {
                description: 'A rapier is a one-handed martial melee weapon.',
                traits: ['Deadly d8', 'Disarm', 'Finesse'],
                damage: '1d6 P',
                bulk: '1'
            }
        };

        return weaponDatabase[weaponName] || null;
    }

    getSpecialAbilityData(abilityName) {
        // Basic special ability data - in a real implementation, this would query the feats/abilities packs
        const abilityDatabase = {
            'Shield Block': {
                type: 'General Feat',
                description: 'You can snap your shield into place to deflect a blow. Requirements: You are wielding a shield.',
                traits: ['General'],
                prerequisites: 'None'
            },
            'Hefty Hauler': {
                type: 'Skill Feat',
                description: 'You can carry more than your frame implies. Increase your maximum and encumbered Bulk limits by 2.',
                traits: ['General', 'Skill'],
                prerequisites: 'Athletics trained'
            },
            'Toughness': {
                type: 'General Feat',
                description: 'You can withstand more punishment than most. Increase your maximum Hit Points by your level.',
                traits: ['General'],
                prerequisites: 'None'
            },
            'Natural Ambition': {
                type: 'Ancestry Feat',
                description: 'You were raised to be ambitious and always reach for the stars, leading you to progress quickly in your chosen field.',
                traits: ['Human'],
                prerequisites: 'Human'
            },
            'Shift Immanence': {
                type: 'Class Feature',
                description: 'You can shift between different divine emanations, changing your capabilities.',
                traits: ['Exemplar'],
                prerequisites: 'Exemplar class'
            }
        };

        return abilityDatabase[abilityName] || null;
    }

    initializeCharacterSheetTooltips() {
        const tooltipItems = document.querySelectorAll('.weapon-item[data-tooltip-content], .special-attack-item[data-tooltip-content]');
        
        tooltipItems.forEach(item => {
            let tooltip = null;
            
            item.addEventListener('mouseenter', (e) => {
                try {
                    const encodedData = e.target.closest('[data-tooltip-content]').getAttribute('data-tooltip-content');
                    const data = JSON.parse(decodeURIComponent(encodedData));
                    
                    // Create tooltip element
                    tooltip = document.createElement('div');
                    tooltip.className = 'character-tooltip';
                    
                    let content = `<div class="tooltip-header">`;
                    content += `<h4>${data.name}</h4>`;
                    content += `</div>`;
                    
                    if (data.type) {
                        content += `<div class="tooltip-type">${data.type}</div>`;
                    }
                    
                    if (data.attack) {
                        content += `<div class="tooltip-attack">${data.attack}</div>`;
                    }
                    
                    if (data.damage) {
                        content += `<div class="tooltip-damage">Damage: ${data.damage}</div>`;
                    }
                    
                    if (data.traits && data.traits.length > 0) {
                        content += `<div class="tooltip-traits">`;
                        content += `<strong>Traits:</strong> `;
                        content += data.traits.map(trait => `<span class="trait">${trait}</span>`).join(', ');
                        content += `</div>`;
                    }
                    
                    if (data.prerequisites && data.prerequisites !== 'None') {
                        content += `<div class="tooltip-prerequisites"><strong>Prerequisites:</strong> ${data.prerequisites}</div>`;
                    }
                    
                    if (data.description) {
                        content += `<div class="tooltip-description">${data.description}</div>`;
                    }
                    
                    tooltip.innerHTML = content;
                    document.body.appendChild(tooltip);
                    
                    // Position tooltip
                    const rect = e.target.closest('[data-tooltip-content]').getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.top - 10) + 'px';
                    
                } catch (err) {
                    console.error('Error creating character sheet tooltip:', err);
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

    exportCharacterSheet(characterId) {
        // For now, just trigger print dialog - PDF export would require additional libraries
        alert('Print functionality: Use Ctrl+P or Cmd+P to print/save as PDF.\n\nThe character sheet is optimized for printing and will automatically format for standard paper sizes.');
        window.print();
    }

    loadRules() {
        const container = document.querySelector('.rules-container');
        container.innerHTML = `
            <h2>Rules Reference</h2>
            <div class="rules-sections">
                <div class="rule-section">
                    <h3>Character Creation</h3>
                    <p>Guidelines for creating Pathfinder 2E characters.</p>
                    <ul>
                        <li>Choose an ancestry to determine your character's heritage</li>
                        <li>Select a background that represents your character's history</li>
                        <li>Pick a class that defines your character's role</li>
                        <li>Assign ability scores using the point-buy system</li>
                        <li>Calculate derived statistics and choose equipment</li>
                    </ul>
                </div>
                
                <div class="rule-section">
                    <h3>Ability Scores</h3>
                    <p>The six ability scores and their uses:</p>
                    <ul>
                        <li><strong>Strength:</strong> Physical power, melee attacks, carrying capacity</li>
                        <li><strong>Dexterity:</strong> Agility, ranged attacks, armor class, stealth</li>
                        <li><strong>Constitution:</strong> Health, hit points, fortitude saves</li>
                        <li><strong>Intelligence:</strong> Reasoning, knowledge, skill points</li>
                        <li><strong>Wisdom:</strong> Awareness, perception, will saves</li>
                        <li><strong>Charisma:</strong> Personality, leadership, social skills</li>
                    </ul>
                </div>
                
                <div class="rule-section">
                    <h3>Combat Basics</h3>
                    <p>Key concepts for Pathfinder 2E combat:</p>
                    <ul>
                        <li>Each round, you get 3 actions plus 1 reaction</li>
                        <li>Many activities use multiple actions</li>
                        <li>Critical hits occur when you beat DC by 10 or more</li>
                        <li>Critical failures occur when you fail DC by 10 or more</li>
                    </ul>
                </div>
            </div>
        `;
    }

    loadTools() {
        const container = document.querySelector('.tools-container');
        container.innerHTML = `
            <h2>Tools & Utilities</h2>
            <div class="tools-grid">
                <div class="tool-card">
                    <h3>Dice Roller</h3>
                    <p>Roll dice for various game situations.</p>
                    <div class="dice-roller">
                        <button class="btn btn-primary" onclick="app.rollDice(20)">d20</button>
                        <button class="btn btn-primary" onclick="app.rollDice(12)">d12</button>
                        <button class="btn btn-primary" onclick="app.rollDice(10)">d10</button>
                        <button class="btn btn-primary" onclick="app.rollDice(8)">d8</button>
                        <button class="btn btn-primary" onclick="app.rollDice(6)">d6</button>
                        <button class="btn btn-primary" onclick="app.rollDice(4)">d4</button>
                    </div>
                    <div id="dice-result" class="dice-result"></div>
                </div>
                
                <div class="tool-card">
                    <h3>Character Manager</h3>
                    <p>Manage your saved characters.</p>
                    <div class="character-manager">
                        <button class="btn btn-primary" onclick="app.showCharacterList()">View All Characters</button>
                        <button class="btn btn-secondary" onclick="app.exportAllCharacters()">Export All</button>
                        <button class="btn btn-danger" onclick="app.clearAllCharacters()">Clear All</button>
                    </div>
                </div>
                
                <div class="tool-card">
                    <h3>Quick Reference</h3>
                    <p>Quick access to common rules and tables.</p>
                    <div class="quick-reference">
                        <button class="btn btn-primary" onclick="app.showConditions()">Conditions</button>
                        <button class="btn btn-primary" onclick="app.showActions()">Actions</button>
                        <button class="btn btn-primary" onclick="app.showSkills()">Skills</button>
                    </div>
                </div>
            </div>
        `;
    }

    rollDice(sides) {
        const result = Math.floor(Math.random() * sides) + 1;
        const resultElement = document.getElementById('dice-result');
        resultElement.textContent = `d${sides}: ${result}`;
        resultElement.style.display = 'block';
    }

    showCharacterList() {
        const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
        if (savedCharacters.length === 0) {
            alert('No characters saved yet.');
            return;
        }

        const characterList = savedCharacters.map(char => 
            `${char.name} (Level ${char.level} ${char.class.name})`
        ).join('\n');
        
        alert(`Saved Characters:\n${characterList}`);
    }

    exportAllCharacters() {
        const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
        if (savedCharacters.length === 0) {
            alert('No characters to export.');
            return;
        }

        const dataStr = JSON.stringify(savedCharacters, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pf2e-characters.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    clearAllCharacters() {
        if (confirm('Are you sure you want to delete all characters? This cannot be undone.')) {
            localStorage.removeItem('pf2e-characters');
            alert('All characters deleted.');
            this.loadCharacterSheet();
        }
    }

    editCharacter(characterId) {
        alert('Character editing feature coming soon!');
    }

    exportCharacter(characterId) {
        const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
        const character = savedCharacters.find(char => char.id === characterId);
        
        if (!character) {
            alert('Character not found.');
            return;
        }

        const dataStr = JSON.stringify(character, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${character.name}-character.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    deleteCharacter(characterId) {
        if (confirm('Are you sure you want to delete this character?')) {
            const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
            const filteredCharacters = savedCharacters.filter(char => char.id !== characterId);
            localStorage.setItem('pf2e-characters', JSON.stringify(filteredCharacters));
            alert('Character deleted.');
            this.loadCharacterSheet();
        }
    }

    showConditions() {
        alert('Conditions reference coming soon!');
    }

    showActions() {
        alert('Actions reference coming soon!');
    }

    showSkills() {
        alert('Skills reference coming soon!');
    }

    async loadMonstersInBackground() {
        try {
            console.log('Loading monsters in background...');
            
            // Load monsters from the monster viewer system
            if (window.monsterViewer) {
                await window.monsterViewer.loadMonsters();
            }
            
            // Encounter generator uses monsters from monsterViewer, no separate loading needed
            
            console.log('Background monster loading complete');
        } catch (error) {
            console.error('Error loading monsters in background:', error);
        }
    }

    async loadMonstersEagerly() {
        try {
            console.log('Loading monsters eagerly at startup...');
            
            // Initialize monster viewer if not already done
            if (!window.monsterViewer && window.MonsterViewer) {
                window.monsterViewer = new MonsterViewer();
            }
            
            // Initialize encounter generator if not already done
            if (!window.encounterGenerator && window.EncounterGenerator) {
                window.encounterGenerator = new EncounterGenerator();
            }
            
            // Load monsters from the monster viewer system with high priority
            if (window.monsterViewer) {
                await window.monsterViewer.loadMonsters();
                console.log('Monster viewer data loaded');
            }
            
            // Encounter generator will access monsters from monsterViewer when needed
            console.log('Monster data ready for encounter generator');
            
            console.log('Eager monster loading complete - monsters ready for immediate use');
        } catch (error) {
            console.error('Error loading monsters eagerly:', error);
            // Fallback to background loading if eager loading fails
            this.loadMonstersInBackground();
        }
    }

    async loadCoreMonsters() {
        try {
            const response = await fetch('./monster-core-100.txt');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            // Parse the monster list - assuming format: "MonsterName (Level X)"
            const monsters = lines.map(line => {
                const match = line.match(/^(.+?)\s*\(.*?Level\s*(\d+).*?\)$/i);
                if (match) {
                    return {
                        name: match[1].trim(),
                        level: parseInt(match[2]),
                        source: 'Core 100'
                    };
                }
                return null;
            }).filter(monster => monster !== null);
            
            return monsters;
        } catch (error) {
            console.error('Error loading core monsters:', error);
            return [];
        }
    }

    initializeCampaignManager() {
        // Campaign manager is already initialized in its own file
        // But we can sync encounter generator with active campaigns
        if (window.campaignManager && window.encounterGenerator) {
            const currentCampaign = window.campaignManager.getCurrentCampaign();
            if (currentCampaign) {
                // Set encounter generator to use campaign party info
                const partyLevel = document.getElementById('party-level');
                const partySize = document.getElementById('party-size');
                
                if (partyLevel) partyLevel.value = currentCampaign.partyLevel;
                if (partySize) partySize.value = currentCampaign.partySize;
                
                // Update encounter generator display
                if (window.encounterGenerator.updateXPBudget) {
                    window.encounterGenerator.updateXPBudget();
                }
                
                console.log('Encounter generator synced with campaign:', currentCampaign.name);
            }
        }
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SuperMegaPF2EApp();
});