/**
 * Event Publisher Service
 *
 * Publishes events to Redis streams with CloudEvents envelope.
 * Handles transformation and tracing.
 */

import type { SidecarConfig, PublishHeaders, PublishResult } from '../types.js';
import { RedisClient } from '../transport/redis.js';
import { wrapCloudEvent, serializeCloudEvent } from '../cloudevents/wrapper.js';
import { resolveTopicFromEventType } from './topic-router.js';

/**
 * Event publisher that wraps payloads in CloudEvents and sends to Redis.
 */
export class EventPublisher {
  private readonly redis: RedisClient;
  private readonly config: SidecarConfig;

  constructor(redis: RedisClient, config: SidecarConfig) {
    this.redis = redis;
    this.config = config;
  }

  /**
   * Publish an event to Redis stream.
   *
   * 1. Resolve topic from event type
   * 2. Apply optional transform
   * 3. Wrap in CloudEvents envelope
   * 4. Serialize and XADD to Redis stream
   *
   * @param payload - Event payload (body from POST /publish)
   * @param headers - Extracted publish headers
   * @returns Publish result with event ID and topic
   * @throws Error if no route found or Redis fails
   */
  async publish(payload: unknown, headers: PublishHeaders): Promise<PublishResult> {
    // 1. Resolve topic from event type
    const route = resolveTopicFromEventType(headers.eventType, this.config);

    if (!route.found || !route.topic) {
      throw new Error(`No outbound route configured for event type: ${headers.eventType}`);
    }

    // 2. Apply transform if configured (placeholder - transforms implemented in Phase 5)
    let transformedPayload = payload;
    if (route.transform) {
      transformedPayload = await this.applyTransform(payload, route.transform);
    }

    // 3. Wrap in CloudEvents envelope
    const cloudEvent = wrapCloudEvent(transformedPayload, route.topic, headers);

    // 4. Serialize and publish to Redis stream
    const serialized = serializeCloudEvent(cloudEvent);
    await this.redis.xadd(route.topic, {
      data: serialized,
    });

    return {
      status: 'accepted',
      id: cloudEvent.id,
      topic: route.topic,
      eventType: headers.eventType,
    };
  }

  /**
   * Apply transformation to payload.
   * Placeholder - full transform implementation in Phase 5.
   */
  private async applyTransform(payload: unknown, _transform: string): Promise<unknown> {
    // Transform will be implemented in T026 (Phase 5)
    // For now, passthrough
    return payload;
  }
}

/**
 * Extract publish headers from Express request.
 *
 * Required headers:
 * - x-service-name: Source service name
 * - x-event-type: Event type for routing
 * - x-correlation-id: Correlation ID for tracing
 *
 * Optional headers:
 * - traceparent: W3C Trace Context
 * - x-user-id: User identity
 * - x-tenant-id: Tenant identity
 */
export function extractPublishHeaders(
  headers: Record<string, string | string[] | undefined>
): PublishHeaders | null {
  const serviceName = getHeader(headers, 'x-service-name');
  const eventType = getHeader(headers, 'x-event-type');
  const correlationId = getHeader(headers, 'x-correlation-id');

  // Required headers
  if (!serviceName || !eventType || !correlationId) {
    return null;
  }

  return {
    serviceName,
    eventType,
    correlationId,
    traceparent: getHeader(headers, 'traceparent'),
    userId: getHeader(headers, 'x-user-id'),
    tenantId: getHeader(headers, 'x-tenant-id'),
  };
}

/**
 * Get header value as string.
 */
function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Validate required publish headers.
 * Returns array of missing header names.
 */
export function validatePublishHeaders(
  headers: Record<string, string | string[] | undefined>
): string[] {
  const missing: string[] = [];

  if (!getHeader(headers, 'x-service-name')) {
    missing.push('x-service-name');
  }
  if (!getHeader(headers, 'x-event-type')) {
    missing.push('x-event-type');
  }
  if (!getHeader(headers, 'x-correlation-id')) {
    missing.push('x-correlation-id');
  }

  return missing;
}
