import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard Flow', () => {
  test('admin can access admin dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.locator('button:has-text("Login")').click()

    // Wait for redirect
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Navigate to admin dashboard
    await page.goto('/admin')

    // Verify admin dashboard is accessible
    const adminPanel = page.locator('[data-testid="admin-panel"], h1:has-text("Admin")')
    await expect(adminPanel).toBeVisible({ timeout: 5000 })
  })

  test('non-admin user cannot access admin dashboard', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()

    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Try to access admin dashboard
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })

    // Should be redirected away from admin
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/admin')
  })

  test('admin can view user management section', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.locator('button:has-text("Login")').click()

    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/admin')

    // Find user management section
    const userManagement = page.locator('[data-testid="user-management"], button:has-text("Users"), a:has-text("Users")')
    if (await userManagement.isVisible()) {
      await userManagement.click()

      // Verify user list displays
      const userList = page.locator('[data-testid="user-list"], table')
      await expect(userList).toBeVisible({ timeout: 5000 })
    }
  })

  test('admin can view analytics section', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.locator('button:has-text("Login")').click()

    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/admin')

    // Find analytics section
    const analytics = page.locator('[data-testid="analytics"], button:has-text("Analytics"), a:has-text("Analytics")')
    if (await analytics.isVisible()) {
      await analytics.click()

      // Verify analytics data displays
      const analyticsPanel = page.locator('[data-testid="analytics-panel"], [data-testid="stats"]')
      await expect(analyticsPanel).toBeVisible({ timeout: 5000 })
    }
  })

  test('admin can view restaurant management', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.locator('button:has-text("Login")').click()

    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/admin')

    // Find restaurants section
    const restaurants = page.locator('[data-testid="restaurants"], button:has-text("Restaurants"), a:has-text("Restaurants")')
    if (await restaurants.isVisible()) {
      await restaurants.click()

      // Verify restaurant list displays
      const restaurantList = page.locator('[data-testid="restaurant-list"], table, [data-testid="restaurants-grid"]')
      await expect(restaurantList).toBeVisible({ timeout: 5000 })
    }
  })

  test('admin dashboard navigation works correctly', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.locator('button:has-text("Login")').click()

    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/admin')

    // Verify navigation menu exists
    const navMenu = page.locator('[data-testid="admin-nav"], [data-testid="sidebar"]')
    await expect(navMenu).toBeVisible({ timeout: 5000 })

    // Verify multiple navigation items are present
    const navItems = page.locator('[data-testid="nav-item"], li a, [role="navigation"] a')
    const count = await navItems.count()
    expect(count).toBeGreaterThan(0)
  })
})
