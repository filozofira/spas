/**
 * Publish Handler
 *
 * POST /publish endpoint for event publishing.
 * Resolves topic from x-event-type header and publishes to Redis.
 */

import { Router, Request, Response } from 'express';
import type { SidecarConfig, SpanTags } from '../types.js';
import { RedisClient } from '../transport/redis.js';
import { EventPublisher, extractPublishHeaders, validatePublishHeaders } from '../services/event-publisher.js';
import { getTracer } from '../services/tracer.js';

/**
 * Create publish router with configured publisher.
 */
export function createPublishRouter(redis: RedisClient, config: SidecarConfig): Router {
  const router = Router();
  const publisher = new EventPublisher(redis, config);

  router.post('/', async (req: Request, res: Response) => {
    const tracer = getTracer();
    let span;

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

      // Start SERVER span for incoming request
      // This links the sidecar to the calling service
      if (headers.traceparent) {
        span = tracer?.startSpan('post /publish', headers.traceparent, {
          spanKind: 'SERVER',
          remoteServiceName: headers.serviceName,
          'http.method': 'POST',
          'http.url': '/publish',
          'http.route': '/publish'
        } as Partial<SpanTags>);
      }

      // Validate body - must be a non-null object
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        if (span) {
          tracer?.tagError(span, 'Invalid body');
          tracer?.tagHttpStatus(span, 400);
          tracer?.finishSpan(span);
        }
        res.status(400).json({
          error: 'Request body must be a JSON object',
        });
        return;
      }

      // Update headers with new span's traceparent so PRODUCER span becomes a child
      const publishHeaders = span 
        ? { ...headers, traceparent: tracer?.getTraceparent(span) }
        : headers;

      // Publish event
      const result = await publisher.publish(req.body, publishHeaders);

      if (span) {
        tracer?.tagHttpStatus(span, 202);
        tracer?.finishSpan(span);
      }

      // Return 202 Accepted with publish result
      res.status(202).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (span) {
        tracer?.tagError(span, message);
        // Check for routing errors (no route configured)
        if (message.includes('No outbound route')) {
          tracer?.tagHttpStatus(span, 400);
        } else {
          tracer?.tagHttpStatus(span, 500);
        }
        tracer?.finishSpan(span);
      }

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
