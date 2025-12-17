/**
 * CloudEvents Wrapper Unit Tests
 *
 * Tests for CloudEvents type construction and resolution (FG09).
 */

import { describe, it, expect } from '@jest/globals';
import {
  constructCloudEventsType,
  resolveEventType,
  wrapCloudEvent,
} from '../../../src/cloudevents/wrapper.js';
import type { PublishHeaders } from '../../../src/types.js';

describe('CloudEvents Wrapper', () => {
  describe('constructCloudEventsType', () => {
    // T005: Type construction from x-event-name → com.{service}.{event}
    it('should construct type from service name and event name', () => {
      const result = constructCloudEventsType('order-service', 'order-created');

      expect(result).toBe('com.order-service.order-created');
    });

    it('should handle kebab-case event names correctly', () => {
      const result = constructCloudEventsType('inventory-service', 'stock-reserved');

      expect(result).toBe('com.inventory-service.stock-reserved');
    });

    it('should preserve exact service and event name casing', () => {
      const result = constructCloudEventsType('OrderService', 'OrderCreated');

      expect(result).toBe('com.OrderService.OrderCreated');
    });
  });

  describe('resolveEventType', () => {
    // T005: Type construction from x-event-name
    it('should construct type from eventName when provided', () => {
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventName: 'order-created',
        correlationId: 'corr-123',
      };

      const result = resolveEventType(headers);

      expect(result).toBe('com.order-service.order-created');
    });

    // T006: Backward compatibility with x-event-type only
    it('should use eventType when eventName is not provided (backward compat)', () => {
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventType: 'com.legacy.order.created',
        correlationId: 'corr-123',
      };

      const result = resolveEventType(headers);

      expect(result).toBe('com.legacy.order.created');
    });

    // T008: x-event-name priority over x-event-type
    it('should prioritize eventName over eventType when both present', () => {
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventName: 'order-created',
        eventType: 'com.legacy.order.created', // Should be ignored
        correlationId: 'corr-123',
      };

      const result = resolveEventType(headers);

      expect(result).toBe('com.order-service.order-created');
    });

    // T007: Validation error when both headers missing
    it('should throw error when neither eventName nor eventType is provided', () => {
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        correlationId: 'corr-123',
      };

      expect(() => resolveEventType(headers)).toThrow(
        'Either x-event-name or x-event-type header is required'
      );
    });
  });

  describe('wrapCloudEvent with type resolution', () => {
    it('should use constructed type from eventName in CloudEvent envelope', () => {
      const payload = { orderId: '123', amount: 100 };
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventName: 'order-created',
        correlationId: 'corr-123',
      };

      const event = wrapCloudEvent(payload, 'orders.created', headers);

      expect(event.type).toBe('com.order-service.order-created');
      expect(event.source).toBe('order-service');
      expect(event.data).toEqual(payload);
    });

    it('should use legacy eventType in CloudEvent envelope when no eventName', () => {
      const payload = { orderId: '123', amount: 100 };
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventType: 'com.legacy.order.created',
        correlationId: 'corr-123',
      };

      const event = wrapCloudEvent(payload, 'orders.created', headers);

      expect(event.type).toBe('com.legacy.order.created');
    });

    it('should include traceparent extension when provided', () => {
      const payload = { orderId: '123' };
      const headers: PublishHeaders = {
        serviceName: 'order-service',
        eventName: 'order-created',
        correlationId: 'corr-123',
        traceparent: '00-abcd1234-5678-01',
      };

      const event = wrapCloudEvent(payload, 'orders.created', headers);

      expect(event.traceparent).toBe('00-abcd1234-5678-01');
    });
  });
});
