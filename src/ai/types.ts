/**
 * AI Provider Type Definitions
 *
 * Shared types for provider adapters, models, prompts, and structured outputs
 */

/**
 * Supported AI provider types
 */
export enum ProviderType {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

/**
 * Supported models per provider
 */
export type ModelId = "gpt-4o" | "gpt-4-turbo" | "claude-opus" | "claude-sonnet";

/**
 * Model metadata and configuration
 */
export interface ModelConfig {
  id: ModelId;
  provider: ProviderType;
  name: string;
  version: string; // Semantic version (e.g., "1.0.0")
  contextWindow: number; // Max tokens
  costPerMToken: {
    input: number; // USD per million input tokens
    output: number; // USD per million output tokens
  };
  capabilities: {
    vision: boolean;
    functionCalling: boolean;
    structuredOutput: boolean;
  };
  releaseDate: string; // ISO 8601 date
  deprecated: boolean;
  deprecationDate?: string; // ISO 8601 date
}

/**
 * Provider request/response types
 */
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIRequest {
  conversationId: string;
  messages: Message[];
  model: ModelId;
  systemPrompt?: string;
  temperature?: number; // 0.0 - 1.0
  maxTokens?: number;
  timeout?: number; // milliseconds
  structuredOutput?: StructuredOutputSchema;
  userId: string; // For audit and PII filtering
  restaurantId: string; // For context
}

export interface AIResponse {
  id: string; // Unique response ID
  conversationId: string;
  model: ModelId;
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: "stop" | "length" | "error";
  cost: number; // USD
  duration: number; // milliseconds
  timestamp: string; // ISO 8601
  warnings: string[];
}

/**
 * Structured output schema for function calling / tool use
 */
export interface StructuredOutputSchema {
  type: "object";
  properties: Record<string, PropertySchema>;
  required: string[];
  additionalProperties: boolean;
}

export interface PropertySchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: (string | number)[];
  items?: PropertySchema;
}

/**
 * Structured output response
 */
export interface StructuredOutput {
  [key: string]: string | number | boolean | unknown[];
}

/**
 * Provider adapter interface
 */
export interface AIProvider {
  name: ProviderType;
  availableModels: ModelConfig[];

  /**
   * Generate response from conversation
   */
  generate(request: AIRequest): Promise<AIResponse>;

  /**
   * Get available models
   */
  getModels(): ModelConfig[];

  /**
   * Check if model is available
   */
  isModelAvailable(modelId: ModelId): boolean;

  /**
   * Validate request before sending
   */
  validateRequest(request: AIRequest): { valid: boolean; errors: string[] };

  /**
   * Check provider health (API connectivity)
   */
  checkHealth(): Promise<boolean>;
}

/**
 * PII filter configuration
 */
export interface PIIFilterConfig {
  enabled: boolean;
  patterns: PIIPattern[];
  masking: {
    email: string; // e.g., "[email]"
    phone: string; // e.g., "[phone]"
    ssn: string; // e.g., "[ssn]"
    creditCard: string; // e.g., "[card]"
    generic: string; // e.g., "[redacted]"
  };
}

export interface PIIPattern {
  type: "email" | "phone" | "ssn" | "creditCard" | "custom";
  pattern: RegExp;
  maskValue: string;
}

/**
 * Prompt template with version control
 */
export interface PromptTemplate {
  id: string;
  name: string;
  version: string; // Semantic version
  provider: ProviderType;
  content: string;
  variables: string[]; // Template variables: {{variable_name}}
  examples: PromptExample[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deprecated: boolean;
}

export interface PromptExample {
  input: Record<string, string>;
  expectedOutput: string;
  description: string;
}

/**
 * Timeout and retry configuration
 */
export interface TimeoutConfig {
  initial: number; // milliseconds
  max: number; // milliseconds
  backoff: "linear" | "exponential";
  multiplier?: number; // For exponential backoff
  maxRetries: number;
}

/**
 * Provider error types
 */
export enum ProviderErrorCode {
  RATE_LIMIT = "RATE_LIMIT",
  INVALID_REQUEST = "INVALID_REQUEST",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  TIMEOUT = "TIMEOUT",
  AUTHENTICATION = "AUTHENTICATION",
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  INSUFFICIENT_CONTEXT = "INSUFFICIENT_CONTEXT",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
}

export class ProviderError extends Error {
  constructor(
    public code: ProviderErrorCode,
    message: string,
    public provider: ProviderType,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * Cost tracking for AI calls
 */
export interface CostTracker {
  totalTokens: number;
  totalCost: number; // USD
  byModel: Record<ModelId, { tokens: number; cost: number }>;
  byUser: Record<string, { tokens: number; cost: number }>;
}
