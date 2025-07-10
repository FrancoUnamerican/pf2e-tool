class CharacterCreator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.character = {
            name: '',
            ancestry: null,
            background: null,
            class: null,
            level: 1,
            deity: null,
            abilityScores: {
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10
            },
            pointsRemaining: 10
        };
        this.initializeEventListeners();
        this.loadAllData();
        this.clearEquipment();
    }

    initializeEventListeners() {
        // Character creation finish button
        document.getElementById('finish-character').addEventListener('click', () => this.finishCharacter());

        // Dropdown selections
        document.getElementById('ancestry-dropdown').addEventListener('change', (e) => {
            this.selectAncestry(e.target.value);
        });
        
        document.getElementById('background-dropdown').addEventListener('change', (e) => {
            this.selectBackground(e.target.value);
        });
        
        document.getElementById('class-dropdown').addEventListener('change', (e) => {
            this.selectClass(e.target.value);
        });

        // Ability score controls
        document.querySelectorAll('.score-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ability = e.target.dataset.ability;
                const action = e.target.dataset.action;
                this.modifyAbilityScore(ability, action);
            });
        });

        // Character name input
        document.getElementById('char-name').addEventListener('input', (e) => {
            this.character.name = e.target.value;
        });

        // Level selection
        document.getElementById('char-level').addEventListener('change', (e) => {
            this.character.level = parseInt(e.target.value);
        });

        // Deity selection
        document.getElementById('char-deity').addEventListener('change', (e) => {
            this.character.deity = e.target.value || null;
        });
    }
    
    async loadAllData() {
        try {
            // Wait for dataLoader to finish loading
            await dataLoader.loadAllData();
            
            // Populate dropdowns
            await this.populateDropdowns();
            
            console.log('Character creator data loaded successfully');
        } catch (error) {
            console.error('Error loading character creator data:', error);
            // Fallback to sample data
            dataLoader.createSampleData();
            await this.populateDropdowns();
        }
    }
    
    async populateDropdowns() {
        // Populate ancestry dropdown
        const ancestrySelect = document.getElementById('ancestry-dropdown');
        const ancestries = dataLoader.getAncestries();
        ancestrySelect.innerHTML = '<option value="">Select Ancestry</option>';
        ancestries.forEach(ancestry => {
            const option = document.createElement('option');
            option.value = ancestry.id;
            option.textContent = ancestry.name;
            ancestrySelect.appendChild(option);
        });
        
        // Populate background dropdown
        const backgroundSelect = document.getElementById('background-dropdown');
        const backgrounds = dataLoader.getBackgrounds();
        backgroundSelect.innerHTML = '<option value="">Select Background</option>';
        backgrounds.forEach(background => {
            const option = document.createElement('option');
            option.value = background.id;
            option.textContent = background.name;
            backgroundSelect.appendChild(option);
        });
        
        // Populate class dropdown
        const classSelect = document.getElementById('class-dropdown');
        const classes = dataLoader.getClasses();
        classSelect.innerHTML = '<option value="">Select Class</option>';
        classes.forEach(charClass => {
            const option = document.createElement('option');
            option.value = charClass.id;
            option.textContent = charClass.name;
            classSelect.appendChild(option);
        });
        
        // Populate deity dropdown
        const deitySelect = document.getElementById('char-deity');
        const deities = dataLoader.getDeities();
        deitySelect.innerHTML = '<option value="">None / Agnostic</option>';
        deities.forEach(deity => {
            const option = document.createElement('option');
            option.value = deity.id;
            option.textContent = `${deity.name} (${deity.alignment})`;
            deitySelect.appendChild(option);
        });
    }
    
    selectAncestry(ancestryId) {
        if (!ancestryId) {
            this.character.ancestry = null;
            document.getElementById('ancestry-info').style.display = 'none';
            return;
        }
        
        const ancestry = dataLoader.getAncestries().find(a => a.id === ancestryId);
        if (ancestry) {
            this.character.ancestry = ancestry;
            this.displayAncestryInfo(ancestry);
            this.applyAncestryModifiers(ancestry);
        }
    }
    
    selectBackground(backgroundId) {
        if (!backgroundId) {
            this.character.background = null;
            document.getElementById('background-info').style.display = 'none';
            return;
        }
        
        const background = dataLoader.getBackgrounds().find(b => b.id === backgroundId);
        if (background) {
            this.character.background = background;
            this.displayBackgroundInfo(background);
        }
    }
    
    selectClass(classId) {
        if (!classId) {
            this.character.class = null;
            document.getElementById('class-info').style.display = 'none';
            this.clearEquipment();
            return;
        }
        
        const charClass = dataLoader.getClasses().find(c => c.id === classId);
        if (charClass) {
            this.character.class = charClass;
            this.displayClassInfo(charClass);
            this.updateEquipment(charClass.name);
        }
    }
    
    displayAncestryInfo(ancestry) {
        const infoSection = document.getElementById('ancestry-info');
        const detailsDiv = infoSection.querySelector('.info-details');
        
        // Parse description with text parser if available
        let description = ancestry.description;
        if (window.pf2eTextParser && description) {
            description = window.pf2eTextParser.parseText(description);
        }
        
        detailsDiv.innerHTML = `
            <p><strong>Size:</strong> ${ancestry.size || 'Medium'}</p>
            <p><strong>Speed:</strong> ${ancestry.speed || 25} feet</p>
            <p><strong>Ability Boosts:</strong> ${ancestry.abilityBoosts.length ? ancestry.abilityBoosts.join(', ') : 'None'}</p>
            ${ancestry.abilityFlaws.length ? `<p><strong>Ability Flaws:</strong> ${ancestry.abilityFlaws.join(', ')}</p>` : ''}
            <p><strong>Languages:</strong> ${ancestry.languages.length ? ancestry.languages.join(', ') : 'None'}</p>
            <p><strong>Traits:</strong> ${ancestry.traits.length ? ancestry.traits.join(', ') : 'None'}</p>
            <div class="parsed-content">${description}</div>
        `;
        
        infoSection.style.display = 'block';
    }
    
    displayBackgroundInfo(background) {
        const infoSection = document.getElementById('background-info');
        const detailsDiv = infoSection.querySelector('.info-details');
        
        // Parse description with text parser if available
        let description = background.description;
        if (window.pf2eTextParser && description) {
            description = window.pf2eTextParser.parseText(description);
        }
        
        detailsDiv.innerHTML = `
            <p><strong>Ability Boosts:</strong> ${background.abilityBoosts.length ? background.abilityBoosts.join(', ') : 'None'}</p>
            <p><strong>Skills:</strong> ${background.skills ? background.skills.join(', ') : 'None'}</p>
            <p><strong>Traits:</strong> ${background.traits.length ? background.traits.join(', ') : 'None'}</p>
            <div class="parsed-content">${description}</div>
        `;
        
        infoSection.style.display = 'block';
    }
    
    displayClassInfo(charClass) {
        const infoSection = document.getElementById('class-info');
        const detailsDiv = infoSection.querySelector('.info-details');
        
        // Parse description with text parser if available
        let description = charClass.description;
        if (window.pf2eTextParser && description) {
            description = window.pf2eTextParser.parseText(description);
        }
        
        detailsDiv.innerHTML = `
            <p><strong>Key Ability:</strong> ${Array.isArray(charClass.keyAbility) ? charClass.keyAbility.join(' or ') : (charClass.keyAbility || 'None')}</p>
            <p><strong>Hit Points:</strong> ${charClass.hitPoints || 8} + Con modifier</p>
            <p><strong>Skills:</strong> ${Array.isArray(charClass.skills) ? charClass.skills.join(', ') : (charClass.skills || 'None')}</p>
            <p><strong>Traits:</strong> ${charClass.traits.length ? charClass.traits.join(', ') : 'None'}</p>
            <div class="parsed-content">${description}</div>
        `;
        
        infoSection.style.display = 'block';
    }

    applyAncestryModifiers(ancestry) {
        // Reset ability scores to base
        this.character.abilityScores = {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
        };

        // Apply boosts
        if (ancestry.abilityBoosts) {
            ancestry.abilityBoosts.forEach(boost => {
                if (boost !== 'Free') {
                    const ability = this.getAbilityKey(boost);
                    if (ability) {
                        this.character.abilityScores[ability] += 2;
                    }
                }
            });
        }

        // Apply flaws
        if (ancestry.abilityFlaws) {
            ancestry.abilityFlaws.forEach(flaw => {
                const ability = this.getAbilityKey(flaw);
                if (ability) {
                    this.character.abilityScores[ability] -= 2;
                }
            });
        }

        this.updateAbilityScores();
    }

    getAbilityKey(abilityName) {
        const mapping = {
            'Strength': 'str',
            'Dexterity': 'dex',
            'Constitution': 'con',
            'Intelligence': 'int',
            'Wisdom': 'wis',
            'Charisma': 'cha'
        };
        return mapping[abilityName];
    }

    modifyAbilityScore(ability, action) {
        const current = this.character.abilityScores[ability];
        const cost = current >= 18 ? 2 : 1;

        if (action === 'increase') {
            if (current < 18 && this.character.pointsRemaining >= cost) {
                this.character.abilityScores[ability] += 2;
                this.character.pointsRemaining -= cost;
            }
        } else if (action === 'decrease') {
            if (current > 8) {
                const refund = current > 18 ? 2 : 1;
                this.character.abilityScores[ability] -= 2;
                this.character.pointsRemaining += refund;
            }
        }

        this.updateAbilityScores();
    }

    updateAbilityScores() {
        Object.keys(this.character.abilityScores).forEach(ability => {
            const score = this.character.abilityScores[ability];
            const modifier = Math.floor((score - 10) / 2);
            
            const scoreElement = document.getElementById(`${ability}-score`);
            const modifierElement = document.getElementById(`${ability}-modifier`);
            
            if (scoreElement) scoreElement.textContent = score;
            if (modifierElement) modifierElement.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        });

        // Update button states
        document.querySelectorAll('.score-btn').forEach(btn => {
            const ability = btn.dataset.ability;
            const action = btn.dataset.action;
            const current = this.character.abilityScores[ability];
            const cost = current >= 18 ? 2 : 1;

            if (action === 'increase') {
                btn.disabled = current >= 18 || this.character.pointsRemaining < cost;
            } else {
                btn.disabled = current <= 8;
            }
        });

        // Update points remaining display
        const pointsElement = document.getElementById('points-remaining');
        if (pointsElement) {
            pointsElement.textContent = this.character.pointsRemaining;
        }
    }

    updateSummary() {
        // Character summary has been removed from the character creator
        // Summary is now handled by the character sheet tab
    }

    finishCharacter() {
        // Validate character creation
        if (!this.character.name || !this.character.ancestry || !this.character.background || !this.character.class) {
            alert('Please complete all required character selections.');
            return;
        }

        // Show character sheet tab
        document.querySelector('[data-tab="character-sheet"]').click();
        
        // Populate character sheet with created character
        this.populateCharacterSheet();
        
        console.log('Character created:', this.character);
    }

    populateCharacterSheet() {
        // This would populate the character sheet with the created character data
        // Implementation depends on the character sheet structure
        console.log('Populating character sheet with:', this.character);
    }

    updateEquipment(className) {
        if (!className || !window.EquipmentData) return;
        
        const equipment = window.EquipmentData.getStarterEquipment(className);
        
        // Update weapons
        const weaponList = document.getElementById('weapon-list');
        if (weaponList && equipment.weapons) {
            weaponList.innerHTML = equipment.weapons.map(weapon => `
                <div class="equipment-item">
                    <div class="equipment-name">${weapon.name}</div>
                    <div class="equipment-stats">
                        <span class="equipment-damage">${weapon.damage}</span>
                        <span class="equipment-category">${weapon.category}</span>
                    </div>
                    <div class="equipment-traits">
                        ${weapon.traits.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        // Update armor
        const armorList = document.getElementById('armor-list');
        if (armorList && equipment.armor) {
            armorList.innerHTML = equipment.armor.map(armor => `
                <div class="equipment-item">
                    <div class="equipment-name">${armor.name}</div>
                    <div class="equipment-stats">
                        <span class="equipment-ac">AC ${armor.ac}</span>
                        <span class="equipment-category">${armor.category}</span>
                    </div>
                    <div class="equipment-details">
                        <span>Dex Cap: ${armor.dexCap}</span>
                        <span>Check: ${armor.checkPenalty}</span>
                        <span>Speed: ${armor.speedPenalty}</span>
                    </div>
                </div>
            `).join('');
        }
        
        // Update tools
        const toolsList = document.getElementById('tools-list');
        if (toolsList && equipment.tools) {
            toolsList.innerHTML = equipment.tools.map(tool => `
                <div class="equipment-item">
                    <div class="equipment-name">${tool.name}</div>
                    <div class="equipment-category">${tool.category}</div>
                    <div class="equipment-description">${tool.description}</div>
                </div>
            `).join('');
        }
    }

    clearEquipment() {
        const weaponList = document.getElementById('weapon-list');
        const armorList = document.getElementById('armor-list');
        const toolsList = document.getElementById('tools-list');
        
        if (weaponList) weaponList.innerHTML = '<p>Select a class to see available weapons.</p>';
        if (armorList) armorList.innerHTML = '<p>Select a class to see available armor.</p>';
        if (toolsList) toolsList.innerHTML = '<p>Select a class to see available tools.</p>';
    }
}

// Initialize character creator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.characterCreator = new CharacterCreator();
});