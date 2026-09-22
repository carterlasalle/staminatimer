import { expect, test as setup } from '@playwright/test'

/**
 * Sign in once and save the session for every authenticated spec.
 *
 * Logging in per test tripped the middleware's own auth rate limiter
 * (`AUTH_RATE_LIMIT_MAX` per minute), so a full local or CI run failed logins
 * for tests that had nothing to do with auth. Reusing one stored session also
 * removes the login from the critical path of each test.
 */
const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  setup.skip(!email || !password, 'Local Supabase credentials are required')

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: 'Sign in to your account' }).click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })

  await page.context().storageState({ path: authFile })
})
