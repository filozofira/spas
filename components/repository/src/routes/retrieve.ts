/**
 * Retrieval Routes
 * 
 * Handles service information retrieval endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RetrievalService } from '../services/RetrievalService';
import type { IStorageProvider } from '../storage/IStorageProvider';

export async function registerRetrieveRoutes(
  fastify: FastifyInstance,
  storage?: IStorageProvider
) {
  /**
   * GET /services/{serviceName}
   * 
   * Get service information (latest version)
   */
  fastify.get<{
    Params: { serviceName: string };
  }>('/services/:serviceName', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName } = request.params as { serviceName: string };

      // Get storage provider
      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      const serviceInfo = await retrievalService.getServiceInfo(serviceName);

      if (!serviceInfo) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Service '${serviceName}' not found`,
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(200).send(serviceInfo);
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to retrieve service',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /services/{serviceName}/versions
   * 
   * Get all versions for a service (descending order)
   */
  fastify.get<{
    Params: { serviceName: string };
  }>('/services/:serviceName/versions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName } = request.params as { serviceName: string };

      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      const versions = await retrievalService.getVersions(serviceName);

      if (versions.length === 0) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Service '${serviceName}' not found`,
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(200).send({
        serviceName,
        versions,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to retrieve versions',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /services/{serviceName}/versions/{version}
   * 
   * Get complete metadata for a specific version
   */
  fastify.get<{
    Params: { serviceName: string; version: string };
  }>('/services/:serviceName/versions/:version', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName, version } = request.params as { serviceName: string; version: string };

      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      const metadata = await retrievalService.getMetadata(serviceName, version);

      if (!metadata) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Service '${serviceName}:${version}' not found`,
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(200).send(metadata);
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to retrieve metadata',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /services/{serviceName}/versions/{version}/schemas
   * 
   * Get all schemas for a service version
   */
  fastify.get<{
    Params: { serviceName: string; version: string };
  }>('/services/:serviceName/versions/:version/schemas', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName, version } = request.params as { serviceName: string; version: string };

      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      
      // Verify service exists
      const metadata = await retrievalService.getMetadata(serviceName, version);
      if (!metadata) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Service '${serviceName}:${version}' not found`,
          timestamp: new Date().toISOString(),
        });
      }

      const schemas = await retrievalService.getSchemas(serviceName, version);

      return reply.status(200).send({
        serviceName,
        version,
        schemas: schemas.map(s => ({
          name: s.name,
          type: s.type,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to retrieve schemas',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /services/{serviceName}/versions/{version}/schemas/{schemaName}
   * 
   * Get a specific schema by name
   */
  fastify.get<{
    Params: { serviceName: string; version: string; schemaName: string };
  }>('/services/:serviceName/versions/:version/schemas/:schemaName', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName, version, schemaName } = request.params as { 
        serviceName: string; 
        version: string; 
        schemaName: string;
      };

      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      const schema = await retrievalService.getSchema(serviceName, version, schemaName);

      if (!schema) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Schema '${schemaName}' not found for service '${serviceName}:${version}'`,
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(200).send(schema.content);
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to retrieve schema',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /services/{serviceName}/versions/{version}/download
   * 
   * Download complete service archive (ZIP with spas.json + schemas)
   */
  fastify.get<{
    Params: { serviceName: string; version: string };
  }>('/services/:serviceName/versions/:version/download', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serviceName, version } = request.params as { serviceName: string; version: string };

      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      const retrievalService = new RetrievalService(storageToUse);
      const archiveStream = await retrievalService.buildDownloadArchive(serviceName, version);

      if (!archiveStream) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Service '${serviceName}:${version}' not found`,
          timestamp: new Date().toISOString(),
        });
      }

      // Set headers for file download
      reply.header('Content-Type', 'application/zip');
      reply.header('Content-Disposition', `attachment; filename="${serviceName}-${version}.zip"`);

      return reply.send(archiveStream);
    } catch (error: unknown) {
      request.log.error(error);
      const err = error as any;

      return reply.status(500).send({
        error: err.name || 'RetrievalError',
        message: err.message || 'Failed to build archive',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
