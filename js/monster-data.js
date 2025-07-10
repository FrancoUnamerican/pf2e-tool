// Comprehensive monster database organized by categories
class MonsterDatabase {
    static getBookCategories() {
        return {
            'Core Books': {
                'pathfinder-monster-core': {
                    name: 'Monster Core',
                    description: 'Essential monsters for Pathfinder 2e (492 creatures)',
                    default: true,
                    files: []
                },
                'pathfinder-bestiary': {
                    name: 'Pathfinder Bestiary',
                    description: 'Classic monsters and creatures (175 creatures)',
                    files: []
                },
                'pathfinder-bestiary-2': {
                    name: 'Pathfinder Bestiary 2',
                    description: 'More creatures and monsters (332 creatures)',
                    files: []
                },
                'pathfinder-bestiary-3': {
                    name: 'Pathfinder Bestiary 3',
                    description: 'Advanced creatures and monsters (347 creatures)',
                    files: []
                },
                'pathfinder-npc-core': {
                    name: 'NPC Core',
                    description: 'Core NPCs and humanoid characters (270 creatures)',
                    files: []
                }
            },
            'Lost Omens': {
                'lost-omens-bestiary': {
                    name: 'Lost Omens Monsters',
                    description: 'Creatures from Lost Omens books (123 creatures)',
                    files: []
                },
                'book-of-the-dead-bestiary': {
                    name: 'Book of the Dead',
                    description: 'Undead creatures and necromancy (91 creatures)',
                    files: []
                },
                'rage-of-elements-bestiary': {
                    name: 'Rage of Elements',
                    description: 'Elemental creatures and kineticists (81 creatures)',
                    files: []
                },
                'howl-of-the-wild-bestiary': {
                    name: 'Howl of the Wild',
                    description: 'Wild creatures and nature (76 creatures)',
                    files: []
                },
                'war-of-immortals-bestiary': {
                    name: 'War of Immortals',
                    description: 'Divine and mythic creatures (11 creatures)',
                    files: []
                },
                'pathfinder-dark-archive': {
                    name: 'Dark Archive',
                    description: 'Occult and mysterious creatures (8 creatures)',
                    files: []
                },
                'wardens-of-wildwood-bestiary': {
                    name: 'Wardens of Wildwood',
                    description: 'Forest and nature guardians (73 creatures)',
                    files: []
                },
                'blog-bestiary': {
                    name: 'Blog Bestiary',
                    description: 'Creatures from Paizo blog posts (31 creatures)',
                    files: []
                },
                'npc-gallery': {
                    name: 'NPC Gallery',
                    description: 'Various NPCs and characters (20 creatures)',
                    files: []
                }
            },
            'Pathfinder Society': {
                'pfs-season-1-bestiary': { 
                    name: 'PFS Season 1', 
                    description: 'Season 1 scenarios (259 creatures)', 
                    files: [] 
                },
                'pfs-season-2-bestiary': { 
                    name: 'PFS Season 2', 
                    description: 'Season 2 scenarios (199 creatures)', 
                    files: [] 
                },
                'pfs-season-3-bestiary': { 
                    name: 'PFS Season 3', 
                    description: 'Season 3 scenarios (198 creatures)', 
                    files: [] 
                },
                'pfs-season-4-bestiary': { 
                    name: 'PFS Season 4', 
                    description: 'Season 4 scenarios (175 creatures)', 
                    files: [] 
                },
                'pfs-season-5-bestiary': { 
                    name: 'PFS Season 5', 
                    description: 'Season 5 scenarios (184 creatures)', 
                    files: [] 
                },
                'pfs-season-6-bestiary': { 
                    name: 'PFS Season 6', 
                    description: 'Season 6 scenarios (233 creatures)', 
                    files: [] 
                },
                'pfs-introductions-bestiary': { 
                    name: 'PFS Introductions', 
                    description: 'Intro scenarios (4 creatures)', 
                    files: [] 
                }
            },
            'Adventure Paths': {
                'abomination-vaults-bestiary': {
                    name: 'Abomination Vaults',
                    description: 'Megadungeon adventure creatures (97 creatures)',
                    subdirectories: {
                        'book-1-ruins-of-gauntlight': [
                            'aller-rosk.json', 'augrael.json', 'blood-of-belcorra.json', 'bloodsiphon.json', 'boss-skrawng.json',
                            'canker-cultist.json', 'chandriu-invisar.json', 'corpselight.json', 'doom-of-tomorrow.json',
                            'flickerwisp.json', 'jarelle-kaldrian.json', 'jaul-mezmin.json', 'jauls-wolf.json', 'mister-beak.json',
                            'morlock-cultist.json', 'morlock-engineer.json', 'morlock-scavenger.json', 'nhakazarin.json',
                            'otari-ilvashti.json', 'scalathrax.json', 'voidglutton.json', 'volluk-azrinae.json', 'wrin-sivinxi.json'
                        ],
                        'book-2-hands-of-the-devil': [
                            'azvalvigander.json', 'barcumbuk.json', 'carman-rajani.json', 'chafkhem.json', 'cratonys.json',
                            'dreshkan.json', 'gibtanius.json', 'gulzash.json', 'jafaki.json', 'kragala.json', 'mulventok.json',
                            'nox.json', 'ryta.json', 'sacuishu.json', 'siora-fallowglade.json', 'urevian.json', 'vischari.json'
                        ],
                        'book-3-eyes-of-empty-death': [
                            'belcorra-haruvex.json', 'bright-walker.json', 'dread-wisp.json', 'dulac.json', 'galudu.json',
                            'khurfel.json', 'padli.json', 'quara-orshendiel.json', 'salaisa-malthulas.json'
                        ]
                    }
                },
                'kingmaker-bestiary': { 
                    name: 'Kingmaker', 
                    description: 'Kingdom building adventure (181 creatures)', 
                    files: [] 
                },
                'agents-of-edgewatch-bestiary': { 
                    name: 'Agents of Edgewatch', 
                    description: 'Urban investigation (150 creatures)', 
                    files: [] 
                },
                'strength-of-thousands-bestiary': { 
                    name: 'Strength of Thousands', 
                    description: 'Magic academy adventure (148 creatures)', 
                    files: [] 
                },
                'extinction-curse-bestiary': { 
                    name: 'Extinction Curse', 
                    description: 'Circus and mystery (140 creatures)', 
                    files: [] 
                },
                'blood-lords-bestiary': { 
                    name: 'Blood Lords', 
                    description: 'Undead and necromancy (139 creatures)', 
                    files: [] 
                },
                'fists-of-the-ruby-phoenix-bestiary': { 
                    name: 'Fists of the Ruby Phoenix', 
                    description: 'Martial arts tournament (129 creatures)', 
                    files: [] 
                },
                'age-of-ashes-bestiary': { 
                    name: 'Age of Ashes', 
                    description: 'Epic fantasy adventure (103 creatures)', 
                    files: [] 
                },
                'stolen-fate-bestiary': { 
                    name: 'Stolen Fate', 
                    description: 'Harrow deck adventure (92 creatures)', 
                    files: [] 
                },
                'sky-kings-tomb-bestiary': { 
                    name: 'Sky King\'s Tomb', 
                    description: 'Dwarven adventure (87 creatures)', 
                    files: [] 
                },
                'outlaws-of-alkenstar-bestiary': { 
                    name: 'Outlaws of Alkenstar', 
                    description: 'Steampunk western (82 creatures)', 
                    files: [] 
                },
                'quest-for-the-frozen-flame-bestiary': { 
                    name: 'Quest for the Frozen Flame', 
                    description: 'Mammoth Lords adventure (68 creatures)', 
                    files: [] 
                },
                'gatewalkers-bestiary': { 
                    name: 'Gatewalkers', 
                    description: 'Planar adventure (65 creatures)', 
                    files: [] 
                },
                'season-of-ghosts-bestiary': { 
                    name: 'Season of Ghosts', 
                    description: 'Horror and spirits (63 creatures)', 
                    files: [] 
                }
            },
            'Standalone Adventures': {
                'triumph-of-the-tusk-bestiary': { 
                    name: 'Triumph of the Tusk', 
                    description: 'Orc adventure (70 creatures)', 
                    files: [] 
                },
                'shades-of-blood-bestiary': { 
                    name: 'Shades of Blood', 
                    description: 'Horror adventure (71 creatures)', 
                    files: [] 
                },
                'curtain-call-bestiary': { 
                    name: 'Curtain Call', 
                    description: 'Theater mystery (61 creatures)', 
                    files: [] 
                },
                'spore-war-bestiary': { 
                    name: 'Spore War', 
                    description: 'Fungal conflict (61 creatures)', 
                    files: [] 
                },
                'menace-under-otari-bestiary': { 
                    name: 'Menace Under Otari', 
                    description: 'Beginner adventure (62 creatures)', 
                    files: [] 
                },
                'seven-dooms-for-sandpoint-bestiary': { 
                    name: 'Seven Dooms for Sandpoint', 
                    description: 'Sandpoint adventure (53 creatures)', 
                    files: [] 
                },
                'prey-for-death-bestiary': { 
                    name: 'Prey for Death', 
                    description: 'Survival horror (36 creatures)', 
                    files: [] 
                },
                'crown-of-the-kobold-king-bestiary': { 
                    name: 'Crown of the Kobold King', 
                    description: 'Classic adventure (27 creatures)', 
                    files: [] 
                },
                'claws-of-the-tyrant-bestiary': { 
                    name: 'Claws of the Tyrant', 
                    description: 'Dragon adventure (25 creatures)', 
                    files: [] 
                },
                'one-shot-bestiary': { 
                    name: 'One-Shot Adventures', 
                    description: 'Short adventures (23 creatures)', 
                    files: [] 
                },
                'myth-speaker-bestiary': { 
                    name: 'Myth Speaker', 
                    description: 'Mythic adventure (22 creatures)', 
                    files: [] 
                },
                'rusthenge-bestiary': { 
                    name: 'Rusthenge', 
                    description: 'Robot adventure (19 creatures)', 
                    files: [] 
                },
                'night-of-the-gray-death-bestiary': { 
                    name: 'Night of the Gray Death', 
                    description: 'Undead horror (15 creatures)', 
                    files: [] 
                },
                'shadows-at-sundown-bestiary': { 
                    name: 'Shadows at Sundown', 
                    description: 'Western horror (13 creatures)', 
                    files: [] 
                },
                'malevolence-bestiary': { 
                    name: 'Malevolence', 
                    description: 'Haunted house (12 creatures)', 
                    files: [] 
                },
                'the-enmity-cycle-bestiary': { 
                    name: 'The Enmity Cycle', 
                    description: 'Planar conflict (12 creatures)', 
                    files: [] 
                },
                'troubles-in-otari-bestiary': { 
                    name: 'Troubles in Otari', 
                    description: 'Beginner box (12 creatures)', 
                    files: [] 
                },
                'the-slithering-bestiary': { 
                    name: 'The Slithering', 
                    description: 'Serpentfolk adventure (9 creatures)', 
                    files: [] 
                },
                'fall-of-plaguestone': { 
                    name: 'Fall of Plaguestone', 
                    description: 'Introductory adventure (21 creatures)', 
                    files: [] 
                }
            }
        };
    }

