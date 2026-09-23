import { expect, test } from '@playwright/test'

/**
 * Authentication journeys that cross the server boundary.
 *
 * The unit tests for `AuthContext` cover its state machine in isolation. What
 * they cannot cover is whether a session is genuinely established and genuinely
 * destroyed — that only shows up as a redirect, which is exactly what these
 * assert. A "sign out" that clears client state but leaves the cookie behind
 * would pass every unit test and fail here.
 */

async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page
    .getByRole('button', { name: 'Skip the tutorial' })
    .click({ timeout: 2_000 })
    .catch(() => {})
}

// The session comes from the setup project, so these only need a page to start
// from — no per-test sign-in.
test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard')

  // A first-run visitor lands under the onboarding overlay, which is a modal:
  // it covers the header, so nothing behind it is clickable. That is correct
  // behaviour, and a journey that ignores it is testing a state real users are
  // not in. Dismiss it if it is there.
  await dismissOnboarding(page)
})

test('a signed-in visitor is sent to their dashboard instead of the landing page', async ({
  page,
}) => {
  // The redirect lives in the middleware now, so the landing page never renders
  // for a signed-in visitor and never needs the Supabase client in its bundle.
  await page.goto('/')

  await expect(page).toHaveURL(/\/dashboard/)
})

test.describe('authenticated pages that own their session', () => {
  // Signing out revokes the session on the SERVER, so it would invalidate
  // the stored session every other spec reuses. These own their login
  // instead of borrowing the shared one.
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in to your account' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    await dismissOnboarding(page)
  })

  test('the account menu is labelled and its sign out ends the session server-side', async ({
    page,
  }) => {
    // Icon-only triggers are invisible to assistive tech without a name; this
    // assertion is the one that catches the label being dropped.
    const trigger = page.getByRole('button', { name: 'Account menu' })
    await expect(trigger).toBeVisible()

    await trigger.click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()

    // Signing out navigates the app itself (a full `window.location` load), so
    // wait for it to land before driving the page — otherwise the in-flight
    // navigation aborts the next `goto`.
    await page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 15_000 })

    // Signed out means signed out on the server: the protected route must
    // redirect, not merely render an empty shell.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('a signed-in dashboard renders real content, not a loading shell', async ({ page }) => {
    await page.goto('/dashboard')

    // The page's own chrome and heading, and enough body text that it is clearly
    // beyond a skeleton.
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
    const text = await page.locator('body').innerText()
    expect(text.length).toBeGreaterThan(200)
  })

  test('a private route is unreachable once signed out', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/$/)

    for (const path of ['/progress', '/settings', '/program']) {
      await page.goto(path)
      await expect(page, `${path} should require a session`).toHaveURL(/\/login/)
    }
  })
})
