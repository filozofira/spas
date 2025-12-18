/**
 * SidecarConfigGenerator - Generates sidecar configuration files from choreography
 *
 * Produces config.{serviceName}.json files containing inbound/outbound entries
 * for each service participating in choreography flows.
 *
 * @see specs/006-sidecar-config-generator/spec.md
 */

import * as fs from "fs";
import * as path from "path";
import type {
  Choreography,
  SidecarConfig,
  InboundEntry,
  OutboundEntry,
  ConfigGeneratorResult,
  ConfigError,
  ConfigSummary,
  ServiceSummarySidecar,
  ServiceMetadata,
} from "../types.js";
import { deriveCloudEventsType, pascalToKebab } from "../utils/event-type.js";

/**
 * Service for generating sidecar configuration files from choreography
 */
export class SidecarConfigGenerator {
  private readonly servicesPath: string;

  constructor(private readonly workspacePath: string) {
    this.servicesPath = path.join(workspacePath, "services");
  }

  /**
   * Generate sidecar configuration for all services in choreography
   *
   * @param choreography - Parsed choreography configuration
   * @returns ConfigGeneratorResult with configs or errors
   */
  generate(choreography: Choreography): ConfigGeneratorResult {
    const configs: Record<string, SidecarConfig> = {};
    const errors: ConfigError[] = [];

    // Get all participating services
    const participants = this.getAllParticipants(choreography);

    // Build config for each service
    for (const serviceName of participants) {
      const inbound = this.buildInboundEntries(choreography, serviceName);
      const outbound = this.buildOutboundEntries(choreography, serviceName);

      configs[serviceName] = { inbound, outbound };
    }

    const summary = this.buildSummary(configs);

    return {
      success: errors.length === 0,
      configs,
      errors,
      summary,
    };
  }

  /**
   * Extract all unique service names participating in any flow
   *
   * @param choreography - Parsed choreography configuration
   * @returns Array of unique service names
   */
  getAllParticipants(choreography: Choreography): string[] {
    const participants = new Set<string>();

    for (const flow of Object.values(choreography.flows)) {
      // Add from participants list
      for (const participant of flow.participants) {
        participants.add(participant);
      }
    }

    return Array.from(participants).sort();
  }

  /**
   * Build outbound entries for a service from all flows
   * T018: Include eventType field
   * T019: Derive eventType using CloudEvents utility
   *
   * @param choreography - Parsed choreography configuration
   * @param serviceName - Service to extract outbound entries for
   * @returns Array of OutboundEntry
   */
  buildOutboundEntries(
    choreography: Choreography,
    serviceName: string,
  ): OutboundEntry[] {
    const entries: OutboundEntry[] = [];
    const seenTopics = new Set<string>();

    for (const flow of Object.values(choreography.flows)) {
      if (!flow.events) continue;
      
      for (const eventRoute of flow.events) {
        // Service is the source → outbound
        if (eventRoute.source === serviceName) {
          // Deduplicate by topic
          if (!seenTopics.has(eventRoute.topic)) {
            seenTopics.add(eventRoute.topic);

            const entry: OutboundEntry = { topic: eventRoute.topic };

            // T019: Derive eventType from service name and event name
            // Uses serviceName (not boundedContext) to match sidecar runtime behavior
            if (eventRoute.event) {
              entry.eventType = deriveCloudEventsType(
                serviceName,
                eventRoute.event,
              );
              // T024/T025: Add short kebab-case eventName (sidecar uses to construct type)
              entry.eventName = pascalToKebab(eventRoute.event);
            }

            entries.push(entry);
          }
        }
      }
    }

    return entries;
  }

  /**
   * Build inbound entries for a service from all flow targets
   *
   * @param choreography - Parsed choreography configuration
   * @param serviceName - Service to extract inbound entries for
   * @returns Array of InboundEntry
   */
  buildInboundEntries(
    choreography: Choreography,
    serviceName: string,
  ): InboundEntry[] {
    const entries: InboundEntry[] = [];
    const seenTopics = new Set<string>();
    const seenCommands = new Set<string>();

    // Load service metadata to resolve endpoint paths
    const metadata = this.loadServiceMetadata(serviceName);

    for (const flow of Object.values(choreography.flows)) {
      // Build command entries (direct entry points)
      if (flow.commands) {
        for (const cmd of flow.commands) {
          if (cmd.service === serviceName && !seenCommands.has(cmd.command)) {
            seenCommands.add(cmd.command);
            entries.push({
              kind: "command",
              command: cmd.command,
              invokeEndpoint: cmd.endpoint,
            });
          }
        }
      }

      // Build event entries
      if (flow.events) {
        for (const eventRoute of flow.events) {
          for (const target of eventRoute.targets) {
            // Service is a target → inbound
            if (target.service === serviceName) {
              // Deduplicate by topic
              if (!seenTopics.has(eventRoute.topic)) {
                seenTopics.add(eventRoute.topic);

                // Resolve endpoint from target.command or fallback
                const invokeEndpoint = this.resolveCommandEndpoint(
                  metadata,
                  target.command,
                );

                const entry: InboundEntry = {
                  kind: "event",
                  topic: eventRoute.topic,
                  invokeEndpoint,
                };

                // Derive eventType from source service and event name for filtering
                if (eventRoute.source && eventRoute.event) {
                  entry.eventType = deriveCloudEventsType(
                    eventRoute.source,
                    eventRoute.event,
                  );
                }

                // Only add transform if specified (US4 - optional transforms)
                if (target.transform) {
                  // Resolve path relative to sidecar mount
                  entry.transform = this.resolveTransformPath(
                    target.transform,
                    serviceName,
                  );
                }

                entries.push(entry);
              }
            }
          }
        }
      }
    }

    return entries;
  }

