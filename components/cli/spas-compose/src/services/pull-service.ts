/**
 * PullService - Downloads and saves service metadata from SPAS Repository
 */

import * as fs from "fs";
import * as path from "path";
import type {
  CommandResult,
  RepositoryServiceResponse,
  PulledService,
  ServiceMetadata,
} from "../types.js";

/**
 * Result with pull-specific data
 */
export interface PullServiceResult extends CommandResult {
  data?: {
    service: {
      name: string;
      version: string;
      boundedContext: string;
    };
    path: string;
    artifacts: {
      metadata: string;
      schemas: string[];
    };
    bytes: number;
  };
}

/**
 * Service for pulling and managing service metadata in domain workspace
 */
export class PullService {
  private readonly servicesPath: string;

  constructor(private readonly workspacePath: string) {
    this.servicesPath = path.join(workspacePath, "services");
  }

  /**
   * Save downloaded service metadata to the workspace
   *
   * Preserves archive structure:
   * - services/<service-name>/spas.json
   * - services/<service-name>/schemas/endpoints/*.schema.json
   * - services/<service-name>/schemas/events/*.schema.json
   */
  async saveService(
    response: RepositoryServiceResponse,
  ): Promise<PullServiceResult> {
    // Validate workspace structure
    const validationError = this.validateWorkspace();
    if (validationError) {
      return validationError;
    }

    const { metadata, schemas } = response;
    const serviceName = metadata.id;
    const servicePath = path.join(this.servicesPath, serviceName);

    try {
      // Create service directory (overwrites if exists)
      if (fs.existsSync(servicePath)) {
        fs.rmSync(servicePath, { recursive: true, force: true });
      }
      fs.mkdirSync(servicePath, { recursive: true });

      // Write spas.json
      const metadataPath = path.join(servicePath, "spas.json");
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        "utf-8",
      );

      // Write schema files preserving archive structure
      const schemaNames: string[] = [];
      let totalBytes = Buffer.byteLength(JSON.stringify(metadata));

      for (const schema of schemas) {
        // Use path if available, otherwise fall back to name in schemas/
        const relativePath = schema.path || `schemas/${schema.name}`;
        const schemaFilePath = path.join(servicePath, relativePath);

        // Create subdirectories if needed (e.g., schemas/events/, schemas/endpoints/)
        const schemaDir = path.dirname(schemaFilePath);
        if (!fs.existsSync(schemaDir)) {
          fs.mkdirSync(schemaDir, { recursive: true });
        }

        const content =
          typeof schema.content === "string"
            ? schema.content
            : JSON.stringify(schema.content, null, 2);
        fs.writeFileSync(schemaFilePath, content, "utf-8");
        schemaNames.push(relativePath);
        totalBytes += Buffer.byteLength(content);
      }

      return {
        success: true,
        message: `Downloaded ${serviceName}:${metadata.version}`,
        data: {
          service: {
            name: serviceName,
            version: metadata.version,
            boundedContext: metadata.boundedContext,
          },
          path: `services/${serviceName}`,
          artifacts: {
            metadata: "spas.json",
            schemas: schemaNames,
          },
          bytes: totalBytes,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save service ${serviceName}`,
        error: {
          code: "FILESYSTEM_ERROR",
          details: (error as Error).message,
        },
      };
    }
  }

  /**
   * List all pulled services in the workspace
   */
  listPulledServices(): Array<{
    name: string;
    version: string;
    pulledAt?: Date;
  }> {
    if (!fs.existsSync(this.servicesPath)) {
      return [];
    }

    const services: Array<{ name: string; version: string; pulledAt?: Date }> =
      [];
    const entries = fs.readdirSync(this.servicesPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(
          this.servicesPath,
          entry.name,
          "spas.json",
        );
        if (fs.existsSync(metadataPath)) {
          try {
            const metadata = JSON.parse(
              fs.readFileSync(metadataPath, "utf-8"),
            ) as ServiceMetadata;
            const stats = fs.statSync(metadataPath);
            services.push({
              name: metadata.id,
              version: metadata.version,
              pulledAt: stats.mtime,
            });
          } catch {
            // Skip invalid service directories
          }
        }
      }
    }

    return services;
  }

  /**
   * Get pulled service by name
   */
  getService(serviceName: string): PulledService | undefined {
    const servicePath = path.join(this.servicesPath, serviceName);
    const metadataPath = path.join(servicePath, "spas.json");

    if (!fs.existsSync(metadataPath)) {
      return undefined;
    }

    try {
      const metadata = JSON.parse(
        fs.readFileSync(metadataPath, "utf-8"),
      ) as ServiceMetadata;
      const stats = fs.statSync(metadataPath);

      // Load schemas
      const schemasPath = path.join(servicePath, "schemas");
      const schemas: Array<{ name: string; content: Record<string, any> }> = [];

      if (fs.existsSync(schemasPath)) {
        const schemaFiles = fs.readdirSync(schemasPath);
        for (const file of schemaFiles) {
          if (file.endsWith(".json")) {
            const content = JSON.parse(
              fs.readFileSync(path.join(schemasPath, file), "utf-8"),
            );
            schemas.push({ name: file, content });
          }
        }
      }

      return {
        name: serviceName,
        version: metadata.version,
        metadata,
        schemas,
        pulledAt: stats.mtime,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Validate workspace structure for pull operations
   */
  private validateWorkspace(): PullServiceResult | null {
    if (!fs.existsSync(this.workspacePath)) {
      return {
        success: false,
        message: "Workspace does not exist",
        error: {
          code: "INVALID_WORKSPACE",
          details: `Workspace path not found: ${this.workspacePath}`,
        },
      };
    }

    if (!fs.existsSync(this.servicesPath)) {
      return {
        success: false,
        message: "Not a valid domain workspace",
        error: {
          code: "INVALID_WORKSPACE",
          details:
            'services/ directory not found. Run "spas-compose init" first.',
        },
      };
    }

    return null;
  }
}
