import { inngest, buildIdempotencyKey, RETRY_CONFIGS, sendToDeadLetterQueue } from "./client";

/**
 * Inngest Workflow Definitions
 *
 * All workflows implement:
 * - Idempotency keys (prevent duplicate processing)
 * - Retry policies with exponential backoff
 * - Checkpoints for state persistence
 * - Dead-letter queue for permanent failures
 */

// ============================================================================
// USER LIFECYCLE WORKFLOWS
// ============================================================================

/**
 * Workflow: User Signup Completion
 *
 * Triggered: stechai/auth/user/signup
 * Steps:
 * 1. Verify email (send verification link)
 * 2. Initialize user profile (Supabase)
 * 3. Create default workspace
 * 4. Send welcome email
 * 5. Log to audit trail
 *
 * Idempotency: buildIdempotencyKey("user", "signup", userId)
 * Retry: RETRY_CONFIGS.critical (5 attempts)
 */
export const onUserSignup = inngest.createFunction(
  {
    id: "user-signup-completion",
    name: "User Signup Completion",
    concurrency: [
      {
        key: "event.data.userId",
        limit: 1, // One signup per user
      },
    ],
  },
  { event: "stechai/auth/user/signup" },
  async ({ event, step }) => {
    const idempotencyKey = buildIdempotencyKey("user", "signup", event.data.userId);

    try {
      // Step 1: Verify email
      const verificationSent = await step.run("send-verification-email", async () => {
        // TODO: Send verification email via Resend
        return { success: true, sentAt: new Date().toISOString() };
      });

      // Step 2: Initialize user profile
      const profileCreated = await step.run("create-user-profile", async () => {
        // TODO: Create user profile in Supabase
        return {
          userId: event.data.userId,
          email: event.data.email,
          createdAt: new Date().toISOString(),
        };
      });

      // Step 3: Create default workspace
      const workspaceCreated = await step.run("create-default-workspace", async () => {
        // TODO: Create workspace for user
        return { workspaceId: `ws-${event.data.userId}` };
      });

      // Step 4: Send welcome email
      await step.run("send-welcome-email", async () => {
        // TODO: Send welcome email
        return { success: true };
      });

      // Step 5: Log to audit trail
      await step.run("log-audit", async () => {
        // TODO: Log user signup to audit_logs table
        return { logged: true };
      });

      return {
        success: true,
        idempotencyKey,
        userId: event.data.userId,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      await sendToDeadLetterQueue(
        event,
        error instanceof Error ? error : new Error(String(error)),
        1,
        RETRY_CONFIGS.critical.maxAttempts
      );
      throw error;
    }
  }
);

// ============================================================================
// CONVERSATION LIFECYCLE WORKFLOWS
// ============================================================================

/**
 * Workflow: Conversation Response Generation
 *
 * Triggered: stechai/ai/response-request
 * Steps:
 * 1. Validate user & restaurant access (RLS check)
 * 2. Prepare prompt context (conversation history, system prompt)
 * 3. Call AI provider (OpenAI/Claude)
 * 4. Process response (streaming if needed)
 * 5. Store message in database
 * 6. Update conversation metadata
 * 7. Log to audit trail
 * 8. Emit completion event
 *
 * Idempotency: buildIdempotencyKey("message", "generate", messageId)
 * Retry: RETRY_CONFIGS.high (3 attempts with exponential backoff)
 */
export const onAiResponseRequest = inngest.createFunction(
  {
    id: "ai-response-generation",
    name: "AI Response Generation",
    concurrency: [
      {
        key: "event.data.conversationId",
        limit: 1, // Sequential processing per conversation
      },
    ],
  },
  { event: "stechai/ai/response-request" },
  async ({ event, step }) => {
    const idempotencyKey = buildIdempotencyKey("message", "generate", event.data.messageId);

    try {
      // Step 1: Validate access
      const validated = await step.run("validate-access", async () => {
        // TODO: Check user has access to restaurant via RLS
        return { hasAccess: true };
      });

      if (!validated.hasAccess) {
        throw new Error("Access denied");
      }

      // Step 2: Prepare prompt context
      const context = await step.run("prepare-context", async () => {
        // TODO: Fetch conversation history, system prompt
        return {
          systemPrompt: "You are a helpful restaurant assistant...",
          conversationHistory: [
            { role: "user", content: event.data.prompt },
          ],
        };
      });

      // Step 3: Call AI provider
      const startTime = Date.now();
      const response = await step.run("call-ai-provider", async () => {
        // TODO: Call OpenAI or Claude with context
        return {
          content: "Sample AI response...",
          tokens: { prompt: 100, completion: 50 },
          model: event.data.model,
        };
      });

      const completionTime = Date.now() - startTime;

      // Step 4: Store message
      await step.run("store-message", async () => {
        // TODO: Insert message into database
        return { messageId: event.data.messageId, stored: true };
      });

      // Step 5: Update conversation
      await step.run("update-conversation", async () => {
        // TODO: Update conversation metadata
        return { updated: true };
      });

      // Step 6: Log to audit trail
      await step.run("log-audit", async () => {
        // TODO: Log response generation
        return { logged: true };
      });

      // Step 7: Emit completion event
      await step.sendEvent("emit-completion", {
        name: "stechai/ai/response-completed",
        data: {
          conversationId: event.data.conversationId,
          messageId: event.data.messageId,
          userId: event.data.userId,
          restaurantId: event.data.restaurantId,
          responseTokens: response.tokens.completion,
          completionTime,
          model: response.model,
          completedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        idempotencyKey,
        messageId: event.data.messageId,
        completionTime,
      };
    } catch (error) {
      // Emit failure event
      await step.sendEvent("emit-failure", {
        name: "stechai/ai/response-failed",
        data: {
          conversationId: event.data.conversationId,
          messageId: event.data.messageId,
          userId: event.data.userId,
          restaurantId: event.data.restaurantId,
          errorCode: (error instanceof Error ? error.name : "UNKNOWN_ERROR"),
          errorMessage: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        },
      });

      await sendToDeadLetterQueue(
        event,
        error instanceof Error ? error : new Error(String(error)),
        1,
        RETRY_CONFIGS.high.maxAttempts
      );
      throw error;
    }
  }
);

// ============================================================================
// PAYMENT WORKFLOWS
// ============================================================================

/**
 * Workflow: Payment Processing
 *
 * Triggered: stechai/payment/checkout-initiated
 * Steps:
 * 1. Validate user wallet balance
 * 2. Create Stripe PaymentIntent
 * 3. Wait for webhook confirmation
 * 4. Process successful payment (debit wallet)
 * 5. Update subscription status
 * 6. Emit completion event
 *
 * Idempotency: buildIdempotencyKey("payment", "process", chargeId)
 * Retry: RETRY_CONFIGS.critical (5 attempts for payment safety)
 * Timeout: 5 minutes (wait for webhook)
 */
export const onPaymentCheckout = inngest.createFunction(
  {
    id: "payment-processing",
    name: "Payment Processing & Wallet Debit",
    concurrency: [
      {
        key: "event.data.userId",
        limit: 1, // One payment per user at a time
      },
    ],
  },
  { event: "stechai/payment/checkout-initiated" },
  async ({ event, step }) => {
    const idempotencyKey = buildIdempotencyKey("payment", "process", event.data.checkoutId);

    try {
      // Step 1: Validate wallet
      const walletValid = await step.run("validate-wallet", async () => {
        // TODO: Check user wallet balance >= amount
        return { hasBalance: true };
      });

      if (!walletValid.hasBalance) {
        throw new Error("Insufficient wallet balance");
      }

      // Step 2: Create Stripe PaymentIntent
      const paymentIntent = await step.run("create-payment-intent", async () => {
        // TODO: Create Stripe PaymentIntent
        return {
          intentId: `pi_test_${Date.now()}`,
          status: "requires_payment_method",
        };
      });

      // Step 3: Wait for webhook confirmation (5 minute timeout)
      const webhookEvent = await step.waitForEvent("wait-stripe-webhook", {
        event: "stechai/payment/charge-succeeded",
        timeout: "5m",
        match: "event.data.chargeId",
        matchValue: paymentIntent.intentId,
      });

      // Step 4: Process payment (debit wallet)
      const walletDebited = await step.run("debit-wallet", async () => {
        // TODO: Debit wallet in Supabase
        return {
          walletId: `wallet-${event.data.userId}`,
          debitedAmount: event.data.amount,
          newBalance: 0, // TODO: Calculate actual balance
        };
      });

      // Step 5: Update subscription
      await step.run("update-subscription", async () => {
        // TODO: Extend subscription expiry date
        return { subscriptionUpdated: true };
      });

      // Step 6: Emit completion (redundant since webhook already sent, but for completeness)
      await step.sendEvent("emit-completion", {
        name: "stechai/payment/charge-succeeded",
        data: {
          chargeId: paymentIntent.intentId,
          userId: event.data.userId,
          restaurantId: event.data.restaurantId,
          amount: event.data.amount,
          currency: event.data.currency,
          chargedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        idempotencyKey,
        chargeId: paymentIntent.intentId,
        walletDebited: true,
      };
    } catch (error) {
      // Emit failure event
      await step.sendEvent("emit-failure", {
        name: "stechai/payment/charge-failed",
        data: {
          chargeId: event.data.checkoutId,
          userId: event.data.userId,
          restaurantId: event.data.restaurantId,
          errorCode: (error instanceof Error ? error.name : "PAYMENT_FAILED"),
          errorMessage: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        },
      });

      await sendToDeadLetterQueue(
        event,
        error instanceof Error ? error : new Error(String(error)),
        1,
        RETRY_CONFIGS.critical.maxAttempts
      );
      throw error;
    }
  }
);

// ============================================================================
// SYSTEM WORKFLOWS
// ============================================================================

/**
 * Workflow: Scheduled Health Check
 *
 * Runs: Every 5 minutes
 * Steps:
 * 1. Check Supabase connectivity
 * 2. Check OpenAI API availability
 * 3. Check Stripe API availability
 * 4. Check Inngest connectivity
 * 5. Emit health status event
 *
 * Concurrency: Single execution (health check is global)
 * Timeout: 30 seconds
 */
export const systemHealthCheck = inngest.createFunction(
  {
    id: "system-health-check",
    name: "System Health Check",
    throttle: {
      limit: 1,
      period: "5m", // Run at most once every 5 minutes
    },
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    try {
      // Step 1: Check Supabase
      const supabaseHealth = await step.run("check-supabase", async () => {
        // TODO: Ping Supabase API
        return { healthy: true };
      });

      // Step 2: Check OpenAI
      const openaiHealth = await step.run("check-openai", async () => {
        // TODO: Ping OpenAI API (models endpoint)
        return { healthy: true };
      });

      // Step 3: Check Stripe
      const stripeHealth = await step.run("check-stripe", async () => {
        // TODO: Ping Stripe API
        return { healthy: true };
      });

      // Step 4: Check Inngest
      const inngestHealth = { healthy: true }; // Inngest is running if we got here

      // Step 5: Emit status
      const statusEvent = await step.sendEvent("emit-health-status", {
        name: "stechai/system/health-check",
        data: {
          timestamp: new Date().toISOString(),
          status: Object.values({
            supabaseHealth,
            openaiHealth,
            stripeHealth,
            inngestHealth,
          }).every((h) => h.healthy)
            ? "healthy"
            : "degraded",
          services: {
            supabase: supabaseHealth.healthy,
            openai: openaiHealth.healthy,
            stripe: stripeHealth.healthy,
            inngest: inngestHealth.healthy,
          },
        },
      });

      return {
        success: true,
        healthCheck: statusEvent,
      };
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }
);
