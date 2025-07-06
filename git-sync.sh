#!/bin/bash

# Git Sync Script for SuperMegaPF2EApp
# This script helps automate common Git operations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_error "Not in a Git repository. Please run this script from your project root."
        exit 1
    fi
}

# Function to pull latest changes from GitHub
pull_from_github() {
    print_status "Pulling latest changes from GitHub..."
    
    # Fetch latest changes
    git fetch origin
    
    # Check if there are any changes to pull
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        print_status "Already up to date."
    else
        print_status "Pulling changes..."
        git pull origin main
        if [ $? -eq 0 ]; then
            print_status "Successfully pulled changes from GitHub."
        else
            print_error "Failed to pull changes. Please resolve conflicts manually."
            exit 1
        fi
    fi
}

# Function to push changes to GitHub
push_to_github() {
    print_status "Preparing to push changes to GitHub..."
    
    # Check if there are any changes to commit
    if [ -z "$(git status --porcelain)" ]; then
        print_status "No changes to commit."
        return 0
    fi
    
    # Show status
    print_status "Current repository status:"
    git status --short
    
    # Add all changes
    print_status "Adding all changes..."
    git add .
    
    # Commit with automatic message or custom message
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    print_status "Committing changes with message: '$COMMIT_MSG'"
    git commit -m "$COMMIT_MSG

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    if [ $? -eq 0 ]; then
        print_status "Successfully committed changes."
        
        # Push to GitHub
        print_status "Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            print_status "Successfully pushed changes to GitHub!"
        else
            print_error "Failed to push changes to GitHub."
            exit 1
        fi
    else
        print_error "Failed to commit changes."
        exit 1
    fi
}

# Function to sync (pull then push)
sync_with_github() {
    print_status "Syncing with GitHub (pull + push)..."
    pull_from_github
    push_to_github "$1"
}

# Function to show help
show_help() {
    echo "Git Sync Script for SuperMegaPF2EApp"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  pull                     Pull latest changes from GitHub"
    echo "  push [message]           Push changes to GitHub with optional commit message"
    echo "  sync [message]           Pull then push changes (full sync)"
    echo "  status                   Show repository status"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 pull                  # Pull latest changes"
    echo "  $0 push                  # Push with automatic commit message"
    echo "  $0 push \"Add new feature\" # Push with custom commit message"
    echo "  $0 sync                  # Full sync with automatic message"
    echo "  $0 sync \"Update UI\"      # Full sync with custom message"
}

# Function to show repository status
show_status() {
    print_status "Repository Status:"
    echo ""
    git status
    echo ""
    print_status "Recent commits:"
    git log --oneline -5
}

# Main script logic
main() {
    check_git_repo
    
    case "${1:-help}" in
        pull)
            pull_from_github
            ;;
        push)
            push_to_github "$2"
            ;;
        sync)
            sync_with_github "$2"
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@"