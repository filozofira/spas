/**
 * Unpublish Routes
 * 
 * Implements unpublish endpoint for service version deletion.
 * Per FR-019 and FR-020 (Unpublishing)
 */

import type { FastifyInstance } from 'fastify';
import type { IStorageProvider } from '../storage/IStorageProvider';
import { UnpublishService } from '../services/UnpublishService';

export async function registerUnpublishRoutes(
  fastify: FastifyInstance,
  storage: IStorageProvider
): Promise<void> {
  const unpublishService = new UnpublishService(storage);

  /**
   * DELETE /services/{serviceName}/versions/{version}
   * Unpublish a specific service version (FR-019, User Story 5)
   * 
   * Path Parameters:
   * - serviceName: string (required) - The service identifier
   * - version: string (required) - The version to unpublish
   * 
   * Returns:
   * - 204: No Content - Service version successfully unpublished
   * - 404: Not Found - Service version does not exist
   * - 500: Internal Server Error - Unexpected error during unpublish
   */
  fastify.delete<{
    Params: { serviceName: string; version: string };
  }>('/services/:serviceName/versions/:version', async (request, reply) => {
    try {
      const { serviceName, version } = request.params;

      fastify.log.info({ serviceName, version }, 'Unpublishing service version');

      const deleted = await unpublishService.unpublishVersion(serviceName, version);

      if (!deleted) {
        return reply.code(404).send({
          error: 'NotFound',
          message: `Service ${serviceName} version ${version} not found`,
          timestamp: new Date().toISOString(),
        });
      }

      fastify.log.info({ serviceName, version }, 'Service version unpublished successfully');
      return reply.code(204).send();
    } catch (error: any) {
      fastify.log.error({ error }, 'Unpublish failed');
      return reply.code(500).send({
        error: 'InternalServerError',
        message: error.message || 'Unpublish operation failed',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
