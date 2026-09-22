import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Accessibility assertions on the real pages.
 *
 * Lighthouse audits `/` and `/login` only, and those are the two pages with the
 * least interactive chrome — which is why an icon-only account-menu button with
 * no accessible name sat undetected while the accessibility score read 100. The
 * application routes are where the controls are, so they are what this covers.
 */

/** Everything the user must not be able to hit; `minor`/`moderate` are reported, not gated. */
const GATED_IMPACTS = ['serious', 'critical']

async function expectAccessible(page: Page, label: string): Promise<void> {
  // Entrance animations run with opacity below 1, which blends the computed
  // colours: measuring during one reports every token as dimmer than it renders
  // (it produced 11 phantom contrast failures on the application routes, 8 of
  // which vanished once the page settled). Wait for the page to be still.
  await page.waitForTimeout(3000)

  const results = await new AxeBuilder({ page }).analyze()

  const blocking = results.violations.filter(
    (violation) => violation.impact && GATED_IMPACTS.includes(violation.impact)
  )

  // Name the offending nodes and the reason, not just a count — a bare
  // "3 violations" is useless when this fails in CI.
  const detail = blocking.flatMap((violation) =>
    violation.nodes.slice(0, 4).map((node) => {
      const reason = String(node.any?.[0]?.message ?? violation.description)
        .replace(/\s+/g, ' ')
        .slice(0, 140)

      return `${violation.id} (${violation.impact}) ${node.target.join(' ')} — ${reason}`
    })
  )

  expect(detail, `${label} has blocking accessibility violations`).toEqual([])
}

test.describe('public pages', () => {
  for (const path of ['/', '/login', '/guides', '/faq', '/privacy', '/about', '/contact']) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path)
      await expectAccessible(page, path)
    })
  }
})

test.describe('application pages', () => {
  test.beforeEach(async ({ page }) => {
    // A first-run visitor lands under the onboarding modal, which covers the
    // page. Measure the page, not the wizard.
    await page.goto('/dashboard')
    const skip = page.getByRole('button', { name: 'Skip the tutorial' })
    if (await skip.isVisible()) await skip.click()
  })

  for (const path of ['/dashboard', '/progress', '/settings', '/training']) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path)
      await expectAccessible(page, path)
    })
  }
})