    static getSubdirectoryFiles() {
        return {
            'abomination-vaults-bestiary': {
                'book-1-ruins-of-gauntlight': [
                    'aller-rosk.json', 'augrael.json', 'blood-of-belcorra.json', 'bloodsiphon.json', 'boss-skrawng.json',
                    'canker-cultist.json', 'chandriu-invisar.json', 'corpselight.json', 'doom-of-tomorrow.json',
                    'flickerwisp.json', 'jarelle-kaldrian.json', 'jaul-mezmin.json', 'jauls-wolf.json', 'mister-beak.json',
                    'morlock-cultist.json', 'morlock-engineer.json', 'morlock-scavenger.json', 'nhakazarin.json',
                    'otari-ilvashti.json', 'scalathrax.json', 'spike-launcher.json', 'stonescale-spirits.json',
                    'vengeful-furnace.json', 'voidglutton.json', 'volluk-azrinae.json', 'watching-wall.json', 'wrin-sivinxi.json'
                ],
                'book-2-hands-of-the-devil': [
                    'afflicted-irnakurse.json', 'azvalvigander.json', 'barcumbuk.json', 'carman-rajani.json',
                    'chafkhem.json', 'cratonys.json', 'deep-end-sarglagon.json', 'dreshkan.json', 'drill-field-barbazu.json',
                    'dune-candle.json', 'gibtanius.json', 'gibtas-bounder.json', 'gibtas-spawn-swarm.json',
                    'groetan-candle.json', 'gulzash.json', 'hellforge-barbazu.json', 'jafaki.json', 'kragala.json',
                    'mulventok.json', 'murschen.json', 'nox.json', 'ryta.json', 'sacuishu.json', 'seugathi-guard.json',
                    'seugathi-reality-warper.json', 'seugathi-researcher.json', 'seugathi-servant.json',
                    'shanrigol-behemoth.json', 'shanrigol-heap.json', 'siora-fallowglade.json', 'spellvoid.json',
                    'urevian.json', 'vischari.json', 'viscous-black-pudding.json', 'warped-brew-morlock.json',
                    'will-o-the-deep.json', 'witchfire-warden.json', 'ysondkhelir.json'
                ],
                'book-3-eyes-of-empty-death': [
                    'belcorra-haruvex.json', 'blast-tumbler.json', 'bright-walker.json', 'caligni-defender.json',
                    'daemonic-fog.json', 'deepwater-dhuthorex.json', 'dhuthorex-sage.json', 'dragons-blood-puffball.json',
                    'dread-dhuthorex.json', 'dread-wisp.json', 'drow-cavern-seer.json', 'drow-hunter.json',
                    'drow-shootist.json', 'drow-warden.json', 'dulac.json', 'elder-child-of-belcorra.json',
                    'galudu.json', 'images-of-failure.json', 'images-of-powerlessness.json', 'khurfel.json',
                    'ladys-whisper.json', 'nhimbaloths-cutter.json', 'padli.json', 'poisoning-room-specter.json',
                    'quara-orshendiel.json', 'reaper-skull-puffball.json', 'salaisa-malthulas.json',
                    'urdefhan-blood-mage.json', 'urdefhan-death-scout.json', 'urdefhan-lasher.json', 'voidbracken-chuul.json'
                ]
            }
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonsterDatabase;
} else {
    window.MonsterDatabase = MonsterDatabase;
}