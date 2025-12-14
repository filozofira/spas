/**
 * Configuration Schema Validation
 *
 * Manual validation for SidecarConfig structure.
 * Validates inbound/outbound entries with detailed error messages.
 */

import type { SidecarConfig, InboundEntry, OutboundEntry } from '../types.js';

/**
 * Validation error with path and message.
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validation result with errors array.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate complete SidecarConfig structure.
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: [{ path: '', message: 'Configuration must be an object' }],
    };
  }

  const cfg = config as Record<string, unknown>;

  // Validate inbound array
  if (!Array.isArray(cfg.inbound)) {
    errors.push({ path: 'inbound', message: 'inbound must be an array' });
  } else {
    cfg.inbound.forEach((entry, index) => {
      const entryErrors = validateInboundEntry(entry, `inbound[${index}]`);
      errors.push(...entryErrors);
    });
  }

  // Validate outbound array
  if (!Array.isArray(cfg.outbound)) {
    errors.push({ path: 'outbound', message: 'outbound must be an array' });
  } else {
    cfg.outbound.forEach((entry, index) => {
      const entryErrors = validateOutboundEntry(entry, `outbound[${index}]`);
      errors.push(...entryErrors);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate InboundEntry structure.
 */
export function validateInboundEntry(entry: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entry || typeof entry !== 'object') {
    return [{ path, message: 'Entry must be an object' }];
  }

  const e = entry as Record<string, unknown>;

  // kind is required
  if (!e.kind) {
    errors.push({ path: `${path}.kind`, message: 'kind is required' });
  } else if (e.kind !== 'command' && e.kind !== 'event') {
    errors.push({ path: `${path}.kind`, message: "kind must be 'command' or 'event'" });
  }

  // Conditional validation based on kind
  if (e.kind === 'command') {
    if (!e.command || typeof e.command !== 'string') {
      errors.push({ path: `${path}.command`, message: 'command is required when kind is "command"' });
    }
  } else if (e.kind === 'event') {
    if (!e.topic || typeof e.topic !== 'string') {
      errors.push({ path: `${path}.topic`, message: 'topic is required when kind is "event"' });
    }
  }

  // transform is always required
  if (!e.transform || typeof e.transform !== 'string') {
    errors.push({ path: `${path}.transform`, message: 'transform is required' });
  }

  // invokeEndpoint is always required
  if (!e.invokeEndpoint || typeof e.invokeEndpoint !== 'string') {
    errors.push({ path: `${path}.invokeEndpoint`, message: 'invokeEndpoint is required' });
  }

  return errors;
}

/**
 * Validate OutboundEntry structure.
 */
export function validateOutboundEntry(entry: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!entry || typeof entry !== 'object') {
    return [{ path, message: 'Entry must be an object' }];
  }

  const e = entry as Record<string, unknown>;

  // eventType is required
  if (!e.eventType || typeof e.eventType !== 'string') {
    errors.push({ path: `${path}.eventType`, message: 'eventType is required' });
  }

  // topic is required
  if (!e.topic || typeof e.topic !== 'string') {
    errors.push({ path: `${path}.topic`, message: 'topic is required' });
  }

  // transform is optional, but if present must be a string
  if (e.transform !== undefined && typeof e.transform !== 'string') {
    errors.push({ path: `${path}.transform`, message: 'transform must be a string if provided' });
  }

  return errors;
}

/**
 * Assert config is valid, throwing if not.
 */
export function assertValidConfig(config: unknown): asserts config is SidecarConfig {
  const result = validateConfig(config);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Invalid configuration: ${errorMessages}`);
  }
}

/**
 * Type guard for InboundEntry.
 */
export function isInboundEntry(entry: unknown): entry is InboundEntry {
  return validateInboundEntry(entry, '').length === 0;
}

/**
 * Type guard for OutboundEntry.
 */
export function isOutboundEntry(entry: unknown): entry is OutboundEntry {
  return validateOutboundEntry(entry, '').length === 0;
}
