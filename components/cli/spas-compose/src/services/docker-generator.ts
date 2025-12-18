/**
 * DockerGenerator - Generates docker-compose.yaml from choreography
 */

import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";
import type {
  Choreography,
  ServiceMetadata,
  BackboneConfig,
  EventBackboneConfig,
  ObservabilityBackboneConfig,
  GeneratorConfig,
} from "../types.js";
import { DEFAULT_GENERATOR_CONFIG } from "../types.js";
import { BackboneNormalizer } from "./backbone-normalizer.js";

/**
 * Result from Docker Compose generation
 */
export interface GenerateResult {
  success: boolean;
  content?: string;
  error?: {
    code: string;
    details: string;
  };
}

/**
 * Result from service validation
 */
export interface ServiceValidationResult {
  isValid: boolean;
  missingServices: string[];
  foundServices: string[];
}

/**
 * Docker Compose service definition
 */
interface DockerService {
  image?: string;
  build?: string;
  container_name?: string;
  ports?: string[];
  environment?: string[] | Record<string, string>;
  volumes?: string[];
  depends_on?: string[];
  networks?: string[];
  pull_policy?: "always" | "never" | "missing" | "build";
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
  };
}

/**
 * Docker Compose structure
 */
interface DockerCompose {
  services: Record<string, DockerService>;
  networks?: Record<string, { driver?: string }>;
  volumes?: Record<string, Record<string, unknown>>;
}

/**
 * Service for generating Docker Compose files from choreography
 */
export class DockerGenerator {
  private readonly servicesPath: string;
  private readonly workspaceName: string;
  private readonly backboneNormalizer: BackboneNormalizer;
  private readonly generatorConfig: GeneratorConfig;
  private readonly devMode: boolean;

  constructor(
    private readonly workspacePath: string,
    generatorConfig?: Partial<GeneratorConfig>,
    devMode: boolean = false,
  ) {
    this.servicesPath = path.join(workspacePath, "services");
    this.workspaceName = path.basename(workspacePath);
    this.backboneNormalizer = new BackboneNormalizer();
    this.generatorConfig = { ...DEFAULT_GENERATOR_CONFIG, ...generatorConfig };
    this.devMode = devMode;
  }

