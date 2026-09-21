import { z } from 'zod'

/**
 * Zod's single entry point for this app.
 *
 * Zod decides between a generated (JIT) validator and an interpreted one by
 * probing eval support: it constructs a `Function` inside a try/catch. The
 * production Content-Security-Policy deliberately omits `'unsafe-eval'`, so that
 * probe is blocked by the browser and reported as a CSP violation in the console
 * on every page that validates anything — even though zod catches the failure and
 * falls back correctly.
 *
 * Declaring `jitless` up front skips the probe and pins zod to the interpreter it
 * would have fallen back to anyway, so behaviour is unchanged and the console
 * noise is gone. Import `z` from here rather than from `zod` directly.
 */
z.config({ jitless: true })

export { z }
