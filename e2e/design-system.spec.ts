import { expect, test, type Page } from '@playwright/test'

/**
 * Design-system regression, checked on the rendered page.
 *
 * Deliberately not pixel snapshots. `toHaveScreenshot` baselines are generated
 * on one OS and compared on another, and font rasterisation differences turn
 * that into a flaky gate that gets muted — which is worse than no gate. These
 * assert the invariants the design system actually promises, which are
 * deterministic everywhere and fail for the right reason.
 *
 * Each one is a bug that shipped at least once:
 *  - headings silently rendered in Georgia because `--font-display` referenced
 *    itself, so the brand font downloaded and was never used;
 *  - gradient text and gradient surfaces arrived with a generated redesign and
 *    had to be removed by hand.
 */

const PAGES = ['/', '/guides', '/faq', '/pricing-check' /* 404 */, '/about', '/contact', '/privacy']

async function fontsOn(page: Page) {
  return page.evaluate(() => {
    const heading = document.querySelector('h1, h2')
    const body = document.body
    return {
      heading: heading ? getComputedStyle(heading).fontFamily : null,
      body: getComputedStyle(body).fontFamily,
    }
  })
}

async function gradientOffenders(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .flatMap((element) => {
        // `.app-ground` is the product's ambient ground: one soft radial wash
        // behind every page, deliberate and token-driven. Everything else is
        // held to "no gradients as surface decoration".
        if (element.matches('.app-ground')) return []

        const style = getComputedStyle(element)
        const offending =
          style.backgroundImage.includes('gradient') ||
          // Read the prefixed property as a string: the camelCase accessor is
          // deprecated in the DOM typings, and gradient text is what we are
          // looking for (`background-clip: text` + a gradient).
          style.getPropertyValue('-webkit-background-clip') === 'text' ||
          style.backgroundClip === 'text'

        return offending
          ? [`${element.tagName.toLowerCase()}.${element.className}`.slice(0, 80)]
          : []
      })
      .slice(0, 5)
  )
}

for (const path of PAGES) {
  test.describe(`${path}`, () => {
    test('headings use the self-hosted display font, not the fallback', async ({ page }) => {
      await page.goto(path)

      const { heading, body } = await fontsOn(page)

      // The exact failure this catches: `--font-display: var(--font-display)`
      // is invalid at computed-value time, so the heading falls through to the
      // serif fallback while the font file still downloads.
      expect(heading, `${path} rendered no heading`).not.toBeNull()
      expect(heading).toContain('Bricolage Grotesque')
      expect(body).toContain('Albert Sans')
    })

    test('no gradient surfaces or gradient text', async ({ page }) => {
      await page.goto(path)

      expect(await gradientOffenders(page)).toEqual([])
    })

    test('no raw palette utility classes in the rendered markup', async ({ page }) => {
      await page.goto(path)

      // The design system is token-based; `text-blue-500` reaching the DOM means
      // a page bypassed it and will not follow a theme change.
      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll('[class]')]
          .flatMap((element) =>
            String(element.className)
              .split(/\s+/)
              .filter((name) =>
                /^(bg|text|border|ring|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}$/.test(
                  name
                )
              )
          )
          .slice(0, 5)
      )

      expect(offenders).toEqual([])
    })

    test('corner radii stay within the budget', async ({ page }) => {
      await page.goto(path)

      const oversized = await page.evaluate(() => {
        // These are the three intentional large-radius scene shapes: the framed
        // hero and two circular environmental bodies. The budget still rejects
        // oversized corners on ordinary interface surfaces.
        const landingSceneRadiusExemptions = [
          '.landing-hero-scene',
          '.story-orbit',
          '.landing-privacy-sun',
        ]

        return [...document.querySelectorAll('*')]
          .flatMap((element) => {
            if (landingSceneRadiusExemptions.some((selector) => element.matches(selector))) return []

            const px = Number.parseFloat(getComputedStyle(element).borderRadius)
            // A pill is legitimate; a 24px+ card corner is not.
            const tooRound = Number.isFinite(px) && px > 16 && px < 9999

            return tooRound
              ? [`${element.tagName.toLowerCase()}.${element.className}`.slice(0, 80)]
              : []
          })
          .slice(0, 5)
      })

      expect(oversized).toEqual([])
    })
  })
}

test('an unknown path returns a real 404 status', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page')

  expect(response?.status()).toBe(404)
  // The site has no `app/not-found.tsx`, so this is Next's built-in page. The
  // assertion records the truth; a branded 404 is tracked separately.
  await expect(page.getByText(/could not be found/i)).toBeVisible()
})
