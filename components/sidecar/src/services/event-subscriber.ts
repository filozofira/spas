/**
 * Event Subscriber Service
 *
 * Subscribes to Redis streams and processes incoming events.
 * Consumes CloudEvents, applies transforms, and invokes service endpoints.
 */

import type { SidecarConfig, InboundEntry, SpanTags, CloudEvent } from '../types.js';
import { RedisClient } from '../transport/redis.js';
import { parseCloudEvent } from '../cloudevents/wrapper.js';
import { ServiceInvoker } from './service-invoker.js';
import { applyTransform } from './transformer.js';
import { getTracer } from './tracer.js';

/**
 * Event subscriber that listens to Redis streams and invokes services.
 */
export class EventSubscriber {
  private readonly redis: RedisClient;
  private readonly config: SidecarConfig;
  private readonly invoker: ServiceInvoker;
  private running: boolean = false;
  private lastIds: Map<string, string> = new Map();

  constructor(redis: RedisClient, config: SidecarConfig, invoker: ServiceInvoker) {
    this.redis = redis;
    this.config = config;
    this.invoker = invoker;
  }

  /**
   * Get event subscriptions from inbound config.
   */
  getEventSubscriptions(): InboundEntry[] {
    return this.config.inbound.filter((e) => e.kind === 'event');
  }

