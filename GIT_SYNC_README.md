# Git Sync Scripts

These scripts help automate common Git operations for the SuperMegaPF2EApp project.

## Available Scripts

- `git-sync.sh` - For Linux/macOS/WSL
- `git-sync.bat` - For Windows Command Prompt

## Usage

### Linux/macOS/WSL
```bash
# Make script executable (first time only)
chmod +x git-sync.sh

# Pull latest changes from GitHub
./git-sync.sh pull

# Push changes with automatic commit message
./git-sync.sh push

# Push changes with custom commit message
./git-sync.sh push "Add new character creator features"

# Full sync (pull + push)
./git-sync.sh sync

# Full sync with custom message
./git-sync.sh sync "Update Pathfinder 2E styling"

# Show repository status
./git-sync.sh status

# Show help
./git-sync.sh help
```

### Windows
```cmd
# Pull latest changes from GitHub
git-sync.bat pull

# Push changes with automatic commit message
git-sync.bat push

# Push changes with custom commit message
git-sync.bat push "Add new character creator features"

# Full sync (pull + push)
git-sync.bat sync

# Full sync with custom message
git-sync.bat sync "Update Pathfinder 2E styling"

# Show repository status
git-sync.bat status

# Show help
git-sync.bat help
```

## Features

- **Automatic commit messages**: If no message is provided, creates timestamped commit messages
- **Error handling**: Checks for common issues and provides helpful error messages
- **Status checking**: Shows what changes will be committed before pushing
- **Cross-platform**: Works on Linux, macOS, Windows, and WSL
- **Safe operations**: Checks if you're in a Git repository before running commands

## Quick Start

1. **First time setup**: Make sure you're in your project directory
2. **To save your work**: `./git-sync.sh sync "Describe your changes"`
3. **To get latest updates**: `./git-sync.sh pull`
4. **To backup everything**: `./git-sync.sh push`

## Tips

- Use descriptive commit messages when possible
- Run `sync` when you want to both get updates and save your work
- Use `status` to see what changes you have before committing
- The scripts automatically add the Claude Code signature to commits