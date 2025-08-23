# Security Policy

## Secret Scanning & Dependency Audit

This project implements comprehensive security measures to detect secrets and vulnerable dependencies.

### Secret Scanning (Gitleaks)

We use [Gitleaks](https://github.com/gitleaks/gitleaks) to scan for secrets, API keys, tokens, and other sensitive data in our codebase.

#### Configuration

- **Config file**: `.gitleaks.toml`
- **Entropy threshold**: 7.0 (detects high-entropy strings that might be secrets)
- **Scan scope**: All files except allowlisted patterns

#### Allowlisted Patterns

The following patterns are allowlisted to reduce false positives:

- Test files and fixtures (`tests/`, `*.test.*`, `*.spec.*`)
- Documentation (`*.md`, `docs/`)
- Generated files (`node_modules/`, `dist/`, `build/`)
- Lock files (`yarn.lock`, `package-lock.json`)
- IDE files (`.vscode/`, `.idea/`)
- Example/template values (`postgres`, `localhost`, `example.com`)

#### Test Environment Exemptions

The following test-specific patterns are explicitly allowlisted:

```bash
# Test JWT secrets (CI environment)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-testing
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long-for-testing
```

#### Custom Rules

We define project-specific rules for:

- MI Campus test JWT secrets
- Database connection strings
- API keys and tokens

### Dependency Audit (Yarn Audit)

We use `yarn audit` to scan for known vulnerabilities in our dependencies.

#### Severity Levels

- **Critical**: Immediate action required
- **High**: Action required within 24 hours
- **Moderate**: Action required within 1 week
- **Low**: Action required within 1 month

#### CI Behavior

- **Fails on**: Critical and High severity vulnerabilities
- **Warns on**: Moderate and Low severity vulnerabilities
- **Exemptions**: Tracked in `yarn-audit-exemptions.json`

### Exemptions Management

#### Adding Exemptions

1. **Secret Scanning Exemptions**:
   - Add patterns to `.gitleaks.toml` allowlist
   - Document the reason in this file
   - Review exemptions quarterly

2. **Dependency Audit Exemptions**:
   - Add to `yarn-audit-exemptions.json`
   - Include justification and timeline
   - Set expiration date

#### Exemption Review Process

- **Quarterly review**: All exemptions are reviewed every 3 months
- **Expiration**: Exemptions automatically expire if not renewed
- **Justification**: Each exemption must have a documented reason

### CI Integration

Both security scans run in our CI pipeline:

```yaml
# Secret scanning
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
  with:
    config-path: .gitleaks.toml
    fail-on: true

# Dependency audit
- name: Run Yarn Audit
  run: yarn audit --level high
```

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. **Do** contact the security team directly
3. **Do** provide detailed information about the vulnerability
4. **Do** include steps to reproduce if possible

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for sensitive configuration
3. **Rotate secrets regularly** in production
4. **Review dependencies** before adding new packages
5. **Keep dependencies updated** to latest secure versions

### Monitoring

- **Daily**: Automated scans in CI
- **Weekly**: Manual review of security reports
- **Monthly**: Dependency update review
- **Quarterly**: Exemption review and cleanup
