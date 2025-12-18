/**
 * SPAS Sidecar Type Definitions
 *
 * Core interfaces for sidecar configuration, CloudEvents, tracing, and health.
 */

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Root configuration object loaded from JSON file.
 * Source: Mounted JSON file at CONFIG_PATH environment variable path.
 */
export interface SidecarConfig {
  inbound: InboundEntry[];
  outbound: OutboundEntry[];
}

/**
 * Configuration for consuming events or handling commands.
 */
export interface InboundEntry {
  /** Entry type: 'command' for request-response, 'event' for subscription */
  kind: 'command' | 'event';
  /** Command name - required when kind='command' */
  command?: string;
  /** Topic to subscribe to - required when kind='event' */
  topic?: string;
  /** Optional CloudEvents type filter - when omitted, processes all events on topic */
  eventType?: string;
  /** Optional transform function - when omitted, passthrough (no transformation) */
  transform?: string;
  /** Service endpoint to invoke with transformed payload */
  invokeEndpoint: string;
}

/**
 * Configuration for publishing events. Maps event types to target topics.
 */
export interface OutboundEntry {
  /** Event type from x-event-type header (e.g., 'com.example.order.created') */
  eventType: string;
  /** Target Redis stream topic */
  topic: string;
  /** Optional transform function - when omitted, no transformation applied */
  transform?: string;
}

/**
 * Legacy configuration format (for migration support).
 */
export interface LegacyConfig {
  subscriptions?: LegacySubscription[];
  publications?: LegacyPublication[];
}

export interface LegacySubscription {
  topic: string;
  transform: string;
  invokeEndpoint: string;
}

export interface LegacyPublication {
  topic: string;
  transform?: string;
}

// =============================================================================
// CloudEvents Types
// =============================================================================

/**
 * CloudEvents 1.0 message envelope.
 * @see https://cloudevents.io/
 */
export interface CloudEvent<T = unknown> {
  /** CloudEvents specification version */
  specversion: '1.0';
  /** Event type identifier (reverse-DNS format) */
  type: string;
  /** Event source identifier (service name) */
  source: string;
  /** Event subject (typically topic name) */
  subject?: string;
  /** Unique event identifier */
  id: string;
  /** Event timestamp in ISO 8601 format */
  time: string;
  /** Content type of data field */
  datacontenttype: string;
  /** W3C Trace Context traceparent header */
  traceparent: string;
  /** Correlation ID for event chain tracking */
  correlationid?: string;
  /** User identity (optional) */
  userid?: string;
  /** Tenant identity (optional) */
  tenantid?: string;
  /** Event payload */
  data: T;
}

/**
 * Headers extracted from incoming publish request.
 */
export interface PublishHeaders {
  traceparent?: string;
  serviceName: string;
  /** Full CloudEvents type from x-event-type header (legacy) */
  eventType?: string;
  /** Short event name from x-event-name header (new) */
  eventName?: string;
  correlationId: string;
  userId?: string;
  tenantId?: string;
}

// =============================================================================
// Tracing Types
// =============================================================================

/**
 * Parsed W3C Trace Context traceparent header.
 * Format: {version}-{trace-id}-{parent-id}-{flags}
 */
export interface ParsedTraceparent {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
}

/**
 * Zipkin API v2 span format.
 */
export interface ZipkinSpan {
  /** 32 hex character trace ID */
  traceId: string;
  /** 16 hex character span ID */
  id: string;
  /** 16 hex character parent span ID (optional) */
  parentId?: string;
  /** Span kind for Zipkin (CLIENT, SERVER, PRODUCER, CONSUMER) */
  kind?: 'CLIENT' | 'SERVER' | 'PRODUCER' | 'CONSUMER';
  /** Operation name */
  name: string;
  /** Start timestamp in microseconds since epoch */
  timestamp: number;
  /** Duration in microseconds */
  duration: number;
  /** Local endpoint information */
  localEndpoint: {
    serviceName: string;
  };
  /** Remote endpoint information (for CLIENT/SERVER/PRODUCER/CONSUMER spans) */
  remoteEndpoint?: {
    serviceName: string;
  };
  /** Span tags/attributes */
  tags: Record<string, string>;
}

/**
 * Standard span tags used by the sidecar.
 */
export interface SpanTags {
  kind: 'event' | 'command';
  /** Zipkin span kind - maps to top-level kind field */
  spanKind?: 'CLIENT' | 'SERVER' | 'PRODUCER' | 'CONSUMER';
  /** Remote service name for dependency graph */
  remoteServiceName?: string;
  transport: 'redis' | 'http';
  'event.topic'?: string;
  'http.url'?: string;
  'http.method'?: string;
  'http.status_code'?: string;
  'transform.function'?: string;
  'cloudevents.type'?: string;
  error?: string;
}

// =============================================================================
// Health Types
// =============================================================================

/**
 * Health check response.
 */
export interface HealthResponse {
  status: 'ok' | 'ready' | 'not ready';
  reason?: string;
  timestamp: string;
}

/**
 * Sidecar lifecycle states.
 */
export type SidecarState = 'STARTING' | 'CONNECTING' | 'READY' | 'DEGRADED' | 'FAILED';

// =============================================================================
// Transport Types
// =============================================================================

/**
 * Redis stream message format.
 */
export interface RedisStreamMessage {
  id: string;
  message: Record<string, string>;
}

/**
 * HTTP invocation result.
 */
export interface InvocationResult {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

/**
 * Publish result returned to caller.
 */
export interface PublishResult {
  status: 'accepted';
  id: string;
  topic: string;
  eventType: string;
}

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Environment variables used by the sidecar.
 */
export interface SidecarEnv {
  CONFIG_PATH: string;
  SERVICE_NAME: string;
  SERVICE_PORT: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  SIDECAR_PORT: string;
  ZIPKIN_URL?: string;
}
