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
      expect(content).toContain("com.{service-name}.{event-name-kebab}");
      expect(content).toContain("CloudEvents Type Format");
    });

    it("should contain sidecar config schema reference", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-002: Sidecar config schema (condensed with file reference)
      expect(content).toContain("Sidecar Configuration Schema");
      expect(content).toContain("inbound");
      expect(content).toContain("outbound");
      expect(content).toContain("kind");
      expect(content).toContain("invokeEndpoint");
      expect(content).toContain("sidecar-config-v1.schema.json");
    });

    it("should contain JSONata transformation patterns", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-003: JSONata patterns
      expect(content).toContain("JSONata Transformation Patterns");
      expect(content).toContain("$append([], ...)");
      expect(content).toContain("❌ WRONG");
      expect(content).toContain("✅ CORRECT");
    });

    it("should contain sidecar communication patterns documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-004: Sidecar communication patterns
      expect(content).toContain("Sidecar Communication Patterns");
      expect(content).toContain("/publish");
      expect(content).toContain("command:");
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
      expect(content).toContain("### Sidecar Communication Patterns");
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

  describe("comprehensive technical reference (US3)", () => {
    it("should contain choreography YAML schema documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-014: Choreography schema (condensed with file reference)
      expect(content).toContain("### Choreography YAML Schema");
      expect(content).toContain("version");
      expect(content).toContain("domain");
      expect(content).toContain("flows");
      expect(content).toContain("participants");
      expect(content).toContain("events");
      expect(content).toContain("choreography-v1.schema.json");
    });

    it("should contain service metadata (spas.json) schema documentation", () => {
      const content = generateAgentFile("./examples/ecommerce");

      // FR-015: Service metadata schema
      expect(content).toContain("### Service Metadata (spas.json) Schema");
      expect(content).toContain("boundedContext");
      expect(content).toContain("runtime-metadata-v1");
      expect(content).toContain(".spas/schemas/runtime-metadata-v1.schema.json");
      expect(content).toContain("endpoints");
      expect(content).toContain("events");
      expect(content).toContain("runtime");
    });

    it("should reference choreography schema file", () => {
      const content = generateAgentFile("./examples/ecommerce");

      expect(content).toContain("### Choreography YAML Schema");
      expect(content).toContain("choreography-v1.schema.json");
      expect(content).toContain("participants");
      expect(content).toContain("events");
    });

    it("should reference sidecar config schema file", () => {
      const content = generateAgentFile("./examples/ecommerce");

      expect(content).toContain("### Sidecar Configuration Schema");
      expect(content).toContain("sidecar-config-v1.schema.json");
      expect(content).toContain("inbound");
      expect(content).toContain("outbound");
    });

    it("should include schema file paths with domain root placeholder", () => {
      const content = generateAgentFile("./examples/ecommerce");

      expect(content).toContain("${domainRoot}/{DOMAIN}/.spas/schemas/sidecar-config-v1.schema.json");
      expect(content).toContain("${domainRoot}/{DOMAIN}/.spas/schemas/choreography-v1.schema.json");
    });
  });

  describe("Known Pitfalls (US4)", () => {
    it("should include all 6 documented pitfalls", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("## Known Pitfalls");
      expect(content).toContain("Missing $append for Arrays");
      expect(content).toContain("Wrong Command Name");
      expect(content).toContain("Invalid Topic Format");
      expect(content).toContain("Inconsistent Field Casing");
      expect(content).toContain("Circular Event Dependencies");
      expect(content).toContain("Empty outputMapping");
    });

    it("should use table format for pitfalls", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("| Pitfall | Symptom | Fix |");
    });

    it("should document array handling pitfall", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("JSONata error");
      expect(content).toContain("$append([], array)");
    });

    it("should document command name pitfall", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("Wrong Command Name");
      expect(content).toContain("command");
    });

    it("should document topic naming convention pitfall", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("Invalid Topic Format");
      expect(content).toContain("{boundedContext}-events");
    });
  });

  describe("Troubleshooting (US4)", () => {
    it("should include error-solution mapping table", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("## Troubleshooting");
      expect(content).toContain("| Error | Solution |");
    });

    it("should document common error scenarios", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("400 on /incoming");
      expect(content).toContain("Transform failures");
      expect(content).toContain("Events not routing");
      expect(content).toContain("Connection refused");
      expect(content).toContain("Choreography not loaded");
    });

    it("should provide debugging commands", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("docker compose logs");
      expect(content).toContain("try.jsonata.org");
    });
  });

  describe("Known Limitations (US4)", () => {
    it("should document 5 system limitations", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("## Known Limitations");
      expect(content).toContain("/incoming endpoint");
      expect(content).toContain("Array handling");
      expect(content).toContain("Single bounded context");
      expect(content).toContain("Choreography naming");
      expect(content).toContain("Transformation paths");
    });

    it("should explain array handling limitation", () => {
      const content = generateAgentFile("./examples/ecommerce");
      
      expect(content).toContain("$append");
      expect(content).toContain("single elements");
    });
  });

  describe("Domain-Relative Path Resolution (US5)", () => {
    it("should use domainRoot parameter in all path references", () => {
      const domainRoot = "./examples/test";
      const content = generateAgentFile(domainRoot);

      // Verify domainRoot is documented
      expect(content).toContain(`**Domain root**: \`${domainRoot}\``);
      expect(content).toContain(`**Full domain path**: \`${domainRoot}/{DOMAIN}/\``);
    });

    it("should construct paths with domainRoot prefix for services directory", () => {
      const domainRoot = "./my-custom-path";
      const content = generateAgentFile(domainRoot);

      expect(content).toContain(`${domainRoot}/{DOMAIN}/services/*/spas.json`);
      expect(content).toContain(`${domainRoot}/{DOMAIN}/services/`);
    });

    it("should construct paths with domainRoot prefix for transformations", () => {
      const domainRoot = "./examples/production";
      const content = generateAgentFile(domainRoot);

      expect(content).toContain(`${domainRoot}/{DOMAIN}/transformations/`);
    });

    it("should construct paths with domainRoot prefix for schema files", () => {
      const domainRoot = "./workspaces/dev";
      const content = generateAgentFile(domainRoot);

      expect(content).toContain(`${domainRoot}/{DOMAIN}/.spas/schemas/sidecar-config-v1.schema.json`);
    });

    it("should work with relative paths", () => {
      const content = generateAgentFile(".");

      expect(content).toContain("./{DOMAIN}/services");
      expect(content).toContain("./{DOMAIN}/transformations");
    });

    it("should work with nested output paths", () => {
      const content = generateAgentFile("./examples/test/nested");

      expect(content).toContain("./examples/test/nested/{DOMAIN}/services");
      expect(content).toContain("./examples/test/nested/{DOMAIN}/transformations");
    });

    it("should not contain any hardcoded absolute paths", () => {
      const content = generateAgentFile("./custom");

      // Should not contain paths that don't start with domainRoot
      const lines = content.split('\n');
      const pathPatterns = [
        /^\s*-.*?\/services\/(?!.*\/custom\/)/,  // services/ without custom
        /^\s*-.*?\/transformations\/(?!.*\/custom\/)/,  // transformations/ without custom
      ];

      lines.forEach((line, index) => {
        pathPatterns.forEach(pattern => {
          if (pattern.test(line) && !line.includes('{DOMAIN}') && !line.includes('choreography.yaml example')) {
            // Allow relative paths in YAML examples
            if (!line.includes('transform:') && !line.includes('# ')) {
              fail(`Line ${index + 1} contains hardcoded path without domainRoot: ${line}`);
            }
          }
        });
      });
    });
  });
});
