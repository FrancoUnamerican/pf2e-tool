class DataLoader {
    constructor() {
        this.data = {
            ancestries: [],
            backgrounds: [],
            classes: [],
            deities: [],
            heritages: [],
            feats: [],
            classFeatures: [],
            spells: []
        };
        this.loadedPacks = new Set();
    }

    async loadAllData() {
        try {
            await Promise.all([
                this.loadAncestries(),
                this.loadBackgrounds(),
                this.loadClasses(),
                this.loadDeities(),
                this.loadHeritages(),
                this.loadFeats(),
                this.loadClassFeatures(),
                this.loadSpells()
            ]);
            console.log('All data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadAncestries() {
        try {
            const response = await fetch('./shared-data/packs/ancestries.json');
            if (response.ok) {
                const data = await response.json();
                this.data.ancestries = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load ancestries.json, trying individual files');
            await this.loadFromFolder('ancestries');
        }
    }

    async loadBackgrounds() {
        try {
            const response = await fetch('./shared-data/packs/backgrounds.json');
            if (response.ok) {
                const data = await response.json();
                this.data.backgrounds = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load backgrounds.json, trying individual files');
            await this.loadFromFolder('backgrounds');
        }
    }

    async loadClasses() {
        try {
            const response = await fetch('./shared-data/packs/classes.json');
            if (response.ok) {
                const data = await response.json();
                this.data.classes = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load classes.json, trying individual files');
            await this.loadFromFolder('classes');
        }
    }

    async loadDeities() {
        try {
            const response = await fetch('./shared-data/packs/deities.json');
            if (response.ok) {
                const data = await response.json();
                this.data.deities = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load deities.json, trying individual files');
            await this.loadFromFolder('deities');
        }
    }

    async loadHeritages() {
        try {
            const response = await fetch('./shared-data/packs/heritages.json');
            if (response.ok) {
                const data = await response.json();
                this.data.heritages = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load heritages.json, trying individual files');
            await this.loadFromFolder('heritages');
        }
    }

    async loadFeats() {
        try {
            const response = await fetch('./shared-data/packs/feats.json');
            if (response.ok) {
                const data = await response.json();
                this.data.feats = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load feats.json, trying individual files');
            await this.loadFromFolder('feats');
        }
    }

    async loadClassFeatures() {
        try {
            const response = await fetch('./shared-data/packs/class-features.json');
            if (response.ok) {
                const data = await response.json();
                this.data.classFeatures = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load class-features.json, trying individual files');
            await this.loadFromFolder('class-features');
        }
    }

    async loadSpells() {
        try {
            const response = await fetch('./shared-data/packs/spells.json');
            if (response.ok) {
                const data = await response.json();
                this.data.spells = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Could not load spells.json, trying individual files');
            await this.loadFromFolder('spells');
        }
    }

    async loadFromFolder(packName) {
        try {
            const folderResponse = await fetch(`./shared-data/packs/${packName}/`);
            if (!folderResponse.ok) {
                console.warn(`Could not access ${packName} folder`);
                return;
            }

            // This is a simplified approach - in a real app, you'd need to list files in the directory
            // For now, we'll use some common file patterns
            const commonFiles = [
                'human.json', 'elf.json', 'dwarf.json', 'halfling.json', 'gnome.json', 'goblin.json',
                'fighter.json', 'wizard.json', 'rogue.json', 'cleric.json', 'ranger.json', 'barbarian.json',
                'acolyte.json', 'criminal.json', 'folk-hero.json', 'merchant.json', 'noble.json', 'scholar.json'
            ];

            const loadPromises = commonFiles.map(async (fileName) => {
                try {
                    const response = await fetch(`./shared-data/packs/${packName}/${fileName}`);
                    if (response.ok) {
                        return await response.json();
                    }
                } catch (error) {
                    // File doesn't exist, skip it
                    return null;
                }
            });

            const results = await Promise.all(loadPromises);
            const validResults = results.filter(result => result !== null);
            
            if (validResults.length > 0) {
                this.data[packName] = validResults;
            }
        } catch (error) {
            console.error(`Error loading from ${packName} folder:`, error);
        }
    }

    // Helper methods to get data
    getAncestries() {
        return this.data.ancestries || [];
    }

    getBackgrounds() {
        return this.data.backgrounds || [];
    }

    getClasses() {
        return this.data.classes || [];
    }

    getDeities() {
        return this.data.deities || [];
    }

    getHeritages() {
        return this.data.heritages || [];
    }

    getFeats() {
        return this.data.feats || [];
    }

    getClassFeatures() {
        return this.data.classFeatures || [];
    }

    getSpells() {
        return this.data.spells || [];
    }

    // Create sample data if no data is loaded
    createSampleData() {
        if (this.data.ancestries.length === 0) {
            this.data.ancestries = [
                {
                    name: 'Human',
                    description: 'Versatile and ambitious, humans are the most common ancestry in most parts of the world.',
                    traits: ['Humanoid', 'Human'],
                    abilityBoosts: ['Free', 'Free'],
                    abilityFlaws: [],
                    languages: ['Common', 'Free'],
                    size: 'Medium',
                    speed: 25
                },
                {
                    name: 'Elf',
                    description: 'Elves are a long-lived people with a deep connection to magic and nature.',
                    traits: ['Humanoid', 'Elf'],
                    abilityBoosts: ['Dexterity', 'Free'],
                    abilityFlaws: ['Constitution'],
                    languages: ['Common', 'Elven'],
                    size: 'Medium',
                    speed: 30
                },
                {
                    name: 'Dwarf',
                    description: 'Dwarves are a sturdy people known for their craftsmanship and resilience.',
                    traits: ['Humanoid', 'Dwarf'],
                    abilityBoosts: ['Constitution', 'Wisdom', 'Free'],
                    abilityFlaws: ['Charisma'],
                    languages: ['Common', 'Dwarven'],
                    size: 'Medium',
                    speed: 20
                }
            ];
        }

        if (this.data.backgrounds.length === 0) {
            this.data.backgrounds = [
                {
                    name: 'Acolyte',
                    description: 'You spent your early days in service to a religious organization.',
                    abilityBoosts: ['Intelligence', 'Wisdom'],
                    skills: ['Religion', 'Scribing Lore'],
                    feat: 'Student of the Canon'
                },
                {
                    name: 'Criminal',
                    description: 'You lived on the wrong side of the law and now seek redemption.',
                    abilityBoosts: ['Dexterity', 'Intelligence'],
                    skills: ['Deception', 'Stealth'],
                    feat: 'Experienced Smuggler'
                },
                {
                    name: 'Folk Hero',
                    description: 'You came of age in a small settlement and earned local fame.',
                    abilityBoosts: ['Constitution', 'Wisdom'],
                    skills: ['Animal Handling', 'Survival'],
                    feat: 'Assurance'
                }
            ];
        }

        if (this.data.classes.length === 0) {
            this.data.classes = [
                {
                    name: 'Fighter',
                    description: 'You fight with skill, strategy, and strength.',
                    keyAbility: 'Strength or Dexterity',
                    hitPoints: 10,
                    proficiencies: {
                        perception: 'Expert',
                        fortitude: 'Expert',
                        reflex: 'Expert',
                        will: 'Trained'
                    },
                    skills: '3 + Int modifier',
                    attacks: 'Expert',
                    defenses: 'Expert',
                    classDC: 'Trained'
                },
                {
                    name: 'Wizard',
                    description: 'You are an eternal student of the arcane secrets of the multiverse.',
                    keyAbility: 'Intelligence',
                    hitPoints: 6,
                    proficiencies: {
                        perception: 'Trained',
                        fortitude: 'Trained',
                        reflex: 'Trained',
                        will: 'Expert'
                    },
                    skills: '2 + Int modifier',
                    attacks: 'Trained',
                    defenses: 'Trained',
                    classDC: 'Trained'
                },
                {
                    name: 'Rogue',
                    description: 'You are skilled and opportunistic.',
                    keyAbility: 'Dexterity',
                    hitPoints: 8,
                    proficiencies: {
                        perception: 'Expert',
                        fortitude: 'Trained',
                        reflex: 'Expert',
                        will: 'Expert'
                    },
                    skills: '7 + Int modifier',
                    attacks: 'Trained',
                    defenses: 'Trained',
                    classDC: 'Trained'
                }
            ];
        }

        if (this.data.deities.length === 0) {
            this.data.deities = [
                {
                    name: 'Sarenrae',
                    description: 'The goddess of the sun, redemption, honesty, and healing.',
                    alignment: 'Neutral Good',
                    domains: ['Fire', 'Healing', 'Sun'],
                    favoredWeapon: 'Scimitar'
                },
                {
                    name: 'Desna',
                    description: 'The goddess of dreams, stars, travelers, and luck.',
                    alignment: 'Chaotic Good',
                    domains: ['Dreams', 'Luck', 'Moon', 'Travel'],
                    favoredWeapon: 'Starknife'
                },
                {
                    name: 'Gozreh',
                    description: 'The god of nature, the sea, and weather.',
                    alignment: 'Neutral',
                    domains: ['Air', 'Nature', 'Water'],
                    favoredWeapon: 'Trident'
                }
            ];
        }
    }
}

// Global instance
const dataLoader = new DataLoader();