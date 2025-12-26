/**
 * Integration tests for the init command
 * 
 * Tests end-to-end workspace creation, agent file generation,
 * and performance requirements (SC-001: < 5 seconds)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { WorkspaceService } from '../../src/services/workspace-service.js';
import { setModuleDir } from '../../src/utils/paths.js';

// Set up module dir for tests - point to dist so paths resolve correctly
// From dist: templates are at templates/, schemas at ../../../schemas
const distDir = join(process.cwd(), 'dist');
setModuleDir(distDir);

describe('Init Command Integration', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    testDir = join(tmpdir(), `spas-init-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('End-to-end workspace creation', () => {
    it('should create complete workspace structure for a service', async () => {
      const serviceName = 'order-service';
      const workspacePath = join(testDir, serviceName);
      
      const service = new WorkspaceService();
      const startTime = Date.now();
      
      // WorkspaceService.create(workspacePath, serviceName, force, projectRoot)
      const result = await service.create(workspacePath, serviceName, false, testDir);
      
      const elapsedTime = Date.now() - startTime;
      
      // Should complete successfully
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Should complete in under 5 seconds (SC-001)
      expect(elapsedTime).toBeLessThan(5000);
      
      // Verify core directories exist
      expect(existsSync(join(workspacePath, 'src'))).toBe(true);
      expect(existsSync(join(workspacePath, 'metadata'))).toBe(true);
      expect(existsSync(join(workspacePath, '.spas', 'schemas'))).toBe(true);
      
      // Verify core files exist
      expect(existsSync(join(workspacePath, 'README.md'))).toBe(true);
      expect(existsSync(join(workspacePath, '.spas', 'schemas', 'design-time-metadata-v1.schema.json'))).toBe(true);
      
      // Verify README contains service name
      const readme = readFileSync(join(workspacePath, 'README.md'), 'utf-8');
      expect(readme).toContain(serviceName);
      expect(readme).toContain('order-service');
    });

    it('should create agent files at project root when in git repo', async () => {
      const serviceName = 'test-service';
      const workspacePath = join(testDir, serviceName);
      
      // Create a fake git repo structure
      mkdirSync(join(testDir, '.git'), { recursive: true });
      
      const service = new WorkspaceService();
      const result = await service.create(workspacePath, serviceName, false, testDir);
      
      expect(result.success).toBe(true);
      
      // Agent files should be at project root (testDir), not in workspace
      // Files are named spas.service.agent.md and spas.service.prompt.md
      expect(existsSync(join(testDir, '.github', 'prompts', 'spas.service.prompt.md'))).toBe(true);
      expect(existsSync(join(testDir, '.github', 'agents', 'spas.service.agent.md'))).toBe(true);
      
      // Verify prompt trigger content
      const promptTrigger = readFileSync(
        join(testDir, '.github', 'prompts', 'spas.service.prompt.md'), 
        'utf-8'
      );
      expect(promptTrigger).toContain('STACK');
      expect(promptTrigger).toContain('CONTEXT');
      
      // Verify agent prompt content
      const agentPrompt = readFileSync(
        join(testDir, '.github', 'agents', 'spas.service.agent.md'), 
        'utf-8'
      );
      expect(agentPrompt).toContain('SPAS Service Scaffolding Agent');
      expect(agentPrompt).toContain('Phase 1');
      expect(agentPrompt).toContain('Phase 9');
    });

    it('should reject workspace creation when directory exists and force is false', async () => {
      const serviceName = 'existing-service';
      const workspacePath = join(testDir, serviceName);
      
      // Create existing directory
      mkdirSync(workspacePath, { recursive: true });
      
      const service = new WorkspaceService();
      const result = await service.create(workspacePath, serviceName, false, testDir);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WORKSPACE_EXISTS');
    });

    it('should overwrite workspace when force is true', async () => {
      const serviceName = 'force-service';
      const workspacePath = join(testDir, serviceName);
      
      const service = new WorkspaceService();
      
      // First creation (directory doesn't exist)
      const result1 = await service.create(workspacePath, serviceName, false, testDir);
      expect(result1.success).toBe(true);
      expect(existsSync(join(workspacePath, 'README.md'))).toBe(true);
      
      // Second creation with force=true (overwrites existing)
      const result2 = await service.create(workspacePath, serviceName, true, testDir);
      expect(result2.success).toBe(true);
      
      // Verify files still exist after force overwrite
      expect(existsSync(join(workspacePath, 'README.md'))).toBe(true);
    });

    it('should meet performance requirement of < 5 seconds (SC-001)', async () => {
      // Create fake git repo for full flow
      mkdirSync(join(testDir, '.git'), { recursive: true });
      
      const service = new WorkspaceService();
      
      // Run multiple times to get consistent timing
      const times: number[] = [];
      for (let i = 0; i < 3; i++) {
        const runPath = join(testDir, `perf-service-${i}`);
        const start = Date.now();
        await service.create(runPath, `perf-service-${i}`, false, testDir);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      // Average should be well under 5 seconds
      expect(avgTime).toBeLessThan(5000);
      
      // Log for visibility
      console.log(`Average workspace creation time: ${avgTime.toFixed(0)}ms`);
    });
  });

  describe('Schema validation', () => {
    it('should copy valid JSON schema file', async () => {
      const serviceName = 'schema-service';
      const workspacePath = join(testDir, serviceName);
      
      const service = new WorkspaceService();
      await service.create(workspacePath, serviceName, false, testDir);
      
      const schemaPath = join(workspacePath, '.spas', 'schemas', 'design-time-metadata-v1.schema.json');
      expect(existsSync(schemaPath)).toBe(true);
      
      // Verify it's valid JSON
      const schemaContent = readFileSync(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      
      expect(schema.$schema).toContain('json-schema.org');
      expect(schema.title).toBeDefined();
      expect(schema.properties).toBeDefined();
    });
  });
});
