# New Full Mega PF2e APP

A comprehensive Pathfinder 2e application with multiple versions and shared game data.

## Project Structure

```
New Full Mega PF2e APP/
├── apps/                    # Application versions
│   ├── v1/                 # Version 1 (upcoming)
│   ├── v2/                 # Version 2 (future)
│   └── ...                 # Additional versions
└── shared-data/            # Shared Pathfinder 2e game data
    └── packs/              # Game data packs
        ├── actions/        # Character actions
        ├── ancestries/     # Character ancestries
        ├── backgrounds/    # Character backgrounds
        └── ...             # Additional game content
```

## Features

- Multi-version architecture allowing parallel development
- Shared game data to prevent duplication
- Pathfinder 2e comprehensive game content
- Electron-based desktop application
- Web-based interface option

## Development

Each app version can be developed independently while sharing the same game data located in `shared-data/packs/`.

## Getting Started

1. Clone this repository
2. Navigate to the desired app version (e.g., `apps/v1/`)
3. Install dependencies: `npm install`
4. Run the application: `npm start`

## Data Structure

All Pathfinder 2e game data is centralized in `shared-data/packs/` and includes:
- Character actions and abilities
- Ancestries and heritage options
- Character backgrounds
- Adventure-specific content
- Bestiary entries
- And much more...