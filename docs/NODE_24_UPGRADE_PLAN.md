# Node.js 20 to 24 LTS Upgrade Plan

## Executive Summary

This document outlines the upgrade plan from Node.js 20 to Node.js 24 LTS for the Stamina Timer application. **The codebase is in excellent condition** with no deprecated APIs found, making this upgrade straightforward.

**Risk Level: LOW**

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Breaking Changes Assessment](#breaking-changes-assessment)
3. [Required Changes](#required-changes)
4. [Optional Enhancements](#optional-enhancements)
5. [Testing Plan](#testing-plan)
6. [Rollback Plan](#rollback-plan)
7. [Implementation Steps](#implementation-steps)

---

## Current State Analysis

### Node.js Version Configuration
| Location | Current Value | Status |
|----------|---------------|--------|
| `.github/workflows/ci.yml` | `node-version: '20.x'` | Needs update |
| `package.json` | No `engines` field | Optional enhancement |
| `.nvmrc` | Not present | Optional enhancement |
| `.node-version` | Not present | Optional enhancement |

### Dependency Compatibility

| Package | Version | Node 24 Support | Status |
|---------|---------|-----------------|--------|
| Next.js | 15.5.9 | `>= 20.0.0` | Compatible |
| sharp | 0.34.5 | `>=21.0.0` | Compatible |
| TypeScript | 5.8.3 | Compatible | Compatible |
| ESLint | 9.x | Compatible | Compatible |
| Vitest | 4.0.17 | Compatible | Compatible |

### Native Addons Inventory
- **sharp** (v0.34.5): Image processing library with native bindings
  - Status: Fully compatible with Node 24
  - Action: Will rebuild automatically during `npm install`/`yarn install`

---

## Breaking Changes Assessment

### Deprecated APIs Scanned (All Clear)

| Deprecation | API | Status |
|-------------|-----|--------|
| DEP0154 | `crypto.generateKeyPair` with `hash`/`mgf1Hash` | NOT USED |
| DEP0176 | `fs.F_OK`, `fs.R_OK`, `fs.W_OK`, `fs.X_OK` | NOT USED |
| DEP0178 | `dirent.path` (use `dirent.parentPath`) | NOT USED |
| DEP0081 | `fs.truncate` with file descriptor | NOT USED |
| DEP0100 | `process.assert` | NOT USED |

### OpenSSL 3.5 Security Level Assessment

Node.js 24 uses OpenSSL 3.5 with security level 2, which prohibits:
- RSA, DSA, DH keys shorter than 2048 bits
- ECC keys shorter than 224 bits
- RC4 cipher suites

**Application Status: COMPLIANT**
- Crypto usage: Web Crypto API (`crypto.subtle`) with SHA-256 HMAC
- No weak keys or deprecated ciphers used

### fetch() and AbortSignal Compliance

The application uses standard `fetch()` patterns in:
- `src/lib/gemini.ts` - API calls
- `public/sw.js` - Service worker caching

**Status: COMPLIANT** - All fetch usage follows modern standards.

### Buffer Behavioral Changes

**Status: NOT APPLICABLE** - No direct `Buffer` manipulation found in application code.

---

## Required Changes

### 1. Update CI Workflow (REQUIRED)

**File:** `.github/workflows/ci.yml`

```yaml
# Before
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'

# After
- uses: actions/setup-node@v4
  with:
    node-version: '24.x'
```

### 2. Rebuild Native Dependencies (AUTOMATIC)

When running `yarn install` or `npm install` with Node 24, native addons will automatically rebuild:
- `sharp` will recompile for Node 24

---

## Optional Enhancements

### 1. Add `engines` Field to package.json

```json
{
  "engines": {
    "node": ">=24.0.0"
  }
}
```

**Benefits:**
- Prevents accidental use with older Node versions
- Clear documentation of Node version requirement

### 2. Create `.nvmrc` File

```
24
```

**Benefits:**
- Developers can run `nvm use` to automatically switch to correct Node version
- Consistent development environment

### 3. Create `.node-version` File (asdf compatibility)

```
24
```

**Benefits:**
- Compatibility with asdf version manager

### 4. Utilize Node 24 Features (Future Enhancement)

Node 24 includes several new features that could be leveraged:

| Feature | Potential Use |
|---------|--------------|
| Native SQLite support | Local caching, analytics |
| Improved test runner | Replace/augment Vitest |
| URLPattern API | Route matching in middleware |
| Built-in fetch improvements | Better error handling |

---

## Testing Plan

### Pre-Upgrade Testing (with Node 20)
1. Run full test suite: `yarn test` (if tests exist)
2. Run type checking: `yarn typecheck`
3. Run linting: `yarn lint`
4. Run production build: `yarn build`
5. Manual smoke test of critical features

### Post-Upgrade Testing (with Node 24)
1. Clean install dependencies:
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```
2. Verify native addons compiled: Check for no errors during install
3. Run full test suite: `yarn test`
4. Run type checking: `yarn typecheck`
5. Run linting: `yarn lint`
6. Run production build: `yarn build`
7. Start development server: `yarn dev`
8. Manual smoke test:
   - [ ] Home page loads
   - [ ] Authentication works
   - [ ] Timer functionality works
   - [ ] AI Coach responds
   - [ ] Dashboard renders charts
   - [ ] Image optimization works (sharp)

### Performance Baseline Comparison
- Compare build times before and after
- Compare cold start times
- Monitor memory usage in production

---

## Rollback Plan

If issues are encountered:

1. **CI Rollback:**
   - Revert `.github/workflows/ci.yml` to use `node-version: '20.x'`

2. **Local Rollback:**
   - Switch back to Node 20: `nvm use 20`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall: `yarn install`

3. **Production Rollback:**
   - Vercel: Configure Node version in project settings to 20.x
   - Redeploy previous deployment

---

## Implementation Steps

### Phase 1: Local Development Testing

```bash
# 1. Install Node 24 (using nvm)
nvm install 24
nvm use 24

# 2. Verify Node version
node --version  # Should show v24.x.x

# 3. Clean install dependencies
rm -rf node_modules yarn.lock
yarn install

# 4. Run validation checks
yarn typecheck
yarn lint
yarn build

# 5. Test development server
yarn dev
```

### Phase 2: CI/CD Updates

1. Update `.github/workflows/ci.yml`
2. Optionally add `.nvmrc` and update `package.json`
3. Push changes to feature branch
4. Verify CI passes

### Phase 3: Production Deployment

1. Merge to main branch
2. Verify Vercel auto-detects Node 24 (or configure explicitly)
3. Monitor deployment logs
4. Run smoke tests on production

---

## Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `.github/workflows/ci.yml` | Update Node version | REQUIRED |
| `package.json` | Add engines field | RECOMMENDED |
| `.nvmrc` | Create new file | OPTIONAL |
| `.node-version` | Create new file | OPTIONAL |

---

## Timeline

| Step | Description |
|------|-------------|
| 1 | Local testing with Node 24 |
| 2 | Update CI configuration |
| 3 | Create PR for review |
| 4 | Merge and deploy |
| 5 | Monitor production |

---

## Conclusion

The Stamina Timer codebase is well-prepared for the Node.js 24 upgrade:

- **No deprecated APIs** found in application code
- **All dependencies** support Node 24
- **Crypto implementation** uses modern Web Crypto API
- **Single required change**: Update CI workflow Node version

The upgrade is low-risk and can be completed quickly with proper testing.
