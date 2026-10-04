/**
 * AI Model Registry
 *
 * Centralized model configuration and versioning
 */

import { ModelId, ModelConfig, ProviderType } from "./types";

/**
 * Complete model registry with all supported models
 */
export const MODEL_REGISTRY: Record<ModelId, ModelConfig> = {
  // OpenAI models
  "gpt-4o": {
    id: "gpt-4o",
    provider: ProviderType.OPENAI,
    name: "GPT-4 Optimized",
    version: "1.0.0",
    contextWindow: 128000,
    costPerMToken: {
      input: 2.5, // $2.50 per million input tokens
      output: 10, // $10 per million output tokens
    },
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
    },
    releaseDate: "2024-05-13",
    deprecated: false,
  },

  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    provider: ProviderType.OPENAI,
    name: "GPT-4 Turbo",
    version: "1.0.0",
    contextWindow: 128000,
    costPerMToken: {
      input: 10, // $10 per million input tokens
      output: 30, // $30 per million output tokens
    },
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
    },
    releaseDate: "2023-11-06",
    deprecated: false,
  },

  // Anthropic models
  "claude-opus": {
    id: "claude-opus",
    provider: ProviderType.ANTHROPIC,
    name: "Claude Opus",
    version: "1.0.0",
    contextWindow: 200000,
    costPerMToken: {
      input: 15, // $15 per million input tokens
      output: 75, // $75 per million output tokens
    },
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
    },
    releaseDate: "2024-02-29",
    deprecated: false,
  },

  "claude-sonnet": {
    id: "claude-sonnet",
    provider: ProviderType.ANTHROPIC,
    name: "Claude Sonnet",
    version: "1.0.0",
    contextWindow: 200000,
    costPerMToken: {
      input: 3, // $3 per million input tokens
      output: 15, // $15 per million output tokens
    },
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
    },
    releaseDate: "2024-02-29",
    deprecated: false,
  },
};

/**
 * Get model configuration by ID
 */
export function getModel(modelId: ModelId): ModelConfig | null {
  return MODEL_REGISTRY[modelId] || null;
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(
  provider: ProviderType
): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter(
    (model) => model.provider === provider && !model.deprecated
  );
}

/**
 * Get all available (non-deprecated) models
 */
export function getAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter((model) => !model.deprecated);
}

/**
 * Check if a model is available
 */
export function isModelAvailable(modelId: ModelId): boolean {
  const model = getModel(modelId);
  return model !== null && !model.deprecated;
}

/**
 * Calculate cost for API call
 */
export function calculateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModel(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000000) * model.costPerMToken.input;
  const outputCost = (outputTokens / 1000000) * model.costPerMToken.output;

  return inputCost + outputCost;
}

/**
 * Get recommended model for use case
 */
export function getRecommendedModel(useCase: "fast" | "accurate" | "cheap"): ModelId {
  switch (useCase) {
    case "fast":
      // Claude Sonnet is fast and accurate
      return "claude-sonnet";
    case "accurate":
      // Claude Opus is most capable
      return "claude-opus";
    case "cheap":
      // GPT-4o is cheapest
      return "gpt-4o";
    default:
      return "claude-sonnet";
  }
}

/**
 * Get model version info
 */
export function getModelVersion(modelId: ModelId): string | null {
  const model = getModel(modelId);
  return model ? model.version : null;
}

/**
 * List all models (including deprecated)
 */
export function getAllModels(): ModelConfig[] {
  return Object.values(MODEL_REGISTRY);
}
