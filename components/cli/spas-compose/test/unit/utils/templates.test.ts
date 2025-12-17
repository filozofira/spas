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

  describe("phased workflow with validation (US2)", () => {
    it("should contain 5 explicit phases", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-008: 5 phases present
      expect(content).toContain("### Phase 1: Analyze");
      expect(content).toContain("### Phase 2: Propose");
      expect(content).toContain("### Phase 3: Generate");
      expect(content).toContain("### Phase 4: Validate");
      expect(content).toContain("### Phase 5: Build");
    });

    it("should have entry/exit criteria for each phase", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-008: Entry/exit criteria
      expect(content).toContain("**Entry Criteria:**");
      expect(content).toContain("**Exit Criteria:**");
      
      // Count should be at least 5 pairs (one per phase)
      const entryCriteriaCount = (content.match(/\*\*Entry Criteria:\*\*/g) || []).length;
      const exitCriteriaCount = (content.match(/\*\*Exit Criteria:\*\*/g) || []).length;
      
      expect(entryCriteriaCount).toBeGreaterThanOrEqual(5);
      expect(exitCriteriaCount).toBeGreaterThanOrEqual(5);
    });

    it("should contain Mermaid sequence diagram template in Phase 2", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-009: Mermaid diagram in Propose phase
      expect(content).toContain("**Mermaid Diagram Template:**");
      expect(content).toContain("```mermaid");
      expect(content).toContain("sequenceDiagram");
      expect(content).toContain("participant");
      
      // Verify it's in Phase 2 section
      const phase2Start = content.indexOf("### Phase 2: Propose");
      const phase3Start = content.indexOf("### Phase 3: Generate");
      const mermaidPos = content.indexOf("```mermaid");
      
      expect(phase2Start).toBeGreaterThan(0);
      expect(phase3Start).toBeGreaterThan(phase2Start);
      expect(mermaidPos).toBeGreaterThan(phase2Start);
      expect(mermaidPos).toBeLessThan(phase3Start);
    });

    it("should contain confirmation prompt between Propose and Generate", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-010: Confirmation prompt
      expect(content).toContain("Do you want me to proceed with generating the choreographies?");
      expect(content).toContain("**Confirmation Prompt:**");
      expect(content).toContain("(yes/no/feedback)");
    });

    it("should contain validation checklists for Phase 3 and Phase 4", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-011: Validation checklists
      expect(content).toContain("**Validation Checklist (Phase 3):**");
      expect(content).toContain("**Validation Checklist (Phase 4):**");
      
      // Check for checkbox format
      expect(content).toMatch(/- \[ \] All transformation files created/);
      expect(content).toMatch(/- \[ \] choreography\.yaml is valid YAML syntax/);
    });

    it("should have phase transition rules", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-012: Phase transition rules
      expect(content).toContain("### Phase Transition Rules");
      expect(content).toContain("Analyze → Propose");
      expect(content).toContain("Propose → Generate");
      expect(content).toContain("Generate → Validate");
      expect(content).toContain("Validate → Build");
    });

    it("should require user confirmation to proceed from Propose phase", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // Verify explicit confirmation requirement
      const phase2ExitSection = content.substring(
        content.indexOf("### Phase 2: Propose"),
        content.indexOf("### Phase 3: Generate")
      );
      
      expect(phase2ExitSection).toContain('User confirms design with "yes"');
      expect(phase2ExitSection).toContain("**Exit Criteria:**");
    });

    it("should include validation actions in Phase 4", () => {
      const content = generateAgentFile("./examples/ecommerce");

      const phase4Section = content.substring(
        content.indexOf("### Phase 4: Validate"),
        content.indexOf("### Phase 5: Build")
      );

      // FR-011: Validation actions
      expect(phase4Section).toContain("**Syntax Validation**");
      expect(phase4Section).toContain("**Schema Validation**");
      expect(phase4Section).toContain("**Consistency Checks**");
      expect(phase4Section).toContain("Check choreography.yaml is valid YAML");
      expect(phase4Section).toContain("Check JSONata files have valid syntax");
    });

    it("should provide clear next steps in Phase 5", () => {
      const content = generateAgentFile("./examples/ecommerce");

      const phase5Section = content.substring(
        content.indexOf("### Phase 5: Build")
      );

      // FR-013: Build phase guidance
      expect(phase5Section).toContain("spas-compose choreography build --dry-run");
      expect(phase5Section).toContain("spas-compose choreography build --docker");
      expect(phase5Section).toContain("docker compose up");
    });
  });
});
