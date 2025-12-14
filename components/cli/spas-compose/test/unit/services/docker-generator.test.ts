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
            event: "OrderCreated",
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
});
