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
  // Placeholder tests for future phases
  // ==========================================================================

  // T009-T011: generate() tests (Phase 3: User Story 1)
  // T017: dry-run tests (Phase 4: User Story 2)
  // T021-T022: missing transform tests (Phase 5: User Story 3)
  // T026-T027: optional transform tests (Phase 6: User Story 4)
});
