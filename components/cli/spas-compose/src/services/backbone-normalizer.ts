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
 * Docker image reference pattern
 * Matches: image, image:tag, org/image, org/image:tag, registry/org/image:tag
 */
const IMAGE_PATTERN = /^[a-zA-Z0-9][\w.-]*(\/[\w.-]+)*(:[a-zA-Z0-9][\w.-]*)?$/;

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
    // Return defaults for empty input
    if (!input) {
      return type === "event"
        ? BACKBONE_DEFAULTS.event.image
        : BACKBONE_DEFAULTS.observability.image;
    }

    // Expand observability shorthands
    if (type === "observability") {
      // zipkin:tag → openzipkin/zipkin:tag
      if (input.startsWith("zipkin:")) {
        return `openzipkin/${input}`;
      }
      // jaeger:tag → jaegertracing/all-in-one:tag
      if (input.startsWith("jaeger:")) {
        const tag = input.split(":")[1] || "latest";
        return `jaegertracing/all-in-one:${tag}`;
      }
    }

    return input;
  }

  /**
   * Build complete backbone configuration from CLI options
   *
   * @param options - CLI options with eventBackbone and observabilityBackbone
   * @returns Complete backbone configuration
   */
  buildConfig(options: {
    eventBackbone?: string;
    observabilityBackbone?: string;
  }): BackboneConfig {
    const eventImage = this.normalizeImage(options.eventBackbone, "event");
    const observabilityImage = this.normalizeImage(
      options.observabilityBackbone,
      "observability",
    );

    const eventBackbone: EventBackboneConfig = {
      enabled: true,
      image: eventImage,
      containerName: BACKBONE_DEFAULTS.event.containerName,
      port: BACKBONE_DEFAULTS.event.port,
      healthcheck: REDIS_HEALTHCHECK,
    };

    const observabilityType = this.detectObservabilityType(observabilityImage);
    const observabilityPorts =
      observabilityType === "jaeger"
        ? JAEGER_PORTS
        : (BACKBONE_DEFAULTS.observability.ports as unknown as PortMapping[]);

    const observabilityBackbone: ObservabilityBackboneConfig = {
      enabled: true,
      image: observabilityImage,
      containerName: BACKBONE_DEFAULTS.observability.containerName,
      type: observabilityType,
      ports: observabilityPorts,
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
  validateImageFormat(image: string): ValidationResult {
    // Empty string is invalid
    if (!image) {
      return { valid: false, error: "Image reference cannot be empty" };
    }

    // "none" is a valid special value
    if (image === "none") {
      return { valid: true };
    }

    // Check for spaces (common error)
    if (image.includes(" ")) {
      return { valid: false, error: "Invalid image format: contains spaces" };
    }

    // Validate against pattern
    if (!IMAGE_PATTERN.test(image)) {
      return { valid: false, error: `Invalid image format: ${image}` };
    }

    return { valid: true };
  }

  /**
   * Detect backbone type from image name
   *
   * @param image - Image reference
   * @returns Detected backbone type
   */
  detectObservabilityType(image: string): "zipkin" | "jaeger" {
    const lowerImage = image.toLowerCase();
    if (lowerImage.includes("jaeger")) {
      return "jaeger";
    }
    return "zipkin";
  }
}
