/**
 * Integration tests for WorkspaceService
 *
 * Uses real filesystem with temp directories for reliable testing.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { WorkspaceService } from "../../../src/services/workspace-service.js";

describe("WorkspaceService", () => {
  let tempDir: string;
  let testWorkspacePath: string;
  const testWorkspaceName = "my-domain";

  beforeEach(() => {
    // Create a unique temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "spas-compose-test-"));
    testWorkspacePath = path.join(tempDir, testWorkspaceName);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("create()", () => {
    it("should create workspace folder structure", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      const result = await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(testWorkspacePath)).toBe(true);
    });

    it("should create README.md file", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const readmePath = path.join(testWorkspacePath, "README.md");
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf-8");
      expect(content).toContain(testWorkspaceName);
    });

    it("should create choreography.yaml scaffold", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const yamlPath = path.join(testWorkspacePath, "choreography.yaml");
      expect(fs.existsSync(yamlPath)).toBe(true);
      const content = fs.readFileSync(yamlPath, "utf-8");
      expect(content).toContain("version:");
      expect(content).toContain("domain:");
    });

    it("should create services/ directory", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const servicesPath = path.join(testWorkspacePath, "services");
      expect(fs.existsSync(servicesPath)).toBe(true);
      expect(fs.statSync(servicesPath).isDirectory()).toBe(true);
    });

    it("should create transformations/ directory", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const transformationsPath = path.join(
        testWorkspacePath,
        "transformations",
      );
      expect(fs.existsSync(transformationsPath)).toBe(true);
      expect(fs.statSync(transformationsPath).isDirectory()).toBe(true);
    });

    it("should fail if workspace already exists and force is false", async () => {
      // Arrange
      const service = new WorkspaceService();
      fs.mkdirSync(testWorkspacePath, { recursive: true });

      // Act
      const result = await service.create(
        testWorkspacePath,
        testWorkspaceName,
        false,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("WORKSPACE_EXISTS");
    });

    it("should overwrite if workspace exists and force is true", async () => {
      // Arrange
      const service = new WorkspaceService();
      fs.mkdirSync(testWorkspacePath, { recursive: true });
      fs.writeFileSync(
        path.join(testWorkspacePath, "old-file.txt"),
        "should be deleted",
      );

      // Act
      const result = await service.create(
        testWorkspacePath,
        testWorkspaceName,
        true,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(testWorkspacePath, "old-file.txt"))).toBe(
        false,
      );
      expect(fs.existsSync(path.join(testWorkspacePath, "README.md"))).toBe(
        true,
      );
    });

    it("should create agent file at parent .github/agents/", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const agentPath = path.join(
        tempDir,
        ".github",
        "agents",
        "spas.compose.agent.md",
      );
      expect(fs.existsSync(agentPath)).toBe(true);
      const content = fs.readFileSync(agentPath, "utf-8");
      expect(content).toContain("description:");
      expect(content).toContain(testWorkspaceName);
    });

    it("should create prompt file at parent .github/prompts/", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const promptPath = path.join(
        tempDir,
        ".github",
        "prompts",
        "spas-compose.prompt.md",
      );
      expect(fs.existsSync(promptPath)).toBe(true);
      const content = fs.readFileSync(promptPath, "utf-8");
      expect(content).toContain("agent: spas-compose");
    });

    it("should create sidecar config schema at .spas/schemas/", async () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      await service.create(testWorkspacePath, testWorkspaceName);

      // Assert
      const schemaPath = path.join(
        testWorkspacePath,
        ".spas",
        "schemas",
        "sidecar-config-v1.schema.json",
      );
      expect(fs.existsSync(schemaPath)).toBe(true);
      const content = fs.readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(content);
      expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
      expect(schema.title).toBe("SPAS Sidecar Configuration");
      expect(schema.properties).toHaveProperty("inbound");
      expect(schema.properties).toHaveProperty("outbound");
    });

    it("should place agent file relative to project root, not workspace", async () => {
      // Arrange - Create a project structure like:
      // project-root/
      //   ├── .git/
      //   └── domains/
      //       └── my-domain/
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "spas-project-"));
      const domainsDir = path.join(projectRoot, "domains");
      const domainPath = path.join(domainsDir, testWorkspaceName);
      
      // Create .git to simulate git repo root
      fs.mkdirSync(path.join(projectRoot, ".git"), { recursive: true });
      fs.mkdirSync(domainsDir, { recursive: true });

      const service = new WorkspaceService();

      // Act - Pass project root separately
      await service.create(domainPath, testWorkspaceName, false, projectRoot);

      // Assert - Agent file should be at project root, not workspace parent
      const agentPath = path.join(
        projectRoot,
        ".github",
        "agents",
        "spas.compose.agent.md",
      );
      expect(fs.existsSync(agentPath)).toBe(true);

      // Clean up
      fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    it("should use relative path in agent file references", async () => {
      // Arrange
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "spas-project-"));
      const domainsDir = path.join(projectRoot, "domains");
      const domainPath = path.join(domainsDir, testWorkspaceName);
      
      fs.mkdirSync(path.join(projectRoot, ".git"), { recursive: true });
      fs.mkdirSync(domainsDir, { recursive: true });

      const service = new WorkspaceService();

      // Act
      await service.create(domainPath, testWorkspaceName, false, projectRoot);

      // Assert - Agent file should contain relative paths to domain
      const agentPath = path.join(
        projectRoot,
        ".github",
        "agents",
        "spas.compose.agent.md",
      );
      const content = fs.readFileSync(agentPath, "utf-8");
      
      // Should reference domain files using relative path from project root
      expect(content).toContain("domains/my-domain");
      // Should NOT contain hardcoded paths or SPAS principles references
      expect(content).not.toContain("principles/component/14-domain-choreography.md");

      // Clean up
      fs.rmSync(projectRoot, { recursive: true, force: true });
    });
  });

  describe("exists()", () => {
    it("should return true if workspace folder exists", () => {
      // Arrange
      const service = new WorkspaceService();
      fs.mkdirSync(testWorkspacePath, { recursive: true });

      // Act
      const result = service.exists(testWorkspacePath);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if workspace folder does not exist", () => {
      // Arrange
      const service = new WorkspaceService();

      // Act
      const result = service.exists(testWorkspacePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("validate()", () => {
    it("should return valid if all required files exist", async () => {
      // Arrange
      const service = new WorkspaceService();
      await service.create(testWorkspacePath, testWorkspaceName);

      // Act
      const result = service.validate(testWorkspacePath);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it("should return invalid if choreography.yaml is missing", () => {
      // Arrange
      const service = new WorkspaceService();
      fs.mkdirSync(testWorkspacePath, { recursive: true });
      fs.mkdirSync(path.join(testWorkspacePath, "services"));
      // Note: not creating choreography.yaml

      // Act
      const result = service.validate(testWorkspacePath);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("choreography.yaml not found");
    });

    it("should return invalid if services/ directory is missing", () => {
      // Arrange
      const service = new WorkspaceService();
      fs.mkdirSync(testWorkspacePath, { recursive: true });
      fs.writeFileSync(
        path.join(testWorkspacePath, "choreography.yaml"),
        'version: "1.0"',
      );
      // Note: not creating services directory

      // Act
      const result = service.validate(testWorkspacePath);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("services/ directory not found");
    });
  });
});
