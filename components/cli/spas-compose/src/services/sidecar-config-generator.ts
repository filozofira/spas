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
} from "../types.js";

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
      for (const eventRoute of flow.events) {
        // Service is the source → outbound
        if (eventRoute.source === serviceName) {
          // Deduplicate by topic
          if (!seenTopics.has(eventRoute.topic)) {
            seenTopics.add(eventRoute.topic);
            entries.push({ topic: eventRoute.topic });
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
   *
   * Converts workspace-relative path to sidecar mount-relative path
   * e.g., "transformations/fulfillment-service/inbound-order.jsonata"
   *    → "transformations/inbound-order.jsonata"
   *
   * @param workspacePath - Path relative to workspace root
   * @param serviceName - Service name for context
   * @returns Path relative to sidecar /app/transformations mount
   */
  private resolveTransformPath(
    workspacePath: string,
    serviceName: string,
  ): string {
    // The sidecar mounts ./transformations/{service}:/app/transformations
    // So we strip the service folder prefix from the path
    const prefix = `transformations/${serviceName}/`;
    if (workspacePath.startsWith(prefix)) {
      return `transformations/${workspacePath.substring(prefix.length)}`;
    }
    // Fallback: return as-is if pattern doesn't match
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
    // TODO: T023 - Implement transformation path validation
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
}
