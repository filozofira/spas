/**
 * Unit tests for SidecarConfigGenerator
 *
 * @see specs/006-sidecar-config-generator/spec.md
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SidecarConfigGenerator } from "../../../src/services/sidecar-config-generator.js";
import type { Choreography } from "../../../src/types.js";

describe("SidecarConfigGenerator", () => {
  let tempDir: string;
  let workspacePath: string;

  /**
   * Sample choreography for testing
   * - order-service publishes to orders-requested topic
   * - fulfillment-service subscribes to orders-requested topic
   */
  const sampleChoreography: Choreography = {
    version: "1.0",
    domain: "e-commerce",
    flows: {
      "order-to-fulfillment": {
        description: "Order placed triggers fulfillment",
        participants: ["order-service", "fulfillment-service"],
        events: [
          {
            source: "order-service",
            event: "order-created",
            topic: "orders-requested",
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
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "spas-sidecar-config-test-"),
    );
    workspacePath = path.join(tempDir, "test-domain");
    fs.mkdirSync(workspacePath, { recursive: true });

    // Create transformations directory
    const transformDir = path.join(
      workspacePath,
      "transformations",
      "fulfillment-service",
    );
    fs.mkdirSync(transformDir, { recursive: true });
    fs.writeFileSync(
      path.join(transformDir, "inbound-order-created.jsonata"),
      '{ "orderId": $.id }',
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // T007: Tests for getAllParticipants()
  // ==========================================================================

  describe("getAllParticipants()", () => {
    it("should extract unique service names from all flows", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const participants = generator.getAllParticipants(sampleChoreography);

      // Assert
      expect(participants).toContain("order-service");
      expect(participants).toContain("fulfillment-service");
      expect(participants).toHaveLength(2);
    });

    it("should return sorted service names", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const participants = generator.getAllParticipants(sampleChoreography);

      // Assert
      expect(participants).toEqual(["fulfillment-service", "order-service"]);
    });

    it("should handle multiple flows with overlapping participants", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const multiFlowChoreography: Choreography = {
        version: "1.0",
        domain: "e-commerce",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b"],
            events: [],
          },
          "flow-2": {
            participants: ["service-b", "service-c"],
            events: [],
          },
        },
      };

      // Act
      const participants = generator.getAllParticipants(multiFlowChoreography);

      // Assert
      expect(participants).toEqual(["service-a", "service-b", "service-c"]);
    });

    it("should return empty array for choreography with no flows", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const emptyChoreography: Choreography = {
        version: "1.0",
        domain: "empty",
        flows: {},
      };

      // Act
      const participants = generator.getAllParticipants(emptyChoreography);

      // Assert
      expect(participants).toEqual([]);
    });
  });

  // ==========================================================================
  // T008: Tests for buildOutboundEntries() and buildInboundEntries()
  // ==========================================================================

  describe("buildOutboundEntries()", () => {
    it("should return outbound entry for publishing service", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const entries = generator.buildOutboundEntries(
        sampleChoreography,
        "order-service",
      );

      // Assert
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({ topic: "orders-requested" });
    });

    it("should return empty array for subscribing service", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const entries = generator.buildOutboundEntries(
        sampleChoreography,
        "fulfillment-service",
      );

      // Assert
      expect(entries).toEqual([]);
    });

    it("should deduplicate topics across flows", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const duplicateTopicChoreography: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["publisher"],
            events: [
              {
                source: "publisher",
                event: "event-1",
                topic: "same-topic",
                targets: [],
              },
            ],
          },
          "flow-2": {
            participants: ["publisher"],
            events: [
              {
                source: "publisher",
                event: "event-2",
                topic: "same-topic",
                targets: [],
              },
            ],
          },
        },
      };

      // Act
      const entries = generator.buildOutboundEntries(
        duplicateTopicChoreography,
        "publisher",
      );

      // Assert
      expect(entries).toHaveLength(1);
      expect(entries[0].topic).toBe("same-topic");
    });
  });

  describe("buildInboundEntries()", () => {
    it("should return inbound entry for subscribing service", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const entries = generator.buildInboundEntries(
        sampleChoreography,
        "fulfillment-service",
      );

      // Assert
      expect(entries).toHaveLength(1);
      expect(entries[0].kind).toBe("event");
      expect(entries[0].topic).toBe("orders-requested");
      expect(entries[0].invokeEndpoint).toBe("/incoming");
    });

    it("should return empty array for publishing service", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const entries = generator.buildInboundEntries(
        sampleChoreography,
        "order-service",
      );

      // Assert
      expect(entries).toEqual([]);
    });

    it("should include transform when specified in target", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const entries = generator.buildInboundEntries(
        sampleChoreography,
        "fulfillment-service",
      );

      // Assert
      expect(entries[0].transform).toBe(
        "transformations/inbound-order-created.jsonata",
      );
    });
  });

  // ==========================================================================
  // T009-T011: Tests for generate() (Phase 3: User Story 1)
  // ==========================================================================

  describe("generate()", () => {
    // T009: Test generate() returns correct SidecarConfig structure per service
    it("should return correct SidecarConfig structure for each service", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.configs).toHaveProperty("order-service");
      expect(result.configs).toHaveProperty("fulfillment-service");

      // order-service: publishes, doesn't subscribe
      expect(result.configs["order-service"].outbound).toHaveLength(1);
      expect(result.configs["order-service"].inbound).toHaveLength(0);

      // fulfillment-service: subscribes, doesn't publish
      expect(result.configs["fulfillment-service"].inbound).toHaveLength(1);
      expect(result.configs["fulfillment-service"].outbound).toHaveLength(0);
    });

    it("should return ConfigGeneratorResult with summary", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(result.summary).toBeDefined();
      expect(result.summary.totalConfigs).toBe(2);
      expect(result.summary.services).toHaveLength(2);
    });

    // T010: Test config aggregation from multiple flows
    it("should aggregate entries from multiple flows where service participates", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const multiFlowChoreography: Choreography = {
        version: "1.0",
        domain: "e-commerce",
        flows: {
          "flow-1": {
            participants: ["order-service", "fulfillment-service"],
            events: [
              {
                source: "order-service",
                event: "order-created",
                topic: "orders-requested",
                targets: [{ service: "fulfillment-service" }],
              },
            ],
          },
          "flow-2": {
            participants: ["order-service", "payment-service"],
            events: [
              {
                source: "order-service",
                event: "order-created",
                topic: "payments-requested",
                targets: [{ service: "payment-service" }],
              },
            ],
          },
        },
      };

      // Act
      const result = generator.generate(multiFlowChoreography);

      // Assert
      // order-service publishes to both topics
      expect(result.configs["order-service"].outbound).toHaveLength(2);
      expect(result.configs["order-service"].outbound.map((e) => e.topic)).toContain("orders-requested");
      expect(result.configs["order-service"].outbound.map((e) => e.topic)).toContain("payments-requested");
    });

    // T011: Test empty inbound/outbound arrays for services with no entries
    it("should generate empty arrays for services with no event participation", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const participantOnlyChoreography: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b", "observer-service"],
            events: [
              {
                source: "service-a",
                event: "event",
                topic: "topic",
                targets: [{ service: "service-b" }],
              },
            ],
          },
        },
      };

      // Act
      const result = generator.generate(participantOnlyChoreography);

      // Assert
      // observer-service is a participant but not in any event routes
      expect(result.configs["observer-service"]).toBeDefined();
      expect(result.configs["observer-service"].inbound).toEqual([]);
      expect(result.configs["observer-service"].outbound).toEqual([]);
    });

    it("should return empty configs for choreography with no flows", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const emptyChoreography: Choreography = {
        version: "1.0",
        domain: "empty",
        flows: {},
      };

      // Act
      const result = generator.generate(emptyChoreography);

      // Assert
      expect(result.success).toBe(true);
      expect(result.configs).toEqual({});
      expect(result.summary.totalConfigs).toBe(0);
    });
  });

  // ==========================================================================
  // T013: Tests for buildSummary()
  // ==========================================================================

  describe("buildSummary()", () => {
    it("should create correct summary with service entry counts", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      const orderSummary = result.summary.services.find((s) => s.name === "order-service");
      const fulfillmentSummary = result.summary.services.find((s) => s.name === "fulfillment-service");

      expect(orderSummary).toEqual({
        name: "order-service",
        inboundCount: 0,
        outboundCount: 1,
      });
      expect(fulfillmentSummary).toEqual({
        name: "fulfillment-service",
        inboundCount: 1,
        outboundCount: 0,
      });
    });
  });
});
