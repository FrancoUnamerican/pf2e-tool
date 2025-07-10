// Text Parser for PF2e Game Text
// Handles @UUID, @Damage, and other game text references
// Version: 1.2 - Removed brackets from damage display

class PF2eTextParser {
    constructor() {
        this.version = "1.2";
        this.uuidDatabase = {};
        this.damageDatabase = {};
        this.initializeReferences();
        console.log(`PF2e Text Parser v${this.version} loaded`);
    }

    initializeReferences() {
        // Common UUID references found in PF2e data
        this.uuidDatabase = {
            // Compendium references
            'Compendium.pf2e.spells-srd.Item.1HMmpWSJ8qgWthjb': 'Heal',
            'Compendium.pf2e.spells-srd.Item.1m4WUdZYmChY9nNm': 'Harm', 
            'Compendium.pf2e.spells-srd.Item.Mb7CzMj1LYpvCQVJ': 'Fireball',
            'Compendium.pf2e.spells-srd.Item.UvJbUbZYJZZJ7NkL': 'Lightning Bolt',
            'Compendium.pf2e.spells-srd.Item.FKtJ8DKoHLiQgZxC': 'Cure Wounds',
            'Compendium.pf2e.spells-srd.Item.XZvR0kWD2CJ7dqoL': 'Magic Missile',
            'Compendium.pf2e.spells-srd.Item.qDGcJfXH4FoqPFfJ': 'Shield',
            'Compendium.pf2e.spells-srd.Item.vQUKzJoQzLfNfBLW': 'Mage Armor',
            'Compendium.pf2e.spells-srd.Item.yLQXW2L5M1tdrF5A': 'Detect Magic',
            'Compendium.pf2e.spells-srd.Item.wQiPBGCb5RgVnCcY': 'Dispel Magic',

            // Equipment references
            'Compendium.pf2e.equipment-srd.Item.JQdqHHguZn6t7EGP': 'Dagger',
            'Compendium.pf2e.equipment-srd.Item.2YdmPfJK0zL4ULdG': 'Longsword',
            'Compendium.pf2e.equipment-srd.Item.KKbNXbvB8HlWBFn9': 'Shortbow',
            'Compendium.pf2e.equipment-srd.Item.LKKNgNnWKnvxq4J8': 'Leather Armor',
            'Compendium.pf2e.equipment-srd.Item.NnYwMBjdHQ3GPnHk': 'Chain Mail',
            'Compendium.pf2e.equipment-srd.Item.W8RjydP4qJBJQnE5': 'Healing Potion',
            'Compendium.pf2e.equipment-srd.Item.6fLyNPpTXxMnCLWd': 'Rope (50 feet)',
            'Compendium.pf2e.equipment-srd.Item.CJw4jZpxpKGVfDWe': 'Torch',
            'Compendium.pf2e.equipment-srd.Item.HYkCVqRFbK8XAx6T': 'Backpack',
            'Compendium.pf2e.equipment-srd.Item.PuG8FKpnQzHB8JZH': 'Bedroll',
            
            // Equipment effects
            'Compendium.pf2e.equipment-effects.Item.Effect: Elixir of Life': 'Elixir of Life Effect',
            'Compendium.pf2e.equipment-effects.Item.Effect: Healing Potion': 'Healing Potion Effect',
            'Compendium.pf2e.equipment-effects.Item.Effect: Antidote': 'Antidote Effect',
            'Compendium.pf2e.equipment-effects.Item.Effect: Antiplague': 'Antiplague Effect',

            // Conditions
            'Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh': 'Drained',
            'Compendium.pf2e.conditionitems.Item.dxMf24fq65RR6J0J': 'Dying',
            'Compendium.pf2e.conditionitems.Item.J2BQvC4VJJGGnN5k': 'Unconscious',
            'Compendium.pf2e.conditionitems.Item.3eZkPbCmkYGDdqDC': 'Clumsy',
            'Compendium.pf2e.conditionitems.Item.H0XfE8qRWNZEEEiJ': 'Enfeebled',
            'Compendium.pf2e.conditionitems.Item.M6mRPX2YCjMRXUzJ': 'Frightened',
            'Compendium.pf2e.conditionitems.Item.HDHfXy1qLNUsYKoD': 'Sickened',
            'Compendium.pf2e.conditionitems.Item.PBMCRGXDJBXKLdJW': 'Stunned',

            // Actions
            'Compendium.pf2e.actionspf2e.Item.VjxZFuUXrCU94gm4': 'Strike',
            'Compendium.pf2e.actionspf2e.Item.8j6YdCZp2hg5jqpC': 'Stride',
            'Compendium.pf2e.actionspf2e.Item.BlAOM2X92F2hbU2J': 'Cast a Spell',
            'Compendium.pf2e.actionspf2e.Item.d6nZ1tWGLjF8dq5g': 'Hide',
            'Compendium.pf2e.actionspf2e.Item.1AKx2JZPGZJAkfwq': 'Seek',
            'Compendium.pf2e.actionspf2e.Item.JuqmRGjmEvr1pLhD': 'Raise a Shield',
            'Compendium.pf2e.actionspf2e.Item.VkGySA3zPyPEhUGq': 'Aid',
            'Compendium.pf2e.actionspf2e.Item.6f4TkXGvNKFUbR4J': 'Climb',
            'Compendium.pf2e.actionspf2e.Item.gXLfRvmvmGLjPfrp': 'Disarm',
            'Compendium.pf2e.actionspf2e.Item.CJp5c7j5JD7TLtJr': 'Grapple',

            // Feats
            'Compendium.pf2e.feats-srd.Item.tUwYjNXTcaRlQdgr': 'Toughness',
            'Compendium.pf2e.feats-srd.Item.LzYi5aHbO8VKjKrJ': 'Shield Block',
            'Compendium.pf2e.feats-srd.Item.sB6vz1Z6fRjZKdPo': 'Power Attack',
            'Compendium.pf2e.feats-srd.Item.X6zIlUcPt8ULKdKo': 'Sudden Charge',
            'Compendium.pf2e.feats-srd.Item.9NZj2HdfPHPHCGvJ': 'Reactive Shield',
            'Compendium.pf2e.feats-srd.Item.1HBqJFuGNQ6FXjDh': 'Combat Reflexes',
            'Compendium.pf2e.feats-srd.Item.Kbm6hkJGRdxYCwWY': 'Weapon Focus',
            'Compendium.pf2e.feats-srd.Item.5vNyKGtVoYNj8JzK': 'Dodge'
        };

        // Damage type references
        this.damageDatabase = {
            'bludgeoning': { type: 'bludgeoning', symbol: 'B' },
            'piercing': { type: 'piercing', symbol: 'P' },
            'slashing': { type: 'slashing', symbol: 'S' },
            'acid': { type: 'acid', symbol: 'A' },
            'cold': { type: 'cold', symbol: 'C' },
            'electricity': { type: 'electricity', symbol: 'E' },
            'fire': { type: 'fire', symbol: 'F' },
            'sonic': { type: 'sonic', symbol: 'So' },
            'force': { type: 'force', symbol: 'Fo' },
            'negative': { type: 'negative', symbol: 'N' },
            'positive': { type: 'positive', symbol: 'P' },
            'mental': { type: 'mental', symbol: 'M' },
            'poison': { type: 'poison', symbol: 'Po' },
            'chaotic': { type: 'chaotic', symbol: 'C' },
            'evil': { type: 'evil', symbol: 'E' },
            'good': { type: 'good', symbol: 'G' },
            'lawful': { type: 'lawful', symbol: 'L' },
            'healing': { type: 'healing', symbol: 'H' },
            'persistent': { type: 'persistent', symbol: 'P' },
            'vitality': { type: 'vitality', symbol: 'V' },
            'void': { type: 'void', symbol: 'V' }
        };
    }