  /**
   * Generate docker-compose.yaml content from choreography
   */
  generate(choreography: Choreography, backboneConfig?: BackboneConfig): GenerateResult {
    try {
      // Use provided config or build defaults
      const config = backboneConfig || this.backboneNormalizer.buildConfig({});

      const compose: DockerCompose = {
        services: {},
        networks: {
          "spas-network": {
            driver: "bridge",
          },
        },
      };

      // Add infrastructure services using backbone config
      if (config.eventBackbone.enabled) {
        compose.services[config.eventBackbone.containerName.replace("spas-", "")] =
          this.generateRedis(config.eventBackbone);
      }

      if (config.observabilityBackbone.enabled) {
        compose.services[config.observabilityBackbone.containerName.replace("spas-", "")] =
          this.generateZipkin(config.observabilityBackbone);
      }

      // Get all unique participants
      const participants = this.getAllParticipants(choreography);
      let portOffset = 0;

      for (const serviceName of participants) {
        const metadata = this.loadServiceMetadata(serviceName);
        const servicePort = metadata?.network?.port || 5001 + portOffset;
        // Use fixed sidecar port from generator config (T014)
        const sidecarPort = this.generatorConfig.sidecarPort;
        // Use fixed internal port for sidecar to call service (inside Docker network)
        const serviceInternalPort = this.generatorConfig.serviceInternalPort;

        // Generate application service
        compose.services[serviceName] = this.generateService(
          serviceName,
          servicePort,
          sidecarPort,
          config.observabilityBackbone,
          metadata,
        );

        // Generate sidecar service - use internal port, not external mapped port
        compose.services[`${serviceName}-sidecar`] = this.generateSidecar(
          serviceName,
          serviceInternalPort,
          sidecarPort,
          config,
        );

        portOffset++;
      }

      // Generate YAML output
      const content = this.formatDockerCompose(compose);

      return {
        success: true,
        content,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GENERATION_ERROR",
          details: (error as Error).message,
        },
      };
    }
  }

  /**
   * Validate that all participants have pulled services
   */
  validateServices(choreography: Choreography): ServiceValidationResult {
    const participants = this.getAllParticipants(choreography);
    const missingServices: string[] = [];
    const foundServices: string[] = [];

    for (const serviceName of participants) {
      const servicePath = path.join(this.servicesPath, serviceName);
      if (fs.existsSync(servicePath)) {
        foundServices.push(serviceName);
      } else {
        missingServices.push(serviceName);
      }
    }

    return {
      isValid: missingServices.length === 0,
      missingServices,
      foundServices,
    };
  }

  /**
   * Generate Redis service definition
   */
  private generateRedis(config: EventBackboneConfig): DockerService {
    const service: DockerService = {
      image: config.image,
      container_name: config.containerName,
      ports: [`${config.port}:${config.port}`],
      networks: ["spas-network"],
    };

    // Add health check if configured
    if (config.healthcheck) {
      service.healthcheck = {
        test: config.healthcheck.test,
        interval: config.healthcheck.interval,
        timeout: config.healthcheck.timeout,
        retries: config.healthcheck.retries,
      };
    }

    return service;
  }

  /**
   * Generate Zipkin/Jaeger service definition
   */
  private generateZipkin(config: ObservabilityBackboneConfig): DockerService {
    const ports = config.ports.map((p) => `${p.host}:${p.container}`);

    return {
      image: config.image,
      container_name: config.containerName,
      ports,
      networks: ["spas-network"],
    };
  }

  /**
   * Generate application service definition
   * T009: Use image: from runtime metadata
   * T010: Use port 8080 as internal port
   * T011: Add SERVICE_NAME and SIDECAR_PORT=7001
   * T015: Log warning when service has no runtime metadata
   * DEV MODE: Use spas-{service-name}:latest with pull_policy: never
   */
  private generateService(
    serviceName: string,
    servicePort: number,
    sidecarPort: number,
    observabilityConfig: ObservabilityBackboneConfig,
    metadata?: ServiceMetadata | null,
  ): DockerService {
    // Use env var substitution when observability is disabled
    const zipkinUrl = observabilityConfig.enabled
      ? `http://${observabilityConfig.containerName.replace("spas-", "")}:${observabilityConfig.ports.find((p) => p.container === 9411)?.container || 9411}`
      : "${ZIPKIN_URL}";

    // T010: Use fixed internal port from generator config
    const internalPort = this.generatorConfig.serviceInternalPort;

    const service: DockerService = {
      container_name: `spas-${serviceName}`,
      ports: [`${servicePort}:${internalPort}`],
      environment: [
        `SERVICE_NAME=${serviceName}`,
        `SIDECAR_PORT=${sidecarPort}`,
        `PORT=${internalPort}`,
        `ZIPKIN_URL=${zipkinUrl}`,
      ],
      networks: ["spas-network"],
    };

    // DEV MODE: Use local images with :latest tag, skip repository metadata
    if (this.devMode) {
      service.image = `spas-${serviceName}:latest`;
      service.pull_policy = "never";
    } else if (metadata?.runtime) {
      // T009: Use image: from runtime metadata when available
      const { repository, tag, image } = metadata.runtime;
      // Prefer full image reference if available, otherwise construct from repo:tag
      service.image = image || `${repository}:${tag}`;
    } else {
      // T015: Fallback to build directive with warning
      console.warn(
        `[WARN] Service '${serviceName}' has no runtime metadata. Using build directive instead of image.`,
      );
      service.build = `./${serviceName}`;
    }

    return service;
  }

  /**
   * Generate sidecar service definition
   * T012: Use image: spas/sidecar:latest
   * T013: Use SIDECAR_PORT env var instead of PORT
   * T014: Use fixed port 7001
   */
  private generateSidecar(
    serviceName: string,
    servicePort: number,
    sidecarPort: number,
    config: BackboneConfig,
  ): DockerService {
    const volumes = [`./config.${serviceName}.json:/app/config.json`];

    // Add transformation volume mounts
    const transformDir = path.join(
      this.workspacePath,
      "transformations",
      serviceName,
    );
    if (fs.existsSync(transformDir)) {
      volumes.push(
        `./transformations/${serviceName}:/app/transformations`,
      );
    }

    // Use env var substitution when backbones are disabled
    const redisHost = config.eventBackbone.enabled
      ? config.eventBackbone.containerName.replace("spas-", "")
      : "${REDIS_HOST}";
    const redisPort = config.eventBackbone.enabled
      ? config.eventBackbone.port.toString()
      : "${REDIS_PORT}";
    const zipkinUrl = config.observabilityBackbone.enabled
      ? `http://${config.observabilityBackbone.containerName.replace("spas-", "")}:${config.observabilityBackbone.ports.find((p) => p.container === 9411)?.container || 9411}`
      : "${ZIPKIN_URL}";

    // Build depends_on based on enabled backbones
    const dependsOn: string[] = [];
    if (config.eventBackbone.enabled) {
      dependsOn.push(config.eventBackbone.containerName.replace("spas-", ""));
    }
    if (config.observabilityBackbone.enabled) {
      dependsOn.push(config.observabilityBackbone.containerName.replace("spas-", ""));
    }

    const service: DockerService = {
      // T012: Use image reference instead of build directive
      image: this.generatorConfig.sidecarImage,
      container_name: `${serviceName}-sidecar`,
      environment: [
        // T013: Use SIDECAR_PORT instead of PORT
        `SIDECAR_PORT=${sidecarPort}`,
        `CONFIG_PATH=/app/config.json`,
        `SERVICE_NAME=${serviceName}`,
        `ZIPKIN_URL=${zipkinUrl}`,
        `SERVICE_PORT=${servicePort}`,
        `REDIS_HOST=${redisHost}`,
        `REDIS_PORT=${redisPort}`,
      ],
      volumes,
      networks: ["spas-network"],
    };

    // Only add depends_on if there are dependencies
    if (dependsOn.length > 0) {
      service.depends_on = dependsOn;
    }

    return service;
  }

  /**
   * Load service metadata from pulled service
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
   * Get all unique participants from choreography
   */
  private getAllParticipants(choreography: Choreography): string[] {
    const participants = new Set<string>();

    for (const flow of Object.values(choreography.flows)) {
      for (const participant of flow.participants) {
        participants.add(participant);
      }
    }

    return Array.from(participants).sort();
  }

  /**
   * Format Docker Compose as YAML with custom formatting
   */
  private formatDockerCompose(compose: DockerCompose): string {
    // Add header comment
    const header = `# Generated by spas-compose
# Domain: ${this.workspaceName}
# Generated: ${new Date().toISOString()}

`;

    // Use js-yaml with custom options for readability
    const yamlContent = yaml.dump(compose, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });

    return header + yamlContent;
  }
}
