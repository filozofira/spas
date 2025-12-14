/**
 * SPAS Sidecar Entry Point
 *
 * Express application bootstrap with route registration and lifecycle management.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import type { SidecarConfig, SidecarState, HealthResponse } from './types.js';
import { loadConfigFromEnv, getConfigSummary } from './config/loader.js';
import { RedisClient } from './transport/redis.js';
import { HttpClient } from './transport/http.js';
import { createPublishRouter } from './handlers/publish.js';
import { EventSubscriber } from './services/event-subscriber.js';
import { ServiceInvoker } from './services/service-invoker.js';

// =============================================================================
// State Management
// =============================================================================

let sidecarState: SidecarState = 'STARTING';
let sidecarConfig: SidecarConfig | null = null;
let stateReason: string | undefined;

/**
 * Get current sidecar state.
 */
export function getState(): SidecarState {
  return sidecarState;
}

/**
 * Set sidecar state with optional reason.
 */
export function setState(state: SidecarState, reason?: string): void {
  sidecarState = state;
  stateReason = reason;
  console.log(`[sidecar] State: ${state}${reason ? ` - ${reason}` : ''}`);
}

/**
 * Get loaded configuration.
 */
export function getConfig(): SidecarConfig | null {
  return sidecarConfig;
}

/**
 * Set loaded configuration.
 */
export function setConfig(config: SidecarConfig): void {
  sidecarConfig = config;
}

// =============================================================================
// Express App Setup
// =============================================================================

/**
 * Create Express application with middleware and routes.
 */
export function createApp(redis?: RedisClient, config?: SidecarConfig): Application {
  const app = express();

  // Request parsing
  app.use(express.json());

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[sidecar] ${req.method} ${req.path}`);
    next();
  });

  // Health endpoints
  app.get('/health', healthHandler);
  app.get('/ready', readinessHandler);

  // Publish endpoint - use router if redis and config available
  if (redis && config) {
    app.use('/publish', createPublishRouter(redis, config));
  } else {
    app.post('/publish', publishPlaceholder);
  }

  // Invoke endpoint - will be implemented in Phase 6
  app.post('/invoke/:command', invokePlaceholder);

  // Error handling
  app.use(errorHandler);

  return app;
}

// =============================================================================
// Health Handlers
// =============================================================================

/**
 * Liveness probe - indicates if sidecar process is running.
 */
function healthHandler(_req: Request, res: Response): void {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
}

/**
 * Readiness probe - indicates if sidecar can accept traffic.
 */
function readinessHandler(_req: Request, res: Response): void {
  const isReady = sidecarState === 'READY';
  const response: HealthResponse = {
    status: isReady ? 'ready' : 'not ready',
    reason: stateReason,
    timestamp: new Date().toISOString(),
  };
  res.status(isReady ? 200 : 503).json(response);
}

// =============================================================================
// Placeholder Handlers (implemented in later phases)
// =============================================================================

function publishPlaceholder(_req: Request, res: Response): void {
  res.status(501).json({ error: 'Not implemented - Phase 4' });
}

function invokePlaceholder(_req: Request, res: Response): void {
  res.status(501).json({ error: 'Not implemented - Phase 6' });
}

// =============================================================================
// Error Handler
// =============================================================================

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[sidecar] Error: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}

// =============================================================================
// Bootstrap
// =============================================================================

// Global references for cleanup
let redis: RedisClient | null = null;
let subscriber: EventSubscriber | null = null;

/**
 * Start the sidecar application.
 */
export async function start(): Promise<void> {
  const port = parseInt(process.env.SIDECAR_PORT || '3500', 10);

  setState('STARTING');

  // Load configuration
  let config: SidecarConfig;
  try {
    config = await loadConfigFromEnv();
    setConfig(config);
    console.log(`[sidecar] Configuration loaded: ${getConfigSummary(config)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setState('FAILED', `Configuration error: ${message}`);
    throw err;
  }

  // Connect to Redis
  setState('CONNECTING', 'Connecting to Redis');
  redis = new RedisClient(
    process.env.REDIS_HOST || 'localhost',
    parseInt(process.env.REDIS_PORT || '6379', 10)
  );

  try {
    await redis.connect();
    console.log('[sidecar] Redis connected');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setState('FAILED', `Redis connection error: ${message}`);
    throw err;
  }

  // Create Express app with routes
  const app = createApp(redis, config);

  // Create service invoker for event subscription
  const serviceName = process.env.SERVICE_NAME;
  const servicePort = process.env.SERVICE_PORT;

  if (serviceName && servicePort) {
    const httpClient = new HttpClient(`http://${serviceName}:${servicePort}`);
    const invoker = new ServiceInvoker(httpClient);
    subscriber = new EventSubscriber(redis, config, invoker);

    // Start subscriber in background (don't await)
    subscriber.start().catch((err) => {
      console.error('[sidecar] Subscriber error:', err);
    });
  } else {
    console.log('[sidecar] SERVICE_NAME/SERVICE_PORT not set, subscriber disabled');
  }

  // Start HTTP server
  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`[sidecar] Listening on port ${port}`);
      setState('READY');
      resolve();
    });
  });
}

/**
 * Stop the sidecar gracefully.
 */
export async function stop(): Promise<void> {
  console.log('[sidecar] Shutting down...');

  if (subscriber) {
    subscriber.stop();
  }

  if (redis) {
    await redis.disconnect();
  }

  console.log('[sidecar] Shutdown complete');
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  start().catch((err) => {
    console.error('[sidecar] Fatal error:', err);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    await stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stop();
    process.exit(0);
  });
}
