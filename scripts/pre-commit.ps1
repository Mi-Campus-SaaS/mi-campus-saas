# Pre-commit script for mi-campus-saas (PowerShell version)
# Runs all quality checks before allowing commit

param(
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Must run from project root directory"
    exit 1
}

try {
    # 1. Format code
    Write-Status "Formatting code..."
    yarn format
    Write-Success "Code formatting complete"

    # 2. Lint code
    Write-Status "Linting code..."
    yarn lint
    Write-Success "Linting complete"

    # 3. Type checking
    Write-Status "Checking TypeScript types..."

    # Frontend type check
    Write-Status "  Frontend type check..."
    Push-Location apps/frontend
    yarn tsc --noEmit
    Pop-Location
    Write-Success "  Frontend types OK"

    # Backend type check
    Write-Status "  Backend type check..."
    Push-Location apps/backend
    yarn tsc --noEmit
    Pop-Location
    Write-Success "  Backend types OK"

    Write-Success "Type checking complete"

    # 4. Run tests (unless skipped)
    if (-not $SkipTests) {
        Write-Status "Running tests..."

        # Backend tests
        Write-Status "  Backend tests..."
        yarn test
        Write-Success "  Backend tests passed"

        # Frontend tests (if any)
        $frontendPackageJson = "apps/frontend/package.json"
        if ((Test-Path $frontendPackageJson) -and (Get-Content $frontendPackageJson | Select-String '"test"')) {
            Write-Status "  Frontend tests..."
            Push-Location apps/frontend
            yarn test
            Pop-Location
            Write-Success "  Frontend tests passed"
        } else {
            Write-Warning "  No frontend tests configured"
        }

        Write-Success "Tests complete"
    } else {
        Write-Warning "Skipping tests (--SkipTests flag used)"
    }

    # 5. Build check
    Write-Status "Building applications..."

    # Frontend build
    Write-Status "  Frontend build..."
    yarn --cwd apps/frontend build
    Write-Success "  Frontend build successful"

    # Backend build
    Write-Status "  Backend build..."
    yarn --cwd apps/backend build
    Write-Success "  Backend build successful"

    Write-Success "Build check complete"

    # 6. Optional: Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "There are uncommitted changes after formatting"
        Write-Status "You may want to review and commit these changes"
    }

    Write-Host ""
    Write-Success "All pre-commit checks passed! 🎉"
    Write-Host ""
    Write-Status "You can now commit your changes safely."

} catch {
    Write-Error "Pre-commit check failed: $($_.Exception.Message)"
    exit 1
} 
