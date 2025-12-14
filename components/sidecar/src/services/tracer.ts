/**
 * Tracer Service
 *
 * Distributed tracing with Zipkin span emission.
 * Creates and reports spans for all sidecar operations.
 */

import type { ZipkinSpan, SpanTags } from '../types.js';
import {
  parseTraceparent,
  generateSpanId,
  toMicroseconds,
  calculateDuration,
} from '../utils/traceparent.js';

/**
 * Tracer configuration.
 */
export interface TracerConfig {
  /** Zipkin API endpoint (e.g., http://zipkin:9411/api/v2/spans) */
  zipkinUrl?: string;
  /** Service name for span reporting */
  serviceName: string;
  /** Enable/disable tracing (default: true if zipkinUrl set) */
  enabled?: boolean;
}

/**
 * Span context for creating child spans.
 */
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceparent: string;
}

/**
 * Active span tracker.
 */
export interface ActiveSpan {
  context: SpanContext;
  name: string;
  startTime: number;
  tags: SpanTags;
}

/**
 * Tracer for distributed tracing with Zipkin.
 */
export class Tracer {
  private readonly config: TracerConfig;
  private readonly pendingSpans: ZipkinSpan[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly flushIntervalMs = 1000;

  constructor(config: TracerConfig) {
    this.config = {
      ...config,
      enabled: config.enabled ?? !!config.zipkinUrl,
    };
  }

  /**
   * Check if tracing is enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled === true && !!this.config.zipkinUrl;
  }

  /**
   * Start a new root span or child span.
   *
   * @param name - Span name (operation)
   * @param traceparent - Optional parent traceparent
   * @param tags - Span tags
   * @returns Active span to be finished later
   */
  startSpan(name: string, traceparent?: string, tags?: Partial<SpanTags>): ActiveSpan {
    let context: SpanContext;

    if (traceparent) {
      const parsed = parseTraceparent(traceparent);
      if (parsed) {
        // Create child span
        const newSpanId = generateSpanId();
        context = {
          traceId: parsed.traceId,
          spanId: newSpanId,
          traceparent: `${parsed.version}-${parsed.traceId}-${newSpanId}-${parsed.flags}`,
        };
      } else {
        // Invalid traceparent, create new root
        context = this.createRootContext();
      }
    } else {
      // No traceparent, create new root
      context = this.createRootContext();
    }

    return {
      context,
      name,
      startTime: toMicroseconds(),
      tags: {
        kind: 'event',
        transport: 'http',
        ...tags,
      } as SpanTags,
    };
  }

  /**
   * Create a child span from an existing span.
   */
  startChildSpan(parent: ActiveSpan, name: string, tags?: Partial<SpanTags>): ActiveSpan {
    const newSpanId = generateSpanId();
    const parsed = parseTraceparent(parent.context.traceparent);
    
    const context: SpanContext = {
      traceId: parent.context.traceId,
      spanId: newSpanId,
      traceparent: parsed
        ? `${parsed.version}-${parsed.traceId}-${newSpanId}-${parsed.flags}`
        : parent.context.traceparent,
    };

    return {
      context,
      name,
      startTime: toMicroseconds(),
      tags: {
        kind: parent.tags.kind,
        transport: parent.tags.transport,
        ...tags,
      } as SpanTags,
    };
  }

  /**
   * Finish a span and queue it for reporting.
   */
  finishSpan(span: ActiveSpan, parentSpanId?: string): void {
    if (!this.isEnabled()) {
      return;
    }

    const duration = calculateDuration(span.startTime);

    const zipkinSpan: ZipkinSpan = {
      traceId: span.context.traceId,
      id: span.context.spanId,
      name: span.name,
      timestamp: span.startTime,
      duration,
      localEndpoint: {
        serviceName: this.config.serviceName,
      },
      tags: span.tags as unknown as Record<string, string>,
    };

    if (parentSpanId) {
      zipkinSpan.parentId = parentSpanId;
    }

    this.pendingSpans.push(zipkinSpan);
    this.scheduleFlush();
  }

  /**
   * Add error tag to span.
   */
  tagError(span: ActiveSpan, error: string): void {
    span.tags.error = error;
  }

  /**
   * Add HTTP status to span.
   */
  tagHttpStatus(span: ActiveSpan, status: number): void {
    span.tags['http.status_code'] = String(status);
  }

  /**
   * Report a complete span immediately.
   */
  async reportSpan(span: ZipkinSpan): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    this.pendingSpans.push(span);
    await this.flush();
  }

