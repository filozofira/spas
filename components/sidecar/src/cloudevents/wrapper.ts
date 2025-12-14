/**
 * CloudEvents Wrapper
 *
 * Wraps payloads in CloudEvents 1.0 envelope format.
 * @see https://cloudevents.io/
 */

import { v4 as uuid } from 'uuid';
import type { CloudEvent, PublishHeaders } from '../types.js';

/**
 * Wrap a payload in a CloudEvents 1.0 envelope.
 *
 * @param payload - Event data payload
 * @param topic - Target topic (used as subject)
 * @param headers - Publish request headers
 * @returns CloudEvent envelope with payload as data
 */
export function wrapCloudEvent<T = unknown>(
  payload: T,
  topic: string,
  headers: PublishHeaders
): CloudEvent<T> {
  return {
    specversion: '1.0',
    type: headers.eventType,
    source: headers.serviceName,
    subject: topic,
    id: uuid(),
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    traceparent: headers.traceparent || generateTraceparent(),
    correlationid: headers.correlationId,
    userid: headers.userId,
    tenantid: headers.tenantId,
    data: payload,
  };
}

/**
 * Parse CloudEvents envelope from Redis stream message.
 *
 * @param messageData - Stringified CloudEvent JSON from Redis
 * @returns Parsed CloudEvent object
 * @throws Error if message is not valid CloudEvents format
 */
export function parseCloudEvent<T = unknown>(messageData: string): CloudEvent<T> {
  const event = JSON.parse(messageData) as CloudEvent<T>;

  // Validate required CloudEvents fields
  if (event.specversion !== '1.0') {
    throw new Error(`Unsupported CloudEvents version: ${event.specversion}`);
  }

  if (!event.type || !event.source || !event.id) {
    throw new Error('Invalid CloudEvent: missing required fields (type, source, id)');
  }

  return event;
}

/**
 * Generate a new W3C traceparent header.
 * Format: {version}-{trace-id}-{parent-id}-{flags}
 *
 * @returns Generated traceparent string
 */
export function generateTraceparent(): string {
  const version = '00';
  const traceId = generateHexId(32); // 16 bytes = 32 hex chars
  const parentId = generateHexId(16); // 8 bytes = 16 hex chars
  const flags = '01'; // sampled

  return `${version}-${traceId}-${parentId}-${flags}`;
}

/**
 * Generate random hex string of specified length.
 */
function generateHexId(length: number): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Serialize CloudEvent for Redis stream storage.
 *
 * @param event - CloudEvent to serialize
 * @returns Stringified JSON
 */
export function serializeCloudEvent<T = unknown>(event: CloudEvent<T>): string {
  return JSON.stringify(event);
}

/**
 * Extract correlation ID from CloudEvent for logging.
 */
export function extractCorrelationId(event: CloudEvent): string | undefined {
  return event.correlationid;
}

/**
 * Extract trace context from CloudEvent for span propagation.
 */
export function extractTraceparent(event: CloudEvent): string {
  return event.traceparent;
}
