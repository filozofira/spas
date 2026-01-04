/**
 * Integration tests for ChoreographyLoader
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ChoreographyLoader } from "../../../src/services/choreography-loader.js";

describe("ChoreographyLoader", () => {
  let tempDir: string;
  let workspacePath: string;
  const workspaceName = "test-domain";

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "spas-choreography-test-"));
    workspacePath = path.join(tempDir, workspaceName);
    fs.mkdirSync(workspacePath, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("load()", () => {
    it("should load valid choreography.yaml", () => {
      // Arrange
      const validChoreography = `
version: "1.0"
domain: "${workspaceName}"
flows:
  order-fulfillment:
    description: "Order to fulfillment flow"
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: order-created
        topic: orders
        targets:
          - service: fulfillment-service
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        validChoreography,
      );
      const loader = new ChoreographyLoader(workspacePath);

      // Act
      const result = loader.load();

      // Assert
      expect(result.success).toBe(true);
      expect(result.choreography).toBeDefined();
      expect(result.choreography?.domain).toBe(workspaceName);
      expect(result.choreography?.flows["order-fulfillment"]).toBeDefined();
    });

    it("should fail if choreography.yaml does not exist", () => {
      // Arrange
      const loader = new ChoreographyLoader(workspacePath);

      // Act
      const result = loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("FILE_NOT_FOUND");
    });

    it("should fail on invalid YAML syntax", () => {
      // Arrange
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        "invalid: yaml: syntax:",
      );
      const loader = new ChoreographyLoader(workspacePath);

      // Act
      const result = loader.load();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_YAML");
    });
  });

  describe("validate()", () => {
    it("should validate choreography has required fields", () => {
      // Arrange
      const missingFlows = `
version: "1.0"
domain: "test"
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        missingFlows,
      );
      const loader = new ChoreographyLoader(workspacePath);
      const loadResult = loader.load();

      // Act
      const validateResult = loader.validate(loadResult.choreography!);

      // Assert
      expect(validateResult.isValid).toBe(false);
      expect(validateResult.errors).toContain("flows is required");
    });

    it("should validate choreographed flow has at least 2 participants", () => {
      // Arrange - flow with targets requires 2+ participants
      const singleParticipant = `
version: "1.0"
domain: "test-domain"
flows:
  my-flow:
    participants:
      - only-one-service
    events:
      - source: only-one-service
        event: my-event
        topic: events
        targets:
          - service: other-service
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        singleParticipant,
      );
      const loader = new ChoreographyLoader(workspacePath);
      const loadResult = loader.load();

      // Act
      const validateResult = loader.validate(loadResult.choreography!);

      // Assert
      expect(validateResult.isValid).toBe(false);
      expect(
        validateResult.errors.some((e) =>
          e.includes("at least 2 participant"),
        ),
      ).toBe(true);
    });

    it("should allow terminal-only flow with 1 participant", () => {
      // Arrange - flow with only terminal events (empty targets) can have 1 participant
      const terminalOnlyFlow = `
version: "1.0"
domain: "test-domain"
flows:
  basket-management:
    participants:
      - basket-service
    events:
      - source: basket-service
        event: basket-created
        topic: basket-events
        targets: []
      - source: basket-service
        event: item-added
        topic: basket-events
        targets: []
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        terminalOnlyFlow,
      );
      const loader = new ChoreographyLoader(workspacePath);
      const loadResult = loader.load();

      // Act
      const validateResult = loader.validate(loadResult.choreography!);

      // Assert
      expect(validateResult.isValid).toBe(true);
      expect(validateResult.errors).toHaveLength(0);
    });

    it("should pass validation for valid choreography", () => {
      // Arrange
      const validChoreography = `
version: "1.0"
domain: "test-domain"
flows:
  order-fulfillment:
    description: "Order to fulfillment flow"
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: order-created
        topic: orders
        targets:
          - service: fulfillment-service
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        validChoreography,
      );
      const loader = new ChoreographyLoader(workspacePath);
      const loadResult = loader.load();

      // Act
      const validateResult = loader.validate(loadResult.choreography!);

      // Assert
      expect(validateResult.isValid).toBe(true);
      expect(validateResult.errors).toHaveLength(0);
    });

    it("should allow a command-only flow (no events yet)", () => {
      // Arrange
      const commandsOnly = `
version: "1.0"
domain: "test-domain"
flows:
  my-flow:
    participants:
      - order-service
      - inventory-service
    commands:
      - service: order-service
        command: create-order
        endpoint: /orders
`;
      fs.writeFileSync(
        path.join(workspacePath, "choreography.yaml"),
        commandsOnly,
      );
      const loader = new ChoreographyLoader(workspacePath);
      const loadResult = loader.load();

      // Act
      const validateResult = loader.validate(loadResult.choreography!);

      // Assert
      expect(validateResult.isValid).toBe(true);
      expect(validateResult.errors).toHaveLength(0);
    });
  });
});
