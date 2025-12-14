/**
 * Topic Router Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  resolveTopicFromEventType,
  findOutboundEntry,
  getAllTopics,
  getAllEventTypes,
  assertRouteExists,
} from '../../../src/services/topic-router.js';
import type { SidecarConfig } from '../../../src/types.js';

describe('Topic Router', () => {
  const testConfig: SidecarConfig = {
    inbound: [],
    outbound: [
      { eventType: 'com.example.order.created', topic: 'orders.created' },
      { eventType: 'com.example.order.updated', topic: 'orders.updated', transform: 'orderTransform' },
      { eventType: 'com.example.notification.*', topic: 'notifications.all' },
    ],
  };

  describe('resolveTopicFromEventType', () => {
    it('should resolve exact match', () => {
      const result = resolveTopicFromEventType('com.example.order.created', testConfig);

      expect(result.found).toBe(true);
      expect(result.topic).toBe('orders.created');
      expect(result.transform).toBeUndefined();
    });

    it('should resolve with transform', () => {
      const result = resolveTopicFromEventType('com.example.order.updated', testConfig);

      expect(result.found).toBe(true);
      expect(result.topic).toBe('orders.updated');
      expect(result.transform).toBe('orderTransform');
    });

    it('should resolve wildcard pattern', () => {
      const result = resolveTopicFromEventType('com.example.notification.email', testConfig);

      expect(result.found).toBe(true);
      expect(result.topic).toBe('notifications.all');
    });

    it('should return not found for unmatched event type', () => {
      const result = resolveTopicFromEventType('com.example.unknown', testConfig);

      expect(result.found).toBe(false);
      expect(result.topic).toBeUndefined();
    });

    it('should prefer exact match over wildcard', () => {
      const config: SidecarConfig = {
        inbound: [],
        outbound: [
          { eventType: 'com.test.*', topic: 'wildcard' },
          { eventType: 'com.test.specific', topic: 'specific' },
        ],
      };

      const result = resolveTopicFromEventType('com.test.specific', config);

      expect(result.found).toBe(true);
      expect(result.topic).toBe('specific');
    });
  });

  describe('findOutboundEntry', () => {
    it('should find exact match', () => {
      const entry = findOutboundEntry('com.example.order.created', testConfig.outbound);

      expect(entry).toBeDefined();
      expect(entry?.topic).toBe('orders.created');
    });

    it('should find wildcard match', () => {
      const entry = findOutboundEntry('com.example.notification.sms', testConfig.outbound);

      expect(entry).toBeDefined();
      expect(entry?.topic).toBe('notifications.all');
    });

    it('should return undefined for no match', () => {
      const entry = findOutboundEntry('com.other.event', testConfig.outbound);

      expect(entry).toBeUndefined();
    });

    it('should not match partial wildcards incorrectly', () => {
      const entry = findOutboundEntry('com.example.notificationX.test', testConfig.outbound);

      expect(entry).toBeUndefined();
    });
  });

  describe('getAllTopics', () => {
    it('should return all topics', () => {
      const topics = getAllTopics(testConfig);

      expect(topics).toEqual(['orders.created', 'orders.updated', 'notifications.all']);
    });

    it('should return empty for empty config', () => {
      const topics = getAllTopics({ inbound: [], outbound: [] });

      expect(topics).toEqual([]);
    });
  });

  describe('getAllEventTypes', () => {
    it('should return all event types', () => {
      const eventTypes = getAllEventTypes(testConfig);

      expect(eventTypes).toEqual([
        'com.example.order.created',
        'com.example.order.updated',
        'com.example.notification.*',
      ]);
    });
  });

  describe('assertRouteExists', () => {
    it('should return entry for existing route', () => {
      const entry = assertRouteExists('com.example.order.created', testConfig);

      expect(entry.topic).toBe('orders.created');
    });

    it('should throw for missing route', () => {
      expect(() => assertRouteExists('com.unknown', testConfig)).toThrow(
        'No outbound route configured for event type: com.unknown'
      );
    });
  });
});
