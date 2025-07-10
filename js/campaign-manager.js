class CampaignManager {
    constructor() {
        this.campaigns = [];
        this.currentCampaign = null;
        this.storageKey = 'pf2e-campaigns';
        this.currentCampaignKey = 'pf2e-current-campaign';
        
        this.initializeEventListeners();
        this.loadCampaigns();
        this.initializeUI();
    }

    initializeEventListeners() {
        // Campaign creation and management
        document.getElementById('new-campaign-btn').addEventListener('click', () => {
            this.showCreateCampaignModal();
        });

        document.getElementById('create-first-campaign-btn').addEventListener('click', () => {
            this.showCreateCampaignModal();
        });

        document.getElementById('campaign-selector').addEventListener('change', (e) => {
            this.switchCampaign(e.target.value);
        });

        // Campaign tab navigation
        document.querySelectorAll('.campaign-tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchCampaignTab(e.target.dataset.tab);
            });
        });

        // Settings
        document.getElementById('save-campaign-btn').addEventListener('click', () => {
            this.saveCampaignSettings();
        });

        document.getElementById('export-campaign-btn').addEventListener('click', () => {
            this.exportCampaign();
        });

        document.getElementById('import-campaign-btn').addEventListener('click', () => {
            this.importCampaign();
        });

        document.getElementById('delete-campaign-btn').addEventListener('click', () => {
            this.deleteCampaign();
        });

        // Character loading
        document.getElementById('character-json-upload').addEventListener('change', (e) => {
            this.loadCharacterFiles(e.target.files);
        });

        // Search and filter
        document.getElementById('encounter-search').addEventListener('input', () => {
            this.filterEncounters();
        });

        document.getElementById('encounter-filter').addEventListener('change', () => {
            this.filterEncounters();
        });

        document.getElementById('loot-search').addEventListener('input', () => {
            this.filterLoot();
        });

        document.getElementById('loot-filter').addEventListener('change', () => {
            this.filterLoot();
        });
    }

    // Data Models
    createCampaign(name, partyLevel = 1, partySize = 4, notes = '', partyRoles = []) {
        const campaign = {
            id: this.generateId(),
            name: name,
            createdDate: new Date().toISOString(),
            partyLevel: partyLevel,
            partySize: partySize,
            notes: notes,
            partyRoles: partyRoles,
            encounters: [],
            loot: [],
            characters: []
        };

        this.campaigns.push(campaign);
        this.saveCampaigns();
        return campaign;
    }

    createEncounterRecord(monsters, difficulty, totalXP, terrain, partyLevel, notes = '') {
        return {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            monsters: monsters.map(m => ({
                name: m.monster.name,
                level: m.monster.system?.details?.level?.value || m.monster.level || 1,
                count: m.count,
                xp: m.xp
            })),
            difficulty: difficulty,
            totalXP: totalXP,
            terrain: terrain,
            partyLevel: partyLevel,
            notes: notes
        };
    }

    createLootRecord(items, totalValue, partyLevel, occasion = 'encounter', notes = '') {
        return {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            items: items,
            totalValue: totalValue,
            partyLevel: partyLevel,
            occasion: occasion,
            notes: notes
        };
    }

    // Storage Management
    loadCampaigns() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.campaigns = stored ? JSON.parse(stored) : [];
            
            const currentId = localStorage.getItem(this.currentCampaignKey);
            if (currentId) {
                this.currentCampaign = this.campaigns.find(c => c.id === currentId);
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.campaigns = [];
            this.currentCampaign = null;
        }
    }

    saveCampaigns() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.campaigns));
            if (this.currentCampaign) {
                localStorage.setItem(this.currentCampaignKey, this.currentCampaign.id);
            }
        } catch (error) {
            console.error('Error saving campaigns:', error);
        }
    }

    // Campaign Management
    switchCampaign(campaignId) {
        if (!campaignId) {
            this.currentCampaign = null;
            this.updateUI();
            return;
        }

        this.currentCampaign = this.campaigns.find(c => c.id === campaignId);
        this.saveCampaigns();
        this.updateUI();
    }

    addEncounter(monsters, difficulty, totalXP, terrain, partyLevel, notes = '') {
        if (!this.currentCampaign) return;

        const encounter = this.createEncounterRecord(monsters, difficulty, totalXP, terrain, partyLevel, notes);
        this.currentCampaign.encounters.push(encounter);
        this.saveCampaigns();
        this.updateUI();
        
        console.log('📝 Encounter added to campaign:', encounter);
    }

    addLoot(items, totalValue, partyLevel, occasion = 'encounter', notes = '') {
        if (!this.currentCampaign) return;

        const loot = this.createLootRecord(items, totalValue, partyLevel, occasion, notes);
        this.currentCampaign.loot.push(loot);
        this.saveCampaigns();
        this.updateUI();
        
        console.log('💰 Loot added to campaign:', loot);
    }

    // UI Management
    initializeUI() {
        this.populateCampaignSelector();
        this.updateUI();
    }

    populateCampaignSelector() {
        const selector = document.getElementById('campaign-selector');
        selector.innerHTML = '<option value="">No Campaign Selected</option>';
        
        this.campaigns.forEach(campaign => {
            const option = document.createElement('option');
            option.value = campaign.id;
            option.textContent = campaign.name;
            if (this.currentCampaign && campaign.id === this.currentCampaign.id) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    updateUI() {
        const noCampaignMessage = document.getElementById('no-campaign-message');
        const campaignDashboard = document.getElementById('campaign-dashboard');

        if (!this.currentCampaign) {
            noCampaignMessage.style.display = 'block';
            campaignDashboard.style.display = 'none';
            return;
        }

        noCampaignMessage.style.display = 'none';
        campaignDashboard.style.display = 'block';

        // Update campaign info
        document.getElementById('campaign-title').textContent = this.currentCampaign.name;
        document.getElementById('party-level-display').textContent = this.currentCampaign.partyLevel;
        document.getElementById('party-size-display').textContent = this.currentCampaign.partySize;
        document.getElementById('encounter-count').textContent = this.currentCampaign.encounters.length;
        
        const totalLootValue = this.currentCampaign.loot.reduce((sum, loot) => sum + (loot.totalValue || 0), 0);
        document.getElementById('total-loot-value').textContent = `${totalLootValue.toLocaleString()} gp`;

        // Update settings form
        document.getElementById('campaign-name-edit').value = this.currentCampaign.name;
        document.getElementById('campaign-party-level').value = this.currentCampaign.partyLevel;
        document.getElementById('campaign-party-size').value = this.currentCampaign.partySize;
        document.getElementById('campaign-notes').value = this.currentCampaign.notes || '';
        
        // Load party roles
        const partyRoles = this.currentCampaign.partyRoles || [];
        document.querySelectorAll('input[name="party-roles"]').forEach(checkbox => {
            checkbox.checked = partyRoles.includes(checkbox.value);
        });

        // Update history displays
        this.updateEncounterHistory();
        this.updateLootHistory();
        this.updateAnalytics();
    }

    updateEncounterHistory() {
        const container = document.getElementById('encounter-history');
        
        if (this.currentCampaign.encounters.length === 0) {
            container.innerHTML = '<div class="no-data">No encounters recorded yet.</div>';
            return;
        }

        const encountersHtml = this.currentCampaign.encounters
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(encounter => {
                const date = new Date(encounter.timestamp).toLocaleDateString();
                const time = new Date(encounter.timestamp).toLocaleTimeString();
                const monstersText = encounter.monsters.map(m => 
                    `${m.name}${m.count > 1 ? ` (×${m.count})` : ''}`
                ).join(', ');

                return `
                    <div class="history-item encounter-item">
                        <div class="history-header">
                            <span class="history-title">${monstersText}</span>
                            <span class="history-date">${date} ${time}</span>
                        </div>
                        <div class="history-details">
                            <div class="detail-row">
                                <span class="detail-label">Difficulty:</span>
                                <span class="difficulty-badge ${encounter.difficulty}">${encounter.difficulty}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total XP:</span>
                                <span class="detail-value">${encounter.totalXP} XP</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Terrain:</span>
                                <span class="detail-value">${encounter.terrain}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Party Level:</span>
                                <span class="detail-value">${encounter.partyLevel}</span>
                            </div>
                            ${encounter.notes ? `<div class="detail-row">
                                <span class="detail-label">Notes:</span>
                                <span class="detail-value">${encounter.notes}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = encountersHtml;
    }

    updateLootHistory() {
        const container = document.getElementById('loot-history');
        
        if (this.currentCampaign.loot.length === 0) {
            container.innerHTML = '<div class="no-data">No loot recorded yet.</div>';
            return;
        }

        const lootHtml = this.currentCampaign.loot
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(loot => {
                const date = new Date(loot.timestamp).toLocaleDateString();
                const time = new Date(loot.timestamp).toLocaleTimeString();
                const itemsText = Array.isArray(loot.items) ? 
                    loot.items.map(item => {
                        if (typeof item === 'string') return item;
                        if (typeof item === 'object' && item !== null) {
                            // Handle various possible object formats
                            return item.item_name || item.name || item.title || item.displayName || 
                                   (item.value ? `${item.value} gp` : '') || '[Unknown Item]';
                        }
                        return String(item);
                    }).join(', ') : 
                    'Various items';

                return `
                    <div class="history-item loot-item">
                        <div class="history-header">
                            <span class="history-title">${itemsText}</span>
                            <span class="history-date">${date} ${time}</span>
                        </div>
                        <div class="history-details">
                            <div class="detail-row">
                                <span class="detail-label">Total Value:</span>
                                <span class="detail-value">${loot.totalValue.toLocaleString()} gp</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Occasion:</span>
                                <span class="detail-value">${loot.occasion}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Party Level:</span>
                                <span class="detail-value">${loot.partyLevel}</span>
                            </div>
                            ${loot.notes ? `<div class="detail-row">
                                <span class="detail-label">Notes:</span>
                                <span class="detail-value">${loot.notes}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = lootHtml;
    }

    updateAnalytics() {
        if (!this.currentCampaign) return;

        this.updateDifficultyChart();
        this.updateWealthChart();
        this.updateMonsterUsage();
        this.updateTerrainUsage();
    }

    updateDifficultyChart() {
        const container = document.getElementById('difficulty-chart');
        const encounters = this.currentCampaign.encounters;
        
        if (encounters.length === 0) {
            container.innerHTML = '<div class="no-data">No encounters to analyze.</div>';
            return;
        }

        const difficulties = encounters.reduce((acc, encounter) => {
            acc[encounter.difficulty] = (acc[encounter.difficulty] || 0) + 1;
            return acc;
        }, {});

        const chartHtml = Object.entries(difficulties)
            .map(([difficulty, count]) => {
                const percentage = (count / encounters.length * 100).toFixed(1);
                return `
                    <div class="chart-bar">
                        <div class="chart-label">${difficulty}</div>
                        <div class="chart-progress">
                            <div class="chart-fill ${difficulty}" style="width: ${percentage}%"></div>
                        </div>
                        <div class="chart-value">${count} (${percentage}%)</div>
                    </div>
                `;
            }).join('');

        container.innerHTML = chartHtml;
    }

    updateWealthChart() {
        const container = document.getElementById('wealth-chart');
        const loot = this.currentCampaign.loot;
        
        if (loot.length === 0) {
            container.innerHTML = '<div class="no-data">No loot to analyze.</div>';
            return;
        }

        const totalWealth = loot.reduce((sum, l) => sum + (l.totalValue || 0), 0);
        const averageByLevel = loot.reduce((acc, l) => {
            if (!acc[l.partyLevel]) acc[l.partyLevel] = { total: 0, count: 0 };
            acc[l.partyLevel].total += l.totalValue || 0;
            acc[l.partyLevel].count += 1;
            return acc;
        }, {});

        const chartHtml = Object.entries(averageByLevel)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, data]) => {
                const average = (data.total / data.count).toFixed(0);
                return `
                    <div class="chart-item">
                        <div class="chart-label">Level ${level}</div>
                        <div class="chart-value">${average} gp avg</div>
                    </div>
                `;
            }).join('');

        container.innerHTML = `
            <div class="wealth-summary">
                <div class="wealth-total">Total: ${totalWealth.toLocaleString()} gp</div>
            </div>
            <div class="wealth-breakdown">${chartHtml}</div>
        `;
    }

    updateMonsterUsage() {
        const container = document.getElementById('monster-usage');
        const encounters = this.currentCampaign.encounters;
        
        if (encounters.length === 0) {
            container.innerHTML = '<div class="no-data">No encounters to analyze.</div>';
            return;
        }

        const monsterCounts = encounters.reduce((acc, encounter) => {
            encounter.monsters.forEach(monster => {
                acc[monster.name] = (acc[monster.name] || 0) + monster.count;
            });
            return acc;
        }, {});

        const topMonsters = Object.entries(monsterCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        const chartHtml = topMonsters.map(([name, count]) => `
            <div class="chart-item">
                <div class="chart-label">${name}</div>
                <div class="chart-value">${count} times</div>
            </div>
        `).join('');

        container.innerHTML = chartHtml || '<div class="no-data">No monster data available.</div>';
    }

    updateTerrainUsage() {
        const container = document.getElementById('terrain-usage');
        const encounters = this.currentCampaign.encounters;
        
        if (encounters.length === 0) {
            container.innerHTML = '<div class="no-data">No encounters to analyze.</div>';
            return;
        }

        const terrainCounts = encounters.reduce((acc, encounter) => {
            acc[encounter.terrain] = (acc[encounter.terrain] || 0) + 1;
            return acc;
        }, {});

        const chartHtml = Object.entries(terrainCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([terrain, count]) => {
                const percentage = (count / encounters.length * 100).toFixed(1);
                return `
                    <div class="chart-item">
                        <div class="chart-label">${terrain}</div>
                        <div class="chart-value">${count} (${percentage}%)</div>
                    </div>
                `;
            }).join('');

        container.innerHTML = chartHtml;
    }

    // Modal and Form Management
    showCreateCampaignModal() {
        const name = prompt('Enter campaign name:');
        if (!name) return;

        const partyLevel = parseInt(prompt('Enter party level (1-20):', '1')) || 1;
        const partySize = parseInt(prompt('Enter party size (1-8):', '4')) || 4;

        const campaign = this.createCampaign(name, partyLevel, partySize);
        this.currentCampaign = campaign;
        this.populateCampaignSelector();
        this.updateUI();
    }

    switchCampaignTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.campaign-tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.campaign-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    saveCampaignSettings() {
        if (!this.currentCampaign) return;

        this.currentCampaign.name = document.getElementById('campaign-name-edit').value;
        this.currentCampaign.partyLevel = parseInt(document.getElementById('campaign-party-level').value);
        this.currentCampaign.partySize = parseInt(document.getElementById('campaign-party-size').value);
        this.currentCampaign.notes = document.getElementById('campaign-notes').value;
        
        // Save party roles
        const partyRoleCheckboxes = document.querySelectorAll('input[name="party-roles"]:checked');
        this.currentCampaign.partyRoles = Array.from(partyRoleCheckboxes).map(cb => cb.value);

        this.saveCampaigns();
        this.populateCampaignSelector();
        this.updateUI();
        
        alert('Campaign settings saved!');
    }

    exportCampaign() {
        if (!this.currentCampaign) return;

        const dataStr = JSON.stringify(this.currentCampaign, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${this.currentCampaign.name}_campaign.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importCampaign() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const campaign = JSON.parse(e.target.result);
                    campaign.id = this.generateId(); // Generate new ID to avoid conflicts
                    this.campaigns.push(campaign);
                    this.saveCampaigns();
                    this.populateCampaignSelector();
                    alert('Campaign imported successfully!');
                } catch (error) {
                    alert('Error importing campaign: Invalid file format');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    deleteCampaign() {
        if (!this.currentCampaign) return;

        if (confirm(`Are you sure you want to delete the campaign "${this.currentCampaign.name}"? This cannot be undone.`)) {
            this.campaigns = this.campaigns.filter(c => c.id !== this.currentCampaign.id);
            this.currentCampaign = null;
            this.saveCampaigns();
            this.populateCampaignSelector();
            this.updateUI();
        }
    }

    // Filter Functions
    filterEncounters() {
        const searchTerm = document.getElementById('encounter-search').value.toLowerCase();
        const difficultyFilter = document.getElementById('encounter-filter').value;
        
        // This would filter the displayed encounters
        // Implementation would depend on how we want to handle filtering
        this.updateEncounterHistory();
    }

    filterLoot() {
        const searchTerm = document.getElementById('loot-search').value.toLowerCase();
        const typeFilter = document.getElementById('loot-filter').value;
        
        // This would filter the displayed loot
        // Implementation would depend on how we want to handle filtering
        this.updateLootHistory();
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public API for other modules
    getCurrentCampaign() {
        return this.currentCampaign;
    }

    hasActiveCampaign() {
        return this.currentCampaign !== null;
    }

    // Character Management
    async loadCharacterFiles(files) {
        if (!this.currentCampaign) {
            alert('Please create or select a campaign first before loading characters.');
            return;
        }

        // Ensure characters array exists
        if (!this.currentCampaign.characters) {
            this.currentCampaign.characters = [];
            console.log('Initialized empty characters array for campaign');
        }

        console.log('Current campaign:', this.currentCampaign.name);
        console.log('Characters array initialized:', Array.isArray(this.currentCampaign.characters));

        for (const file of files) {
            try {
                console.log(`Starting to load file: ${file.name} (${file.size} bytes)`);
                
                const text = await this.readFileAsText(file);
                console.log(`File read successfully, text length: ${text.length}`);
                console.log('First 200 characters:', text.substring(0, 200));
                
                const characterData = JSON.parse(text);
                console.log('JSON parsed successfully');
                
                const processedCharacter = this.processCharacterData(characterData, file.name);
                console.log('Character data processed successfully');
                
                // Check if character already exists
                const existingIndex = this.currentCampaign.characters.findIndex(c => c.name === processedCharacter.name);
                if (existingIndex >= 0) {
                    // Update existing character
                    this.currentCampaign.characters[existingIndex] = processedCharacter;
                    console.log(`Updated character: ${processedCharacter.name}`);
                } else {
                    // Add new character
                    this.currentCampaign.characters.push(processedCharacter);
                    console.log(`Added character: ${processedCharacter.name}`);
                }
                
            } catch (error) {
                console.error('=== CHARACTER LOADING ERROR ===');
                console.error('File name:', file.name);
                console.error('File size:', file.size);
                console.error('Error object:', error);
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                console.error('===============================');
                
                // More specific error messages
                let errorMsg = `Failed to load character from ${file.name}.\n\n`;
                if (error.name === 'SyntaxError') {
                    errorMsg += `JSON Parse Error: ${error.message}\n\nThe file appears to contain invalid JSON. Please check the file format.`;
                } else if (error.message && error.message.includes('processCharacterData')) {
                    errorMsg += 'The character data format is not recognized. This tool supports Pathbuilder 2e exports.';
                } else if (error.message) {
                    errorMsg += `Error: ${error.message}`;
                } else {
                    errorMsg += `Unknown error occurred: ${error.toString()}`;
                }
                
                alert(errorMsg);
            }
        }
        
        this.saveCampaigns();
        this.updateCharacterList();
        this.updatePartyFromCharacters();
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    processCharacterData(rawData, fileName) {
        // Flexible character data processing - handles multiple formats
        // This will be customized based on the specific format you provide
        
        console.log('Processing character data for:', fileName);
        console.log('Raw data structure:', Object.keys(rawData));
        
        const character = {
            id: this.generateId(),
            loadedDate: new Date().toISOString(),
            fileName: fileName,
            rawData: rawData // Keep original data for reference
        };

        // Try to extract common character properties from various possible formats
        if (rawData.name) {
            character.name = rawData.name;
        } else if (rawData.character && rawData.character.name) {
            character.name = rawData.character.name;
        } else if (rawData.data && rawData.data.name) {
            character.name = rawData.data.name;
        } else if (rawData.build && rawData.build.name) {
            character.name = rawData.build.name;  // Pathbuilder 2e format
        } else {
            character.name = fileName.replace('.json', '');
        }

        // Extract level
        character.level = this.extractValue(rawData, ['level', 'build.level', 'character.level', 'data.level', 'system.details.level.value']) || 1;
        
        // Extract class
        character.class = this.extractValue(rawData, ['class', 'build.class', 'character.class', 'data.class', 'system.details.class']) || 'Unknown';
        
        // Extract ancestry/race
        character.ancestry = this.extractValue(rawData, ['ancestry', 'build.ancestry', 'race', 'character.ancestry', 'data.ancestry', 'system.details.ancestry']) || 'Unknown';
        
        // Extract ability scores if available
        try {
            character.abilities = this.extractAbilityScores(rawData);
        } catch (error) {
            console.warn('Error extracting ability scores:', error);
            character.abilities = {};
        }
        
        // Extract HP and AC for encounter balancing
        try {
            character.hp = this.extractValue(rawData, ['hp', 'hitPoints', 'character.hp', 'system.attributes.hp.max']) || null;
            character.ac = this.extractValue(rawData, ['ac', 'armorClass', 'character.ac', 'system.attributes.ac.value', 'acTotal.acTotal']) || null;
        } catch (error) {
            console.warn('Error extracting HP/AC:', error);
            character.hp = null;
            character.ac = null;
        }

        console.log('Processed character:', {
            name: character.name,
            level: character.level,
            class: character.class,
            ancestry: character.ancestry
        });

        return character;
    }

    extractValue(obj, paths) {
        for (const path of paths) {
            const keys = path.split('.');
            let value = obj;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    value = null;
                    break;
                }
            }
            
            if (value !== null && value !== undefined) {
                return value;
            }
        }
        return null;
    }

    extractAbilityScores(rawData) {
        const abilities = {};
        const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        
        for (const ability of abilityNames) {
            abilities[ability] = this.extractValue(rawData, [
                `abilities.${ability}`,
                `build.abilities.${ability}`,  // Pathbuilder 2e format
                `character.abilities.${ability}`,
                `data.abilities.${ability}`,
                `system.abilities.${ability}.value`
            ]) || 10;
        }
        
        return abilities;
    }

    updateCharacterList() {
        const container = document.getElementById('character-list');
        
        if (!this.currentCampaign || !this.currentCampaign.characters || this.currentCampaign.characters.length === 0) {
            container.innerHTML = '<p class="no-characters">No characters loaded</p>';
            return;
        }

        const charactersHtml = this.currentCampaign.characters.map(character => `
            <div class="character-item" data-character-id="${character.id}">
                <div class="character-summary">
                    <span class="character-name">${character.name}</span>
                    <span class="character-details">Level ${character.level} ${character.class} (${character.ancestry})</span>
                </div>
                <div class="character-actions">
                    <button class="btn btn-small btn-danger" onclick="campaignManager.removeCharacter('${character.id}')">Remove</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = charactersHtml;
    }

    updatePartyFromCharacters() {
        if (!this.currentCampaign || !this.currentCampaign.characters || this.currentCampaign.characters.length === 0) return;

        // Update party size based on loaded characters
        const partySize = this.currentCampaign.characters.length;
        document.getElementById('campaign-party-size').value = partySize;
        this.currentCampaign.partySize = partySize;

        // Calculate average party level
        const totalLevel = this.currentCampaign.characters.reduce((sum, char) => sum + char.level, 0);
        const avgLevel = Math.round(totalLevel / this.currentCampaign.characters.length);
        document.getElementById('campaign-party-level').value = avgLevel;
        this.currentCampaign.partyLevel = avgLevel;

        console.log(`Party updated: ${partySize} characters, average level ${avgLevel}`);
    }

    removeCharacter(characterId) {
        if (!this.currentCampaign || !this.currentCampaign.characters) return;

        const index = this.currentCampaign.characters.findIndex(c => c.id === characterId);
        if (index >= 0) {
            const removedCharacter = this.currentCampaign.characters.splice(index, 1)[0];
            console.log(`Removed character: ${removedCharacter.name}`);
            
            this.saveCampaigns();
            this.updateCharacterList();
            this.updatePartyFromCharacters();
        }
    }

    getPartyCharacters() {
        return this.currentCampaign && this.currentCampaign.characters ? this.currentCampaign.characters : [];
    }
}

// Initialize campaign manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.campaignManager = new CampaignManager();
    console.log('Campaign Manager initialized');
});