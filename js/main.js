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
        
        // Initialize character creator
        if (characterCreator) {
            characterCreator.loadStepData();
        }
        
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
                if (characterCreator) {
                    characterCreator.loadStepData();
                }
                break;
            case 'character-sheet':
                this.loadCharacterSheet();
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
        
        if (savedCharacters.length === 0) {
            container.innerHTML = `
                <h2>Character Sheet</h2>
                <div class="no-characters">
                    <p>No characters created yet.</p>
                    <button class="btn btn-primary" onclick="app.switchTab('character-creator')">Create Your First Character</button>
                </div>
            `;
        } else {
            const latestCharacter = savedCharacters[savedCharacters.length - 1];
            this.displayCharacterSheet(latestCharacter);
        }
    }

    displayCharacterSheet(character) {
        const container = document.querySelector('.character-sheet-container');
        container.innerHTML = `
            <h2>Character Sheet</h2>
            <div class="character-details">
                <div class="character-header">
                    <h3>${character.name}</h3>
                    <div class="character-basic-info">
                        <span class="character-level">Level ${character.level}</span>
                        <span class="character-class">${character.class.name}</span>
                    </div>
                </div>
                
                <div class="character-info-grid">
                    <div class="info-section">
                        <h4>Basic Information</h4>
                        <p><strong>Ancestry:</strong> ${character.ancestry.name}</p>
                        <p><strong>Background:</strong> ${character.background.name}</p>
                        <p><strong>Class:</strong> ${character.class.name}</p>
                        ${character.deity ? `<p><strong>Deity:</strong> ${character.deity}</p>` : ''}
                    </div>
                    
                    <div class="info-section">
                        <h4>Ability Scores</h4>
                        <div class="ability-scores-grid">
                            ${Object.entries(character.abilityScores).map(([ability, score]) => {
                                const modifier = Math.floor((score - 10) / 2);
                                const abilityName = {
                                    str: 'Strength',
                                    dex: 'Dexterity',
                                    con: 'Constitution',
                                    int: 'Intelligence',
                                    wis: 'Wisdom',
                                    cha: 'Charisma'
                                }[ability];
                                return `
                                    <div class="ability-display">
                                        <div class="ability-name">${abilityName}</div>
                                        <div class="ability-score">${score}</div>
                                        <div class="ability-modifier">${modifier >= 0 ? '+' : ''}${modifier}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="character-actions">
                    <button class="btn btn-primary" onclick="app.editCharacter('${character.id}')">Edit Character</button>
                    <button class="btn btn-secondary" onclick="app.exportCharacter('${character.id}')">Export Character</button>
                    <button class="btn btn-danger" onclick="app.deleteCharacter('${character.id}')">Delete Character</button>
                </div>
            </div>
        `;
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
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SuperMegaPF2EApp();
});