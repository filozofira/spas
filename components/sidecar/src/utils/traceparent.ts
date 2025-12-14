/**
 * Traceparent Utility
 *
 * W3C Trace Context traceparent header parsing and manipulation.
 * @see https://www.w3.org/TR/trace-context/
 *
 * Format: {version}-{trace-id}-{parent-id}-{flags}
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */

import type { ParsedTraceparent, ZipkinSpan, SpanTags } from '../types.js';

/**
 * Parse a W3C traceparent header.
 *
 * @param traceparent - W3C traceparent string
 * @returns Parsed components or null if invalid
 */
export function parseTraceparent(traceparent: string): ParsedTraceparent | null {
  if (!traceparent) {
    return null;
  }

  const parts = traceparent.split('-');
  if (parts.length !== 4) {
    return null;
  }

  const [version, traceId, parentId, flags] = parts;

  // Validate version (currently only '00' is supported)
  if (version !== '00') {
    return null;
  }

  // Validate trace-id (32 hex chars)
  if (!/^[0-9a-f]{32}$/i.test(traceId)) {
    return null;
  }

  // Validate parent-id (16 hex chars)
  if (!/^[0-9a-f]{16}$/i.test(parentId)) {
    return null;
  }

  // Validate flags (2 hex chars)
  if (!/^[0-9a-f]{2}$/i.test(flags)) {
    return null;
  }

  return {
    version,
    traceId,
    parentId,
    flags,
  };
}

/**
 * Generate a new span ID (16 hex characters).
 */
export function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a child traceparent from a parent traceparent.
 * Preserves trace-id and flags, generates new parent-id.
 *
 * @param parentTraceparent - Parent traceparent string
 * @returns Child traceparent string
 */
export function createChildTraceparent(parentTraceparent: string): string {
  const parsed = parseTraceparent(parentTraceparent);
  if (!parsed) {
    throw new Error(`Invalid traceparent: ${parentTraceparent}`);
  }

  const newSpanId = generateSpanId();
  return `${parsed.version}-${parsed.traceId}-${newSpanId}-${parsed.flags}`;
}

/**
 * Check if a trace is sampled based on flags.
 */
export function isSampled(traceparent: string): boolean {
  const parsed = parseTraceparent(traceparent);
  if (!parsed) {
    return false;
  }
  // Bit 0 of flags indicates sampling
  return (parseInt(parsed.flags, 16) & 1) === 1;
}

/**
 * Create a Zipkin span for tracing.
 *
 * @param traceparent - W3C traceparent for trace context
 * @param name - Span name (operation name)
 * @param serviceName - Local service name
 * @param startTime - Start timestamp in microseconds
 * @param duration - Duration in microseconds
 * @param tags - Span tags
 * @returns ZipkinSpan for reporting
 */
export function createZipkinSpan(
  traceparent: string,
  name: string,
  serviceName: string,
  startTime: number,
  duration: number,
  tags: SpanTags
): ZipkinSpan {
  const parsed = parseTraceparent(traceparent);
  if (!parsed) {
    throw new Error(`Invalid traceparent for span: ${traceparent}`);
  }

  return {
    traceId: parsed.traceId,
    id: parsed.parentId,
    name,
    timestamp: startTime,
    duration,
    localEndpoint: {
      serviceName,
    },
    tags: tags as Record<string, string>,
  };
}

/**
 * Create a child Zipkin span with parent relationship.
 */
export function createChildZipkinSpan(
  traceparent: string,
  parentSpanId: string,
  name: string,
  serviceName: string,
  startTime: number,
  duration: number,
  tags: SpanTags
): ZipkinSpan {
  const parsed = parseTraceparent(traceparent);
  if (!parsed) {
    throw new Error(`Invalid traceparent for child span: ${traceparent}`);
  }

  return {
    traceId: parsed.traceId,
    id: generateSpanId(),
    parentId: parentSpanId,
    name,
    timestamp: startTime,
    duration,
    localEndpoint: {
      serviceName,
    },
    tags: tags as Record<string, string>,
  };
}

/**
 * Convert Date to microseconds since epoch for Zipkin.
 */
export function toMicroseconds(date: Date = new Date()): number {
  return date.getTime() * 1000;
}

/**
 * Calculate duration in microseconds.
 */
export function calculateDuration(startMicros: number, endMicros: number = toMicroseconds()): number {
  return endMicros - startMicros;
}
