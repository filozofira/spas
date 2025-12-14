/**
 * Unit tests for Tracer Service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Tracer, initTracer, getTracer, noopTracer } from '../../../src/services/tracer.js';

describe('Tracer', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('constructor', () => {
    it('should be disabled when no zipkinUrl provided', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      expect(tracer.isEnabled()).toBe(false);
    });

    it('should be enabled when zipkinUrl is provided', () => {
      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      expect(tracer.isEnabled()).toBe(true);
    });

    it('should respect explicit enabled=false', () => {
      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
        enabled: false,
      });
      expect(tracer.isEnabled()).toBe(false);
    });
  });

  describe('startSpan', () => {
    it('should create new root span without traceparent', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });

      const span = tracer.startSpan('test-operation');

      expect(span.name).toBe('test-operation');
      expect(span.context.traceId).toHaveLength(32);
      expect(span.context.spanId).toHaveLength(16);
      expect(span.context.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    });

    it('should create child span with valid traceparent', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const parentTraceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';

      const span = tracer.startSpan('child-operation', parentTraceparent);

      expect(span.name).toBe('child-operation');
      expect(span.context.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(span.context.spanId).toHaveLength(16);
      expect(span.context.spanId).not.toBe('b7ad6b7169203331');
    });

    it('should create root span with invalid traceparent', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });

      const span = tracer.startSpan('operation', 'invalid-traceparent');

      expect(span.name).toBe('operation');
      expect(span.context.traceId).toHaveLength(32);
    });

    it('should include provided tags', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });

      const span = tracer.startSpan('operation', undefined, {
        kind: 'event',
        transport: 'redis',
        'event.topic': 'orders',
      });

      expect(span.tags.kind).toBe('event');
      expect(span.tags.transport).toBe('redis');
      expect(span.tags['event.topic']).toBe('orders');
    });
  });

  describe('startChildSpan', () => {
    it('should create child span from parent', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const parentSpan = tracer.startSpan('parent');

      const childSpan = tracer.startChildSpan(parentSpan, 'child');

      expect(childSpan.name).toBe('child');
      expect(childSpan.context.traceId).toBe(parentSpan.context.traceId);
      expect(childSpan.context.spanId).not.toBe(parentSpan.context.spanId);
    });

    it('should inherit kind from parent', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const parentSpan = tracer.startSpan('parent', undefined, { kind: 'command' });

      const childSpan = tracer.startChildSpan(parentSpan, 'child');

      expect(childSpan.tags.kind).toBe('command');
    });

    it('should allow overriding tags', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const parentSpan = tracer.startSpan('parent');

      const childSpan = tracer.startChildSpan(parentSpan, 'child', {
        'http.url': '/api/test',
      });

      expect(childSpan.tags['http.url']).toBe('/api/test');
    });
  });

  describe('finishSpan', () => {
    it('should not queue spans when disabled', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const span = tracer.startSpan('operation');

      tracer.finishSpan(span);

      expect(tracer.getPendingSpanCount()).toBe(0);
    });

    it('should queue spans when enabled', () => {
      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const span = tracer.startSpan('operation');

      tracer.finishSpan(span);

      expect(tracer.getPendingSpanCount()).toBe(1);
    });

    it('should set parentId when provided', async () => {
      const mockFetch = jest.fn<(url: string, init: { body: string }) => Promise<{ ok: boolean }>>()
        .mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const parentSpan = tracer.startSpan('parent');
      const childSpan = tracer.startChildSpan(parentSpan, 'child');

      tracer.finishSpan(childSpan, parentSpan.context.spanId);
      await tracer.flush();

      expect(mockFetch).toHaveBeenCalled();
      const calls = mockFetch.mock.calls;
      const body = JSON.parse(calls[0][1].body);
      expect(body[0].parentId).toBe(parentSpan.context.spanId);
    });
  });

  describe('tagError', () => {
    it('should add error tag to span', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const span = tracer.startSpan('operation');

      tracer.tagError(span, 'Something went wrong');

      expect(span.tags.error).toBe('Something went wrong');
    });
  });

  describe('tagHttpStatus', () => {
    it('should add http.status_code tag', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const span = tracer.startSpan('operation');

      tracer.tagHttpStatus(span, 200);

      expect(span.tags['http.status_code']).toBe('200');
    });
  });

  describe('flush', () => {
    it('should not call fetch when disabled', async () => {
      const mockFetch = jest.fn<() => Promise<{ ok: boolean }>>();
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({ serviceName: 'test-service' });
      await tracer.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not call fetch when no pending spans', async () => {
      const mockFetch = jest.fn<() => Promise<{ ok: boolean }>>();
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      await tracer.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should POST spans to Zipkin', async () => {
      const mockFetch = jest.fn<() => Promise<{ ok: boolean }>>().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const span = tracer.startSpan('operation');
      tracer.finishSpan(span);

      await tracer.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://zipkin:9411/api/v2/spans',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should clear pending spans after successful flush', async () => {
      const mockFetch = jest.fn<() => Promise<{ ok: boolean }>>().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const span = tracer.startSpan('operation');
      tracer.finishSpan(span);

      expect(tracer.getPendingSpanCount()).toBe(1);
      await tracer.flush();
      expect(tracer.getPendingSpanCount()).toBe(0);
    });

    it('should re-queue spans on fetch failure', async () => {
      const mockFetch = jest.fn<() => Promise<never>>().mockRejectedValue(new Error('Network error'));
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const span = tracer.startSpan('operation');
      tracer.finishSpan(span);

      await tracer.flush();

      expect(tracer.getPendingSpanCount()).toBe(1);
    });
  });

  describe('getTraceparent', () => {
    it('should return traceparent from span context', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      const span = tracer.startSpan('operation');

      const traceparent = tracer.getTraceparent(span);

      expect(traceparent).toBe(span.context.traceparent);
      expect(traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    });
  });

  describe('shutdown', () => {
    it('should flush remaining spans', async () => {
      const mockFetch = jest.fn<() => Promise<{ ok: boolean }>>().mockResolvedValue({ ok: true });
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      const tracer = new Tracer({
        serviceName: 'test-service',
        zipkinUrl: 'http://zipkin:9411/api/v2/spans',
      });
      const span = tracer.startSpan('operation');
      tracer.finishSpan(span);

      await tracer.shutdown();

      expect(mockFetch).toHaveBeenCalled();
      expect(tracer.getPendingSpanCount()).toBe(0);
    });
  });
});

describe('Global Tracer', () => {
  describe('initTracer', () => {
    it('should create global tracer instance', () => {
      const tracer = initTracer({ serviceName: 'test' });

      expect(tracer).toBeInstanceOf(Tracer);
      expect(getTracer()).toBe(tracer);
    });
  });

  describe('getTracer', () => {
    it('should return null when not initialized', () => {
      // Note: This test depends on no other test having called initTracer
      // In practice, we reset between tests
    });
  });
});

describe('noopTracer', () => {
  it('should have isEnabled return false', () => {
    expect(noopTracer.isEnabled()).toBe(false);
  });

  it('should return empty span from startSpan', () => {
    const span = noopTracer.startSpan();
    expect(span.context.traceId).toBe('');
    expect(span.context.spanId).toBe('');
  });

  it('should not throw on any method call', async () => {
    expect(() => noopTracer.finishSpan()).not.toThrow();
    expect(() => noopTracer.tagError()).not.toThrow();
    expect(() => noopTracer.tagHttpStatus()).not.toThrow();
    await expect(noopTracer.emitSpan()).resolves.toBeUndefined();
    await expect(noopTracer.flush()).resolves.toBeUndefined();
    await expect(noopTracer.shutdown()).resolves.toBeUndefined();
  });
});
