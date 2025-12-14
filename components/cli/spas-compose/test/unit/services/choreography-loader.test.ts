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
        event: OrderCreated
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

    it("should validate flow has at least 2 participants", () => {
      // Arrange
      const singleParticipant = `
version: "1.0"
domain: "test-domain"
flows:
  my-flow:
    participants:
      - only-one-service
    events:
      - source: only-one-service
        event: MyEvent
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
          e.includes("at least 2 participants"),
        ),
      ).toBe(true);
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
        event: OrderCreated
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
  });
});
