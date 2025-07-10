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
        console.log('Loading ancestries from individual files...');
        await this.loadFromFolder('ancestries');
    }

    async loadBackgrounds() {
        console.log('Loading backgrounds from individual files...');
        await this.loadFromFolder('backgrounds');
    }

    async loadClasses() {
        console.log('Loading classes from individual files...');
        await this.loadFromFolder('classes');
    }

    async loadDeities() {
        console.log('Loading deities from individual files...');
        await this.loadFromFolder('deities');
    }

    async loadHeritages() {
        try {
            const response = await fetch('./shared-data/packs/heritages.json');
            if (response.ok) {
                const data = await response.json();
                this.data.heritages = Array.isArray(data) ? data : [];
            } else {
                console.warn('Could not load heritages.json, trying individual files');
                await this.loadFromFolder('heritages');
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
            } else {
                console.warn('Could not load feats.json, trying individual files');
                await this.loadFromFolder('feats');
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
            } else {
                console.warn('Could not load class-features.json, trying individual files');
                await this.loadFromFolder('class-features');
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
            } else {
                console.warn('Could not load spells.json, trying individual files');
                await this.loadFromFolder('spells');
            }
        } catch (error) {
            console.warn('Could not load spells.json, trying individual files');
            await this.loadFromFolder('spells');
        }
    }

    async loadFromFolder(packName) {
        try {
            // Get actual file list from the directory structure
            const filePatterns = {
                ancestries: [
                    'human.json', 'elf.json', 'dwarf.json', 'halfling.json', 'gnome.json', 'goblin.json',
                    'orc.json', 'hobgoblin.json', 'lizardfolk.json', 'catfolk.json', 'ratfolk.json',
                    'tengu.json', 'kobold.json', 'leshy.json', 'poppet.json', 'fetchling.json',
                    'fleshwarp.json', 'kitsune.json', 'sprite.json', 'strix.json',
                    'azarketi.json', 'android.json', 'automaton.json', 'conrasu.json', 'kashrishi.json',
                    'nagaji.json', 'shoony.json', 'vanara.json', 'vishkanya.json', 'anadi.json',
                    'goloma.json', 'shisk.json', 'surki.json', 'yaoguai.json', 'yaksha.json',
                    'wayang.json', 'tripkee.json', 'tanuki.json', 'samsaran.json', 'sarangay.json',
                    'skeleton.json', 'minotaur.json', 'merfolk.json', 'kholo.json', 'centaur.json',
                    'ghoran.json', 'awakened-animal.json', 'athamaru.json'
                ],
                classes: [
                    'alchemist.json', 'barbarian.json', 'bard.json', 'champion.json', 'cleric.json',
                    'druid.json', 'fighter.json', 'gunslinger.json', 'inventor.json', 'investigator.json',
                    'kineticist.json', 'magus.json', 'monk.json', 'oracle.json', 'psychic.json',
                    'ranger.json', 'rogue.json', 'sorcerer.json', 'summoner.json', 'swashbuckler.json',
                    'thaumaturge.json', 'witch.json', 'wizard.json', 'animist.json', 'exemplar.json'
                ],
                backgrounds: [
                    'acolyte.json', 'acrobat.json', 'animal-whisperer.json', 'artisan.json', 'artist.json',
                    'barkeep.json', 'barrister.json', 'bounty-hunter.json', 'charlatan.json', 'criminal.json',
                    'detective.json', 'entertainer.json', 'farmhand.json', 'field-medic.json', 'folk-hero.json',
                    'fortune-teller.json', 'gambler.json', 'gladiator.json', 'guard.json', 'herbalist.json',
                    'hermit.json', 'hunter.json', 'laborer.json', 'merchant.json', 'miner.json',
                    'noble.json', 'nomad.json', 'prisoner.json', 'sailor.json', 'scholar.json',
                    'scout.json', 'street-urchin.json', 'tinker.json', 'warrior.json'
                ],
                deities: [
                    // Core gods
                    'core-gods/abadar.json', 'core-gods/asmodeus.json', 'core-gods/calistria.json', 'core-gods/cayden-cailean.json', 
                    'core-gods/desna.json', 'core-gods/erastil.json', 'core-gods/gozreh.json', 'core-gods/iomedae.json', 
                    'core-gods/irori.json', 'core-gods/lamashtu.json', 'core-gods/nethys.json', 'core-gods/norgorber.json', 
                    'core-gods/pharasma.json', 'core-gods/rovagug.json', 'core-gods/sarenrae.json', 'core-gods/shelyn.json', 
                    'core-gods/torag.json', 'core-gods/urgathoa.json', 'core-gods/zon-kuthon.json', 'core-gods/arazni.json',
                    // Other popular gods
                    'other-gods/besmara.json', 'other-gods/brigh.json', 'other-gods/chaldira.json', 'other-gods/dahak.json',
                    'other-gods/ghlaunder.json', 'other-gods/groetus.json', 'other-gods/hanspur.json', 'other-gods/kurgess.json',
                    'other-gods/milani.json', 'other-gods/naderi.json', 'other-gods/nocticula.json', 'other-gods/sivanah.json',
                    'other-gods/tsukiyo.json', 'other-gods/shizuru.json', 'other-gods/zyphus.json',
                    // Empyreal Lords
                    'empyreal-lords/ragathiel.json', 'empyreal-lords/korada.json', 'empyreal-lords/pulura.json',
                    'empyreal-lords/black-butterfly.json', 'empyreal-lords/dammerich.json'
                ]
            };

            const filesToTry = filePatterns[packName] || [];
            
            // Skip loading for complex directory structures that need special handling
            if (['heritages', 'feats', 'class-features', 'spells'].includes(packName) && filesToTry.length === 0) {
                console.warn(`Skipping ${packName} - complex directory structure not yet supported`);
                return;
            }
            
            const loadPromises = filesToTry.map(async (fileName) => {
                try {
                    // Try multiple path variations to ensure compatibility
                    const paths = [
                        `./shared-data/packs/${packName}/${fileName}`,
                        `shared-data/packs/${packName}/${fileName}`,
                        `/shared-data/packs/${packName}/${fileName}`
                    ];
                    
                    let data = null;
                    for (const path of paths) {
                        try {
                            const response = await fetch(path);
                            if (response.ok) {
                                data = await response.json();
                                break;
                            }
                        } catch (e) {
                            // Continue to next path
                        }
                    }
                    
                    if (data) {
                        // Process the data to match our expected format
                        const processedData = {
                            id: data._id || fileName.replace('.json', ''),
                            name: data.name,
                            description: data.system?.description?.value || data.description || 'No description available',
                            traits: data.system?.traits?.value || data.traits || [],
                            abilityBoosts: [],
                            abilityFlaws: [],
                            languages: [],
                            size: data.system?.size?.value || data.size || 'Medium',
                            speed: data.system?.attributes?.speed?.value || data.system?.speed || data.speed || 25
                        };
                        
                        // Add class-specific properties
                        if (packName === 'classes') {
                            processedData.keyAbility = data.system?.keyAbility?.value || data.keyAbility || [];
                            processedData.hitPoints = data.system?.hp || data.hitPoints || 8;
                            processedData.skills = data.system?.trainedSkills?.value || data.skills || [];
                            processedData.perception = data.system?.perception || 0;
                            processedData.classDC = data.system?.classDC || 0;
                            processedData.savingThrows = data.system?.savingThrows || {};
                            processedData.attacks = data.system?.attacks || {};
                            processedData.defenses = data.system?.defenses || {};
                        }
                        
                        // Add deity-specific properties
                        if (packName === 'deities') {
                            processedData.alignment = data.system?.alignment?.own || data.alignment || 'N';
                            processedData.domains = data.system?.domains || data.domains || [];
                            processedData.font = data.system?.font || data.font || [];
                            processedData.weapons = data.system?.weapons || data.weapons || [];
                            processedData.skill = data.system?.skill || data.skill || [];
                        }
                        
                        // Process ability boosts from the complex structure
                        if (data.system?.boosts) {
                            Object.values(data.system.boosts).forEach(boost => {
                                if (boost.value && Array.isArray(boost.value)) {
                                    processedData.abilityBoosts.push(...boost.value);
                                }
                            });
                        }
                        
                        // Process ability flaws
                        if (data.system?.flaws) {
                            Object.values(data.system.flaws).forEach(flaw => {
                                if (flaw.value && Array.isArray(flaw.value)) {
                                    processedData.abilityFlaws.push(...flaw.value);
                                }
                            });
                        }
                        
                        // Process languages
                        if (data.system?.languages) {
                            if (data.system.languages.value && Array.isArray(data.system.languages.value)) {
                                processedData.languages.push(...data.system.languages.value);
                            }
                        }
                        
                        return processedData;
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
                console.log(`Loaded ${validResults.length} ${packName} from individual files`);
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
        console.log('createSampleData called - current ancestries:', this.data.ancestries.length);
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