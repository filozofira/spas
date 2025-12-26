import { WorkspaceService } from '../../../src/services/workspace-service';
import { setModuleDir } from '../../../src/utils/paths';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock the templates module to avoid Eta dependency in tests
jest.mock('../../../src/utils/templates', () => ({
  renderTemplate: (name: string, data: { serviceName?: string }) => {
    if (name === 'readme') {
      return `# ${data.serviceName}\n\nService README content`;
    }
    if (name === 'agent-prompt') {
      return '# Agent Prompt\n\nAgent prompt content';
    }
    if (name === 'prompt-trigger') {
      return '# Prompt Trigger\n\nPrompt trigger content';
    }
    return '';
  },
}));

describe('WorkspaceService', () => {
    const testDir = join(tmpdir(), 'spas-workspace-test-' + Date.now());
    let workspaceService: WorkspaceService;
    let schemaDir: string;
    
    beforeAll(() => {
        mkdirSync(testDir, { recursive: true });
        
        // Create a mock schema directory for tests
        schemaDir = join(testDir, 'schemas');
        mkdirSync(schemaDir, { recursive: true });
        writeFileSync(
          join(schemaDir, 'design-time-metadata-v1.schema.json'),
          JSON.stringify({ type: 'object' }),
          'utf-8'
        );
        
        // Set the module dir so getSchemaSourcePath works
        // moduleDir is set from dist/index.js, so it's the dist/ folder
        // The path should be set so that going up 3 levels and then to 'schemas' lands in schemaDir
        // moduleDir -> .. -> .. -> .. -> schemas = schemaDir
        // So moduleDir needs to be testDir/a/b/c
        const fakeModuleDir = join(testDir, 'a', 'b', 'c');
        mkdirSync(fakeModuleDir, { recursive: true });
        
        // Also create templates directory for getTemplateDir (moduleDir/templates)
        const fakeTemplatesDir = join(fakeModuleDir, 'templates');
        mkdirSync(fakeTemplatesDir, { recursive: true });
        
        setModuleDir(fakeModuleDir);
        
        workspaceService = new WorkspaceService();
    });

    afterAll(() => {
        rmSync(testDir, { recursive: true, force: true });
    });

    describe('create', () => {
        it('should create workspace with correct folder structure', async () => {
            // Arrange
            const workspacePath = join(testDir, 'test-service');
            const serviceName = 'test-service';

            // Act
            const result = await workspaceService.create(workspacePath, serviceName, false);

            // Assert
            expect(result.success).toBe(true);
            expect(existsSync(workspacePath)).toBe(true);
            expect(existsSync(join(workspacePath, 'README.md'))).toBe(true);
            expect(existsSync(join(workspacePath, 'src'))).toBe(true);
            expect(existsSync(join(workspacePath, 'metadata'))).toBe(true);
            expect(existsSync(join(workspacePath, '.spas', 'schemas'))).toBe(true);
        });

        it('should return error when workspace exists and force is false', async () => {
            // Arrange
            const workspacePath = join(testDir, 'existing-service');
            mkdirSync(workspacePath, { recursive: true });

            // Act
            const result = await workspaceService.create(workspacePath, 'existing-service', false);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('WORKSPACE_EXISTS');
        });

        it('should overwrite workspace when force is true', async () => {
            // Arrange
            const workspacePath = join(testDir, 'force-overwrite');
            mkdirSync(workspacePath, { recursive: true });

            // Act
            const result = await workspaceService.create(workspacePath, 'force-overwrite', true);

            // Assert
            expect(result.success).toBe(true);
            expect(existsSync(join(workspacePath, 'README.md'))).toBe(true);
        });

        it('should include service name in README', async () => {
            // Arrange
            const workspacePath = join(testDir, 'readme-test-service');
            const serviceName = 'readme-test-service';

            // Act
            await workspaceService.create(workspacePath, serviceName, false);

            // Assert
            const readmeContent = readFileSync(join(workspacePath, 'README.md'), 'utf-8');
            expect(readmeContent).toContain(serviceName);
        });

        it('should return correct file list in result', async () => {
            // Arrange
            const workspacePath = join(testDir, 'file-list-service');
            const serviceName = 'file-list-service';

            // Act
            const result = await workspaceService.create(workspacePath, serviceName, false);

            // Assert
            expect(result.data?.files).toBeDefined();
            expect(result.data?.files.length).toBeGreaterThan(0);
            expect(result.data?.files).toContain(`${serviceName}/README.md`);
            expect(result.data?.files).toContain(`${serviceName}/src/`);
        });

        it('should create agent files at project root when provided', async () => {
            // Arrange
            const projectRoot = join(testDir, 'project-root');
            const workspacePath = join(projectRoot, 'services', 'agent-test-service');
            mkdirSync(projectRoot, { recursive: true });

            // Act
            const result = await workspaceService.create(
                workspacePath,
                'agent-test-service',
                false,
                projectRoot
            );

            // Assert
            expect(result.success).toBe(true);
            expect(existsSync(join(projectRoot, '.github', 'agents', 'spas.service.agent.md'))).toBe(true);
            expect(existsSync(join(projectRoot, '.github', 'prompts', 'spas.service.prompt.md'))).toBe(true);
        });
    });
});
