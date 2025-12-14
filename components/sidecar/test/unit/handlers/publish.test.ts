/**
 * Publish Handler Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import http from 'node:http';
import express, { Express } from 'express';
import { createPublishRouter } from '../../../src/handlers/publish.js';
import type { SidecarConfig } from '../../../src/types.js';

// Mock RedisClient
const mockRedis = {
  xadd: jest.fn<(stream: string, fields: Record<string, string>) => Promise<string>>(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  xread: jest.fn(),
  ping: jest.fn(),
};

// Simple test helper for Express
async function makeRequest(
  app: Express,
  method: 'POST' | 'GET',
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as { port: number };
      const options = {
        hostname: 'localhost',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe('Publish Handler', () => {
  const testConfig: SidecarConfig = {
    inbound: [],
    outbound: [
      { eventType: 'com.example.order.created', topic: 'orders.created' },
    ],
  };

  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.xadd.mockResolvedValue('1234567890-0');

    app = express();
    app.use(express.json());
    app.use('/publish', createPublishRouter(mockRedis as never, testConfig));
  });

  describe('POST /publish', () => {
    it('should return 202 for valid publish request', async () => {
      const response = await makeRequest(
        app,
        'POST',
        '/publish',
        { orderId: '123' },
        {
          'x-service-name': 'order-service',
          'x-event-type': 'com.example.order.created',
          'x-correlation-id': 'corr-123',
        }
      );

      expect(response.status).toBe(202);
      expect((response.body as any).status).toBe('accepted');
      expect((response.body as any).topic).toBe('orders.created');
    });

    it('should return 400 for missing required headers', async () => {
      const response = await makeRequest(
        app,
        'POST',
        '/publish',
        { orderId: '123' },
        {
          'x-service-name': 'order-service',
          // missing x-event-type and x-correlation-id
        }
      );

      expect(response.status).toBe(400);
      expect((response.body as any).error).toBe('Missing required headers');
      expect((response.body as any).missing).toContain('x-event-type');
      expect((response.body as any).missing).toContain('x-correlation-id');
    });

    it('should return 400 for unknown event type', async () => {
      const response = await makeRequest(
        app,
        'POST',
        '/publish',
        { orderId: '123' },
        {
          'x-service-name': 'order-service',
          'x-event-type': 'com.unknown.event',
          'x-correlation-id': 'corr-123',
        }
      );

      expect(response.status).toBe(400);
      expect((response.body as any).error).toBe('Routing error');
    });

    it('should return 400 for non-object body (array)', async () => {
      const response = await makeRequest(app, 'POST', '/publish', ['not', 'an', 'object'], {
        'x-service-name': 'order-service',
        'x-event-type': 'com.example.order.created',
        'x-correlation-id': 'corr-123',
      });

      expect(response.status).toBe(400);
      expect((response.body as any).error).toBe('Request body must be a JSON object');
    });

    it('should include event ID in response', async () => {
      const response = await makeRequest(
        app,
        'POST',
        '/publish',
        { test: true },
        {
          'x-service-name': 'test-service',
          'x-event-type': 'com.example.order.created',
          'x-correlation-id': 'corr-456',
        }
      );

      expect(response.status).toBe(202);
      expect((response.body as any).id).toBeDefined();
      expect(typeof (response.body as any).id).toBe('string');
    });

    it('should call Redis xadd with correct stream', async () => {
      await makeRequest(
        app,
        'POST',
        '/publish',
        { orderId: 'test-order' },
        {
          'x-service-name': 'order-service',
          'x-event-type': 'com.example.order.created',
          'x-correlation-id': 'corr-789',
        }
      );

      expect(mockRedis.xadd).toHaveBeenCalledWith('orders.created', expect.any(Object));
    });
  });
});