    parseText(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let parsedText = text;

        // Parse @UUID references
        parsedText = this.parseUUIDs(parsedText);

        // Parse @Damage references
        parsedText = this.parseDamage(parsedText);

        // Parse other common references
        parsedText = this.parseOtherReferences(parsedText);

        return parsedText;
    }

    parseUUIDs(text) {
        // Match @UUID[reference]{optional display text}
        const uuidPattern = /@UUID\[([^\]]+)\](?:\{([^}]+)\})?/g;
        
        return text.replace(uuidPattern, (match, uuid, displayText) => {
            // Look up the UUID in our database
            const resolvedName = this.uuidDatabase[uuid];
            
            if (resolvedName) {
                // Use display text if provided, otherwise use resolved name
                const finalText = displayText || resolvedName;
                return `<span class="game-reference spell-link" data-uuid="${uuid}" title="${resolvedName}">${finalText}</span>`;
            } else {
                // Extract name from UUID if not in database
                const extractedName = this.extractNameFromUUID(uuid);
                const finalText = displayText || extractedName;
                return `<span class="game-reference unknown-reference" data-uuid="${uuid}" title="Unknown reference">${finalText}</span>`;
            }
        });
    }

    parseDamage(text) {
        // Match @Damage[dice type]{optional display text}
        const damagePattern = /@Damage\[([^\]]+)\](?:\{([^}]+)\})?/g;
        
        return text.replace(damagePattern, (match, damageSpec, displayText) => {
            const parsedDamage = this.parseDamageSpecification(damageSpec);
            
            if (parsedDamage) {
                const finalText = displayText || parsedDamage.display;
                return `<span class="damage-reference" data-damage="${damageSpec}" title="${parsedDamage.tooltip}">${finalText}</span>`;
            } else {
                // Remove brackets from display for unknown damage
                const cleanSpec = damageSpec.replace(/[\[\]]/g, '');
                const finalText = displayText || cleanSpec;
                return `<span class="damage-reference unknown-damage" data-damage="${damageSpec}">${finalText}</span>`;
            }
        });
    }

    parseDamageSpecification(damageSpec) {
        // Parse damage specifications like "1d6[fire]", "2d8+4[slashing]", or "(3d6+6)[healing]"
        const damagePattern = /\(?(\d+d\d+(?:[+\-]\d+)?)\)?\[([^\]]+)\]/;
        const match = damageSpec.match(damagePattern);
        
        if (match) {
            const [, diceRoll, damageType] = match;
            const damageInfo = this.damageDatabase[damageType.toLowerCase()];
            
            if (damageInfo) {
                const damageText = damageInfo.type === 'healing' ? 'healing' : `${damageInfo.type} damage`;
                return {
                    display: `${diceRoll} ${damageInfo.symbol}`,
                    tooltip: `${diceRoll} ${damageText}`,
                    dice: diceRoll,
                    type: damageInfo.type,
                    symbol: damageInfo.symbol
                };
            } else {
                const damageText = damageType.toLowerCase() === 'healing' ? 'healing' : `${damageType} damage`;
                // Clean up damage type display (remove brackets if any)
                const cleanDamageType = damageType.replace(/[\[\]]/g, '');
                return {
                    display: `${diceRoll} ${cleanDamageType}`,
                    tooltip: `${diceRoll} ${damageText}`,
                    dice: diceRoll,
                    type: damageType,
                    symbol: cleanDamageType.charAt(0).toUpperCase()
                };
            }
        }
        
        return null;
    }

    parseOtherReferences(text) {
        // Parse @Check references
        text = text.replace(/@Check\[([^\]]+)\]/g, (match, checkType) => {
            return `<span class="check-reference" data-check="${checkType}">${checkType} check</span>`;
        });

        // Parse @Template references
        text = text.replace(/@Template\[([^\]]+)\]/g, (match, templateType) => {
            return `<span class="template-reference" data-template="${templateType}">${templateType} template</span>`;
        });

        // Parse @Localize references (usually just remove these)
        text = text.replace(/@Localize\[([^\]]+)\]/g, (match, localizationKey) => {
            return this.getLocalizedText(localizationKey);
        });

        return text;
    }

    extractNameFromUUID(uuid) {
        // Try to extract a readable name from the UUID
        const parts = uuid.split('.');
        if (parts.length >= 4) {
            // Usually the last part is the item ID, second to last might be more readable
            const itemId = parts[parts.length - 1];
            // Convert camelCase or kebab-case to readable text
            return itemId.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/[-_]/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
        }
        return uuid;
    }

    getLocalizedText(key) {
        // Basic localization - in a full implementation this would use actual localization data
        const localizations = {
            'PF2E.ActionTypeAction': 'Action',
            'PF2E.ActionTypeReaction': 'Reaction',
            'PF2E.ActionTypeFreeAction': 'Free Action',
            'PF2E.ActionTypePassive': 'Passive',
            'PF2E.SaveReflex': 'Reflex',
            'PF2E.SaveFortitude': 'Fortitude',
            'PF2E.SaveWill': 'Will',
            'PF2E.CheckBasic': 'Basic',
            'PF2E.SpellAreaBurst': 'Burst',
            'PF2E.SpellAreaCone': 'Cone',
            'PF2E.SpellAreaLine': 'Line',
            'PF2E.SpellAreaRadius': 'Radius'
        };
        
        return localizations[key] || key.split('.').pop();
    }

    // Helper method to parse HTML with game references
    parseHTML(html) {
        if (!html) return html;
        
        // First parse the text content
        let parsedHTML = this.parseText(html);
        
        // Then clean up any remaining HTML issues
        parsedHTML = this.cleanupHTML(parsedHTML);
        
        return parsedHTML;
    }

    cleanupHTML(html) {
        // Remove or replace problematic HTML elements
        html = html.replace(/<p><\/p>/g, ''); // Remove empty paragraphs
        html = html.replace(/<p>/g, ''); // Remove opening p tags
        html = html.replace(/<\/p>/g, '<br>'); // Replace closing p tags with breaks
        html = html.replace(/<br>\s*<br>/g, '<br>'); // Remove duplicate breaks
        html = html.replace(/^<br>|<br>$/g, ''); // Remove leading/trailing breaks
        
        return html;
    }

    // Method to enhance loot descriptions
    enhanceLootDescription(description) {
        if (!description) return '';
        
        // Debug logging
        console.log('[TextParser] Enhancing description:', description);
        
        // Parse the description text
        let enhanced = this.parseHTML(description);
        
        // Add additional context for common PF2e terms
        enhanced = this.addGameContextTooltips(enhanced);
        
        console.log('[TextParser] Enhanced result:', enhanced);
        
        return enhanced;
    }

    addGameContextTooltips(text) {
        // Add tooltips for common game terms
        const gameTerms = {
            'AC': 'Armor Class',
            'HP': 'Hit Points',
            'DC': 'Difficulty Class',
            'Fort': 'Fortitude Save',
            'Ref': 'Reflex Save',
            'Will': 'Will Save',
            'Bulk': 'Bulk (encumbrance)',
            'Hardness': 'Damage reduction',
            'Broken Threshold': 'HP when item becomes broken'
        };

        for (const [term, explanation] of Object.entries(gameTerms)) {
            const regex = new RegExp(`\\b${term}\\b`, 'g');
            text = text.replace(regex, `<span class="game-term" title="${explanation}">${term}</span>`);
        }

        return text;
    }
}

// Initialize the parser when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pf2eTextParser = new PF2eTextParser();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PF2eTextParser;
}
if (typeof window !== 'undefined') {
    window.PF2eTextParser = PF2eTextParser;
}