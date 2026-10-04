/**
 * OpenAI Provider Adapter
 *
 * Implements AIProvider interface for OpenAI models (GPT-4, GPT-4 Turbo)
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
 * OpenAI provider implementation
 */
export class OpenAIProvider implements AIProvider {
  name = ProviderType.OPENAI;
  availableModels: ModelConfig[];
  private apiKey: string;
  private baseURL = "https://api.openai.com/v1";
  private timeoutConfig: TimeoutConfig = {
    initial: 30000,
    max: 300000,
    backoff: "exponential",
    multiplier: 1.5,
    maxRetries: 3,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.availableModels = getModelsByProvider(ProviderType.OPENAI);

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
  }

  /**
   * Generate response from OpenAI
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
      const response = await this.callOpenAIAPI(
        {
          ...request,
          messages: filteredMessages,
        },
        timeout
      );

      const duration = Date.now() - startTime;
      const cost = calculateCost(
        request.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      return {
        id: response.id,
        conversationId: request.conversationId,
        model: request.model,
        content: response.choices[0].message.content,
        tokens: {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens,
        },
        finishReason: this.mapFinishReason(response.choices[0].finish_reason),
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
   * Call OpenAI API with timeout and retry logic
   */
  private async callOpenAIAPI(
    request: AIRequest,
    timeout: number,
    retryCount = 0
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
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
          return this.callOpenAIAPI(request, timeout, retryCount + 1);
        }

        throw new ProviderError(
          this.getErrorCode(response.status),
          error.error?.message || "OpenAI API error",
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
      errors.push(`model ${request.model} is not available for OpenAI`);
    }

    if (!request.messages || request.messages.length === 0) {
      errors.push("messages array cannot be empty");
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      errors.push("temperature must be between 0 and 2");
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
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Map OpenAI finish_reason to standard enum
   */
  private mapFinishReason(
    finishReason: string
  ): "stop" | "length" | "error" {
    switch (finishReason) {
      case "stop":
        return "stop";
      case "length":
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
          "OpenAI request timeout",
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
      "Unknown error from OpenAI",
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