  /**
   * Create a simple span and report it (for one-shot operations).
   */
  async emitSpan(
    name: string,
    traceparent: string,
    startTime: number,
    duration: number,
    tags: SpanTags,
    parentSpanId?: string
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const parsed = parseTraceparent(traceparent);
    if (!parsed) {
      console.warn(`[tracer] Invalid traceparent, skipping span: ${name}`);
      return;
    }

    const span: ZipkinSpan = {
      traceId: parsed.traceId,
      id: parsed.parentId,
      name,
      timestamp: startTime,
      duration,
      localEndpoint: {
        serviceName: this.config.serviceName,
      },
      tags: tags as unknown as Record<string, string>,
    };

    if (parentSpanId) {
      span.parentId = parentSpanId;
    }

    this.pendingSpans.push(span);
    this.scheduleFlush();
  }

  /**
   * Flush pending spans to Zipkin.
   */
  async flush(): Promise<void> {
    if (!this.isEnabled() || this.pendingSpans.length === 0) {
      return;
    }

    const spans = [...this.pendingSpans];
    this.pendingSpans.length = 0;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      const response = await fetch(this.config.zipkinUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spans),
      });

      if (!response.ok) {
        console.warn(`[tracer] Failed to report spans: ${response.status} ${response.statusText}`);
        // Re-queue failed spans for retry (up to a limit)
        if (this.pendingSpans.length < 1000) {
          this.pendingSpans.push(...spans);
        }
      } else {
        console.log(`[tracer] Reported ${spans.length} span(s) to Zipkin`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[tracer] Error reporting spans: ${message}`);
      // Re-queue failed spans for retry
      if (this.pendingSpans.length < 1000) {
        this.pendingSpans.push(...spans);
      }
    }
  }

  /**
   * Get the traceparent from a span context.
   */
  getTraceparent(span: ActiveSpan): string {
    return span.context.traceparent;
  }

  /**
   * Get pending span count (for testing).
   */
  getPendingSpanCount(): number {
    return this.pendingSpans.length;
  }

  /**
   * Shutdown tracer, flush remaining spans.
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Create a root trace context (no parent).
   */
  private createRootContext(): SpanContext {
    const traceId = this.generateTraceId();
    const spanId = generateSpanId();
    return {
      traceId,
      spanId,
      traceparent: `00-${traceId}-${spanId}-01`,
    };
  }

  /**
   * Generate a new trace ID (32 hex characters).
   */
  private generateTraceId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Schedule a flush of pending spans.
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush().catch((err) => {
        console.error('[tracer] Flush error:', err);
      });
    }, this.flushIntervalMs);
  }
}

/**
 * Global tracer instance (set during initialization).
 */
let globalTracer: Tracer | null = null;

/**
 * Initialize global tracer.
 */
export function initTracer(config: TracerConfig): Tracer {
  globalTracer = new Tracer(config);
  return globalTracer;
}

/**
 * Get global tracer (returns no-op if not initialized).
 */
export function getTracer(): Tracer | null {
  return globalTracer;
}

/**
 * No-op tracer for when tracing is disabled.
 */
export const noopTracer = {
  isEnabled: () => false,
  startSpan: () => ({ context: { traceId: '', spanId: '', traceparent: '' }, name: '', startTime: 0, tags: {} as SpanTags }),
  startChildSpan: () => ({ context: { traceId: '', spanId: '', traceparent: '' }, name: '', startTime: 0, tags: {} as SpanTags }),
  finishSpan: () => {},
  tagError: () => {},
  tagHttpStatus: () => {},
  emitSpan: async () => {},
  flush: async () => {},
  shutdown: async () => {},
  getTraceparent: () => '',
  getPendingSpanCount: () => 0,
};
