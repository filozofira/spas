/**
 * Topic Router Service
 *
 * Resolves event types to target topics using outbound configuration.
 * Used by the publish handler to determine where to send events.
 */

import type { SidecarConfig, OutboundEntry } from '../types.js';

/**
 * Topic routing result.
 */
export interface TopicRouteResult {
  found: boolean;
  topic?: string;
  transform?: string;
}

/**
 * Resolve topic from event type using outbound configuration.
 *
 * @param eventType - Event type from x-event-type header
 * @param config - Sidecar configuration with outbound entries
 * @returns Topic route result with topic and optional transform
 */
export function resolveTopicFromEventType(
  eventType: string,
  config: SidecarConfig
): TopicRouteResult {
  const entry = findOutboundEntry(eventType, config.outbound);

  if (!entry) {
    return { found: false };
  }

  return {
    found: true,
    topic: entry.topic,
    transform: entry.transform,
  };
}

/**
 * Find outbound entry by event type.
 * Supports exact match and wildcard patterns.
 *
 * @param eventType - Event type to match
 * @param outbound - Outbound entries from config
 * @returns Matching OutboundEntry or undefined
 */
export function findOutboundEntry(
  eventType: string,
  outbound: OutboundEntry[]
): OutboundEntry | undefined {
  // First try exact match
  const exactMatch = outbound.find((e) => e.eventType === eventType);
  if (exactMatch) {
    return exactMatch;
  }

  // Try wildcard patterns (e.g., 'com.example.*' matches 'com.example.order.created')
  for (const entry of outbound) {
    if (entry.eventType.endsWith('.*')) {
      const prefix = entry.eventType.slice(0, -2); // Remove '.*'
      if (eventType.startsWith(prefix + '.')) {
        return entry;
      }
    }
  }

  return undefined;
}

/**
 * Get all topics from outbound configuration.
 * Useful for logging or debugging.
 */
export function getAllTopics(config: SidecarConfig): string[] {
  return config.outbound.map((e) => e.topic);
}

/**
 * Get all event types from outbound configuration.
 */
export function getAllEventTypes(config: SidecarConfig): string[] {
  return config.outbound.map((e) => e.eventType);
}

/**
 * Validate that an event type has a route configured.
 * Throws if no route found.
 */
export function assertRouteExists(eventType: string, config: SidecarConfig): OutboundEntry {
  const entry = findOutboundEntry(eventType, config.outbound);

  if (!entry) {
    throw new Error(`No outbound route configured for event type: ${eventType}`);
  }

  return entry;
}
