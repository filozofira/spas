/**
 * DockerGenerator - Generates docker-compose.yaml from choreography
 */

import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";
import type { Choreography, ServiceMetadata } from "../types.js";

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

  constructor(private readonly workspacePath: string) {
    this.servicesPath = path.join(workspacePath, "services");
    this.workspaceName = path.basename(workspacePath);
  }

  /**
   * Generate docker-compose.yaml content from choreography
   */
  generate(choreography: Choreography): GenerateResult {
    try {
      const compose: DockerCompose = {
        services: {},
        networks: {
          "spas-network": {
            driver: "bridge",
          },
        },
      };

      // Add infrastructure services
      if (choreography.infrastructure?.redis?.enabled !== false) {
        compose.services["redis"] = this.generateRedis();
      }

      if (choreography.infrastructure?.zipkin?.enabled !== false) {
        compose.services["zipkin"] = this.generateZipkin();
      }

      // Get all unique participants
      const participants = this.getAllParticipants(choreography);
      let portOffset = 0;

      for (const serviceName of participants) {
        const metadata = this.loadServiceMetadata(serviceName);
        const servicePort = metadata?.network?.port || 5001 + portOffset;
        const sidecarPort = 7001 + portOffset;

        // Generate application service
        compose.services[serviceName] = this.generateService(
          serviceName,
          servicePort,
          sidecarPort,
        );

        // Generate sidecar service
        compose.services[`${serviceName}-sidecar`] = this.generateSidecar(
          serviceName,
          servicePort,
          sidecarPort,
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
  private generateRedis(): DockerService {
    return {
      image: "redis:6-alpine",
      container_name: "spas-redis",
      ports: ["6379:6379"],
      networks: ["spas-network"],
    };
  }

  /**
   * Generate Zipkin service definition
   */
  private generateZipkin(): DockerService {
    return {
      image: "openzipkin/zipkin:latest",
      container_name: "spas-zipkin",
      ports: ["9411:9411"],
      networks: ["spas-network"],
    };
  }

  /**
   * Generate application service definition
   */
  private generateService(
    serviceName: string,
    servicePort: number,
    sidecarPort: number,
  ): DockerService {
    return {
      build: `./${serviceName}`,
      container_name: `spas-${serviceName}`,
      ports: [`${servicePort}:${servicePort}`],
      environment: [
        `SERVICE_NAME=${serviceName}`,
        `SIDECAR_PORT=${sidecarPort}`,
        `PORT=${servicePort}`,
        "ZIPKIN_URL=http://zipkin:9411",
      ],
      networks: ["spas-network"],
    };
  }

  /**
   * Generate sidecar service definition
   */
  private generateSidecar(
    serviceName: string,
    servicePort: number,
    sidecarPort: number,
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

    return {
      build: "./spas-sidecar",
      container_name: `${serviceName}-sidecar`,
      environment: [
        `PORT=${sidecarPort}`,
        `CONFIG_PATH=/app/config.json`,
        `SERVICE_NAME=${serviceName}`,
        "ZIPKIN_URL=http://zipkin:9411",
        `SERVICE_PORT=${servicePort}`,
        "REDIS_HOST=redis",
        "REDIS_PORT=6379",
      ],
      volumes,
      depends_on: ["redis", "zipkin"],
      networks: ["spas-network"],
    };
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
