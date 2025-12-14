/**
 * Health & Readiness Handlers
 *
 * Exposes /health and /ready endpoints for container orchestration.
 * - /health: Liveness probe - process is running
 * - /ready: Readiness probe - sidecar can accept traffic (Redis connected)
 */

import { Router, Request, Response } from 'express';
import type { HealthResponse, SidecarState } from '../types.js';
import type { RedisClient } from '../transport/redis.js';

/**
 * Health handler dependencies.
 */
export interface HealthDependencies {
  getState: () => SidecarState;
  getStateReason: () => string | undefined;
  redis?: RedisClient;
}

/**
 * Create health router with /health and /ready endpoints.
 */
export function createHealthRouter(_deps: HealthDependencies): Router {
  const router = Router();

  /**
   * GET /health - Liveness probe
   * 
   * Returns 200 OK if the sidecar process is running.
   * Used by orchestrators to detect crashed/hung processes.
   */
  router.get('/', (_req: Request, res: Response) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  });

  return router;
}

/**
 * Create readiness router with /ready endpoint.
 */
export function createReadyRouter(deps: HealthDependencies): Router {
  const router = Router();

  /**
   * GET /ready - Readiness probe
   * 
   * Returns 200 OK if:
   * - Sidecar state is READY
   * - Redis connection is healthy (when redis client provided)
   * 
   * Returns 503 Service Unavailable otherwise.
   * Used by orchestrators to control traffic routing.
   */
  router.get('/', async (_req: Request, res: Response) => {
    const state = deps.getState();
    const reason = deps.getStateReason();

    // Check sidecar state
    if (state !== 'READY' && state !== 'DEGRADED') {
      const response: HealthResponse = {
        status: 'not ready',
        reason: reason || `State: ${state}`,
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(response);
      return;
    }

    // Check Redis connectivity if client is available
    if (deps.redis) {
      const redisHealthy = await checkRedisHealth(deps.redis);
      if (!redisHealthy) {
        const response: HealthResponse = {
          status: 'not ready',
          reason: 'Redis connection unhealthy',
          timestamp: new Date().toISOString(),
        };
        res.status(503).json(response);
        return;
      }
    }

    // All checks passed
    const response: HealthResponse = {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  });

  return router;
}

/**
 * Check Redis connection health.
 * 
 * Returns true if Redis is connected and responsive.
 * Returns false if disconnected or PING fails.
 */
async function checkRedisHealth(redis: RedisClient): Promise<boolean> {
  try {
    // Check connection state
    if (!redis.isConnected()) {
      return false;
    }

    // Attempt PING to verify responsiveness
    const pingResult = await redis.ping();
    return pingResult === true;
  } catch (err) {
    console.warn('[health] Redis health check failed:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
}

/**
 * Standalone health handler function (for backward compatibility).
 */
export function healthHandler(_req: Request, res: Response): void {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

/**
 * Create readiness handler with Redis check.
 */
export function createReadinessHandler(
  getState: () => SidecarState,
  getStateReason: () => string | undefined,
  redis?: RedisClient
): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    const state = getState();
    const reason = getStateReason();

    // Check sidecar state
    if (state !== 'READY' && state !== 'DEGRADED') {
      const response: HealthResponse = {
        status: 'not ready',
        reason: reason || `State: ${state}`,
        timestamp: new Date().toISOString(),
      };
      res.status(503).json(response);
      return;
    }

    // Check Redis connectivity if client is available
    if (redis) {
      const redisHealthy = await checkRedisHealth(redis);
      if (!redisHealthy) {
        const response: HealthResponse = {
          status: 'not ready',
          reason: 'Redis connection unhealthy',
          timestamp: new Date().toISOString(),
        };
        res.status(503).json(response);
        return;
      }
    }

    // All checks passed
    const response: HealthResponse = {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  };
}
