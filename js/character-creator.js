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
    }

    initializeEventListeners() {
        // Step navigation
        document.getElementById('next-step').addEventListener('click', () => this.nextStep());
        document.getElementById('prev-step').addEventListener('click', () => this.prevStep());
        document.getElementById('finish-character').addEventListener('click', () => this.finishCharacter());

        // Step buttons
        document.querySelectorAll('.step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNum = parseInt(step.dataset.step);
                this.goToStep(stepNum);
            });
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
            this.updateSummary();
        });

        // Level selection
        document.getElementById('char-level').addEventListener('change', (e) => {
            this.character.level = parseInt(e.target.value);
            this.updateSummary();
        });

        // Deity selection
        document.getElementById('char-deity').addEventListener('change', (e) => {
            this.character.deity = e.target.value || null;
            this.updateSummary();
        });
    }

    async loadStepData() {
        switch (this.currentStep) {
            case 1:
                await this.loadAncestries();
                break;
            case 2:
                await this.loadBackgrounds();
                break;
            case 3:
                await this.loadClasses();
                break;
            case 4:
                await this.loadDeities();
                break;
            case 5:
                this.updateAbilityScores();
                break;
        }
    }

    async loadAncestries() {
        const grid = document.getElementById('ancestry-grid');
        const ancestries = dataLoader.getAncestries();
        
        if (ancestries.length === 0) {
            dataLoader.createSampleData();
        }

        const ancestryList = dataLoader.getAncestries();
        grid.innerHTML = '';

        ancestryList.forEach(ancestry => {
            const card = this.createSelectionCard(ancestry, 'ancestry');
            grid.appendChild(card);
        });
    }

    async loadBackgrounds() {
        const grid = document.getElementById('background-grid');
        const backgrounds = dataLoader.getBackgrounds();
        
        if (backgrounds.length === 0) {
            dataLoader.createSampleData();
        }

        const backgroundList = dataLoader.getBackgrounds();
        grid.innerHTML = '';

        backgroundList.forEach(background => {
            const card = this.createSelectionCard(background, 'background');
            grid.appendChild(card);
        });
    }

    async loadClasses() {
        const grid = document.getElementById('class-grid');
        const classes = dataLoader.getClasses();
        
        if (classes.length === 0) {
            dataLoader.createSampleData();
        }

        const classList = dataLoader.getClasses();
        grid.innerHTML = '';

        classList.forEach(charClass => {
            const card = this.createSelectionCard(charClass, 'class');
            grid.appendChild(card);
        });
    }

    async loadDeities() {
        const select = document.getElementById('char-deity');
        const deities = dataLoader.getDeities();
        
        if (deities.length === 0) {
            dataLoader.createSampleData();
        }

        const deityList = dataLoader.getDeities();
        
        // Clear existing options (except "None")
        select.innerHTML = '<option value="">None</option>';

        deityList.forEach(deity => {
            const option = document.createElement('option');
            option.value = deity.name;
            option.textContent = `${deity.name} (${deity.alignment})`;
            select.appendChild(option);
        });
    }

    createSelectionCard(item, type) {
        const card = document.createElement('div');
        card.className = 'selection-card';
        card.dataset.type = type;
        card.dataset.name = item.name;

        let traits = '';
        if (item.traits) {
            traits = `<div class="traits">${item.traits.map(trait => `<span class="trait">${trait}</span>`).join('')}</div>`;
        }

        let additionalInfo = '';
        if (type === 'ancestry') {
            additionalInfo = `
                <p><strong>Size:</strong> ${item.size || 'Medium'}</p>
                <p><strong>Speed:</strong> ${item.speed || 25} feet</p>
                <p><strong>Ability Boosts:</strong> ${item.abilityBoosts ? item.abilityBoosts.join(', ') : 'None'}</p>
                ${item.abilityFlaws && item.abilityFlaws.length > 0 ? `<p><strong>Ability Flaws:</strong> ${item.abilityFlaws.join(', ')}</p>` : ''}
            `;
        } else if (type === 'background') {
            additionalInfo = `
                <p><strong>Ability Boosts:</strong> ${item.abilityBoosts ? item.abilityBoosts.join(', ') : 'None'}</p>
                <p><strong>Skills:</strong> ${item.skills ? item.skills.join(', ') : 'None'}</p>
            `;
        } else if (type === 'class') {
            additionalInfo = `
                <p><strong>Key Ability:</strong> ${item.keyAbility}</p>
                <p><strong>Hit Points:</strong> ${item.hitPoints} + Con modifier</p>
                <p><strong>Skills:</strong> ${item.skills}</p>
            `;
        }

        card.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            ${additionalInfo}
            ${traits}
        `;

        card.addEventListener('click', () => this.selectItem(item, type, card));

        return card;
    }

    selectItem(item, type, cardElement) {
        // Remove previous selection
        document.querySelectorAll(`.selection-card[data-type="${type}"]`).forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        cardElement.classList.add('selected');

        // Update character data
        this.character[type] = item;
        this.updateSummary();

        // Apply ability score modifiers if ancestry
        if (type === 'ancestry') {
            this.applyAncestryModifiers(item);
        }
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
            
            document.getElementById(`${ability}-score`).textContent = score;
            document.getElementById(`${ability}-modifier`).textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
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
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepDisplay();
            this.loadStepData();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.loadStepData();
        }
    }

    goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
            this.currentStep = stepNum;
            this.updateStepDisplay();
            this.loadStepData();
        }
    }

    updateStepDisplay() {
        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === this.currentStep);
        });

        // Update step content
        document.querySelectorAll('.creation-step').forEach(step => {
            const stepNum = parseInt(step.id.split('-')[1]);
            step.classList.toggle('active', stepNum === this.currentStep);
        });

        // Update button states
        document.getElementById('prev-step').disabled = this.currentStep === 1;
        document.getElementById('next-step').style.display = this.currentStep === this.totalSteps ? 'none' : 'inline-block';
        document.getElementById('finish-character').style.display = this.currentStep === this.totalSteps ? 'inline-block' : 'none';
    }

    updateSummary() {
        document.getElementById('summary-name').textContent = this.character.name || '-';
        document.getElementById('summary-ancestry').textContent = this.character.ancestry ? this.character.ancestry.name : '-';
        document.getElementById('summary-background').textContent = this.character.background ? this.character.background.name : '-';
        document.getElementById('summary-class').textContent = this.character.class ? this.character.class.name : '-';
        document.getElementById('summary-level').textContent = this.character.level;
    }

    finishCharacter() {
        // Validate character is complete
        if (!this.character.name) {
            alert('Please enter a character name.');
            return;
        }

        if (!this.character.ancestry) {
            alert('Please select an ancestry.');
            return;
        }

        if (!this.character.background) {
            alert('Please select a background.');
            return;
        }

        if (!this.character.class) {
            alert('Please select a class.');
            return;
        }

        // Save character data
        this.saveCharacter();
        
        // Switch to character sheet tab
        this.switchToCharacterSheet();
    }

    saveCharacter() {
        const characterData = {
            ...this.character,
            dateCreated: new Date().toISOString(),
            id: Date.now().toString()
        };

        // Save to localStorage
        const savedCharacters = JSON.parse(localStorage.getItem('pf2e-characters') || '[]');
        savedCharacters.push(characterData);
        localStorage.setItem('pf2e-characters', JSON.stringify(savedCharacters));

        console.log('Character saved:', characterData);
    }

    switchToCharacterSheet() {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show character sheet tab
        document.getElementById('character-sheet').classList.add('active');

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-tab="character-sheet"]').classList.add('active');

        // Display character data in character sheet
        this.displayCharacterSheet();
    }

    displayCharacterSheet() {
        const container = document.querySelector('.character-sheet-container');
        container.innerHTML = `
            <h2>Character Sheet</h2>
            <div class="character-details">
                <h3>${this.character.name}</h3>
                <p><strong>Ancestry:</strong> ${this.character.ancestry.name}</p>
                <p><strong>Background:</strong> ${this.character.background.name}</p>
                <p><strong>Class:</strong> ${this.character.class.name}</p>
                <p><strong>Level:</strong> ${this.character.level}</p>
                ${this.character.deity ? `<p><strong>Deity:</strong> ${this.character.deity}</p>` : ''}
                
                <h4>Ability Scores</h4>
                <div class="ability-scores-display">
                    ${Object.entries(this.character.abilityScores).map(([ability, score]) => {
                        const modifier = Math.floor((score - 10) / 2);
                        const abilityName = {
                            str: 'Strength',
                            dex: 'Dexterity',
                            con: 'Constitution',
                            int: 'Intelligence',
                            wis: 'Wisdom',
                            cha: 'Charisma'
                        }[ability];
                        return `<p><strong>${abilityName}:</strong> ${score} (${modifier >= 0 ? '+' : ''}${modifier})</p>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize character creator when DOM is loaded
let characterCreator;
document.addEventListener('DOMContentLoaded', () => {
    characterCreator = new CharacterCreator();
});