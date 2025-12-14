/**
 * BackboneNormalizer - Normalizes image references and builds backbone configurations
 *
 * Handles:
 * - Shorthand image name normalization (zipkin:* → openzipkin/zipkin:*)
 * - Default value application
 * - Image format validation
 * - Backbone type detection (Zipkin vs Jaeger)
 */

import type {
  BackboneConfig,
  EventBackboneConfig,
  ObservabilityBackboneConfig,
  HealthCheckConfig,
  PortMapping,
} from "../types.js";

/**
 * Validation result for image format
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Default backbone configuration values
 */
export const BACKBONE_DEFAULTS = {
  event: {
    image: "redis:7-alpine",
    containerName: "spas-redis",
    port: 6379,
  },
  observability: {
    image: "openzipkin/zipkin:latest",
    containerName: "spas-zipkin",
    type: "zipkin" as const,
    ports: [{ host: 9411, container: 9411 }],
  },
} as const;

/**
 * Jaeger port configuration
 */
export const JAEGER_PORTS: PortMapping[] = [
  { host: 16686, container: 16686 }, // Jaeger UI
  { host: 9411, container: 9411 }, // Zipkin-compatible collector
];

/**
 * Redis health check configuration
 */
export const REDIS_HEALTHCHECK: HealthCheckConfig = {
  test: ["CMD", "redis-cli", "ping"],
  interval: "5s",
  timeout: "3s",
  retries: 3,
};

/**
 * Service for normalizing image references and building backbone configurations
 */
export class BackboneNormalizer {
  /**
   * Normalize shorthand image names to full references
   *
   * @param input - Image reference or "none"
   * @param type - Type of backbone ("event" or "observability")
   * @returns Normalized image reference
   */
  normalizeImage(
    input: string | undefined,
    type: "event" | "observability",
  ): string {
    // TODO: Implement in T004
    if (!input) {
      return type === "event"
        ? BACKBONE_DEFAULTS.event.image
        : BACKBONE_DEFAULTS.observability.image;
    }
    return input;
  }

  /**
   * Build complete backbone configuration from CLI options
   *
   * @param options - CLI options with eventBackbone and observabilityBackbone
   * @returns Complete backbone configuration
   */
  buildConfig(_options: {
    eventBackbone?: string;
    observabilityBackbone?: string;
  }): BackboneConfig {
    // TODO: Implement in T005
    const eventBackbone: EventBackboneConfig = {
      enabled: true,
      image: BACKBONE_DEFAULTS.event.image,
      containerName: BACKBONE_DEFAULTS.event.containerName,
      port: BACKBONE_DEFAULTS.event.port,
      healthcheck: REDIS_HEALTHCHECK,
    };

    const observabilityBackbone: ObservabilityBackboneConfig = {
      enabled: true,
      image: BACKBONE_DEFAULTS.observability.image,
      containerName: BACKBONE_DEFAULTS.observability.containerName,
      type: BACKBONE_DEFAULTS.observability.type,
      ports: BACKBONE_DEFAULTS.observability.ports as unknown as PortMapping[],
    };

    return {
      eventBackbone,
      observabilityBackbone,
    };
  }

  /**
   * Validate image reference format
   *
   * @param image - Image reference to validate
   * @returns Validation result
   */
  validateImageFormat(_image: string): ValidationResult {
    // TODO: Implement in T012
    return { valid: true };
  }

  /**
   * Detect backbone type from image name
   *
   * @param image - Image reference
   * @returns Detected backbone type
   */
  detectObservabilityType(_image: string): "zipkin" | "jaeger" {
    // TODO: Implement in T018
    return "zipkin";
  }
}
