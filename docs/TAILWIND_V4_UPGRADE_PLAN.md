# Tailwind CSS v3 → v4 Upgrade Plan

## Executive Summary

This document outlines the migration plan from Tailwind CSS v3.4.17 to v4.x for the Stamina Timer application.

**Risk Level: MEDIUM-HIGH**

Tailwind v4 is a significant rewrite with CSS-first configuration, new package structure, and many utility renames. The upgrade tool will automate most changes, but careful review is required.

**Note:** Project is already on Next.js 16.1.4 with React Compiler and Turbopack enabled.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Breaking Changes Assessment](#breaking-changes-assessment)
3. [Package Changes](#package-changes)
4. [Required Migrations](#required-migrations)
5. [Implementation Steps](#implementation-steps)
6. [Testing Plan](#testing-plan)
7. [Rollback Plan](#rollback-plan)

---

## Current State Analysis

### Current Package Versions

| Package | Version | v4 Status |
|---------|---------|-----------|
| next | 16.1.4 | ✅ Already upgraded |
| tailwindcss | 3.4.17 | → 4.x |
| tailwindcss-animate | 1.0.7 | → v4-compatible version |
| tailwind-merge | 2.6.0 | → 3.x (v4 compatible) |
| class-variance-authority | 0.7.1 | Compatible |
| clsx | 2.1.1 | Compatible |
| autoprefixer | 10.4.23 | No longer needed (built-in) |

### Framework Status
- **Next.js 16.1.4** ✅ (with React Compiler, Turbopack)
- **ESLint** ✅ Already using flat config format
- **React 19.2.3** ✅

### Configuration Files

| File | Current | Required Changes |
|------|---------|------------------|
| `tailwind.config.ts` | JS config | Migrate to CSS `@theme` |
| `postcss.config.mjs` | `tailwindcss: {}` | `@tailwindcss/postcss: {}` |
| `globals.css` | `@tailwind` directives | `@import "tailwindcss"` |

### Custom Utilities Found

The project has extensive custom utilities in `globals.css`:
- Custom animations (border-beam, text-clip-reveal, stagger, marquee, etc.)
- Component styles (auth-container, glass, glow effects)
- Safe area utilities
- Custom scrollbar styles

**These will need to be migrated from `@layer components` to `@utility` directive.**

---

## Breaking Changes Assessment

### 1. Renamed Utilities ⚠️ HIGH IMPACT

Found **27 occurrences** across **16 files** of utilities that change meaning in v4:

| v3 Utility | v4 Utility | Impact |
|------------|------------|--------|
| `shadow-sm` | `shadow-xs` | Shadow scale shifted |
| `shadow` | `shadow-sm` | Shadow scale shifted |
| `rounded-sm` | `rounded-xs` | Radius scale shifted |
| `rounded` | `rounded-sm` | Radius scale shifted |
| `blur-sm` | `blur-xs` | Blur scale shifted |
| `outline-none` | `outline-hidden` | Renamed for clarity |

**Files affected:**
- `src/components/ui/*.tsx` (multiple)
- `src/components/AICoachChat.tsx`
- `src/components/Achievements.tsx`
- `src/components/OnboardingTutorial.tsx`
- `src/app/page.tsx`
- `src/app/login/page.tsx`

### 2. Default Ring Width Change ⚠️ MEDIUM IMPACT

- v3: `ring` = 3px
- v4: `ring` = 1px

**Action:** Replace `ring` with `ring-3` where 3px width is expected.

### 3. Default Border Color Change ⚠️ MEDIUM IMPACT

- v3: `border` defaults to `gray-200`
- v4: `border` defaults to `currentColor`

**Action:** Explicitly add border colors where needed.

### 4. CSS Directives Change ⚠️ HIGH IMPACT

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

### 5. Custom Utilities Migration ⚠️ HIGH IMPACT

```css
/* v3 */
@layer components {
  .my-utility { /* ... */ }
}

/* v4 */
@utility my-utility {
  /* ... */
}
```

### 6. Theme Configuration ⚠️ HIGH IMPACT

```css
/* v4 - CSS-first configuration */
@theme {
  --color-background: hsl(220 20% 6%);
  --color-primary: hsl(156 100% 51%);
  --font-family-sans: 'Albert Sans', system-ui, sans-serif;
  --radius-lg: 0.75rem;
}
```

### 7. PostCSS Plugin Change ⚠️ MEDIUM IMPACT

```javascript
// v3
plugins: { tailwindcss: {} }

// v4
plugins: { "@tailwindcss/postcss": {} }
```

---

## Package Changes

### Remove
```bash
npm uninstall autoprefixer  # Built into Tailwind v4
```

### Update
```bash
npm install tailwindcss@latest
npm install tailwind-merge@latest  # v3.x for v4 compatibility
npm install @tailwindcss/postcss   # New PostCSS plugin
```

### Check Compatibility
- `tailwindcss-animate` - Check for v4-compatible version or migrate animations to CSS

---

## Required Migrations

### Phase 1: Run Upgrade Tool

```bash
npx @tailwindcss/upgrade
```

The upgrade tool will:
1. Update dependencies
2. Migrate `tailwind.config.ts` to CSS `@theme`
3. Update `@tailwind` directives to `@import`
4. Rename deprecated utilities in templates
5. Update PostCSS config

### Phase 2: Manual Migrations

#### 2.1 Custom Utilities (`globals.css`)

Migrate from `@layer components` to `@utility`:

```css
/* Before */
@layer components {
  .glass {
    backdrop-filter: blur(16px) saturate(180%);
    /* ... */
  }
}

/* After */
@utility glass {
  backdrop-filter: blur(16px) saturate(180%);
  /* ... */
}
```

#### 2.2 Theme Variables

The current theme uses CSS variables wrapped in `hsl()`. In v4, define them in `@theme`:

```css
@theme {
  /* Colors */
  --color-background: hsl(220 20% 6%);
  --color-foreground: hsl(220 10% 96%);
  --color-primary: hsl(156 100% 51%);
  --color-primary-foreground: hsl(220 20% 6%);
  /* ... */

  /* Radius */
  --radius-lg: 0.75rem;
  --radius-md: calc(0.75rem - 2px);
  --radius-sm: calc(0.75rem - 4px);

  /* Fonts */
  --font-family-sans: 'Albert Sans', system-ui, sans-serif;
  --font-family-display: 'Bricolage Grotesque', Georgia, serif;
}
```

#### 2.3 tailwind-merge Update

Update to v3.x which supports Tailwind v4:

```bash
npm install tailwind-merge@latest
```

The `cn()` utility should continue to work unchanged.

#### 2.4 tailwindcss-animate

Check if `tailwindcss-animate` has a v4-compatible version. If not, migrate animations to plain CSS keyframes (which the project already has many of).

---

## Implementation Steps

### Step 1: Create Upgrade Branch
```bash
git checkout -b tailwind-v4-upgrade
```

### Step 2: Run Upgrade Tool
```bash
npx @tailwindcss/upgrade
```

### Step 3: Review and Fix Automated Changes
- Review renamed utilities
- Verify theme migration
- Check PostCSS config

### Step 4: Manual Migrations
- Migrate custom utilities from `@layer components` to `@utility`
- Update any remaining deprecated patterns
- Test `tailwind-merge` compatibility

### Step 5: Update Dependencies
```bash
npm install tailwind-merge@latest
npm uninstall autoprefixer  # If still present
```

### Step 6: Test Build
```bash
npm run build
npm run dev
```

### Step 7: Visual Review
- Test all pages in browser
- Verify shadows, borders, and rounded corners
- Check dark mode
- Test responsive layouts

---

## Testing Plan

### Automated Tests
- [ ] Build passes without errors
- [ ] Type check passes
- [ ] Lint passes

### Visual Regression Testing

| Page | Check |
|------|-------|
| Home (`/`) | Hero section, buttons, cards |
| Login (`/login`) | Form inputs, OAuth buttons |
| Dashboard (`/dashboard`) | Charts, cards, navigation |
| Training (`/training`) | Timer, controls, overlays |
| Progress (`/progress`) | Charts, statistics |
| Settings (`/settings`) | Form controls, switches |
| Guides (`/guides/*`) | Typography, layout |

### Component Checks
- [ ] Shadows look correct (not too small/large)
- [ ] Border radius looks correct
- [ ] Ring focus states work
- [ ] Border colors are correct
- [ ] Dark mode transitions work
- [ ] Animations play correctly

---

## Rollback Plan

### Quick Rollback
```bash
git checkout HEAD -- package.json yarn.lock
git checkout HEAD -- tailwind.config.ts postcss.config.mjs
git checkout HEAD -- src/app/globals.css
rm -rf node_modules .next
npm install
```

### Full Rollback
```bash
git checkout main
git branch -D tailwind-v4-upgrade
```

---

## Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `package.json` | Update dependencies | REQUIRED |
| `tailwind.config.ts` | Migrate to CSS (or remove) | REQUIRED |
| `postcss.config.mjs` | Use @tailwindcss/postcss | REQUIRED |
| `src/app/globals.css` | Update directives, migrate utilities | REQUIRED |
| `src/components/ui/*.tsx` | Rename utilities (automated) | REQUIRED |
| `src/components/*.tsx` | Rename utilities (automated) | REQUIRED |
| `src/app/**/*.tsx` | Rename utilities (automated) | REQUIRED |
| `src/lib/utils.ts` | Verify tailwind-merge works | VERIFY |

---

## Estimated Utility Renames

Based on grep analysis:

| Pattern | Count | Files |
|---------|-------|-------|
| `shadow-sm` | ~10 | UI components |
| `rounded-sm` | ~5 | Cards, buttons |
| `outline-none` | ~5 | Focus states |
| `blur-sm` | ~2 | Backdrop effects |
| Other | ~5 | Various |
| **Total** | **~27** | **16 files** |

---

## Browser Support

Tailwind v4 requires:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

**Current project targets:** Already compatible (Next.js 16 has similar requirements).

---

## Conclusion

The Tailwind v4 upgrade is a significant change but manageable:

✅ **Automated by upgrade tool:**
- Utility renames
- Directive changes
- PostCSS config

⚠️ **Manual work required:**
- Custom utility migration (`@utility` directive)
- Theme verification
- Visual regression testing

🔄 **Package updates:**
- `tailwind-merge` → v3.x
- Remove `autoprefixer`
- Check `tailwindcss-animate` compatibility

The upgrade tool will handle most of the work. Plan for 1-2 hours of manual review and testing.
