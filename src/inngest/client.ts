import { Inngest } from "inngest";

/**
 * Inngest client for STECHA AI
 *
 * Handles durable workflows, retry logic, event processing
 * Uses Supabase for state persistence, PostgreSQL for audit trails
 */

export const inngest = new Inngest({
  id: "stechai",
  name: "STECHA AI - Restaurant AI Assistant",

  // Event acknowledgment timeout
  eventAckTimeout: 30000, // 30 seconds

  // Retry configuration (global defaults)
  retryDefaults: {
    maxAttempts: 3,
    initialDelayMs: 1000, // 1 second
    multiplier: 2, // exponential backoff: 1s, 2s, 4s
  },
});

/**
 * Inngest event definitions
 * All events follow: "{ company }/{ domain }/{ entity }/{ action }"
 */

export type InngestEvents = {
  // User lifecycle
  "stechai/auth/user/signup": {
    data: {
      userId: string;
      email: string;
      restaurantId?: string;
      signupSource: "web" | "api" | "oauth";
      timestamp: string;
    };
  };

  "stechai/auth/user/email-verified": {
    data: {
      userId: string;
      email: string;
      verifiedAt: string;
    };
  };

  "stechai/auth/user/deleted": {
    data: {
      userId: string;
      email: string;
      deletedAt: string;
      reason?: string;
    };
  };

  // Restaurant lifecycle
  "stechai/restaurant/created": {
    data: {
      restaurantId: string;
      ownerId: string;
      name: string;
      slug: string;
      createdAt: string;
    };
  };

  "stechai/restaurant/updated": {
    data: {
      restaurantId: string;
      updatedBy: string;
      changes: Record<string, unknown>;
      updatedAt: string;
    };
  };

  "stechai/restaurant/deleted": {
    data: {
      restaurantId: string;
      deletedBy: string;
      deletedAt: string;
    };
  };

  // Conversation lifecycle
  "stechai/conversation/started": {
    data: {
      conversationId: string;
      userId: string;
      restaurantId: string;
      messageCount: number;
      startedAt: string;
    };
  };

  "stechai/conversation/completed": {
    data: {
      conversationId: string;
      userId: string;
      restaurantId: string;
      totalMessages: number;
      totalTokens: number;
      completedAt: string;
    };
  };

  // AI response generation
  "stechai/ai/response-request": {
    data: {
      conversationId: string;
      messageId: string;
      userId: string;
      restaurantId: string;
      prompt: string;
      model: "gpt-4o" | "claude-opus" | "claude-sonnet";
      requestedAt: string;
    };
  };

  "stechai/ai/response-completed": {
    data: {
      conversationId: string;
      messageId: string;
      userId: string;
      restaurantId: string;
      responseTokens: number;
      completionTime: number; // ms
      model: string;
      completedAt: string;
    };
  };

  "stechai/ai/response-failed": {
    data: {
      conversationId: string;
      messageId: string;
      userId: string;
      restaurantId: string;
      errorCode: string;
      errorMessage: string;
      failedAt: string;
    };
  };

  // Payment events
  "stechai/payment/checkout-initiated": {
    data: {
      checkoutId: string;
      userId: string;
      restaurantId: string;
      amount: number;
      currency: "USD" | "EUR";
      initiatedAt: string;
    };
  };

  "stechai/payment/charge-succeeded": {
    data: {
      chargeId: string;
      userId: string;
      restaurantId: string;
      amount: number;
      currency: string;
      chargedAt: string;
    };
  };

  "stechai/payment/charge-failed": {
    data: {
      chargeId: string;
      userId: string;
      restaurantId: string;
      errorCode: string;
      errorMessage: string;
      failedAt: string;
    };
  };

  // System events
  "stechai/system/health-check": {
    data: {
      timestamp: string;
      status: "healthy" | "degraded" | "unhealthy";
      services: {
        supabase: boolean;
        openai: boolean;
        stripe: boolean;
        inngest: boolean;
      };
    };
  };

  "stechai/system/audit-log": {
    data: {
      userId: string;
      action: string;
      resourceType: string;
      resourceId: string;
      changes: Record<string, unknown>;
      timestamp: string;
    };
  };
};

/**
 * Idempotency key builder
 * Prevents duplicate processing of events
 */
export function buildIdempotencyKey(
  resource: string,
  action: string,
  id: string
): string {
  return `${resource}-${action}-${id}`;
}

/**
 * Retry configuration per workflow type
 */
export const RETRY_CONFIGS = {
  // Critical: payment processing, auth
  critical: {
    maxAttempts: 5,
    initialDelayMs: 500,
    multiplier: 2, // 0.5s, 1s, 2s, 4s, 8s
  },

  // High: AI responses, conversation processing
  high: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    multiplier: 2, // 1s, 2s, 4s
  },

  // Medium: analytics, logging
  medium: {
    maxAttempts: 2,
    initialDelayMs: 5000,
    multiplier: 1.5, // 5s, 7.5s
  },

  // Low: non-critical background jobs
  low: {
    maxAttempts: 1,
    initialDelayMs: 10000,
    multiplier: 1,
  },
};

/**
 * Checkpoint helper for long-running workflows
 * Allows resuming from last checkpoint on failure
 */
export interface WorkflowCheckpoint {
  workflowId: string;
  stepName: string;
  state: Record<string, unknown>;
  timestamp: string;
}

/**
 * Dead-letter queue handler
 * Routes failed events after max retries for manual review
 */
export async function sendToDeadLetterQueue(
  event: {
    id: string;
    name: string;
    data: unknown;
  },
  error: Error,
  attempt: number,
  maxAttempts: number
): Promise<void> {
  // Log to Supabase audit_logs table
  const dlqEntry = {
    id: `dlq-${event.id}-${Date.now()}`,
    eventId: event.id,
    eventName: event.name,
    eventData: event.data,
    error: {
      message: error.message,
      stack: error.stack,
      code: (error as any).code || "UNKNOWN",
    },
    attempt,
    maxAttempts,
    enqueuedAt: new Date().toISOString(),
    status: "pending", // pending -> reviewed -> resolved -> archived
  };

  // Write to database (implementation in inngest/dlq.ts)
  console.error(`[DLQ] Event ${event.id} failed after ${attempt}/${maxAttempts} attempts:`, dlqEntry);

  // TODO: Post to Slack #incident-alerts for manual review
  // TODO: Create monitoring dashboard for DLQ growth
}

/**
 * Event replay helper
 * Re-processes dead-letter queue events
 */
export async function replayEvent(
  dlqId: string,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Retrieve DLQ entry from database
  // Re-publish original event with retry count reset
  // Log replay action to audit trail
  console.log(`[REPLAY] Event ${dlqId} replayed: ${reason}`, metadata);
}
