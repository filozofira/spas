/**
 * SPAS Sidecar Entry Point
 *
 * Express application bootstrap with route registration and lifecycle management.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import type { SidecarConfig, SidecarState, HealthResponse } from './types.js';

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
export function createApp(): Application {
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

  // Publish endpoint - will be implemented in Phase 4
  app.post('/publish', publishPlaceholder);

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

/**
 * Start the sidecar application.
 */
export async function start(): Promise<void> {
  const port = parseInt(process.env.SIDECAR_PORT || '3500', 10);

  setState('STARTING');

  const app = createApp();

  // Configuration loading will be added in Phase 3
  // Redis connection will be added in Phase 3
  // For now, just start the HTTP server

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`[sidecar] Listening on port ${port}`);
      setState('READY');
      resolve();
    });
  });
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  start().catch((err) => {
    console.error('[sidecar] Fatal error:', err);
    process.exit(1);
  });
}
