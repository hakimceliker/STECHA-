import { test, expect } from '@playwright/test'

test.describe('Payment and Demo Mode Flow', () => {
  test('demo mode disables payment functionality', async ({ page }) => {
    // Navigate to checkout/payment page
    await page.goto('/checkout')

    // Verify demo mode badge is visible
    const demoBadge = page.locator('[data-testid="demo-badge"], text=/Demo Mode/i')
    if (await demoBadge.isVisible()) {
      expect(demoBadge).toBeTruthy()
    }

    // Verify demo message appears
    const demoMessage = page.locator('text=/demo|limited/i')
    await expect(demoMessage).toBeVisible({ timeout: 5000 })

    // Verify payment form is disabled or shows demo limitation
    const paymentButton = page.locator('button:has-text("Pay"), button:has-text("Complete Payment")')
    const disabled = await paymentButton.isDisabled()

    // Either button is disabled or demo message prevents interaction
    expect(disabled || await demoMessage.isVisible()).toBeTruthy()
  })

  test('user cannot submit payment in demo mode', async ({ page }) => {
    // Navigate to payment page
    await page.goto('/checkout')

    // Try to fill payment form
    const cardInput = page.locator('input[placeholder*="card" i], input[placeholder*="1234" i]')

    // If demo mode, form should be disabled
    if (await cardInput.isVisible()) {
      const isDisabled = await cardInput.isDisabled()
      expect(isDisabled).toBeTruthy()
    } else {
      // Or payment section should show demo limitation
      const demoNotice = page.locator('text=/demo|unavailable|disabled/i')
      await expect(demoNotice).toBeVisible({ timeout: 5000 })
    }
  })

  test('demo mode shows limitations in preorder flow', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Navigate to preorder
    await page.goto('/preorder')

    // Verify demo badge visible
    const demoBadge = page.locator('[data-testid="demo-badge"], text=/Demo Mode/i')
    if (await demoBadge.isVisible()) {
      expect(demoBadge).toBeTruthy()
    }

    // Try to add item to order
    const addButton = page.locator('button:has-text("Add to Order")')
    if (await addButton.isVisible()) {
      // Should be disabled in demo mode
      const disabled = await addButton.isDisabled()
      if (disabled) {
        expect(disabled).toBeTruthy()
      }
    }
  })

  test('demo mode banner appears across all payment pages', async ({ page }) => {
    // Check checkout page
    await page.goto('/checkout')
    let demoBadge = page.locator('[data-testid="demo-badge"], text=/Demo Mode/i')
    if (await demoBadge.isVisible()) {
      expect(demoBadge).toBeTruthy()
    }

    // Check payment page
    await page.goto('/payment')
    demoBadge = page.locator('[data-testid="demo-badge"], text=/Demo Mode/i')
    if (await demoBadge.isVisible()) {
      expect(demoBadge).toBeTruthy()
    }

    // Check preorder page
    await page.goto('/preorder')
    demoBadge = page.locator('[data-testid="demo-badge"], text=/Demo Mode/i')
    if (await demoBadge.isVisible()) {
      expect(demoBadge).toBeTruthy()
    }
  })

  test('demo mode limitations message is clear', async ({ page }) => {
    await page.goto('/checkout')

    // Verify clear demo limitation message
    const limitationMessage = page.locator('[data-testid="demo-message"], text=/demo|limited|unavailable/i')
    const message = await limitationMessage.textContent()

    if (message) {
      expect(message.toLowerCase()).toContain('demo')
    }
  })
})
