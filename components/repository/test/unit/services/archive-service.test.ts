/**
 * Unit tests for ArchiveService
 */

import { ArchiveService, ArchiveError } from '../../../src/services/ArchiveService';
import archiver from 'archiver';

describe('ArchiveService', () => {
  let service: ArchiveService;

  beforeEach(() => {
    service = new ArchiveService();
  });

  describe('extractArchive', () => {
    it('should extract valid archive with spas.json and schemas', async () => {
      const archive = archiver('zip');
      
      const spasJson = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test-service',
        name: 'Test Service',
        description: 'Test',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: ['test'],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      archive.append(JSON.stringify(spasJson), { name: 'spas.json' });
      archive.append(JSON.stringify(schema), { name: 'schemas/test-event.json' });
      archive.finalize();

      const result = await service.extractArchive(archive as any);

      expect(result.metadata.id).toBe('test-service');
      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].name).toBe('test-event');
      expect(result.schemas[0].type).toBe('event');
    });

    it('should throw error if spas.json is missing', async () => {
      const archive = archiver('zip');
      archive.append(JSON.stringify({ type: 'object' }), { name: 'schemas/test.json' });
      archive.finalize();

      await expect(service.extractArchive(archive as any)).rejects.toThrow('Missing spas.json');
    });

    it('should throw error if spas.json is invalid JSON', async () => {
      const archive = archiver('zip');
      archive.append('{ invalid json', { name: 'spas.json' });
      archive.finalize();

      await expect(service.extractArchive(archive as any)).rejects.toThrow('Invalid spas.json');
    });

    it('should throw error if schema file is invalid JSON', async () => {
      const archive = archiver('zip');
      
      const spasJson = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      archive.append(JSON.stringify(spasJson), { name: 'spas.json' });
      archive.append('{ invalid', { name: 'schemas/bad.json' });
      archive.finalize();

      await expect(service.extractArchive(archive as any)).rejects.toThrow(ArchiveError);
    });

    it('should infer schema types correctly', async () => {
      const archive = archiver('zip');
      
      const spasJson = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      archive.append(JSON.stringify(spasJson), { name: 'spas.json' });
      archive.append(JSON.stringify({ type: 'object' }), { name: 'schemas/order-created-event.json' });
      archive.append(JSON.stringify({ type: 'object' }), { name: 'metadata/create-order-endpoint.json' });
      archive.append(JSON.stringify({ type: 'object' }), { name: 'schemas/internal-model.json' });
      archive.finalize();

      const result = await service.extractArchive(archive as any);

      expect(result.schemas).toHaveLength(3);
      expect(result.schemas.find(s => s.name === 'order-created-event')?.type).toBe('event');
      expect(result.schemas.find(s => s.name === 'create-order-endpoint')?.type).toBe('endpoint');
      expect(result.schemas.find(s => s.name === 'internal-model')?.type).toBe('internal');
    });
  });
});
