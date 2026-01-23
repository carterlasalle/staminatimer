# Next.js 15 → 16 Upgrade Plan

## Executive Summary

This document outlines the migration plan from Next.js 15.5.9 to Next.js 16.1.4 for the Stamina Timer application.

**Risk Level: LOW-MEDIUM**

The codebase is well-prepared for Next.js 16 with most patterns already following the new conventions. The main work involves:
- Upgrading dependencies
- Decision on middleware → proxy rename
- ESLint config updates
- Testing with Turbopack (now default)

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Breaking Changes Assessment](#breaking-changes-assessment)
3. [Required Changes](#required-changes)
4. [Optional Enhancements](#optional-enhancements)
5. [Implementation Steps](#implementation-steps)
6. [Testing Plan](#testing-plan)
7. [Rollback Plan](#rollback-plan)

---

## Current State Analysis

### Version Matrix

| Package | Current | Target |
|---------|---------|--------|
| next | 15.5.9 | 16.1.4 |
| react | 19.2.3 | 19.2.x (keep) |
| react-dom | 19.2.3 | 19.2.x (keep) |
| eslint-config-next | 15.5.9 | 16.1.4 |
| @types/react | 19.0.0 | 19.x (update) |
| @types/react-dom | 19.0.0 | 19.x (update) |

### Compatibility Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Async Request APIs | ✅ READY | Already using `Promise<>` types and `await params` |
| No custom webpack | ✅ READY | Turbopack will work out of the box |
| ESLint flat config | ✅ READY | Already using `eslint.config.mjs` |
| Using `eslint .` not `next lint` | ✅ READY | Scripts already correct |
| No `next/legacy/image` | ✅ READY | Not used |
| No runtime config | ✅ READY | Uses env vars |
| No AMP | ✅ READY | Not used |
| No `unstable_` APIs | ✅ READY | Not used |

---

## Breaking Changes Assessment

### 1. Turbopack by Default ⚠️ LOW RISK

**Change:** Turbopack is now the default for `next dev` and `next build`.

**Current State:** No custom webpack configuration in `next.config.js`.

**Action Required:**
- Test build with Turbopack (will happen automatically)
- If issues arise, can use `--webpack` flag as fallback

**Risk:** LOW - No custom webpack config means Turbopack should work seamlessly.

---

### 2. Middleware → Proxy Rename ⚠️ DECISION NEEDED

**Change:** The `middleware.ts` filename is deprecated in favor of `proxy.ts`.

**Current State:** `src/middleware.ts` exists and uses:
- Edge runtime (Web Crypto API)
- Supabase SSR authentication
- Cookie-based rate limiting

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| **A: Keep middleware.ts** | No code changes, edge runtime still works | Deprecated naming (may be removed in future) |
| **B: Rename to proxy.ts** | Future-proof naming | nodejs runtime required (no edge), code changes needed |

**Recommendation:** **Option A - Keep as middleware.ts** for now because:
1. Current code uses Edge-compatible APIs (Web Crypto, Supabase SSR)
2. Edge runtime provides better latency for auth checks
3. Can migrate to proxy later when edge runtime support is clarified

**Risk:** LOW - The deprecation warning won't break functionality.

---

### 3. ESLint Changes ⚠️ LOW RISK

**Change:**
- `next lint` command removed
- `@next/eslint-plugin-next` defaults to flat config

**Current State:**
- Already using `eslint .` in package.json scripts ✅
- Already using `eslint.config.mjs` flat config ✅
- CI runs `yarn lint` which calls `eslint .` ✅

**Action Required:**
- Update `eslint-config-next` to 16.1.4
- Verify flat config compatibility

**Risk:** LOW - Already following Next.js 16 patterns.

---

### 4. Async Request APIs ✅ ALREADY COMPLIANT

**Change:** Synchronous access to `cookies`, `headers`, `params`, `searchParams` is fully removed.

**Current State:** All usages already async:

```typescript
// src/app/guides/[slug]/page.tsx - ✅ Correct
type PageProps = {
  params: Promise<{ slug: string }>
}
export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  // ...
}

// src/app/share/[id]/page.tsx - ✅ Correct (client component)
export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // ...
}
```

**Action Required:** None - already compliant.

---

### 5. next/image Changes ⚠️ MINOR IMPACT

**Changes:**
- `minimumCacheTTL` default: 60s → 14400s (4 hours)
- `imageSizes` default: removes 16px
- `qualities` default: restricts to [75]
- Local images with query strings require configuration

**Current State:** No custom image configuration in `next.config.js`.

**Action Required:**
- Review if any images rely on 16px size
- Review if any images use quality props other than 75
- Test image optimization after upgrade

**Risk:** LOW - Default changes are improvements for most apps.

---

### 6. Sitemap Async ID ✅ NOT APPLICABLE

**Change:** `sitemap()` function now receives `id` as a Promise when using `generateSitemaps()`.

**Current State:** `src/app/sitemap.ts` does NOT use `generateSitemaps()` - it's a single static sitemap.

**Action Required:** None.

---

### 7. React Compiler Support 🆕 OPTIONAL

**Change:** React Compiler support is now stable (not enabled by default).

**Potential Benefit:** Automatic memoization, reduced re-renders.

**Action:** Can enable later with `reactCompiler: true` in next.config.

---

## Required Changes

### Phase 1: Dependency Updates

```bash
# 1. Update Next.js and ESLint config
npm install next@16.1.4 eslint-config-next@16.1.4

# 2. Update React types to latest
npm install -D @types/react@latest @types/react-dom@latest
```

### Phase 2: Configuration Updates

**next.config.js** - No changes required (no deprecated options used).

**eslint.config.mjs** - Verify works with updated `eslint-config-next`.

**package.json scripts** - Already correct:
```json
{
  "scripts": {
    "dev": "next dev",      // Turbopack is now default
    "build": "next build",  // Turbopack is now default
    "lint": "eslint ."      // Already using ESLint directly
  }
}
```

### Phase 3: Code Changes

**None required!** The codebase is already compliant with Next.js 16 patterns.

---

## Optional Enhancements

### 1. Enable React Compiler (Performance)

```javascript
// next.config.js
const nextConfig = {
  reactCompiler: true, // Requires babel-plugin-react-compiler
}
```

Requires: `npm install -D babel-plugin-react-compiler`

### 2. Enable Turbopack File System Caching (Dev Performance)

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}
```

### 3. Migrate Middleware to Proxy (Future-Proofing)

When ready to migrate:
1. Rename `src/middleware.ts` → `src/proxy.ts`
2. Rename `export async function middleware` → `export async function proxy`
3. Update `config.matcher` to `config.proxy` if needed
4. Note: Will lose Edge runtime (nodejs only in proxy)

### 4. Use New Caching APIs

Next.js 16 introduces:
- `updateTag()` - for immediate cache updates
- `refresh()` - for client router refresh from Server Actions
- Stable `cacheLife` and `cacheTag` (no `unstable_` prefix)

---

## Implementation Steps

### Step-by-Step Upgrade

```bash
# 1. Create upgrade branch
git checkout -b nextjs-16-upgrade

# 2. Run the Next.js codemod (optional - handles edge cases)
npx @next/codemod@canary upgrade latest

# 3. Install dependencies
npm install next@16.1.4 eslint-config-next@16.1.4
npm install -D @types/react@latest @types/react-dom@latest

# 4. Clear caches
rm -rf .next node_modules
npm install

# 5. Test development server
npm run dev

# 6. Run linting
npm run lint

# 7. Run type checking
npm run typecheck

# 8. Test production build
npm run build

# 9. Test production server
npm run start
```

---

## Testing Plan

### Pre-Upgrade Checklist
- [ ] All tests pass on current version
- [ ] Lint passes
- [ ] Type check passes
- [ ] Production build succeeds

### Post-Upgrade Testing

#### Development Mode
- [ ] `npm run dev` starts without errors
- [ ] Hot reload works
- [ ] All pages render correctly
- [ ] Authentication flow works
- [ ] API routes respond correctly

#### Production Build
- [ ] `npm run build` completes successfully
- [ ] No Turbopack warnings/errors
- [ ] Bundle sizes are reasonable

#### Functionality Testing
- [ ] Home page loads
- [ ] Login/authentication works
- [ ] Training timer functions
- [ ] Dashboard renders with data
- [ ] Charts display correctly
- [ ] AI Coach responds
- [ ] Share functionality works
- [ ] Guide pages render (SSG)
- [ ] Sitemap generates correctly
- [ ] Images load and optimize correctly

#### Middleware Testing
- [ ] Rate limiting works
- [ ] Protected routes redirect to login
- [ ] Auth cookies refresh correctly

---

## Rollback Plan

If issues are encountered:

### Quick Rollback
```bash
# Revert package.json changes
git checkout HEAD -- package.json yarn.lock

# Clear caches and reinstall
rm -rf .next node_modules
npm install
```

### Full Rollback
```bash
# Discard all changes
git checkout main
git branch -D nextjs-16-upgrade
```

### Production Rollback
If deployed and issues arise:
1. Redeploy previous version from Vercel dashboard
2. Or revert to previous commit on main

---

## Timeline Summary

| Step | Description |
|------|-------------|
| 1 | Update dependencies (Next.js, eslint-config-next, @types) |
| 2 | Clear caches and reinstall |
| 3 | Test development server with Turbopack |
| 4 | Run lint and type check |
| 5 | Test production build |
| 6 | Manual smoke testing |
| 7 | Create PR for review |
| 8 | Merge and deploy |
| 9 | Monitor production |

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `package.json` | Update next, eslint-config-next, @types | REQUIRED |
| `yarn.lock` | Regenerated | AUTOMATIC |
| `next.config.js` | No changes needed | - |
| `eslint.config.mjs` | Verify compatibility | VERIFY |
| `src/middleware.ts` | Keep as-is (deprecated but works) | OPTIONAL |

---

## Conclusion

The Stamina Timer codebase is **well-prepared** for Next.js 16:

✅ **Already compliant:**
- Async Request APIs (params/searchParams)
- ESLint flat config
- Using `eslint .` not `next lint`
- No custom webpack config
- No deprecated APIs

⚠️ **Minor considerations:**
- Middleware deprecation warning (keep for now)
- Image default changes (likely non-breaking)

🚀 **Optional enhancements available:**
- React Compiler
- Turbopack file system caching
- New caching APIs

The upgrade should be straightforward with minimal risk.
