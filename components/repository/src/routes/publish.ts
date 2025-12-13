/**
 * Publish Routes
 * 
 * Handles service publication endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PublishService } from '../services/PublishService';
import type { IStorageProvider } from '../storage/IStorageProvider';

export async function registerPublishRoutes(
  fastify: FastifyInstance, 
  spasSchemaPath: string,
  storage?: IStorageProvider
) {
  /**
   * POST /services/{serviceId}:{version}
   * 
   * Publish a new service version
   * Accepts multipart/form-data with 'archive' part (ZIP file)
   * Optional 'checksum' part for SHA-256 verification
   */
  fastify.post<{
    Params: { serviceIdVersion: string };
  }>('/services/:serviceIdVersion', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse service ID and version from path
      const { serviceIdVersion } = request.params as { serviceIdVersion: string };
      const pathParts = serviceIdVersion.split(':');

      if (pathParts.length !== 2) {
        return reply.status(400).send({
          error: 'Invalid path format',
          message: 'Path must be in format /services/{serviceId}:{version}',
          timestamp: new Date().toISOString(),
        });
      }

      const [serviceId, version] = pathParts;

      // Validate path format
      const serviceIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!serviceIdPattern.test(serviceId)) {
        return reply.status(400).send({
          error: 'Invalid service ID',
          message: 'Service ID must be kebab-case (lowercase, hyphens only)',
          timestamp: new Date().toISOString(),
        });
      }

      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(version)) {
        return reply.status(400).send({
          error: 'Invalid version format',
          message: 'Version must follow semver format (MAJOR.MINOR.PATCH)',
          timestamp: new Date().toISOString(),
        });
      }

      // Parse multipart form data - collect all parts
      const parts = request.parts();
      let archiveStream: any = null;
      let checksum: string | undefined;

      try {
        for await (const part of parts) {
          if (part.type === 'file' && part.fieldname === 'archive') {
            archiveStream = part.file;
          } else if (part.fieldname === 'checksum' && 'value' in part) {
            checksum = String(part.value);
          }
        }
      } catch (err) {
        request.log.error({ err }, 'Multipart parsing error');
      }

      if (!archiveStream) {
        return reply.status(400).send({
          error: 'Archive file is required',
          message: 'Request must include multipart file upload with field name "archive"',
          timestamp: new Date().toISOString(),
        });
      }

      // Get storage provider (injected for tests or from global for production)
      let storageToUse: IStorageProvider;
      if (storage) {
        storageToUse = storage;
      } else {
        // Import dynamically to avoid circular dependency
        const { getStorage } = await import('../index');
        storageToUse = getStorage();
      }

      // Initialize publish service
      const publishService = new PublishService(storageToUse, spasSchemaPath);

      // Publish service
      await publishService.publish({
        serviceId,
        version,
        archiveStream,
        checksum,
      });

      return reply.status(201).send({
        message: `Service ${serviceId}:${version} published successfully`,
        serviceId,
        version,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      request.log.error(error);

      const err = error as any;
      
      // Map client errors (validation, business logic) to 400
      const clientErrors = ['ValidationError', 'EvolutionError', 'VersionError', 'ArchiveError', 'ChecksumError'];
      const isClientError = clientErrors.includes(err.name) || err.message?.includes('already exists');
      const statusCode = err.statusCode || (isClientError ? 400 : 500);

      // Map 409 for duplicate resources
      const isDuplicate = err.message?.includes('already exists');
      const finalStatusCode = isDuplicate ? 409 : statusCode;

      return reply.status(finalStatusCode).send({
        error: err.name || 'PublishError',
        message: err.message || 'Failed to publish service',
        details: err.details,
        timestamp: new Date().toISOString(),
      });
    }
  });
}
