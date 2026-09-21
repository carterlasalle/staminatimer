# Vendored anti-slop Oxlint plugin

This directory is vendored, repository-owned code. The repository owns its rules,
diagnostics, tests, and configuration; upstream changes are brought in
deliberately rather than by dependency bump.

Source: [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop)

Upstream revision: `e6676e8d0bf17c678cb45b9dacb2bd6ca8dea53a` (2026-08-31), the latest
commit touching `skills/install-anti-slop/assets/anti-slop`. Verified, not
assumed: `index.ts`, `rules/no-array-filter-map.ts`, and
`rules/require-readable-spacing.ts` all hash-match the upstream blobs at that
revision.

Install method: `npx skills add dmmulroy/anti-slop --skill install-anti-slop`,
then `node .agents/skills/install-anti-slop/scripts/install.mjs` from the
repository root, which copies `assets/anti-slop` to `tools/oxlint/anti-slop`.
The Skills CLI records the skill itself in `skills-lock.json`
(`computedHash: 4031728fbe75bdcad6ee3208fd52b5d66e167b056fefee1fa9758e9a6cb9c0c8`).

## Installed plugin paths

- `tools/oxlint/anti-slop/index.ts` — generic plugin, registered as `anti-slop`.
- `tools/oxlint/anti-slop/effect/index.ts` — opt-in Effect plugin, **not registered**.
- `tools/oxlint/anti-slop/rules/*.ts` — the 18 generic rules.
- `tools/oxlint/anti-slop/shared/*.ts` — rule-shared scope, AST and type helpers.
- `tools/oxlint/anti-slop/vendor/eslint-stylistic/` — vendored
  `padding-line-between-statements`, with its own `UPSTREAM.md` and `LICENSE`.

## Registration

`.oxlintrc.json` (not `oxlint.config.ts`, which emits a
`MODULE_TYPELESS_PACKAGE_JSON` warning because this package is not
`"type": "module"`) registers the plugin and enables all 18 generic rules plus
the native `oxc/no-accumulating-spread` companion at `error`. Dependency pins:
`oxlint@1.83.0` and `@oxlint/plugins@1.83.0`, exact, in `devDependencies`.

The plugin directory is excluded from the repository's other tooling so vendored
code is never treated as application source:

- `eslint.config.mjs` — `ignores`
- `tsconfig.json` — `exclude`
- `.prettierignore`
- `.oxlintrc.json` — `ignorePatterns`

`.agents/`, `.claude/`, `.omp/`, and the other agent-harness directories are
excluded on the same grounds: installed skills and generated agent configuration
are not application source.

## Intentional deviations

None in the copied source. The only local choices are the JSON config format
above, and the fact that this repository's ESLint pass
(`eslint.config.mjs`) remains the primary lint gate — anti-slop runs as the
explicit `yarn lint:oxlint` command rather than being folded into `yarn lint`.

The Effect plugin is registered nowhere: this repository has no direct `effect`
dependency and Effect rules were not requested.

## Current limitations

- The upstream rule tests (`rules/require-readable-spacing.test.ts`,
  `rules/require-readable-spacing-cli.test.ts`, and the other `*.test.ts` files
  referenced by the nested `vendor/eslint-stylistic/UPSTREAM.md`) are **not**
  shipped in the skill assets, so they are not present here. This installation
  therefore carries no local conformance suite for the copied rules.
- `no-array-filter-map` deliberately does not infer unknown receiver types.
- `no-reduce-accumulator-copy` does not fully analyze named callbacks, indirect
  helpers, or nested accumulator properties.
- The Effect rule set covers relative project imports only; package-alias
  imports are not enforced.

## Updating

Follow the skill's update procedure (`references/update.md`) rather than
`--force` copying. Fetch an explicit upstream revision, diff it against
`e6676e8d0bf17c678cb45b9dacb2bd6ca8dea53a`, port the relevant changes, keep the
nested license and provenance files, and refresh this record.
