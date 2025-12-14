/**
 * Publish Handler
 *
 * POST /publish endpoint for event publishing.
 * Resolves topic from x-event-type header and publishes to Redis.
 */

import { Router, Request, Response } from 'express';
import type { SidecarConfig } from '../types.js';
import { RedisClient } from '../transport/redis.js';
import { EventPublisher, extractPublishHeaders, validatePublishHeaders } from '../services/event-publisher.js';

/**
 * Create publish router with configured publisher.
 */
export function createPublishRouter(redis: RedisClient, config: SidecarConfig): Router {
  const router = Router();
  const publisher = new EventPublisher(redis, config);

  router.post('/', async (req: Request, res: Response) => {
    try {
      // Validate required headers
      const missingHeaders = validatePublishHeaders(req.headers);
      if (missingHeaders.length > 0) {
        res.status(400).json({
          error: 'Missing required headers',
          missing: missingHeaders,
        });
        return;
      }

      // Extract headers
      const headers = extractPublishHeaders(req.headers);
      if (!headers) {
        res.status(400).json({
          error: 'Invalid headers',
        });
        return;
      }

      // Validate body - must be a non-null object
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        res.status(400).json({
          error: 'Request body must be a JSON object',
        });
        return;
      }

      // Publish event
      const result = await publisher.publish(req.body, headers);

      // Return 202 Accepted with publish result
      res.status(202).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      // Check for routing errors (no route configured)
      if (message.includes('No outbound route')) {
        res.status(400).json({
          error: 'Routing error',
          message,
        });
        return;
      }

      // Log and return 500 for other errors
      console.error('[publish] Error:', message);
      res.status(500).json({
        error: 'Publish failed',
        message,
      });
    }
  });

  return router;
}

/**
 * Standalone publish handler for integration with existing app.
 */
export async function handlePublish(
  req: Request,
  res: Response,
  publisher: EventPublisher
): Promise<void> {
  // Validate required headers
  const missingHeaders = validatePublishHeaders(req.headers);
  if (missingHeaders.length > 0) {
    res.status(400).json({
      error: 'Missing required headers',
      missing: missingHeaders,
    });
    return;
  }

  // Extract headers
  const headers = extractPublishHeaders(req.headers);
  if (!headers) {
    res.status(400).json({
      error: 'Invalid headers',
    });
    return;
  }

  // Validate body
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      error: 'Request body must be a JSON object',
    });
    return;
  }

  try {
    const result = await publisher.publish(req.body, headers);
    res.status(202).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('No outbound route')) {
      res.status(400).json({
        error: 'Routing error',
        message,
      });
      return;
    }

    console.error('[publish] Error:', message);
    res.status(500).json({
      error: 'Publish failed',
      message,
    });
  }
}
