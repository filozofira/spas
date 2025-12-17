/**
 * Unit tests for template generation functions
 */

import { describe, it, expect } from "@jest/globals";
import { generateAgentFile } from "../../../src/utils/templates.js";

describe("generateAgentFile", () => {
  describe("self-contained agent prompt (US1)", () => {
    it("should not contain external SPAS repo path references", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-007: No references to principles/, specs/, components/
      expect(content).not.toMatch(/principles\//);
      expect(content).not.toMatch(/specs\//);
      expect(content).not.toMatch(/components\//);
    });

    it("should contain CloudEvents type format documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-001: CloudEvents type format
      expect(content).toContain("com.{bounded-context}.{event-name-kebab}");
      expect(content).toContain("CloudEvents Type Format");
    });

    it("should contain complete sidecar config schema documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-002: Sidecar config schema
      expect(content).toContain("Sidecar Configuration Schema");
      expect(content).toContain("serviceId");
      expect(content).toContain("serviceName");
      expect(content).toContain("sidecarPort");
      expect(content).toContain("choreographyPath");
      expect(content).toContain("proxies");
    });

    it("should contain JSONata transformation patterns", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-003: JSONata patterns
      expect(content).toContain("JSONata Transformation Patterns");
      expect(content).toContain("$append([], ...)");
      expect(content).toContain("❌ WRONG");
      expect(content).toContain("✅ CORRECT");
    });

    it("should contain endpoint routing documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-004: Endpoint routing
      expect(content).toContain("Endpoint Routing");
      expect(content).toContain("/proxy/{serviceId}/{path}");
    });

    it("should contain field naming conventions", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-005: Field naming
      expect(content).toContain("Field Naming Conventions");
      expect(content).toContain("camelCase");
    });

    it("should contain all required technical reference sections", () => {
      const content = generateAgentFile("./examples/ecommerce");

      expect(content).toContain("## Technical Reference");
      expect(content).toContain("### CloudEvents Type Format");
      expect(content).toContain("### Sidecar Configuration Schema");
      expect(content).toContain("### JSONata Transformation Patterns");
      expect(content).toContain("### Endpoint Routing");
      expect(content).toContain("### Field Naming Conventions");
    });

    it("should be under 25KB file size limit", () => {
      const content = generateAgentFile("./examples/ecommerce");
      const sizeKB = Buffer.byteLength(content, "utf8") / 1024;

      // SC-005: File size under 25KB
      expect(sizeKB).toBeLessThan(25);
    });

    it("should use domainRoot parameter correctly", () => {
      const content1 = generateAgentFile(".");
      const content2 = generateAgentFile("./examples/ecommerce");

      expect(content1).toContain("**Domain root**: `.`");
      expect(content2).toContain(
        "**Domain root**: `./examples/ecommerce`",
      );

      // Should use domainRoot in paths
      expect(content1).toContain("./{DOMAIN}/services");
      expect(content2).toContain("./examples/ecommerce/{DOMAIN}/services");
    });
  });
});
