/**
 * PII (Personally Identifiable Information) Filter
 *
 * Masks sensitive data before sending to LLM providers
 * to protect user privacy
 */

import { PIIFilterConfig, PIIPattern } from "./types";

/**
 * Standard PII patterns for detection
 */
const STANDARD_PATTERNS: Record<string, RegExp> = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (US format variations)
  phone:
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,

  // Social Security Numbers (XXX-XX-XXXX)
  ssn: /\b(?!666|000|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4}\b/g,

  // Credit card numbers (16 digits)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // API keys (basic pattern)
  apiKey: /api[_-]?key[_-]?[\w]{20,}/gi,

  // URLs with potential credentials
  urlCredentials: /https?:\/\/[^:]+:[^@]+@/g,

  // Canadian SIN (Social Insurance Number)
  sin: /\b(?!0{3}|6{3})\d{3}\s?(?!0{2}|6{2})(?!\d*-*0{2})\d{2}\s?(?!0{4}|6{4})\d{4}\b/g,
};

/**
 * Default masking values
 */
const DEFAULT_MASKING = {
  email: "[EMAIL]",
  phone: "[PHONE]",
  ssn: "[SSN]",
  creditCard: "[CREDIT_CARD]",
  apiKey: "[API_KEY]",
  urlCredentials: "[CREDENTIALS]",
  sin: "[SIN]",
  generic: "[REDACTED]",
};

/**
 * PIIFilter class for detecting and masking sensitive data
 */
export class PIIFilter {
  private config: PIIFilterConfig;
  private patterns: Map<string, { regex: RegExp; mask: string }>;

  constructor(config?: Partial<PIIFilterConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      patterns: config?.patterns ?? [],
      masking: { ...DEFAULT_MASKING, ...config?.masking },
    };

    this.patterns = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize built-in patterns
   */
  private initializePatterns(): void {
    this.patterns.set("email", {
      regex: STANDARD_PATTERNS.email,
      mask: this.config.masking.email,
    });
    this.patterns.set("phone", {
      regex: STANDARD_PATTERNS.phone,
      mask: this.config.masking.phone,
    });
    this.patterns.set("ssn", {
      regex: STANDARD_PATTERNS.ssn,
      mask: this.config.masking.ssn,
    });
    this.patterns.set("creditCard", {
      regex: STANDARD_PATTERNS.creditCard,
      mask: this.config.masking.creditCard,
    });
    this.patterns.set("apiKey", {
      regex: STANDARD_PATTERNS.apiKey,
      mask: this.config.masking.apiKey,
    });
  }

  /**
   * Filter text to mask PII
   */
  filterText(text: string): string {
    if (!this.config.enabled) return text;

    let filtered = text;

    // Apply each pattern
    for (const [, { regex, mask }] of this.patterns) {
      filtered = filtered.replace(regex, mask);
    }

    return filtered;
  }

  /**
   * Detect PII in text (returns matches)
   */
  detectPII(text: string): {
    type: string;
    matches: string[];
  }[] {
    const detections: { type: string; matches: string[] }[] = [];

    for (const [type, { regex }] of this.patterns) {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        detections.push({
          type,
          matches: [...new Set(matches)], // Deduplicate
        });
      }
    }

    return detections;
  }

  /**
   * Check if text contains PII
   */
  containsPII(text: string): boolean {
    return this.detectPII(text).length > 0;
  }

  /**
   * Add custom pattern
   */
  addPattern(
    name: string,
    regex: RegExp,
    maskValue: string = this.config.masking.generic
  ): void {
    this.patterns.set(name, { regex, mask: maskValue });
  }

  /**
   * Remove pattern by name
   */
  removePattern(name: string): void {
    this.patterns.delete(name);
  }

  /**
   * Enable/disable filtering
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set masking value for a type
   */
  setMaskingValue(type: string, maskValue: string): void {
    if (type in this.config.masking) {
      this.config.masking[type as keyof typeof this.config.masking] = maskValue;
      // Update pattern mask
      const pattern = this.patterns.get(type);
      if (pattern) {
        this.patterns.set(type, { ...pattern, mask: maskValue });
      }
    }
  }

  /**
   * Filter array of strings
   */
  filterArray(items: string[]): string[] {
    return items.map((item) => this.filterText(item));
  }

  /**
   * Filter object values recursively
   */
  filterObject<T extends Record<string, unknown>>(obj: T): T {
    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        filtered[key] = this.filterText(value);
      } else if (Array.isArray(value)) {
        filtered[key] = this.filterArray(
          value.filter((v) => typeof v === "string")
        );
      } else if (value && typeof value === "object") {
        filtered[key] = this.filterObject(value as Record<string, unknown>);
      } else {
        filtered[key] = value;
      }
    }

    return filtered as T;
  }
}

/**
 * Global default PII filter instance
 */
export const defaultPIIFilter = new PIIFilter();

/**
 * Convenience functions
 */
export function filterText(text: string): string {
  return defaultPIIFilter.filterText(text);
}

export function detectPII(text: string) {
  return defaultPIIFilter.detectPII(text);
}

export function containsPII(text: string): boolean {
  return defaultPIIFilter.containsPII(text);
}
