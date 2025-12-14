/**
 * Integration tests for PullService
 *
 * Tests service pulling functionality with real filesystem operations.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { PullService } from "../../../src/services/pull-service.js";
import { WorkspaceService } from "../../../src/services/workspace-service.js";
import type { RepositoryServiceResponse } from "../../../src/types.js";

// Mock RepositoryClient responses with archive structure
const mockServiceResponse: RepositoryServiceResponse = {
  metadata: {
    id: "order-service",
    version: "1.0.0",
    boundedContext: "orders",
    events: {
      published: [
        {
          name: "OrderCreated",
          schema: "schemas/events/OrderCreated.schema.json",
        },
        {
          name: "OrderUpdated",
          schema: "schemas/events/OrderUpdated.schema.json",
        },
      ],
      subscribed: [
        {
          name: "PaymentReceived",
          schema: "schemas/events/PaymentReceived.schema.json",
        },
      ],
    },
    network: {
      port: 8080,
      protocol: "grpc",
    },
  },
  schemas: [
    {
      path: "schemas/events/OrderCreated.schema.json",
      name: "OrderCreated.schema.json",
      content: '{"type":"object","properties":{"orderId":{"type":"string"}}}',
    },
    {
      path: "schemas/events/OrderUpdated.schema.json",
      name: "OrderUpdated.schema.json",
      content:
        '{"type":"object","properties":{"orderId":{"type":"string"},"status":{"type":"string"}}}',
    },
    {
      path: "schemas/events/PaymentReceived.schema.json",
      name: "PaymentReceived.schema.json",
      content: '{"type":"object","properties":{"paymentId":{"type":"string"}}}',
    },
  ],
};

describe("PullService", () => {
  let tempDir: string;
  let workspacePath: string;
  const workspaceName = "test-domain";

  beforeEach(async () => {
    // Create temp directory and initialize workspace
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "spas-compose-pull-test-"));
    workspacePath = path.join(tempDir, workspaceName);

    // Create valid workspace structure
    const workspaceService = new WorkspaceService();
    await workspaceService.create(workspacePath, workspaceName);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("pull()", () => {
    it("should save service metadata to spas.json", async () => {
      // Arrange
      const pullService = new PullService(workspacePath);

      // Act
      const result = await pullService.saveService(mockServiceResponse);

      // Assert
      expect(result.success).toBe(true);
      const metadataPath = path.join(
        workspacePath,
        "services",
        "order-service",
        "spas.json",
      );
      expect(fs.existsSync(metadataPath)).toBe(true);

      const savedMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      expect(savedMetadata.id).toBe("order-service");
      expect(savedMetadata.version).toBe("1.0.0");
    });

    it("should save schemas preserving archive subdirectory structure", async () => {
      // Arrange
      const pullService = new PullService(workspacePath);

      // Act
      const result = await pullService.saveService(mockServiceResponse);

      // Assert
      expect(result.success).toBe(true);

      // Check events subdirectory exists
      const eventsDir = path.join(
        workspacePath,
        "services",
        "order-service",
        "schemas",
        "events",
      );
      expect(fs.existsSync(eventsDir)).toBe(true);

      // Check schema files are in the correct subdirectory
      const eventSchemas = fs.readdirSync(eventsDir);
      expect(eventSchemas).toContain("OrderCreated.schema.json");
      expect(eventSchemas).toContain("OrderUpdated.schema.json");
      expect(eventSchemas).toContain("PaymentReceived.schema.json");
    });

    it("should return correct artifact list with paths", async () => {
      // Arrange
      const pullService = new PullService(workspacePath);

      // Act
      const result = await pullService.saveService(mockServiceResponse);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.service.name).toBe("order-service");
      expect(result.data?.service.version).toBe("1.0.0");
      expect(result.data?.artifacts.metadata).toBe("spas.json");
      expect(result.data?.artifacts.schemas).toContain(
        "schemas/events/OrderCreated.schema.json",
      );
    });

    it("should overwrite existing service if pulling again", async () => {
      // Arrange
      const pullService = new PullService(workspacePath);

      // First pull
      await pullService.saveService(mockServiceResponse);

      // Modify the version for second pull
      const updatedResponse = {
        ...mockServiceResponse,
        metadata: { ...mockServiceResponse.metadata, version: "1.1.0" },
      };

      // Act
      const result = await pullService.saveService(updatedResponse);

      // Assert
      expect(result.success).toBe(true);
      const metadataPath = path.join(
        workspacePath,
        "services",
        "order-service",
        "spas.json",
      );
      const savedMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      expect(savedMetadata.version).toBe("1.1.0");
    });
  });

  describe("listPulledServices()", () => {
    it("should return empty array if no services pulled", () => {
      // Arrange
      const pullService = new PullService(workspacePath);

      // Act
      const services = pullService.listPulledServices();

      // Assert
      expect(services).toEqual([]);
    });

    it("should return list of pulled services", async () => {
      // Arrange
      const pullService = new PullService(workspacePath);
      await pullService.saveService(mockServiceResponse);

      // Act
      const services = pullService.listPulledServices();

      // Assert
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe("order-service");
      expect(services[0].version).toBe("1.0.0");
    });
  });

  describe("workspace validation", () => {
    it("should fail if workspace path does not exist", async () => {
      // Arrange
      const invalidPath = path.join(tempDir, "non-existent");
      const pullService = new PullService(invalidPath);

      // Act
      const result = await pullService.saveService(mockServiceResponse);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_WORKSPACE");
    });

    it("should fail if services directory does not exist", async () => {
      // Arrange
      // Delete services directory
      fs.rmSync(path.join(workspacePath, "services"), { recursive: true });
      const pullService = new PullService(workspacePath);

      // Act
      const result = await pullService.saveService(mockServiceResponse);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_WORKSPACE");
    });
  });
});
