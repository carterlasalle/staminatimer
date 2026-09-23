import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL

const password = process.env.E2E_PASSWORD

test.use({ storageState: { cookies: [], origins: [] } })

test('health and public pages are production-readable', async ({ page, request }) => {
  const health = await request.get('/api/health')
  expect(health.ok()).toBeTruthy()
  await expect(health.json()).resolves.toEqual({ status: 'ok', service: 'staminatimer' })

  await page.goto('/')
  await expect(page.getByText('Stamina Timer', { exact: true }).first()).toBeVisible()

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
})

test('authenticated timer lifecycle persists and progress remains reachable', async ({ page }) => {
  test.skip(
    !email || !password,
    'Local Supabase credentials are required for the authenticated flow'
  )

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: 'Sign in to your account' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()

  await page.goto('/training')
  await expect(page.getByText('Ready to Begin')).toBeVisible()

  await page.keyboard.press('s')
  await expect(page.getByText('Session Active')).toBeVisible()

  await page.keyboard.press('e')
  await expect(page.getByText('Edge Zone')).toBeVisible()

  await page.keyboard.press('x')
  await expect(page.getByText('Session Active')).toBeVisible()

  await page.keyboard.press('f')
  await expect(page.getByText('Session Complete!')).toBeVisible()

  await page.goto('/progress')
  await expect(page).toHaveURL(/\/progress/)
})

test('unknown or expired share IDs never expose session data', async ({ page }) => {
  await page.goto('/share/00000000-0000-0000-0000-000000000001')
  await expect(page.getByRole('heading', { name: /unavailable/i })).toBeVisible()
})

test('guided program v2 onboarding, control session, rescue and summary persist', async ({
  page,
}) => {
  test.skip(!email || !password, 'Local Supabase credentials are required for the guided flow')

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: 'Sign in to your account' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/program')

  // The dashboard renders a loading state first, so wait for either outcome rather
  // than sampling for the onboarding button before it exists.
  const onboarding = page.getByRole('button', { name: 'Start Guided Program V2' })
  const todaysPractice = page.getByText("Today's Practice")

  await expect(onboarding.or(todaysPractice)).toBeVisible({ timeout: 20_000 })

  // First run only: V2 placement onboarding.
  if (await onboarding.isVisible()) {
    await page.getByRole('button', { name: /I don't know/ }).click()
    await onboarding.click()
  }

  await expect(todaysPractice).toBeVisible({ timeout: 20_000 })
  // "Current Target" is rendered once per card, so scope the check to the first one.
  await expect(page.getByText('Current Target').first()).toBeVisible()
  await expect(page.getByText('Recent qualifying observations')).toBeVisible()
  await expect(page.getByText('Weekly Plan')).toBeVisible()

  // Deep-link the Control session so the flow is deterministic regardless of the weekday.
  await page.goto('/program/session?type=control')
  await page.getByRole('button', { name: 'Start 5-minute breathing prep' }).click()
  await page.getByRole('button', { name: /Continue early/ }).click()

  await expect(page.getByRole('button', { name: 'Steady' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accelerating' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Need reset' })).toBeVisible()

  // Acceleration keeps the block running.
  await page.getByRole('button', { name: 'Accelerating' }).click()
  await expect(page.getByText(/Slow by roughly 30-50%/)).toBeVisible()
  await page.getByRole('button', { name: 'Back in range' }).click()
  await expect(page.getByRole('button', { name: 'Accelerating' })).toBeVisible()

  // A rescue is an open-ended full reset that only the user can close.
  await page.getByRole('button', { name: 'Need reset' }).click()
  await expect(page.getByText(/Recovery elapsed/)).toBeVisible()
  await expect(page.getByText(/Stop completely/)).toBeVisible()
  await page.getByRole('button', { name: 'Still above 4' }).click()
  await expect(page.getByText(/Recovery elapsed/)).toBeVisible()
  await page.getByRole('button', { name: '3', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Accelerating' })).toBeVisible()

  await page.getByRole('button', { name: 'Complete training' }).click()
  await expect(page.getByText('Control summary')).toBeVisible()
  await expect(page.getByText('Rescue stops')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How did it feel?' })).toBeVisible()

  await page.getByRole('button', { name: 'Save session' }).click()
  await expect(page.getByRole('link', { name: 'Back to the program' })).toBeVisible()

  await page.goto('/program')
  await expect(page.getByText('Recent qualifying observations')).toBeVisible()
})
