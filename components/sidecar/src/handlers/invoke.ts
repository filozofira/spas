/**
 * Invoke Handler
 *
 * POST /invoke/:command endpoint for synchronous command invocation.
 */

import { Router, Request, Response } from 'express';
import type { SidecarConfig } from '../types.js';
import { CommandInvoker } from '../services/command-invoker.js';
import { ServiceInvoker } from '../services/service-invoker.js';
import { HttpClient } from '../transport/http.js';

/**
 * Create invoke router with command invoker.
 */
export function createInvokeRouter(config: SidecarConfig, httpClient: HttpClient): Router {
  const router = Router();
  const serviceInvoker = new ServiceInvoker(httpClient);
  const commandInvoker = new CommandInvoker(config, serviceInvoker);

  router.post('/:command', async (req: Request, res: Response) => {
    const commandName = req.params.command;

    if (!commandName) {
      res.status(400).json({ error: 'Command name is required' });
      return;
    }

    // Extract propagation headers
    const headers = extractPropagationHeaders(req);

    try {
      const result = await commandInvoker.invoke(commandName, req.body, headers);

      // Set response headers from service
      for (const [key, value] of Object.entries(result.headers)) {
        if (shouldPropagateHeader(key)) {
          res.setHeader(key, value);
        }
      }

      res.status(result.status).json(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[invoke] Error: ${message}`);
      res.status(500).json({
        error: 'Internal error',
        message,
      });
    }
  });

  return router;
}

/**
 * Extract headers to propagate to service.
 */
function extractPropagationHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Propagate trace context
  const traceparent = req.headers['traceparent'];
  if (traceparent && typeof traceparent === 'string') {
    headers['traceparent'] = traceparent;
  }

  // Propagate correlation ID
  const correlationId = req.headers['x-correlation-id'];
  if (correlationId && typeof correlationId === 'string') {
    headers['x-correlation-id'] = correlationId;
  }

  // Propagate user/tenant context
  const userId = req.headers['x-user-id'];
  if (userId && typeof userId === 'string') {
    headers['x-user-id'] = userId;
  }

  const tenantId = req.headers['x-tenant-id'];
  if (tenantId && typeof tenantId === 'string') {
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}

/**
 * Check if header should be propagated back to client.
 */
function shouldPropagateHeader(name: string): boolean {
  const lowerName = name.toLowerCase();
  // Propagate custom headers and trace context
  return (
    lowerName.startsWith('x-') ||
    lowerName === 'traceparent' ||
    lowerName === 'tracestate'
  );
}

/**
 * Standalone invoke handler for integration.
 */
export async function handleInvoke(
  req: Request,
  res: Response,
  commandInvoker: CommandInvoker
): Promise<void> {
  const commandName = req.params.command;

  if (!commandName) {
    res.status(400).json({ error: 'Command name is required' });
    return;
  }

  const headers = extractPropagationHeaders(req);

  try {
    const result = await commandInvoker.invoke(commandName, req.body, headers);

    for (const [key, value] of Object.entries(result.headers)) {
      if (shouldPropagateHeader(key)) {
        res.setHeader(key, value);
      }
    }

    res.status(result.status).json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[invoke] Error: ${message}`);
    res.status(500).json({
      error: 'Internal error',
      message,
    });
  }
}
