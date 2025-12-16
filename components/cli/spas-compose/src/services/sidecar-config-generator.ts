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
  constructor(private readonly workspacePath: string) {}

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

    // T020: Load service metadata for boundedContext
    const metadata = this.loadServiceMetadata(serviceName);

    for (const flow of Object.values(choreography.flows)) {
      for (const eventRoute of flow.events) {
        // Service is the source → outbound
        if (eventRoute.source === serviceName) {
          // Deduplicate by topic
          if (!seenTopics.has(eventRoute.topic)) {
            seenTopics.add(eventRoute.topic);

            const entry: OutboundEntry = { topic: eventRoute.topic };

            // T019: Derive eventType from boundedContext and event name
            if (metadata?.boundedContext && eventRoute.event) {
              entry.eventType = deriveCloudEventsType(
                metadata.boundedContext,
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

    for (const flow of Object.values(choreography.flows)) {
      for (const eventRoute of flow.events) {
        for (const target of eventRoute.targets) {
          // Service is a target → inbound
          if (target.service === serviceName) {
            // Deduplicate by topic
            if (!seenTopics.has(eventRoute.topic)) {
              seenTopics.add(eventRoute.topic);

              const entry: InboundEntry = {
                kind: "event",
                topic: eventRoute.topic,
                invokeEndpoint: "/incoming",
              };

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

    return entries;
  }

  /**
   * Resolve transformation path for sidecar config
   * T021: Keep full path with service folder - sidecar mounts at workspace root
   *
   * The sidecar mounts ./transformations:/app/transformations at the container level.
   * The docker-compose mounts the full transformations directory, so paths should
   * preserve the full structure including service folder.
   *
   * @param workspacePath - Path relative to workspace root
   * @param _serviceName - Service name (unused, kept for backwards compatibility)
   * @returns Path as-is (full path preserved)
   */
  private resolveTransformPath(
    workspacePath: string,
    _serviceName: string,
  ): string {
    // T021: Return path as-is - docker-compose mounts full transformations directory
    // e.g., "transformations/fulfillment-service/inbound-order.jsonata" stays the same
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
   * Validate transformation file paths exist
   *
   * @param choreography - Parsed choreography configuration
   * @returns Array of ConfigError for missing files
   */
  validateTransformationPaths(choreography: Choreography): ConfigError[] {
    const errors: ConfigError[] = [];

    for (const flow of Object.values(choreography.flows)) {
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

  /**
   * Load service metadata from spas.json
   * T020: Helper to read service metadata for boundedContext
   *
   * @param serviceName - Name of the service to load metadata for
   * @returns ServiceMetadata or null if not found
   */
  private loadServiceMetadata(serviceName: string): ServiceMetadata | null {
    const metadataPath = path.join(
      this.workspacePath,
      "services",
      serviceName,
      "spas.json",
    );

    try {
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, "utf-8");
        return JSON.parse(content) as ServiceMetadata;
      }
    } catch {
      // Silently ignore parse errors - return null
    }

    return null;
  }
}
