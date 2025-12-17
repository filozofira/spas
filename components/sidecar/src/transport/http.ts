/**
 * HTTP Transport Client
 *
 * Wrapper for HTTP requests to target services.
 * Used for service invocation (commands and event delivery).
 */

import type { InvocationResult } from '../types.js';

/**
 * HTTP client for invoking service endpoints.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl: string, timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * POST request to service endpoint.
   *
   * @param path - Endpoint path (e.g., '/incoming', '/orders')
   * @param body - Request body (will be JSON serialized)
   * @param headers - Additional headers to send
   * @returns Invocation result with status, data, and headers
   */
  async post(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<InvocationResult> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Debug: log outgoing payload
    console.log(`[http] POST ${url} payload:`, JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Debug: log response status and body for errors
      if (response.status >= 400) {
        const errorBody = await response.text();
        console.log(`[http] Error response (${response.status}):`, errorBody);
      }

      // Parse response body
      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms: ${url}`);
        }
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * GET request (for health checks, etc.).
   */
  async get(path: string, headers: Record<string, string> = {}): Promise<InvocationResult> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms: ${url}`);
        }
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      throw error;
    }
  }
}

/**
 * Create HTTP client for target service from environment variables.
 */
export function createServiceClient(): HttpClient {
  const serviceName = process.env.SERVICE_NAME;
  const servicePort = process.env.SERVICE_PORT;

  if (!serviceName || !servicePort) {
    throw new Error('SERVICE_NAME and SERVICE_PORT environment variables are required');
  }

  const baseUrl = `http://${serviceName}:${servicePort}`;
  return new HttpClient(baseUrl);
}

/**
 * Create HTTP client for Zipkin from environment variable.
 * Returns null if ZIPKIN_URL is not configured.
 */
export function createZipkinClient(): HttpClient | null {
  const zipkinUrl = process.env.ZIPKIN_URL;

  if (!zipkinUrl) {
    return null;
  }

  return new HttpClient(zipkinUrl, 5000); // 5s timeout for tracing
}
