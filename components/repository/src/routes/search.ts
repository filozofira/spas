/**
 * Search Routes
 * 
 * Implements search endpoints for capability and bounded context queries.
 * Per FR-017 (capability search) and FR-018 (bounded context search)
 */

import type { FastifyInstance } from 'fastify';
import type { IStorageProvider } from '../storage/IStorageProvider';
import { SearchService } from '../services/SearchService';

export async function registerSearchRoutes(
  fastify: FastifyInstance,
  storage: IStorageProvider
): Promise<void> {
  const searchService = new SearchService(storage);

  /**
   * GET /services?capability={cap}
   * Search services by capability (FR-017, User Story 3)
   * 
   * Query Parameters:
   * - capability: string (required) - The capability to search for
   * 
   * Returns:
   * - 200: SearchResults with matching services (latest version only per service)
   * - 400: BadRequest if capability parameter is missing or empty
   * - 500: InternalServerError on unexpected errors
   */
  fastify.get<{
    Querystring: { capability?: string; boundedContext?: string };
  }>('/services', async (request, reply) => {
    try {
      const { capability, boundedContext } = request.query;

      // Check for both parameters (not allowed)
      if (capability !== undefined && boundedContext !== undefined) {
        return reply.code(400).send({
          error: 'BadRequest',
          message: 'Either capability or boundedContext query parameter is required, not both',
          timestamp: new Date().toISOString(),
        });
      }

      // Determine which search to perform
      if (capability !== undefined) {
        if (!capability || capability.trim() === '') {
          return reply.code(400).send({
            error: 'BadRequest',
            message: 'Capability parameter cannot be empty',
            timestamp: new Date().toISOString(),
          });
        }

        const results = await searchService.searchByCapability(capability);
        return reply.code(200).send(results);
      }

      if (boundedContext !== undefined) {
        if (!boundedContext || boundedContext.trim() === '') {
          return reply.code(400).send({
            error: 'BadRequest',
            message: 'BoundedContext parameter cannot be empty',
            timestamp: new Date().toISOString(),
          });
        }

        const results = await searchService.searchByBoundedContext(boundedContext);
        return reply.code(200).send(results);
      }

      // No search parameters provided - return all services (User Story 1)
      const results = await searchService.getAllServices();
      return reply.code(200).send(results);
    } catch (error: any) {
      fastify.log.error({ error }, 'Search failed');
      return reply.code(500).send({
        error: 'InternalServerError',
        message: error.message || 'Search operation failed',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
