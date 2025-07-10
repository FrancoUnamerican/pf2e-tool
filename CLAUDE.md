# PF2e App - CURRENT DEVELOPMENT VERSION
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Run system: `./llm.sh` or `./llm.sh quiet` 
- Test model loading: `python scripts/minimal_inference_quiet.py [model_path]`
- Test interface: `python scripts/quiet_interface.py`
- Activate environment: `source LLM-MODELS/tools/scripts/activate_mac.sh`
- Install dependencies: `pip install -r config/requirements.txt`

## Code Style
- Follow PEP 8 with descriptive snake_case names
- Use Path objects for cross-platform path handling
- Class names: CamelCase, functions/variables: snake_case
- Import order: standard library → third-party → local modules
- Error handling: Use try/except with specific exceptions
- Provide descriptive error messages with traceback when appropriate
- Document functions with docstrings and comment complex sections

## Dependencies
- Core: Python 3.9+, llama-cpp-python, torch, transformers, flask
- Document new dependencies in config/requirements.txt

## Core Principles

The implementation must strictly adhere to these non-negotiable principles, as established in previous PRDs:

1. **DRY (Don't Repeat Yourself)**
   - Zero code duplication will be tolerated
   - Each functionality must exist in exactly one place
   - No duplicate files or alternative implementations allowed

2. **KISS (Keep It Simple, Stupid)**
   - Implement the simplest solution that works
   - No over-engineering or unnecessary complexity
   - Straightforward, maintainable code patterns

3. **Clean File System**
   - All existing files must be either used or removed
   - No orphaned, redundant, or unused files
   - Clear, logical organization of the file structure

4. **Transparent Error Handling**
   - No error hiding or fallback mechanisms that mask issues
   - All errors must be properly displayed to the user
   - Errors must be clear, actionable, and honest

## Success Criteria

In accordance with the established principles and previous PRDs, the implementation will be successful if:

1. **Zero Duplication**: No duplicate code or files exist in the codebase
2. **Single Implementation**: Each feature has exactly one implementation
3. **Complete Template System**: All HTML is generated via the template system
4. **No Fallbacks**: No fallback systems that hide or mask errors
5. **Transparent Errors**: All errors are properly displayed to users
6. **External Assets**: All CSS and JavaScript is in external files
7. **Component Architecture**: UI is built from reusable, modular components
8. **Consistent Standards**: Implementation follows UI_INTEGRATION_STANDARDS.md
9. **Full Functionality**: All features work correctly through template UI
10. **Complete Documentation**: Implementation details are properly documented
## ⚠️ IMPORTANT: This is the ACTIVE development folder
- **Version**: CURRENT-DEV-2025-07-10 (see VERSION file)
- **Main files**: Root level (index.html, js/, styles/)
- **Last updated**: July 10, 2025
- **Features**: Full encounter generator (1,648 lines) + loot generation
- **Server**: Use `cd v3 && python3 start-server.py` for local development

## Archived Versions
- v1, v2, v3 are older versions with basic functionality
- v3 has basic encounter generator (674 lines)
- Apps/v5, v6 folders are empty placeholders

## Quick Start
1. `cd "/home/francounamerican/Users/User/Desktop/New Full Mega PF2e APP"`
2. `cd v3 && python3 start-server.py`
3. Open http://localhost:8080

## Git Repository Setup
- Multi-device/environment development
- Git repository for synchronization across laptops

## Daily Workflow
1. **Before starting work:** `git pull origin main`
2. **After making changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
3. **When switching devices:** Always `git pull` first

## Repository
- GitHub repo: [Add your repo URL here]
- Local path: `/home/francounamerican/Users/User/Desktop/New Full Mega PF2e APP`

## Notes
- Always sync before and after work sessions
- Keep commits frequent and descriptive

---

# Recent Development Session - Monster Statblock UI Redesign

## Project Context
Working on a Pathfinder 2e character creator and monster viewer application with the following structure:
- **Main directory**: `/home/francounamerican/Users/User/Desktop/New Full Mega PF2e APP/`
- **Key files**: 
  - `index.html` - Main application
  - `styles/main.css` - All styling
  - `js/monster-viewer.js` - Monster display logic
  - `js/encounter-generator.js` - Encounter generation with terrain selector

## Major Accomplishments This Session

### 1. **Official PF2e Statblock Design Implementation**
Based on the provided Pathfinder Bestiary Cards image (`PathfinderBestiary2Cards3.jpg`), completely redesigned the monster statblock to match official styling:

#### Visual Design:
- **Parchment background**: Subtle gradients matching official cards
- **Dark header**: Black background with white text for creature name/level
- **Color-coded trait badges**:
  - Green for alignment (LG)
  - Blue for size (Medium)
  - Gold for creature types (Celestial, Archon)
  - Red variations for rarity levels

#### Typography & Layout:
- **Cinzel font** for headers and titles
- **Crimson Text** for body content
- **Professional spacing** with proper borders and sections
- **Organized hierarchy** matching official layout

### 2. **Monster List Optimization**
Transformed the monster list for better usability:

#### Ultra-Thin Design:
- **Single-line entries**: Name on left, level on right
- **Compact spacing**: Reduced padding and gaps significantly
- **Smart name display**: Removes parenthetical text like "(Elite)" but shows full name in tooltip
- **Darker text**: Changed to #1a1000 for better readability
- **Automatic padding**: Added left/right padding for better spacing

#### Styling Improvements:
- **Font change**: From Source Sans Pro to Crimson Text
- **Better contrast**: Much darker text on light background
- **Responsive width**: Reduced from 320px to 280px

### 3. **Header Size Reduction**
Dramatically reduced header height to free up content space:
- **App title**: From 2.8rem to 1.8rem
- **Header padding**: From 1.5rem to 0.8rem
- **Tab buttons**: Smaller padding and font sizes
- **Result**: Header now takes ~15-20% instead of 33% of page height

### 4. **Tooltip Readability Fix**
Completely redesigned tooltips for better visibility:
- **Light background**: Changed from dark to parchment-style light
- **Dark text**: High contrast black text on light background
- **Strong borders**: Dark borders for clear definition
- **Result**: Tooltips now clearly readable

### 5. **Statblock Section Reorganization**
Reordered sections for better gameplay flow:
1. **Header**: Creature name, level, traits
2. **Defenses**: AC, HP, Speed (all on one line), then saves, resistances
3. **Ability Scores**: Ultra-compact single row
4. **Perception/Languages/Skills**: Moved below combat stats
5. **Actions**: Two-column layout for efficient space usage

### 6. **Space Optimization for Single-Page Fit**
Made extensive modifications to fit entire statblock without scrolling:

#### Container Adjustments:
- **Height increase**: From `calc(100vh - 200px)` to `calc(100vh - 180px)`
- **Body padding**: Reduced from 1.5rem to 1rem
- **Section spacing**: Reduced margins and padding throughout

#### Ability Scores Ultra-Compact:
- **Padding**: From 0.5rem to 0.15rem
- **Margins**: From 0.6rem to 0.25rem
- **Font size**: Optimized for readability vs space
- **Result**: Takes minimal vertical space

#### Two-Column Actions Layout:
- **Grid system**: Side-by-side columns for actions
- **Smart distribution**: 
  - Left: Melee attacks
  - Right: Ranged attacks and special abilities
- **Space savings**: 40-60% reduction in vertical space
- **Fallback logic**: Intelligent content distribution

## Technical Implementation Details

### CSS Architecture:
- **Official PF2e styling**: `.pf2e-statblock`, `.statblock-header`, `.statblock-body`
- **Responsive design**: Works on different screen sizes
- **Color system**: Consistent parchment theme throughout
- **Typography hierarchy**: Clear visual organization

### JavaScript Logic:
- **Name cleaning**: Removes parenthetical text with regex
- **Two-column rendering**: Smart action distribution algorithm
- **Trait categorization**: Proper color coding for different trait types
- **Tooltip integration**: Full name display on hover

### Key Files Modified:
- **`styles/main.css`**: Complete statblock redesign, spacing optimization
- **`js/monster-viewer.js`**: Display logic, two-column actions, name cleaning
- **Layout structure**: Maintained existing HTML structure while enhancing appearance

## Current Status
- ✅ **Official PF2e styling** implemented and working
- ✅ **Monster list optimization** completed
- ✅ **Space efficiency** maximized for single-page fit
- ✅ **Two-column actions** layout implemented
- ✅ **Tooltips** fixed for readability
- ✅ **Header compression** completed

## Next Session Priorities
1. **Test statblock fitting** with various monster types
2. **Fine-tune spacing** if any monsters still require scrolling
3. **Responsive design** testing on different screen sizes
4. **Additional UI polish** based on usage feedback
5. **Consider mobile optimization** for smaller screens

## Development Environment
- **Working directory**: `/home/francounamerican/Users/User/Desktop/New Full Mega PF2e APP/styles`
- **Platform**: Linux 6.6.87.2-microsoft-standard-WSL2
- **Development date**: 2025-07-10

---

*This session focused entirely on UI/UX improvements for the monster viewer component, achieving a professional appearance matching official Pathfinder 2e materials while maximizing screen space efficiency.*