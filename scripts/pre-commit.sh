#!/bin/bash

# Pre-commit script for mi-campus-saas
# Runs all quality checks before allowing commit

set -e

# Parse command line arguments
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-tests]"
            exit 1
            ;;
    esac
done

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

# 1. Format code
print_status "Formatting code..."
yarn format
print_success "Code formatting complete"

# 2. Lint code
print_status "Linting code..."
yarn lint
print_success "Linting complete"

# 3. Type checking
print_status "Checking TypeScript types..."

# Frontend type check
print_status "  Frontend type check..."
cd apps/frontend
yarn tsc --noEmit
cd ../..
print_success "  Frontend types OK"

# Backend type check
print_status "  Backend type check..."
cd apps/backend
yarn tsc --noEmit
cd ../..
print_success "  Backend types OK"

print_success "Type checking complete"

    # 4. Run tests (unless skipped)
    if [ "$SKIP_TESTS" = false ]; then
        print_status "Running tests..."

        # Backend tests
        print_status "  Backend tests..."
        yarn test
        print_success "  Backend tests passed"

        # Frontend tests (if any)
        if [ -f "apps/frontend/package.json" ] && grep -q '"test"' apps/frontend/package.json; then
            print_status "  Frontend tests..."
            cd apps/frontend
            yarn test
            cd ../..
            print_success "  Frontend tests passed"
        else
            print_warning "  No frontend tests configured"
        fi

        print_success "Tests complete"
    else
        print_warning "Skipping tests (--skip-tests flag used)"
    fi

# 5. Build check
print_status "Building applications..."

# Frontend build
print_status "  Frontend build..."
yarn --cwd apps/frontend build
print_success "  Frontend build successful"

# Backend build
print_status "  Backend build..."
yarn --cwd apps/backend build
print_success "  Backend build successful"

print_success "Build check complete"

# 6. Optional: Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes after formatting"
    print_status "You may want to review and commit these changes"
fi

echo ""
print_success "All pre-commit checks passed! 🎉"
echo ""
print_status "You can now commit your changes safely."
