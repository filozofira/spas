/**
 * SPAS Repository Service
 * 
 * HTTP service for publishing and retrieving service metadata and schemas
 */

import Fastify, { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import pino from 'pino';
import { ConfigLoader } from './config';
import { StorageFactory } from './storage/StorageFactory';
import type { IStorageProvider } from './storage/IStorageProvider';
import type { ErrorResponse, HealthResponse } from './models/types';

let fastifyInstance: FastifyInstance;
let storageProvider: IStorageProvider;

/**
 * Initialize and start the application
 */
export async function start(): Promise<FastifyInstance> {
  // Load configuration
  const config = ConfigLoader.load();

  // Create logger
  const logger = pino({
    level: config.logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: config.nodeEnv === 'development',
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });

  // Initialize Fastify
  fastifyInstance = Fastify({
    logger,
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestTimeout: 30000,
  });

  // Register plugins
  fastifyInstance.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per FR-001
      files: 10,
      fields: 20,
    },
  });

  // Initialize storage provider
  storageProvider = StorageFactory.createProvider(config.storage);
  await storageProvider.initialize();

  logger.info({ storage: config.storage }, 'Storage provider initialized');

  // Global error handler
  fastifyInstance.setErrorHandler((error: unknown, request, reply) => {
    request.log.error(error);

    const err = error as any;
    const errorResponse: ErrorResponse = {
      error: err.name || 'InternalServerError',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    };

    const statusCode = err.statusCode || 500;
    reply.status(statusCode).send(errorResponse);
  });

  // Health check endpoint
  fastifyInstance.get('/health', async (_request, reply) => {
    try {
      const storageHealth = await storageProvider.health();
      const response: HealthResponse = {
        status: storageHealth ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0', // TODO: Read from package.json
        storage: {
          status: storageHealth ? 'ok' : 'error',
          message: storageHealth ? undefined : 'Storage provider unreachable',
        },
      };
      return reply.send(response);
    } catch (error: unknown) {
      const response: HealthResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        storage: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      return reply.status(503).send(response);
    }
  });

  // Register routes
  const { registerPublishRoutes } = await import('./routes/publish');
  await registerPublishRoutes(fastifyInstance, config.spasSchemaPath);

  const { registerRetrieveRoutes } = await import('./routes/retrieve');
  await registerRetrieveRoutes(fastifyInstance);

  const { registerSearchRoutes } = await import('./routes/search');
  await registerSearchRoutes(fastifyInstance, storageProvider);

  const { registerUnpublishRoutes } = await import('./routes/unpublish');
  await registerUnpublishRoutes(fastifyInstance, storageProvider);

  // Start server
  await fastifyInstance.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`Repository service listening on port ${config.port}`);

  return fastifyInstance;
}

/**
 * Stop the application
 */
export async function stop(): Promise<void> {
  if (fastifyInstance) {
    await fastifyInstance.close();
  }
}

/**
 * Get the Fastify instance (for route registration)
 */
export function getApp(): FastifyInstance {
  if (!fastifyInstance) {
    throw new Error('Application not initialized - call start() first');
  }
  return fastifyInstance;
}

/**
 * Get the storage provider (for business logic)
 */
export function getStorage(): IStorageProvider {
  if (!storageProvider) {
    throw new Error('Storage provider not initialized - call start() first');
  }
  return storageProvider;
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await stop();
  process.exit(0);
});

// Start if run directly
if (require.main === module) {
  start().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
