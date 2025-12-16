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

      // Assert - T021: Keep full path with service folder
      expect(entries[0].transform).toBe(
        "transformations/fulfillment-service/inbound-order-created.jsonata",
      );
    });

    // T026: Test inbound entry omits transform when not specified in choreography
    it("should omit transform property when not specified in choreography", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const choreographyWithoutTransform: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b"],
            events: [
              {
                source: "service-a",
                event: "event",
                topic: "topic",
                targets: [{ service: "service-b" }], // No transform field
              },
            ],
          },
        },
      };

      // Act
      const entries = generator.buildInboundEntries(
        choreographyWithoutTransform,
        "service-b",
      );

      // Assert
      expect(entries).toHaveLength(1);
      expect(entries[0]).not.toHaveProperty("transform");
      expect(entries[0].kind).toBe("event");
      expect(entries[0].topic).toBe("topic");
      expect(entries[0].invokeEndpoint).toBe("/incoming");
    });
  });

  // T027: Test outbound entry omits transform when not specified in choreography
  describe("buildOutboundEntries() - optional transforms", () => {
    it("should omit transform property for outbound entries (current behavior)", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act - Current implementation doesn't support outbound transforms yet
      const entries = generator.buildOutboundEntries(
        sampleChoreography,
        "order-service",
      );

      // Assert - outbound entries currently don't include transform
      expect(entries).toHaveLength(1);
      expect(entries[0]).not.toHaveProperty("transform");
      expect(entries[0].topic).toBe("orders-requested");
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

    // T017: Test dry-run mode includes config summary in result
    it("should include summary suitable for dry-run output", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - Summary has all info needed for dry-run display
      expect(result.summary).toBeDefined();
      expect(result.summary.totalConfigs).toBeGreaterThan(0);
      expect(result.summary.services).toBeInstanceOf(Array);

      // Each service summary has name, inboundCount, outboundCount
      for (const serviceSummary of result.summary.services) {
        expect(serviceSummary).toHaveProperty("name");
        expect(serviceSummary).toHaveProperty("inboundCount");
        expect(serviceSummary).toHaveProperty("outboundCount");
      }
    });
  });

  // ==========================================================================
  // T021-T022: Tests for validateTransformationPaths() (Phase 5: User Story 3)
  // ==========================================================================

  describe("validateTransformationPaths()", () => {
    // T021: Test error returned for missing transformation file
    it("should return error for missing transformation file", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const choreographyWithMissingTransform: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b"],
            events: [
              {
                source: "service-a",
                event: "event",
                topic: "topic",
                targets: [
                  {
                    service: "service-b",
                    transform: "transformations/nonexistent.jsonata",
                  },
                ],
              },
            ],
          },
        },
      };

      // Act
      const errors = generator.validateTransformationPaths(choreographyWithMissingTransform);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe("MISSING_TRANSFORM");
      expect(errors[0].service).toBe("service-b");
      expect(errors[0].message).toContain("nonexistent.jsonata");
    });

    // T022: Test all missing files reported (not just first)
    it("should report all missing files, not just the first", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const choreographyWithMultipleMissing: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b", "service-c"],
            events: [
              {
                source: "service-a",
                event: "event",
                topic: "topic",
                targets: [
                  {
                    service: "service-b",
                    transform: "transformations/missing1.jsonata",
                  },
                  {
                    service: "service-c",
                    transform: "transformations/missing2.jsonata",
                  },
                ],
              },
            ],
          },
        },
      };

      // Act
      const errors = generator.validateTransformationPaths(choreographyWithMultipleMissing);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors.map((e) => e.message)).toContain(
        "Missing transformation file: transformations/missing1.jsonata",
      );
      expect(errors.map((e) => e.message)).toContain(
        "Missing transformation file: transformations/missing2.jsonata",
      );
    });

    it("should return empty array when all transformation files exist", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act - sampleChoreography has valid transform path created in beforeEach
      const errors = generator.validateTransformationPaths(sampleChoreography);

      // Assert
      expect(errors).toEqual([]);
    });

    it("should skip validation for targets without transform", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const choreographyWithoutTransform: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b"],
            events: [
              {
                source: "service-a",
                event: "event",
                topic: "topic",
                targets: [{ service: "service-b" }], // No transform
              },
            ],
          },
        },
      };

      // Act
      const errors = generator.validateTransformationPaths(choreographyWithoutTransform);

      // Assert
      expect(errors).toEqual([]);
    });
  });

  // ==========================================================================
  // T031: Edge case tests
  // ==========================================================================

  describe("edge cases", () => {
    it("should handle empty choreography with no flows", () => {
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
      expect(Object.keys(result.configs)).toHaveLength(0);
      expect(result.summary.totalConfigs).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should deduplicate topic entries across multiple flows", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const duplicateTopicsChoreography: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["publisher", "subscriber-a"],
            events: [
              {
                source: "publisher",
                event: "event-1",
                topic: "shared-topic",
                targets: [{ service: "subscriber-a" }],
              },
            ],
          },
          "flow-2": {
            participants: ["publisher", "subscriber-a"],
            events: [
              {
                source: "publisher",
                event: "event-2",
                topic: "shared-topic", // Same topic in different flow
                targets: [{ service: "subscriber-a" }],
              },
            ],
          },
        },
      };

      // Act
      const result = generator.generate(duplicateTopicsChoreography);

      // Assert - should deduplicate
      expect(result.configs["publisher"].outbound).toHaveLength(1);
      expect(result.configs["subscriber-a"].inbound).toHaveLength(1);
    });

    it("should handle service that only publishes", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - order-service only publishes
      expect(result.configs["order-service"].outbound).toHaveLength(1);
      expect(result.configs["order-service"].inbound).toHaveLength(0);
    });

    it("should handle service that only subscribes", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - fulfillment-service only subscribes
      expect(result.configs["fulfillment-service"].inbound).toHaveLength(1);
      expect(result.configs["fulfillment-service"].outbound).toHaveLength(0);
    });

    it("should handle flow with participants but no events", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const noEventsChoreography: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "flow-1": {
            participants: ["service-a", "service-b"],
            events: [],
          },
        },
      };

      // Act
      const result = generator.generate(noEventsChoreography);

      // Assert - configs exist but are empty
      expect(result.configs["service-a"]).toBeDefined();
      expect(result.configs["service-a"].inbound).toEqual([]);
      expect(result.configs["service-a"].outbound).toEqual([]);
    });
  });

  // ==========================================================================
  // T016, T017: CloudEvents eventType and transform path tests (Spec 009)
  // ==========================================================================

  describe("eventType generation (T016)", () => {
    it("should include eventType in outbound entries with full CloudEvents format", () => {
      // Arrange
      const servicesDir = path.join(workspacePath, "services", "order-service");
      fs.mkdirSync(servicesDir, { recursive: true });
      fs.writeFileSync(
        path.join(servicesDir, "spas.json"),
        JSON.stringify({
          id: "order-service",
          version: "1.0.0",
          boundedContext: "order",
        }),
      );
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - kebab-case format matches SDK: com.{context}.{event-kebab}
      expect(result.configs["order-service"].outbound[0].eventType).toBe(
        "com.order.order-created",
      );
    });

    it("should derive eventType from boundedContext and event name", () => {
      // Arrange
      const servicesDir = path.join(workspacePath, "services", "order-service");
      fs.mkdirSync(servicesDir, { recursive: true });
      fs.writeFileSync(
        path.join(servicesDir, "spas.json"),
        JSON.stringify({
          id: "order-service",
          version: "1.0.0",
          boundedContext: "e-commerce",
        }),
      );
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - hyphenated context preserved, event name kebab-case
      expect(result.configs["order-service"].outbound[0].eventType).toBe(
        "com.e-commerce.order-created",
      );
    });

    it("should leave eventType undefined if service metadata not found", () => {
      // Arrange - no spas.json for order-service
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert
      expect(
        result.configs["order-service"].outbound[0].eventType,
      ).toBeUndefined();
    });

    // T023: Test eventName field in generated outbound entries
    it("should include eventName in outbound entries with short kebab-case format", () => {
      // Arrange
      const servicesDir = path.join(workspacePath, "services", "order-service");
      fs.mkdirSync(servicesDir, { recursive: true });
      fs.writeFileSync(
        path.join(servicesDir, "spas.json"),
        JSON.stringify({
          id: "order-service",
          version: "1.0.0",
          boundedContext: "order",
        }),
      );
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - eventName is short kebab-case, eventType is full CloudEvents format
      expect(result.configs["order-service"].outbound[0].eventName).toBe(
        "order-created",
      );
      expect(result.configs["order-service"].outbound[0].eventType).toBe(
        "com.order.order-created",
      );
    });

    it("should convert PascalCase event to kebab-case eventName", () => {
      // Arrange
      const servicesDir = path.join(workspacePath, "services", "order-service");
      fs.mkdirSync(servicesDir, { recursive: true });
      fs.writeFileSync(
        path.join(servicesDir, "spas.json"),
        JSON.stringify({
          id: "order-service",
          version: "1.0.0",
          boundedContext: "order",
        }),
      );
      const choreographyWithPascal: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          "test-flow": {
            participants: ["order-service"],
            events: [
              {
                source: "order-service",
                event: "OrderCreated",
                topic: "orders-created",
                targets: [],
              },
            ],
          },
        },
      };
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(choreographyWithPascal);

      // Assert - PascalCase converted to kebab-case
      expect(result.configs["order-service"].outbound[0].eventName).toBe(
        "order-created",
      );
    });

    it("should leave eventName undefined if service metadata not found", () => {
      // Arrange - no spas.json for order-service
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - no metadata means no eventName
      expect(
        result.configs["order-service"].outbound[0].eventName,
      ).toBeUndefined();
    });
  });

  describe("transform path resolution (T017)", () => {
    it("should keep full path with service folder for sidecar mount", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);

      // Act
      const result = generator.generate(sampleChoreography);

      // Assert - should keep full path: transformations/fulfillment-service/inbound-order-created.jsonata
      expect(result.configs["fulfillment-service"].inbound[0].transform).toBe(
        "transformations/fulfillment-service/inbound-order-created.jsonata",
      );
    });

    it("should preserve absolute transform path from choreography", () => {
      // Arrange
      const generator = new SidecarConfigGenerator(workspacePath);
      const choreographyWithPath: Choreography = {
        version: "1.0",
        domain: "test",
        flows: {
          flow1: {
            participants: ["svc-a", "svc-b"],
            events: [
              {
                source: "svc-a",
                event: "TestEvent",
                topic: "test-topic",
                targets: [
                  {
                    service: "svc-b",
                    transform: "transformations/svc-b/custom-transform.jsonata",
                  },
                ],
              },
            ],
          },
        },
      };

      // Act
      const result = generator.generate(choreographyWithPath);

      // Assert - path should be preserved exactly
      expect(result.configs["svc-b"].inbound[0].transform).toBe(
        "transformations/svc-b/custom-transform.jsonata",
      );
    });
  });
});
