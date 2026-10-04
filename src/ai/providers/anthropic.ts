/**
 * Anthropic Provider Adapter
 *
 * Implements AIProvider interface for Anthropic models (Claude)
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  ModelConfig,
  ProviderType,
  ProviderErrorCode,
  ProviderError,
  TimeoutConfig,
} from "../types";
import { getModel, getModelsByProvider, calculateCost } from "../models";
import { defaultPIIFilter } from "../pii-filter";

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements AIProvider {
  name = ProviderType.ANTHROPIC;
  availableModels: ModelConfig[];
  private apiKey: string;
  private baseURL = "https://api.anthropic.com/v1";
  private timeoutConfig: TimeoutConfig = {
    initial: 30000,
    max: 300000,
    backoff: "exponential",
    multiplier: 1.5,
    maxRetries: 3,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.availableModels = getModelsByProvider(ProviderType.ANTHROPIC);

    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
  }

  /**
   * Generate response from Anthropic
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      throw new ProviderError(
        ProviderErrorCode.INVALID_REQUEST,
        `Invalid request: ${validation.errors.join(", ")}`,
        this.name
      );
    }

    // Filter PII from messages
    const filteredMessages = request.messages.map((msg) => ({
      ...msg,
      content: defaultPIIFilter.filterText(msg.content),
    }));

    const timeout = request.timeout || this.timeoutConfig.initial;
    const startTime = Date.now();

    try {
      const response = await this.callAnthropicAPI(
        {
          ...request,
          messages: filteredMessages,
        },
        timeout
      );

      const duration = Date.now() - startTime;
      const cost = calculateCost(
        request.model,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      return {
        id: response.id,
        conversationId: request.conversationId,
        model: request.model,
        content: response.content[0].text,
        tokens: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: this.mapStopReason(response.stop_reason),
        cost,
        duration,
        timestamp: new Date().toISOString(),
        warnings: [],
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Call Anthropic API with timeout and retry logic
   */
  private async callAnthropicAPI(
    request: AIRequest,
    timeout: number,
    retryCount = 0
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens || 4096,
          system: request.systemPrompt,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();

        // Handle rate limiting with retry
        if (response.status === 429 && retryCount < this.timeoutConfig.maxRetries) {
          const delay = this.calculateBackoff(retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.callAnthropicAPI(request, timeout, retryCount + 1);
        }

        throw new ProviderError(
          this.getErrorCode(response.status),
          error.error?.message || "Anthropic API error",
          this.name,
          response.status === 429 || response.status === 500
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get available models
   */
  getModels(): ModelConfig[] {
    return this.availableModels;
  }

  /**
   * Check if model is available
   */
  isModelAvailable(modelId: string): boolean {
    return this.availableModels.some((m) => m.id === modelId);
  }

  /**
   * Validate request
   */
  validateRequest(request: AIRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.model) {
      errors.push("model is required");
    } else if (!this.isModelAvailable(request.model)) {
      errors.push(`model ${request.model} is not available for Anthropic`);
    }

    if (!request.messages || request.messages.length === 0) {
      errors.push("messages array cannot be empty");
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 1)) {
      errors.push("temperature must be between 0 and 1");
    }

    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      errors.push("maxTokens must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Anthropic doesn't have a models endpoint, so we check with a minimal request
      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus",
          max_tokens: 1,
          messages: [{ role: "user", content: "test" }],
        }),
      });
      return response.ok || response.status !== 401; // 401 means auth failed
    } catch {
      return false;
    }
  }

  /**
   * Map Anthropic stop_reason to standard enum
   */
  private mapStopReason(
    stopReason: string
  ): "stop" | "length" | "error" {
    switch (stopReason) {
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      default:
        return "error";
    }
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCode(status: number): ProviderErrorCode {
    switch (status) {
      case 401:
        return ProviderErrorCode.AUTHENTICATION;
      case 404:
        return ProviderErrorCode.MODEL_NOT_FOUND;
      case 429:
        return ProviderErrorCode.RATE_LIMIT;
      case 503:
        return ProviderErrorCode.PROVIDER_UNAVAILABLE;
      default:
        return ProviderErrorCode.INVALID_RESPONSE;
    }
  }

  /**
   * Handle provider errors
   */
  private handleError(error: unknown): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new ProviderError(
          ProviderErrorCode.TIMEOUT,
          "Anthropic request timeout",
          this.name,
          true
        );
      }

      return new ProviderError(
        ProviderErrorCode.PROVIDER_UNAVAILABLE,
        error.message,
        this.name,
        true
      );
    }

    return new ProviderError(
      ProviderErrorCode.INVALID_RESPONSE,
      "Unknown error from Anthropic",
      this.name,
      false
    );
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const delay =
      this.timeoutConfig.initial *
      Math.pow(this.timeoutConfig.multiplier || 1.5, retryCount);
    return Math.min(delay, this.timeoutConfig.max);
  }
}
