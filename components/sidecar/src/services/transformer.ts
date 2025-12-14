/**
 * Transformer Service
 *
 * Applies transformations to payloads using JSONata expressions.
 * Supports both inbound (event→service) and outbound (service→event) transforms.
 */

import jsonata from 'jsonata';

/**
 * Transform cache to avoid recompiling expressions.
 */
const transformCache = new Map<string, jsonata.Expression>();

/**
 * Apply a transformation to a payload.
 *
 * @param payload - Input payload to transform
 * @param transform - JSONata expression or transform identifier
 * @returns Transformed payload
 */
export async function applyTransform(payload: unknown, transform: string): Promise<unknown> {
  if (!transform) {
    return payload;
  }

  try {
    // Get or compile the expression
    let expression = transformCache.get(transform);
    if (!expression) {
      expression = jsonata(transform);
      transformCache.set(transform, expression);
    }

    // Evaluate the expression against the payload
    const result = await expression.evaluate(payload);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[transformer] Transform failed: ${message}`);
    throw new Error(`Transform failed: ${message}`);
  }
}

/**
 * Apply a transformation synchronously (deprecated, use applyTransform).
 * Note: jsonata evaluate always returns a promise in latest versions.
 * @deprecated Use applyTransform instead
 */
export async function applyTransformSync(payload: unknown, transform: string): Promise<unknown> {
  return applyTransform(payload, transform);
}

/**
 * Validate a transform expression without applying it.
 *
 * @param transform - JSONata expression to validate
 * @returns true if valid, throws on invalid
 */
export function validateTransform(transform: string): boolean {
  try {
    jsonata(transform);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Invalid transform expression: ${message}`);
  }
}

/**
 * Clear the transform cache.
 * Useful for testing or hot-reloading transforms.
 */
export function clearTransformCache(): void {
  transformCache.clear();
}

/**
 * Common transform patterns for convenience.
 */
export const CommonTransforms = {
  /** Pass through unchanged */
  PASSTHROUGH: '$',

  /** Extract just the data field */
  DATA_ONLY: 'data',

  /** Wrap in envelope */
  WRAP_EVENT: '{ "event": $ }',

  /** Flatten nested objects */
  FLATTEN: '$ ~> | ** | |',
} as const;
