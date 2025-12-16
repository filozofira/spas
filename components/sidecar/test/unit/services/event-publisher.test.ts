/**
 * Event Publisher Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { join } from 'path';
import {
  EventPublisher,
  extractPublishHeaders,
  validatePublishHeaders,
} from '../../../src/services/event-publisher.js';
import { clearTransformCache } from '../../../src/services/transformer.js';
import type { SidecarConfig, PublishHeaders } from '../../../src/types.js';

// Mock RedisClient
const mockRedis = {
  xadd: jest.fn<(stream: string, fields: Record<string, string>) => Promise<string>>(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  xread: jest.fn(),
  ping: jest.fn(),
};

describe('Event Publisher', () => {
  const testConfig: SidecarConfig = {
    inbound: [],
    outbound: [
      { eventType: 'com.example.order.created', topic: 'orders.created' },
      { eventType: 'com.example.order.updated', topic: 'orders.updated', transform: 'orderTransform' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.xadd.mockResolvedValue('1234567890-0');
  });

  describe('EventPublisher.publish', () => {
    it('should publish event to correct topic', async () => {
      const publisher = new EventPublisher(mockRedis as never, testConfig);
      const payload = { orderId: '123', amount: 100 };
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventType: 'com.example.order.created',
        correlationId: 'corr-123',
      };

      const result = await publisher.publish(payload, headers);

      expect(result.status).toBe('accepted');
      expect(result.topic).toBe('orders.created');
      expect(result.eventType).toBe('com.example.order.created');
      expect(result.id).toBeDefined();
      expect(mockRedis.xadd).toHaveBeenCalledWith('orders.created', expect.any(Object));
    });

    it('should wrap payload in CloudEvents envelope', async () => {
      const publisher = new EventPublisher(mockRedis as never, testConfig);
      const payload = { orderId: '123' };
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventType: 'com.example.order.created',
        correlationId: 'corr-123',
        traceparent: '00-trace-span-01',
      };

      await publisher.publish(payload, headers);

      const callArgs = mockRedis.xadd.mock.calls[0];
      const data = JSON.parse(callArgs[1].data);

      expect(data.specversion).toBe('1.0');
      expect(data.type).toBe('com.example.order.created');
      expect(data.source).toBe('order-service');
      expect(data.correlationid).toBe('corr-123');
      expect(data.data).toEqual({ orderId: '123' });
    });

    it('should include optional headers in CloudEvent', async () => {
      const publisher = new EventPublisher(mockRedis as never, testConfig);
      const payload = { test: true };
      const headers: PublishHeaders = {
        serviceName: 'test-service',
        eventType: 'com.example.order.created',
        correlationId: 'corr-456',
        userId: 'user-123',
        tenantId: 'tenant-abc',
      };

      await publisher.publish(payload, headers);

      const callArgs = mockRedis.xadd.mock.calls[0];
      const data = JSON.parse(callArgs[1].data);

      expect(data.userid).toBe('user-123');
      expect(data.tenantid).toBe('tenant-abc');
    });

    it('should throw for unknown event type', async () => {
      const publisher = new EventPublisher(mockRedis as never, testConfig);
      const headers: PublishHeaders = {
        serviceName: 'test-service',
        eventType: 'com.unknown.event',
        correlationId: 'corr-789',
      };

      await expect(publisher.publish({}, headers)).rejects.toThrow(
        'No outbound route configured for event type: com.unknown.event'
      );
    });

    // T022: Outbound file-based transform test
    it('should apply file-based transform to outbound events', async () => {
      // Path to test fixture
      const transformPath = join(process.cwd(), 'test/fixtures/transforms/outbound-stock-reserved.jsonata');
      
      // Config with file-based transform
      const configWithTransform: SidecarConfig = {
        inbound: [],
        outbound: [
          { 
            eventType: 'com.example.stock.reserved', 
            topic: 'stock.reserved', 
            transform: transformPath 
          },
        ],
      };

      // Clear cache for clean test
      clearTransformCache();

      const publisher = new EventPublisher(mockRedis as never, configWithTransform);
      const payload = {
        data: {
          sku: 'PROD-123',
          quantity: 5,
          warehouse: 'WH-001',
          orderId: 'ORD-456',
        },
      };
      const headers: PublishHeaders = {
        serviceName: 'inventory-service',
        eventType: 'com.example.stock.reserved',
        correlationId: 'corr-stock-123',
      };

      const result = await publisher.publish(payload, headers);

      expect(result.status).toBe('accepted');
      expect(result.topic).toBe('stock.reserved');

      // Verify the transformed payload in CloudEvent
      const callArgs = mockRedis.xadd.mock.calls[0];
      const cloudEvent = JSON.parse(callArgs[1].data);

      // The transform should have restructured the data
      expect(cloudEvent.data).toEqual({
        productId: 'PROD-123',
        reservedQuantity: 5,
        warehouseId: 'WH-001',
        orderId: 'ORD-456',
      });
    });
  });

  describe('extractPublishHeaders', () => {
    it('should extract all required headers', () => {
      const headers = {
        'x-service-name': 'my-service',
        'x-event-type': 'com.example.event',
        'x-correlation-id': 'corr-123',
      };

      const result = extractPublishHeaders(headers);

      expect(result).not.toBeNull();
      expect(result?.serviceName).toBe('my-service');
      expect(result?.eventType).toBe('com.example.event');
      expect(result?.correlationId).toBe('corr-123');
    });

    it('should extract optional headers', () => {
      const headers = {
        'x-service-name': 'my-service',
        'x-event-type': 'com.example.event',
        'x-correlation-id': 'corr-123',
        traceparent: '00-trace-span-01',
        'x-user-id': 'user-456',
        'x-tenant-id': 'tenant-789',
      };

      const result = extractPublishHeaders(headers);

      expect(result?.traceparent).toBe('00-trace-span-01');
      expect(result?.userId).toBe('user-456');
      expect(result?.tenantId).toBe('tenant-789');
    });

    it('should return null if required headers missing', () => {
      const headers = {
        'x-service-name': 'my-service',
        // missing x-event-type and x-correlation-id
      };

      const result = extractPublishHeaders(headers);

      expect(result).toBeNull();
    });

    it('should handle array header values', () => {
      const headers = {
        'x-service-name': ['my-service'],
        'x-event-type': ['com.example.event'],
        'x-correlation-id': ['corr-123'],
      };

      const result = extractPublishHeaders(headers);

      expect(result?.serviceName).toBe('my-service');
    });
  });

  describe('validatePublishHeaders', () => {
    it('should return empty array for valid headers', () => {
      const headers = {
        'x-service-name': 'my-service',
        'x-event-type': 'com.example.event',
        'x-correlation-id': 'corr-123',
      };

      const missing = validatePublishHeaders(headers);

      expect(missing).toEqual([]);
    });

    it('should return missing header names', () => {
      const headers = {
        'x-service-name': 'my-service',
      };

      const missing = validatePublishHeaders(headers);

      expect(missing).toContain('x-event-type');
      expect(missing).toContain('x-correlation-id');
      expect(missing).not.toContain('x-service-name');
    });

    it('should return all required headers for empty object', () => {
      const missing = validatePublishHeaders({});

      expect(missing).toHaveLength(3);
      expect(missing).toContain('x-service-name');
      expect(missing).toContain('x-event-type');
      expect(missing).toContain('x-correlation-id');
    });
  });
});
