/**
 * Command Invoker Service
 *
 * Handles synchronous request-response command invocation.
 * Looks up command configuration, transforms request, invokes service, transforms response.
 */

import type { SidecarConfig, InboundEntry, SpanTags } from '../types.js';
import { ServiceInvoker } from './service-invoker.js';
import { applyTransform } from './transformer.js';
import { getTracer } from './tracer.js';

/**
 * Command lookup result.
 */
export interface CommandLookupResult {
  found: boolean;
  entry?: InboundEntry;
}

/**
 * Command invocation result.
 */
export interface CommandResult {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

/**
 * Command invoker that handles synchronous request-response patterns.
 */
export class CommandInvoker {
  private readonly config: SidecarConfig;
  private readonly serviceInvoker: ServiceInvoker;

  constructor(config: SidecarConfig, serviceInvoker: ServiceInvoker) {
    this.config = config;
    this.serviceInvoker = serviceInvoker;
  }

  /**
   * Look up command configuration by name.
   *
   * @param commandName - Command name to look up
   * @returns Lookup result with found flag and entry
   */
  lookupCommand(commandName: string): CommandLookupResult {
    const entry = this.config.inbound.find(
      (e) => e.kind === 'command' && e.command === commandName
    );

    if (!entry) {
      return { found: false };
    }

    return { found: true, entry };
  }

  /**
   * Invoke a command with request payload.
   *
   * 1. Look up command configuration
   * 2. Apply request transform
   * 3. Invoke service endpoint
   * 4. Apply response transform (if configured)
   * 5. Return result
   *
   * @param commandName - Command name to invoke
   * @param payload - Request payload
   * @param headers - Request headers to propagate
   * @returns Command result with status and data
   */
  async invoke(
    commandName: string,
    payload: unknown,
    headers: Record<string, string>
  ): Promise<CommandResult> {
    // 1. Look up command
    const lookup = this.lookupCommand(commandName);
    if (!lookup.found || !lookup.entry) {
      return {
        status: 404,
        data: { error: 'Command not found', command: commandName },
        headers: {},
      };
    }

    const entry = lookup.entry;
    console.log(`[command] Invoking ${commandName} → ${entry.invokeEndpoint}`);

    // Start tracing span
    const tracer = getTracer();
    const traceparent = headers['traceparent'];
    const span = tracer?.startSpan(`command:${commandName}`, traceparent, {
      kind: 'command',
      transport: 'http',
      'http.url': entry.invokeEndpoint,
      'http.method': 'POST',
    } as Partial<SpanTags>);

    try {
      // 2. Apply request transform
      let transformedPayload = payload;
      if (entry.transform) {
        transformedPayload = await applyTransform(payload, entry.transform);
      }

      // 3. Invoke service endpoint
      const result = await this.serviceInvoker.invokeCommand(
        entry.invokeEndpoint,
        transformedPayload,
        headers
      );

      // Tag HTTP status
      if (span) {
        tracer?.tagHttpStatus(span, result.status);
      }

      // 4. Check for service error
      if (result.status >= 500) {
        console.warn(`[command] Service error: ${result.status}`);
        if (span) {
          tracer?.tagError(span, `Service error: ${result.status}`);
          tracer?.finishSpan(span);
        }
        return {
          status: 502, // Bad Gateway - upstream service error
          data: { error: 'Service error', upstream_status: result.status, details: result.data },
          headers: result.headers,
        };
      }

      // Finish span on success
      if (span) {
        tracer?.finishSpan(span);
      }

      // 5. Return result (response transform not implemented - would need responseTransform config)
      return {
        status: result.status,
        data: result.data,
        headers: result.headers,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[command] Invocation failed: ${message}`);

      // Tag error and finish span
      if (span) {
        tracer?.tagError(span, message);
        tracer?.finishSpan(span);
      }

      return {
        status: 502,
        data: { error: 'Command invocation failed', message },
        headers: {},
      };
    }
  }

  /**
   * Get all configured commands.
   */
  getCommands(): string[] {
    return this.config.inbound
      .filter((e) => e.kind === 'command' && e.command)
      .map((e) => e.command as string);
  }
}

/**
 * Create command invoker with configuration and service invoker.
 */
export function createCommandInvoker(
  config: SidecarConfig,
  serviceInvoker: ServiceInvoker
): CommandInvoker {
  return new CommandInvoker(config, serviceInvoker);
}
