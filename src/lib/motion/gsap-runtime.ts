'use client'

/**
 * The only module that references GSAP.
 *
 * Nothing imports this statically — every caller reaches it through
 * `await import('@/lib/motion/gsap-runtime')` from inside an effect. That is what
 * actually keeps GSAP out of the landing page's first paint: when this module
 * lived beside the synchronous helpers, the callers pulled it (and therefore
 * GSAP, ScrollTrigger and SplitText, ~15 KiB) into an eagerly-loaded chunk.
 *
 * GSAP is free to use including ScrollTrigger and SplitText since 3.13; both
 * plugins ship inside the `gsap` package.
 */

export type GsapBundle = {
  gsap: typeof import('gsap').gsap
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
  SplitText: typeof import('gsap/SplitText').SplitText
}

let bundle: Promise<GsapBundle> | null = null

/** Loads and registers the plugins once per page, however many callers ask. */
function load(): Promise<GsapBundle> {
  bundle ??= (async () => {
    const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
    ])

    gsap.registerPlugin(ScrollTrigger, SplitText)

    return { gsap, ScrollTrigger, SplitText }
  })()

  return bundle
}

/**
 * Runs `work` with the plugin bundle, loading it first.
 *
 * Callers use `const { withGsap } = await import('@/lib/motion/gsap-runtime')`
 * and then `await withGsap(({ gsap }) => { … })`, so the library stays on the
 * far side of a dynamic import at every call site.
 */
export async function withGsap<T>(work: (bundle: GsapBundle) => T): Promise<T> {
  return work(await load())
}
