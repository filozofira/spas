/**
 * Service Invoker
 *
 * Invokes service HTTP endpoints with proper header propagation.
 * Used by event subscriber and command invoker.
 */

import type { CloudEvent, InvocationResult } from '../types.js';
import { HttpClient } from '../transport/http.js';

/**
 * Service invoker that calls service endpoints with CloudEvent context.
 */
export class ServiceInvoker {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Invoke a service endpoint with transformed payload.
   *
   * @param endpoint - Service endpoint path (e.g., '/orders', '/notifications')
   * @param payload - Transformed payload to send
   * @param event - Source CloudEvent for header propagation
   * @returns Invocation result with status and response data
   */
  async invoke(
    endpoint: string,
    payload: unknown,
    event: CloudEvent
  ): Promise<InvocationResult> {
    // Build headers from CloudEvent
    const headers = this.buildHeaders(event);

    console.log(`[invoker] POST ${endpoint} (correlation: ${event.correlationid})`);

    const result = await this.httpClient.post(endpoint, payload, headers);

    if (result.status >= 200 && result.status < 300) {
      console.log(`[invoker] Success: ${result.status}`);
    } else {
      console.warn(`[invoker] Failed: ${result.status}`);
    }

    return result;
  }

  /**
   * Invoke a service endpoint for command (without CloudEvent).
   * Used for synchronous request-response patterns.
   *
   * @param endpoint - Service endpoint path
   * @param payload - Payload to send
   * @param headers - Headers to propagate
   * @returns Invocation result
   */
  async invokeCommand(
    endpoint: string,
    payload: unknown,
    headers: Record<string, string>
  ): Promise<InvocationResult> {
    console.log(`[invoker] Command POST ${endpoint}`);

    const result = await this.httpClient.post(endpoint, payload, headers);

    if (result.status >= 200 && result.status < 300) {
      console.log(`[invoker] Command success: ${result.status}`);
    } else {
      console.warn(`[invoker] Command failed: ${result.status}`);
    }

    return result;
  }

  /**
   * Build headers from CloudEvent for service invocation.
   */
  private buildHeaders(event: CloudEvent): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      traceparent: event.traceparent,
      'x-event-type': event.type,
      'x-event-source': event.source,
      'x-event-id': event.id,
    };

    if (event.correlationid) {
      headers['x-correlation-id'] = event.correlationid;
    }

    if (event.userid) {
      headers['x-user-id'] = event.userid;
    }

    if (event.tenantid) {
      headers['x-tenant-id'] = event.tenantid;
    }

    return headers;
  }
}

/**
 * Create service invoker from environment.
 */
export function createServiceInvoker(): ServiceInvoker {
  const serviceName = process.env.SERVICE_NAME;
  const servicePort = process.env.SERVICE_PORT;

  if (!serviceName || !servicePort) {
    throw new Error('SERVICE_NAME and SERVICE_PORT environment variables are required');
  }

  const baseUrl = `http://${serviceName}:${servicePort}`;
  const httpClient = new HttpClient(baseUrl);

  return new ServiceInvoker(httpClient);
}
