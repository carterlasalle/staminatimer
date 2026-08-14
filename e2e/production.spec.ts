import { expect, test } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

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
  test.skip(!email || !password, 'Local Supabase credentials are required for the authenticated flow')

  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email!)
  await page.getByLabel(/password/i).fill(password!)
  await page.getByRole('button', { name: 'Sign in to your account' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

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
  await expect(page.getByText(/not found|expired|unavailable/i)).toBeVisible()
})
