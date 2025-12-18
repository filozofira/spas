/**
 * Event Publisher Service
 *
 * Publishes events to Redis streams with CloudEvents envelope.
 * Handles transformation and tracing.
 */

import type { SidecarConfig, PublishHeaders, PublishResult, SpanTags } from '../types.js';
import { RedisClient } from '../transport/redis.js';
import { wrapCloudEvent, serializeCloudEvent, resolveEventType } from '../cloudevents/wrapper.js';
import { resolveTopicFromEventType } from './topic-router.js';
import { getTracer } from './tracer.js';
import { applyTransform } from './transformer.js';

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
    // DEBUG: Log incoming headers
    console.log('[publish] Headers received:', JSON.stringify(headers, null, 2));
    
    // 1. Resolve event type from headers (prioritizes x-event-name over x-event-type)
    const resolvedEventType = resolveEventType(headers);
    console.log('[publish] Resolved eventType:', resolvedEventType);

    // DEBUG: Log payload for troubleshooting (PoC only)
    console.log('[publish] Payload:', JSON.stringify(payload, null, 2));

    // 2. Resolve topic from event type
    const route = resolveTopicFromEventType(resolvedEventType, this.config);
    console.log('[publish] Route lookup result:', JSON.stringify(route));
    console.log('[publish] Config outbound:', JSON.stringify(this.config.outbound));

    if (!route.found || !route.topic) {
      throw new Error(`No outbound route configured for event type: ${resolvedEventType}`);
    }

    // 3. Apply transform if configured (using shared transformer service)
    let transformedPayload = payload;
    if (route.transform) {
      transformedPayload = await applyTransform(payload, route.transform);
    }

    // 4. Wrap in CloudEvents envelope
    const cloudEvent = wrapCloudEvent(transformedPayload, route.topic, headers);

    // Start tracing span with eventType tag
    const tracer = getTracer();
    const span = tracer?.startSpan('publish', headers.traceparent, {
      kind: 'event',
      transport: 'redis',
      'event.topic': route.topic,
      'cloudevents.type': resolvedEventType,
    } as Partial<SpanTags>);

    try {
      // 5. Serialize and publish to Redis stream
      const serialized = serializeCloudEvent(cloudEvent);
      await this.redis.xadd(route.topic, {
        data: serialized,
      });

      // Finish span on success
      if (span) {
        tracer?.finishSpan(span);
      }

      return {
        status: 'accepted',
        id: cloudEvent.id,
        topic: route.topic,
        eventType: resolvedEventType,
      };
    } catch (err) {
      // Tag error and finish span
      if (span) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        tracer?.tagError(span, message);
        tracer?.finishSpan(span);
      }
      throw err;
    }
  }
}

/**
 * Extract publish headers from Express request.
 *
 * Required headers:
 * - x-service-name: Source service name
 * - x-correlation-id: Correlation ID for tracing
 * - ONE OF: x-event-name (new) OR x-event-type (legacy)
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
  const eventName = getHeader(headers, 'x-event-name');
  const correlationId = getHeader(headers, 'x-correlation-id');

  // Required headers: serviceName, correlationId, and ONE OF eventName or eventType
  if (!serviceName || !correlationId || (!eventName && !eventType)) {
    return null;
  }

  return {
    serviceName,
    eventType,
    eventName,
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
 * Note: Either x-event-name OR x-event-type must be present (not both required).
 */
export function validatePublishHeaders(
  headers: Record<string, string | string[] | undefined>
): string[] {
  const missing: string[] = [];

  if (!getHeader(headers, 'x-service-name')) {
    missing.push('x-service-name');
  }
  
  // Either x-event-name or x-event-type must be present
  const hasEventName = !!getHeader(headers, 'x-event-name');
  const hasEventType = !!getHeader(headers, 'x-event-type');
  if (!hasEventName && !hasEventType) {
    missing.push('x-event-type or x-event-name');
  }
  
  if (!getHeader(headers, 'x-correlation-id')) {
    missing.push('x-correlation-id');
  }

  return missing;
}
