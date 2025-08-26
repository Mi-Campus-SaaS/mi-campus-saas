# Gitleaks Setup Guide

## Overview

This project uses Gitleaks for secret scanning. Gitleaks has recently changed to a licensed model, but we provide both licensed and open-source options.

## License Options

### Option 1: Licensed Version (Recommended)

1. **Get a License**: Visit [gitleaks.io](https://gitleaks.io) to obtain a license
2. **Add to GitHub Secrets**:
   - Go to your repository settings
   - Navigate to Secrets and variables → Actions
   - Add a new secret named `GITLEAKS_LICENSE`
   - Paste your license key as the value

### Option 2: Open Source Version (Fallback)

If you don't have a license, the workflow will automatically fall back to the open-source version of Gitleaks.

## How It Works

The CI workflows are configured to:

1. **Check for License**: First try to use the licensed version if `GITLEAKS_LICENSE` secret is available
2. **Fallback**: If no license is found, automatically use the open-source version
3. **Report**: Generate JSON reports with detailed findings
4. **Fail on Secrets**: CI will fail if any secrets are detected (except allowlisted patterns)

## Configuration

### Gitleaks Config (`.gitleaks.toml`)

The configuration file includes:

- **Entropy threshold**: 7.0 (detects high-entropy strings)
- **Allowlist patterns**: Reduces false positives
- **Custom rules**: Project-specific patterns
- **Test exemptions**: Allows test JWT secrets

### Test Environment Exemptions

The following patterns are explicitly allowlisted for testing:

```bash
# Test JWT secrets (CI environment)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-testing
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long-for-testing
```

## Local Development

### Install Gitleaks Locally

```bash
# macOS
brew install gitleaks

# Linux
# Download from https://github.com/gitleaks/gitleaks/releases

# Windows
# Download from https://github.com/gitleaks/gitleaks/releases
```

### Run Scans Locally

```bash
# Run secret scan
yarn security:scan

# Run dependency audit
yarn security:audit

# Run both
yarn security:check
```

## Troubleshooting

### Common Issues

1. **"missing gitleaks license"**:
   - Add `GITLEAKS_LICENSE` secret to GitHub repository
   - Or the workflow will automatically use open-source version

2. **"Unexpected input(s)"**:
   - The workflow has been updated to handle both licensed and open-source versions
   - No action needed

3. **False Positives**:
   - Add patterns to the allowlist in `.gitleaks.toml`
   - Document the reason in `SECURITY.md`

### Adding Exemptions

1. **Secret Scanning Exemptions**:
   - Add patterns to `.gitleaks.toml` allowlist
   - Document the reason in `SECURITY.md`
   - Review exemptions quarterly

2. **Dependency Audit Exemptions**:
   - Add to `yarn-audit-exemptions.json`
   - Include justification and timeline
   - Set expiration date

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive configuration
3. **Rotate secrets regularly** in production
4. **Review dependencies** before adding new packages
5. **Keep dependencies updated** to latest secure versions

## Monitoring

- **Daily**: Automated scans in CI
- **Weekly**: Manual review of security reports
- **Monthly**: Dependency update review
- **Quarterly**: Exemption review and cleanup

## Support

For issues with:

- **Gitleaks licensing**: Contact [gitleaks.io](https://gitleaks.io)
- **Configuration**: Check `.gitleaks.toml` and `SECURITY.md`
- **CI/CD**: Review workflow files in `.github/workflows/`
