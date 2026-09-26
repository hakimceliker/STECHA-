import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register and login successfully', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register')

    // Fill registration form
    await page.fill('input[placeholder="Name"]', 'Test User')
    await page.fill('input[placeholder*="email" i]', `testuser${Date.now()}@example.com`)
    await page.fill('input[placeholder*="password" i]', 'TestPassword123!')

    // Submit registration
    const registerButton = page.locator('button:has-text("Register")')
    await registerButton.click()

    // Should be redirected to chat or home
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Token should be stored
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
  })

  test('user can login with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')

    // Fill login form
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')

    // Submit login
    const loginButton = page.locator('button:has-text("Login")')
    await loginButton.click()

    // Should be redirected and token stored
    await page.waitForURL(/\//, { timeout: 5000 })
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
  })

  test('user cannot login with invalid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')

    // Fill login form with wrong password
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')

    // Submit login
    const loginButton = page.locator('button:has-text("Login")')
    await loginButton.click()

    // Should show error message
    const errorMessage = page.locator('text=/invalid|error/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Token should not be stored
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeFalsy()
  })

  test('redirects to login when accessing protected page without token', async ({ page }) => {
    // Clear token
    await page.evaluate(() => localStorage.removeItem('token'))

    // Try to access chat page
    await page.goto('/chat')

    // Should be redirected to login
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
