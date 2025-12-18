/**
 * Integration tests for DockerGenerator
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DockerGenerator } from "../../../src/services/docker-generator.js";
import { BackboneNormalizer } from "../../../src/services/backbone-normalizer.js";
import type { Choreography } from "../../../src/types.js";

describe("DockerGenerator", () => {
  let tempDir: string;
  let workspacePath: string;

  const sampleChoreography: Choreography = {
    version: "1.0",
    domain: "e-commerce",
    flows: {
      "order-fulfillment": {
        description: "Order to fulfillment flow",
        participants: ["order-service", "fulfillment-service"],
        events: [
          {
            source: "order-service",
            event: "order-created",
            topic: "orders",
            targets: [
              {
                service: "fulfillment-service",
                transform:
                  "transformations/fulfillment-service/inbound-order-created.jsonata",
              },
            ],
          },
        ],
      },
    },
    infrastructure: {
      redis: { enabled: true },
      zipkin: { enabled: true },
    },
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "spas-docker-test-"));
    workspacePath = path.join(tempDir, "test-domain");
    fs.mkdirSync(workspacePath, { recursive: true });

    // Create services directory with pulled services
    const servicesDir = path.join(workspacePath, "services");
    fs.mkdirSync(path.join(servicesDir, "order-service", "schemas"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(servicesDir, "fulfillment-service", "schemas"), {
      recursive: true,
    });

    // Create minimal service metadata
    fs.writeFileSync(
      path.join(servicesDir, "order-service", "spas.json"),
      JSON.stringify({
        id: "order-service",
        version: "1.0.0",
        network: { port: 5001 },
      }),
    );
    fs.writeFileSync(
      path.join(servicesDir, "fulfillment-service", "spas.json"),
      JSON.stringify({
        id: "fulfillment-service",
        version: "1.0.0",
        network: { port: 5002 },
      }),
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("generate()", () => {
    it("should generate valid docker-compose.yaml", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("services:");
    });

    it("should include Redis when enabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.content).toContain("redis:");
      expect(result.content).toContain("redis:7-alpine");
      expect(result.content).toContain("healthcheck:");
      expect(result.content).toContain("redis-cli");
    });

    it("should include Zipkin when enabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.content).toContain("zipkin:");
      expect(result.content).toContain("openzipkin/zipkin");
    });

    it("should include sidecars for each participating service", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.content).toContain("order-service-sidecar:");
      expect(result.content).toContain("fulfillment-service-sidecar:");
    });

    it("should create network definition", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.content).toContain("networks:");
      expect(result.content).toContain("spas-network:");
    });
  });

  describe("validateServices()", () => {
    it("should pass if all participants have pulled services", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.validateServices(sampleChoreography);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.missingServices).toHaveLength(0);
    });

    it("should fail if participant service not pulled", () => {
      // Arrange
      const choreographyWithMissing: Choreography = {
        ...sampleChoreography,
        flows: {
          "test-flow": {
            participants: ["order-service", "missing-service"],
            events: [],
          },
        },
      };
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.validateServices(choreographyWithMissing);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.missingServices).toContain("missing-service");
    });
  });

  describe("backbone disable (none value)", () => {
    it("should not include Redis when event backbone is disabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);
      const normalizer = new BackboneNormalizer();
      const config = normalizer.buildConfig({ eventBackbone: "none" });

      // Act
      const result = generator.generate(sampleChoreography, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).not.toContain("redis:");
      expect(result.content).toContain("zipkin:");
    });

    it("should not include Zipkin when observability backbone is disabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);
      const normalizer = new BackboneNormalizer();
      const config = normalizer.buildConfig({ observabilityBackbone: "none" });

      // Act
      const result = generator.generate(sampleChoreography, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).not.toContain("zipkin:");
      expect(result.content).toContain("redis:");
    });

    it("should use env var substitution for sidecar when event backbone disabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);
      const normalizer = new BackboneNormalizer();
      const config = normalizer.buildConfig({ eventBackbone: "none" });

      // Act
      const result = generator.generate(sampleChoreography, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("${REDIS_HOST}");
      expect(result.content).toContain("${REDIS_PORT}");
    });

    it("should use env var substitution for sidecar when observability backbone disabled", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);
      const normalizer = new BackboneNormalizer();
      const config = normalizer.buildConfig({ observabilityBackbone: "none" });

      // Act
      const result = generator.generate(sampleChoreography, config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("${ZIPKIN_URL}");
    });
  });

  // ==========================================================================
  // T007, T008: Image reference and port configuration tests (Spec 009)
  // ==========================================================================

  describe("image reference generation (T007)", () => {
    it("should use image: from runtime metadata when available", () => {
      // Arrange
      const servicesDir = path.join(workspacePath, "services");
      fs.writeFileSync(
        path.join(servicesDir, "order-service", "spas.json"),
        JSON.stringify({
          id: "order-service",
          version: "1.0.0",
          boundedContext: "order",
          runtime: {
            repository: "spas-examples/order-service",
            tag: "1.0.0",
          },
        }),
      );
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("image: spas-examples/order-service:1.0.0");
      expect(result.content).not.toContain("build: ./order-service");
    });

    it("should use sidecar image instead of build directive", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("image: spas-sidecar:latest");
      expect(result.content).not.toContain("build: ./spas-sidecar");
    });
  });

  describe("port configuration (T008)", () => {
    it("should use 8080 as internal port for services", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      // Host port varies, but internal should be 8080
      expect(result.content).toMatch(/ports:\s*\n\s*- "\d+:8080"/);
    });

    it("should use SIDECAR_PORT=7000 for sidecars instead of PORT", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("SIDECAR_PORT=7000");
      // Ensure sidecars don't use bare PORT= for the sidecar port (they used to have "PORT=7000")
      // Use negative lookbehind to ensure PORT= is not preceded by SIDECAR_
      expect(result.content).not.toMatch(/(?<!SIDECAR_)PORT=7000/);
    });

    it("should include SERVICE_NAME and SIDECAR_PORT in service environment", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.content).toContain("SERVICE_NAME=order-service");
      expect(result.content).toContain("SIDECAR_PORT=7000");
    });

    it("should use fixed port 7000 for all sidecars", () => {
      // Arrange
      const generator = new DockerGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      // All sidecars should use 7000, not incrementing ports
      const sidecarPortMatches = result.content!.match(/SIDECAR_PORT=(\d+)/g);
      expect(sidecarPortMatches).toBeDefined();
      for (const match of sidecarPortMatches!) {
        expect(match).toBe("SIDECAR_PORT=7000");
      }
    });
  });
});
