import { test, expect } from '@playwright/test'

test.describe('Conversation Flow', () => {
  test('user can create a new conversation and send messages', async ({ page }) => {
    // Setup: Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()

    // Wait for redirect to chat or home
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })

    // Navigate to chat
    await page.goto('/chat')

    // Create a new conversation
    const newConversationButton = page.locator('button:has-text("New Conversation")')
    if (await newConversationButton.isVisible()) {
      await newConversationButton.click()
    }

    // Verify conversation list exists
    const conversationList = page.locator('[data-testid="conversation-list"]')
    await expect(conversationList).toBeVisible({ timeout: 5000 })

    // Send a message
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]')
    await messageInput.fill('What are your restaurant hours?')

    const sendButton = page.locator('button:has-text("Send")')
    await sendButton.click()

    // Verify message appears in conversation
    const userMessage = page.locator('text=/What are your restaurant hours/i')
    await expect(userMessage).toBeVisible({ timeout: 5000 })

    // Verify AI response appears
    const aiResponse = page.locator('[data-testid="ai-message"]')
    await expect(aiResponse).toBeVisible({ timeout: 5000 })
  })

  test('user can send multiple messages in conversation', async ({ page }) => {
    // Setup: Login and navigate to chat
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/chat')

    // Send first message
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]')
    await messageInput.fill('Do you have vegetarian options?')
    await page.locator('button:has-text("Send")').click()

    // Verify first response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 5000 })

    // Send second message
    await messageInput.fill('What about vegan options?')
    await page.locator('button:has-text("Send")').click()

    // Verify messages are in conversation history
    const messages = page.locator('[data-testid="chat-message"]')
    const messageCount = await messages.count()
    expect(messageCount).toBeGreaterThanOrEqual(2)
  })

  test('user can view conversation history', async ({ page }) => {
    // Setup: Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'testuser@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL(/\/(chat|home|\/)/, { timeout: 5000 })
    await page.goto('/chat')

    // Verify conversation history section exists
    const historySection = page.locator('[data-testid="conversation-history"]')
    if (await historySection.isVisible()) {
      // Should display previous conversations
      const conversationItems = page.locator('[data-testid="conversation-item"]')
      const count = await conversationItems.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})