  /**
   * Resolve transformation path for sidecar config
   * T021: Adjust path for per-service mount
   *
   * The docker-compose mounts ./transformations/{service}:/app/transformations
   * So a choreography path like "transformations/inventory-service/inbound.jsonata"
   * becomes "/app/transformations/inbound.jsonata" inside the container.
   * We need to strip the service-specific prefix.
   *
   * @param workspacePath - Path relative to workspace root (from choreography)
   * @param serviceName - Service name to strip from path
   * @returns Path relative to /app/transformations inside container
   */
  private resolveTransformPath(
    workspacePath: string,
    serviceName: string,
  ): string {
    // Strip "transformations/{serviceName}/" prefix to get just the filename
    // e.g., "transformations/inventory-service/inbound-order.jsonata" 
    //    -> "transformations/inbound-order.jsonata"
    const servicePrefix = `transformations/${serviceName}/`;
    if (workspacePath.startsWith(servicePrefix)) {
      return `transformations/${workspacePath.substring(servicePrefix.length)}`;
    }
    // Fallback: return as-is
    return workspacePath;
  }

  /**
   * Build summary for CLI output
   *
   * @param configs - Generated configs by service name
   * @returns ConfigSummary
   */
  buildSummary(configs: Record<string, SidecarConfig>): ConfigSummary {
    const services: ServiceSummarySidecar[] = Object.entries(configs).map(
      ([name, config]) => ({
        name,
        inboundCount: config.inbound.length,
        outboundCount: config.outbound.length,
      }),
    );

    return {
      totalConfigs: Object.keys(configs).length,
      services,
    };
  }

  /**
   * Load service metadata from pulled service
   *
   * @param serviceName - Service name to load metadata for
   * @returns ServiceMetadata or null if not found
   */
  private loadServiceMetadata(serviceName: string): ServiceMetadata | null {
    const metadataPath = path.join(this.servicesPath, serviceName, "spas.json");
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch {
      return null;
    }
  }

  /**
   * Resolve command endpoint from service metadata
   * Looks for matching command by name, falls back to first Command-type endpoint
   *
   * @param metadata - Service metadata
   * @param commandName - Optional command name to find (PascalCase)
   * @returns Endpoint path (defaults to /incoming if not found)
   */
  private resolveCommandEndpoint(
    metadata: ServiceMetadata | null,
    commandName?: string,
  ): string {
    if (!metadata || !metadata.endpoints) {
      return "/incoming"; // Fallback to old behavior
    }

    // If command name specified, find matching endpoint
    if (commandName) {
      const matchingEndpoint = metadata.endpoints.find(
        (ep: any) => ep.name === commandName && ep.type === "Command",
      );
      if (matchingEndpoint && matchingEndpoint.methodPath) {
        return matchingEndpoint.methodPath;
      }
    }

    // Fallback: Find first Command-type endpoint
    const commandEndpoint = metadata.endpoints.find(
      (ep: any) => ep.type === "Command",
    );

    if (commandEndpoint && commandEndpoint.methodPath) {
      return commandEndpoint.methodPath;
    }

    return "/incoming"; // Fallback
  }

  /**
   * Validate transformation file paths exist
   *
   * @param choreography - Parsed choreography configuration
   * @returns Array of ConfigError for missing files
   */
  validateTransformationPaths(choreography: Choreography): ConfigError[] {
    const errors: ConfigError[] = [];

    for (const flow of Object.values(choreography.flows)) {
      if (!flow.events) continue;
      
      for (const eventRoute of flow.events) {
        for (const target of eventRoute.targets) {
          if (target.transform) {
            const fullPath = path.join(this.workspacePath, target.transform);
            if (!fs.existsSync(fullPath)) {
              errors.push({
                service: target.service,
                message: `Missing transformation file: ${target.transform}`,
                type: "MISSING_TRANSFORM",
              });
            }
          }
        }
      }
    }

    return errors;
  }
}
