import { test, expect } from '@playwright/test'

test.describe('Reservation Flow', () => {
  test('user can create a reservation', async ({ page }) => {
    // Setup: Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Navigate to reservations or booking page
    await page.goto('/reservations')

    // Click create new reservation button
    const newReservationButton = page.locator('button:has-text("New Reservation")')
    await expect(newReservationButton).toBeVisible({ timeout: 5000 })
    await newReservationButton.click()

    // Fill reservation form
    const dateInput = page.locator('input[type="date"]')
    const today = new Date()
    const nextDay = new Date(today.getTime() + 86400000)
    const dateString = nextDay.toISOString().split('T')[0]
    await dateInput.fill(dateString)

    const timeInput = page.locator('input[type="time"]')
    await timeInput.fill('19:00')

    const guestsInput = page.locator('input[placeholder*="guests" i], input[placeholder*="number of people" i]')
    await guestsInput.fill('2')

    // Submit reservation
    const submitButton = page.locator('button:has-text("Reserve")')
    await submitButton.click()

    // Verify confirmation message
    const confirmationMessage = page.locator('text=/reservation confirmed|booking confirmed/i')
    await expect(confirmationMessage).toBeVisible({ timeout: 5000 })
  })

  test('user can select restaurant for reservation', async ({ page }) => {
    // Setup: Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    await page.goto('/reservations')

    // Click new reservation
    await page.locator('button:has-text("New Reservation")').click()

    // Verify restaurant selection exists
    const restaurantSelect = page.locator('select[name*="restaurant" i], button:has-text("Select Restaurant")')
    await expect(restaurantSelect).toBeVisible({ timeout: 5000 })

    // Select a restaurant
    const tagName = await restaurantSelect.first().evaluate(el => el.tagName.toLowerCase())
    if (tagName === 'select') {
      await restaurantSelect.first().selectOption({ index: 1 })
    } else {
      await restaurantSelect.first().click()
      const firstOption = page.locator('text=/[A-Za-z]+ (Restaurant|Cafe)/').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
      }
    }
  })

  test('user cannot create reservation with past date', async ({ page }) => {
    // Setup: Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    await page.goto('/reservations')
    await page.locator('button:has-text("New Reservation")').click()

    // Fill with past date
    const dateInput = page.locator('input[type="date"]')
    const yesterday = new Date(new Date().getTime() - 86400000)
    await dateInput.fill(yesterday.toISOString().split('T')[0])

    const timeInput = page.locator('input[type="time"]')
    await timeInput.fill('19:00')

    const guestsInput = page.locator('input[placeholder*="guests" i], input[placeholder*="number of people" i]')
    await guestsInput.fill('2')

    // Attempt to submit
    const submitButton = page.locator('button:has-text("Reserve")')
    await submitButton.click()

    // Should show error message
    const errorMessage = page.locator('text=/past|invalid|cannot book/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('user can view reservation details', async ({ page }) => {
    // Setup: Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    await page.goto('/reservations')

    // Find first reservation in list
    const reservationItem = page.locator('[data-testid="reservation-item"]').first()
    if (await reservationItem.isVisible()) {
      await reservationItem.click()

      // Verify details are displayed
      const detailsSection = page.locator('[data-testid="reservation-details"]')
      await expect(detailsSection).toBeVisible({ timeout: 5000 })
    }
  })
})
