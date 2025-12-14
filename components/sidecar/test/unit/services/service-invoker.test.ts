/**
 * Service Invoker Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ServiceInvoker } from '../../../src/services/service-invoker.js';
import type { CloudEvent } from '../../../src/types.js';

// Mock HTTP client
const mockHttpClient = {
  post: jest.fn<(endpoint: string, payload: unknown, headers: Record<string, string>) => Promise<{ status: number; data: unknown; headers: Record<string, string> }>>(),
  get: jest.fn(),
};

describe('Service Invoker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createTestEvent = (overrides?: Partial<CloudEvent>): CloudEvent => ({
    specversion: '1.0',
    type: 'com.example.order.created',
    source: 'order-service',
    id: 'event-123',
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
    correlationid: 'corr-456',
    data: { orderId: 'order-789' },
    ...overrides,
  });

  describe('invoke', () => {
    it('should POST to endpoint with payload', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: { success: true }, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent();

      const result = await invoker.invoke('/orders', { orderId: '123' }, event);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/orders',
        { orderId: '123' },
        expect.any(Object)
      );
      expect(result.status).toBe(200);
    });

    it('should propagate traceparent header', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {}, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent({
        traceparent: '00-custom-trace-parent-01',
      });

      await invoker.invoke('/orders', {}, event);

      const callArgs = mockHttpClient.post.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(callArgs[2].traceparent).toBe('00-custom-trace-parent-01');
    });

    it('should propagate correlation ID', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {}, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent({
        correlationid: 'my-correlation-id',
      });

      await invoker.invoke('/orders', {}, event);

      const callArgs = mockHttpClient.post.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(callArgs[2]['x-correlation-id']).toBe('my-correlation-id');
    });

    it('should propagate user and tenant IDs when present', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {}, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent({
        userid: 'user-abc',
        tenantid: 'tenant-xyz',
      });

      await invoker.invoke('/orders', {}, event);

      const callArgs = mockHttpClient.post.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(callArgs[2]['x-user-id']).toBe('user-abc');
      expect(callArgs[2]['x-tenant-id']).toBe('tenant-xyz');
    });

    it('should include event type and source headers', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: {}, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent({
        type: 'com.example.order.shipped',
        source: 'shipping-service',
      });

      await invoker.invoke('/orders', {}, event);

      const callArgs = mockHttpClient.post.mock.calls[0] as [string, unknown, Record<string, string>];
      expect(callArgs[2]['x-event-type']).toBe('com.example.order.shipped');
      expect(callArgs[2]['x-event-source']).toBe('shipping-service');
    });

    it('should return result with error status on failure', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 500,
        data: { error: 'Internal error' },
        headers: {},
      });
      const invoker = new ServiceInvoker(mockHttpClient as never);
      const event = createTestEvent();

      const result = await invoker.invoke('/orders', {}, event);

      expect(result.status).toBe(500);
      expect(result.data).toEqual({ error: 'Internal error' });
    });
  });

  describe('invokeCommand', () => {
    it('should POST to endpoint with custom headers', async () => {
      mockHttpClient.post.mockResolvedValue({ status: 200, data: { result: 'ok' }, headers: {} });
      const invoker = new ServiceInvoker(mockHttpClient as never);

      const result = await invoker.invokeCommand(
        '/commands/create-order',
        { items: ['item1'] },
        { 'x-correlation-id': 'cmd-123' }
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/commands/create-order',
        { items: ['item1'] },
        { 'x-correlation-id': 'cmd-123' }
      );
      expect(result.status).toBe(200);
    });
  });
});
