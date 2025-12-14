/**
 * Health Handler Unit Tests
 *
 * Tests for /health and /ready endpoints.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express, { Application } from 'express';
import request from 'supertest';
import {
  createHealthRouter,
  createReadyRouter,
  healthHandler,
  createReadinessHandler,
  HealthDependencies,
} from '../../../src/handlers/health.js';
import type { SidecarState } from '../../../src/types.js';
import type { RedisClient } from '../../../src/transport/redis.js';

describe('Health Handlers', () => {
  // ==========================================================================
  // healthHandler function tests
  // ==========================================================================

  describe('healthHandler', () => {
    let app: Application;

    beforeEach(() => {
      app = express();
      app.get('/health', healthHandler);
    });

    it('should return 200 with ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.timestamp).toBeDefined();
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should not include reason for healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.body.reason).toBeUndefined();
    });
  });

  // ==========================================================================
  // createHealthRouter tests
  // ==========================================================================

  describe('createHealthRouter', () => {
    let app: Application;
    let mockDeps: HealthDependencies;

    beforeEach(() => {
      mockDeps = {
        getState: jest.fn<() => SidecarState>().mockReturnValue('READY'),
        getStateReason: jest.fn<() => string | undefined>().mockReturnValue(undefined),
      };

      app = express();
      app.use('/health', createHealthRouter(mockDeps));
    });

    it('should return 200 for GET /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should return health regardless of sidecar state', async () => {
      (mockDeps.getState as jest.Mock<() => SidecarState>).mockReturnValue('FAILED');

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  // ==========================================================================
  // createReadyRouter tests
  // ==========================================================================

  describe('createReadyRouter', () => {
    let app: Application;
    let mockDeps: HealthDependencies;
    let mockRedis: jest.Mocked<RedisClient>;

    beforeEach(() => {
      mockRedis = {
        isConnected: jest.fn<() => boolean>().mockReturnValue(true),
        ping: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        connect: jest.fn(),
        disconnect: jest.fn(),
        xadd: jest.fn(),
        xread: jest.fn(),
      } as unknown as jest.Mocked<RedisClient>;

      mockDeps = {
        getState: jest.fn<() => SidecarState>().mockReturnValue('READY'),
        getStateReason: jest.fn<() => string | undefined>().mockReturnValue(undefined),
        redis: mockRedis,
      };

      app = express();
      app.use('/ready', createReadyRouter(mockDeps));
    });

    it('should return 200 when READY and Redis connected', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return 200 when DEGRADED and Redis connected', async () => {
      (mockDeps.getState as jest.Mock<() => SidecarState>).mockReturnValue('DEGRADED');

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return 503 when state is STARTING', async () => {
      (mockDeps.getState as jest.Mock).mockReturnValue('STARTING');

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toContain('STARTING');
    });

    it('should return 503 when state is CONNECTING', async () => {
      (mockDeps.getState as jest.Mock).mockReturnValue('CONNECTING');

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
    });

    it('should return 503 when state is FAILED', async () => {
      (mockDeps.getState as jest.Mock).mockReturnValue('FAILED');
      (mockDeps.getStateReason as jest.Mock).mockReturnValue('Configuration error');

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Configuration error');
    });

    it('should return 503 when Redis is disconnected', async () => {
      mockRedis.isConnected.mockReturnValue(false);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Redis connection unhealthy');
    });

    it('should return 503 when Redis ping fails', async () => {
      mockRedis.ping.mockResolvedValue(false);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Redis connection unhealthy');
    });

    it('should return 503 when Redis ping throws', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection lost'));

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Redis connection unhealthy');
    });

    it('should return 200 when no Redis client provided', async () => {
      mockDeps.redis = undefined;
      app = express();
      app.use('/ready', createReadyRouter(mockDeps));

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/ready');

      expect(response.body.timestamp).toBeDefined();
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });

  // ==========================================================================
  // createReadinessHandler tests
  // ==========================================================================

  describe('createReadinessHandler', () => {
    let app: Application;
    let mockRedis: jest.Mocked<RedisClient>;

    beforeEach(() => {
      mockRedis = {
        isConnected: jest.fn<() => boolean>().mockReturnValue(true),
        ping: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        connect: jest.fn(),
        disconnect: jest.fn(),
        xadd: jest.fn(),
        xread: jest.fn(),
      } as unknown as jest.Mocked<RedisClient>;
    });

    it('should return 200 when ready', async () => {
      const handler = createReadinessHandler(
        () => 'READY' as SidecarState,
        () => undefined,
        mockRedis
      );

      app = express();
      app.get('/ready', handler);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
    });

    it('should return 503 when not ready', async () => {
      const handler = createReadinessHandler(
        () => 'STARTING' as SidecarState,
        () => 'Initializing',
        mockRedis
      );

      app = express();
      app.get('/ready', handler);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not ready');
    });

    it('should work without Redis client', async () => {
      const handler = createReadinessHandler(
        () => 'READY' as SidecarState,
        () => undefined
      );

      app = express();
      app.get('/ready', handler);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // Response timing tests
  // ==========================================================================

  describe('Response timing', () => {
    it('should respond within 50ms for /health', async () => {
      const app = express();
      app.get('/health', healthHandler);

      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should respond quickly for /ready when Redis is healthy', async () => {
      const mockRedis = {
        isConnected: jest.fn<() => boolean>().mockReturnValue(true),
        ping: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
      } as unknown as jest.Mocked<RedisClient>;

      const mockDeps: HealthDependencies = {
        getState: () => 'READY',
        getStateReason: () => undefined,
        redis: mockRedis,
      };

      const app = express();
      app.use('/ready', createReadyRouter(mockDeps));

      const start = Date.now();
      await request(app).get('/ready');
      const duration = Date.now() - start;

      // Should be fast in test environment
      expect(duration).toBeLessThan(100);
    });
  });
});
