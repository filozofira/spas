/**
 * Event Subscriber Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EventSubscriber } from '../../../src/services/event-subscriber.js';
import type { SidecarConfig, CloudEvent } from '../../../src/types.js';

// Mock Redis client
const mockRedis = {
  xread: jest.fn<() => Promise<Map<string, Array<{ id: string; message: Record<string, string> }>> | null>>(),
  xadd: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  ping: jest.fn(),
};

// Mock Service Invoker
const mockInvoker = {
  invoke: jest.fn<() => Promise<{ status: number; data: unknown; headers: Record<string, string> }>>(),
  invokeCommand: jest.fn(),
};

describe('Event Subscriber', () => {
  const testConfig: SidecarConfig = {
    inbound: [
      {
        kind: 'event',
        topic: 'orders.created',
        transform: '$',
        invokeEndpoint: '/orders',
      },
      {
        kind: 'event',
        topic: 'notifications.send',
        transform: '{ "message": $.data.message }',
        invokeEndpoint: '/notifications',
      },
      {
        kind: 'command',
        command: 'CreateOrder',
        transform: '$',
        invokeEndpoint: '/commands/create-order',
      },
    ],
    outbound: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventSubscriptions', () => {
    it('should return only event subscriptions', () => {
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      const subscriptions = subscriber.getEventSubscriptions();

      expect(subscriptions).toHaveLength(2);
      expect(subscriptions[0].topic).toBe('orders.created');
      expect(subscriptions[1].topic).toBe('notifications.send');
    });

    it('should return empty for config with no events', () => {
      const config: SidecarConfig = {
        inbound: [
          { kind: 'command', command: 'Test', transform: '$', invokeEndpoint: '/test' },
        ],
        outbound: [],
      };
      const subscriber = new EventSubscriber(mockRedis as never, config, mockInvoker as never);

      const subscriptions = subscriber.getEventSubscriptions();

      expect(subscriptions).toHaveLength(0);
    });
  });

  describe('pollOnce', () => {
    it('should call xread with correct streams', async () => {
      mockRedis.xread.mockResolvedValue(null);
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      await subscriber.pollOnce(subscriber.getEventSubscriptions());

      expect(mockRedis.xread).toHaveBeenCalledWith(
        ['orders.created', 'notifications.send'],
        ['$', '$'],
        5000
      );
    });

    it('should process messages and invoke service', async () => {
      const cloudEvent: CloudEvent = {
        specversion: '1.0',
        type: 'com.example.order.created',
        source: 'order-service',
        id: 'event-123',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        traceparent: '00-trace-span-01',
        correlationid: 'corr-456',
        data: { orderId: 'order-789' },
      };

      const messages = new Map([
        [
          'orders.created',
          [{ id: '1234567890-0', message: { data: JSON.stringify(cloudEvent) } }],
        ],
      ]);

      mockRedis.xread.mockResolvedValue(messages);
      mockInvoker.invoke.mockResolvedValue({ status: 200, data: {}, headers: {} });

      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      await subscriber.pollOnce(subscriber.getEventSubscriptions());

      expect(mockInvoker.invoke).toHaveBeenCalledWith(
        '/orders',
        { orderId: 'order-789' },
        expect.objectContaining({ id: 'event-123' }),
        undefined  // traceparentOverride is undefined when tracer not initialized
      );
    });

    it('should handle null xread result (timeout)', async () => {
      mockRedis.xread.mockResolvedValue(null);
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      await subscriber.pollOnce(subscriber.getEventSubscriptions());

      expect(mockInvoker.invoke).not.toHaveBeenCalled();
    });
  });

  describe('processMessage', () => {
    it('should skip messages without data field', async () => {
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await subscriber.processMessage({}, testConfig.inbound[0]);

      expect(mockInvoker.invoke).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[subscriber] Message missing data field');
      consoleSpy.mockRestore();
    });
  });

  describe('lifecycle', () => {
    it('should track running state', () => {
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      expect(subscriber.isRunning()).toBe(false);
    });

    it('should stop when stop() is called', () => {
      const subscriber = new EventSubscriber(mockRedis as never, testConfig, mockInvoker as never);

      subscriber.stop();

      expect(subscriber.isRunning()).toBe(false);
    });
  });
});