  /**
   * Start the subscription loop.
   * Runs continuously until stop() is called.
   */
  async start(): Promise<void> {
    this.running = true;

    const subscriptions = this.getEventSubscriptions();
    if (subscriptions.length === 0) {
      console.log('[subscriber] No event subscriptions configured');
      return;
    }

    // Initialize last IDs to '$' for new messages only
    const streams: string[] = [];
    for (const sub of subscriptions) {
      if (sub.topic) {
        streams.push(sub.topic);
        this.lastIds.set(sub.topic, '$');
      }
    }

    console.log(`[subscriber] Starting subscription loop for ${streams.length} stream(s)`);

    while (this.running) {
      try {
        await this.pollOnce(subscriptions);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[subscriber] Error in poll loop: ${message}`);
        // Brief pause before retry
        await this.sleep(1000);
      }
    }

    console.log('[subscriber] Subscription loop stopped');
  }

  /**
   * Poll Redis streams once for new messages.
   */
  async pollOnce(subscriptions: InboundEntry[]): Promise<void> {
    const streams: string[] = [];
    const ids: string[] = [];

    for (const sub of subscriptions) {
      if (sub.topic) {
        streams.push(sub.topic);
        ids.push(this.lastIds.get(sub.topic) || '$');
      }
    }

    if (streams.length === 0) {
      return;
    }

    // Block for up to 5 seconds waiting for messages
    const result = await this.redis.xread(streams, ids, 5000);

    if (!result) {
      return; // No messages, continue loop
    }

    // Process messages from each stream
    for (const [stream, messages] of result.entries()) {
      const topicSubscriptions = subscriptions.filter((s) => s.topic === stream);
      if (topicSubscriptions.length === 0) {
        continue;
      }

      for (const msg of messages) {
        // Update last ID for this stream
        this.lastIds.set(stream, msg.id);

        try {
          await this.processMessageForTopic(msg.message, topicSubscriptions);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[subscriber] Error processing message ${msg.id}: ${errMsg}`);
          // Continue processing other messages
        }
      }
    }
  }

  /**
   * Process a single message and route it to all subscriptions for the topic.
   * This supports multiple event types on the same topic (common in PoC).
   */
  private async processMessageForTopic(
    message: Record<string, string>,
    topicSubscriptions: InboundEntry[]
  ): Promise<void> {
    const data = message.data;
    if (!data) {
      console.warn('[subscriber] Message missing data field');
      return;
    }

    const event = parseCloudEvent(data);
    console.log(`[subscriber] Processing event ${event.id} (${event.type})`);

    // Route to all matching subscriptions for this topic.
    // Match rules:
    // - If subscription.eventType is set, it must match the CloudEvent type.
    // - If subscription.eventType is not set, the subscription accepts all types.
    const matchingSubscriptions = topicSubscriptions.filter(
      (s) => !s.eventType || s.eventType === event.type
    );

    if (matchingSubscriptions.length === 0) {
      // Preserve existing logging behavior but avoid claiming a single "expected" value
      // since multiple subscriptions may exist.
      const expectedTypes = topicSubscriptions
        .map((s) => s.eventType)
        .filter((t): t is string => typeof t === 'string' && t.length > 0);
      if (expectedTypes.length > 0) {
        console.log(
          `[subscriber] Skipping event - type mismatch (expected one of: ${expectedTypes.join(
            ', '
          )}, got: ${event.type})`
        );
      } else {
        console.log(
          `[subscriber] Skipping event - no matching subscription for type ${event.type}`
        );
      }
      return;
    }

    for (const subscription of matchingSubscriptions) {
      await this.processEvent(event, subscription);
    }
  }

  private async processEvent(event: CloudEvent, subscription: InboundEntry): Promise<void> {
    // DEBUG: Log payload for troubleshooting (PoC only)
    console.log(`[subscriber] Payload:`, JSON.stringify(event.data, null, 2));

    // Start parent span for event processing with eventType tag
    // remoteServiceName is 'redis' (the message broker) for CONSUMER spans
    const tracer = getTracer();
    const parentSpan = tracer?.startSpan('receive', event.traceparent, {
      kind: 'event',
      spanKind: 'CONSUMER',
      remoteServiceName: 'redis',
      transport: 'redis',
      'event.topic': subscription.topic,
      'cloudevents.type': event.type,
      'peer.service': event.source,
    } as Partial<SpanTags>);

    try {
      // Apply inbound transform with child span
      let payload = event.data;
      if (subscription.transform) {
        // Create local span for transformation
        const transformSpan = parentSpan
          ? tracer?.startSpan('transform', parentSpan.context.traceparent, {
              'transform.function': subscription.transform,
            } as Partial<SpanTags>)
          : undefined;

        payload = await applyTransform(payload, subscription.transform);

        if (transformSpan) {
          tracer?.finishSpan(transformSpan, parentSpan?.context.spanId);
        }
      }

      // Invoke service endpoint with child span
      // remoteServiceName is the service being invoked (derived from SERVICE_NAME env var)
      const targetServiceName = process.env.SERVICE_NAME || 'unknown-service';
      const invokeSpan = parentSpan
        ? tracer?.startChildSpan(parentSpan, 'invoke', {
            'http.url': subscription.invokeEndpoint,
            'http.method': 'POST',
            spanKind: 'CLIENT',
            remoteServiceName: targetServiceName,
          } as Partial<SpanTags>)
        : undefined;

      // Pass invoke span's traceparent so downstream service links to this span
      const invokeTraceparent = invokeSpan ? tracer?.getTraceparent(invokeSpan) : undefined;
      const result = await this.invoker.invoke(
        subscription.invokeEndpoint,
        payload,
        event,
        invokeTraceparent
      );

      if (invokeSpan) {
        tracer?.tagHttpStatus(invokeSpan, result.status);
        tracer?.finishSpan(invokeSpan, parentSpan?.context.spanId);
      }

      if (parentSpan) {
        tracer?.finishSpan(parentSpan);
      }
    } catch (err) {
      if (parentSpan) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        tracer?.tagError(parentSpan, errMsg);
      }
      throw err;
    }
  }

  /**
   * Process a single message from a stream.
   */
  async processMessage(
    message: Record<string, string>,
    subscription: InboundEntry
  ): Promise<void> {
    // Backwards-compatible API: process a single message with a single subscription.
    // Used by unit tests and potential external callers.
    return this.processMessageForTopic(message, [subscription]);
  }

  /**
   * Stop the subscriber loop.
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Check if subscriber is running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Sleep helper for retry delays.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create event subscriber with default configuration.
 */
export function createEventSubscriber(
  redis: RedisClient,
  config: SidecarConfig,
  invoker: ServiceInvoker
): EventSubscriber {
  return new EventSubscriber(redis, config, invoker);
}
