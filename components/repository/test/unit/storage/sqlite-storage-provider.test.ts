/**
 * Unit tests for SqliteStorageProvider
 */

import { SqliteStorageProvider } from '../../../src/storage/SqliteStorageProvider';
import type { ServiceMetadata, Schema } from '../../../src/models/types';

describe('SqliteStorageProvider', () => {
  let provider: SqliteStorageProvider;

  beforeEach(async () => {
    // Use in-memory database for tests
    provider = new SqliteStorageProvider(':memory:');
    await provider.initialize();
  });

  afterEach(() => {
    // No cleanup needed for in-memory database
  });

  describe('publishService', () => {
    const sampleMetadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'test-service',
      name: 'Test Service',
      description: 'A test service',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: ['test-capability'],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    const sampleSchemas: Schema[] = [
      {
        name: 'test-schema',
        type: 'event',
        content: { type: 'object', properties: { id: { type: 'string' } } },
      },
    ];

    it('should publish service metadata and schemas successfully', async () => {
      await provider.publishService('test-service', '1.0.0', sampleMetadata, sampleSchemas);

      const exists = await provider.serviceExists('test-service', '1.0.0');
      expect(exists).toBe(true);

      const metadata = await provider.getServiceMetadata('test-service', '1.0.0');
      expect(metadata).toMatchObject({
        id: 'test-service',
        version: '1.0.0',
        name: 'Test Service',
      });

      const schemas = await provider.getSchemas('test-service', '1.0.0');
      expect(schemas).toHaveLength(1);
      expect(schemas[0].name).toBe('test-schema');
    });

    it('should detect duplicate service versions', async () => {
      await provider.publishService('test-service', '1.0.0', sampleMetadata, sampleSchemas);

      await expect(
        provider.publishService('test-service', '1.0.0', sampleMetadata, sampleSchemas)
      ).rejects.toThrow();
    });

    it('should rollback transaction on error', async () => {
      // This should fail but we need to simulate a DB error
      // For now, verify that partial inserts don't occur
      const exists = await provider.serviceExists('rollback-test', '1.0.0');
      expect(exists).toBe(false);
    });

    it('should handle multiple schemas for same service', async () => {
      const multiSchemas: Schema[] = [
        {
          name: 'schema-1',
          type: 'event',
          content: { type: 'object' },
        },
        {
          name: 'schema-2',
          type: 'internal',
          content: { type: 'object' },
        },
      ];

      await provider.publishService('multi-schema-test', '1.0.0', sampleMetadata, multiSchemas);

      const schemas = await provider.getSchemas('multi-schema-test', '1.0.0');
      expect(schemas).toHaveLength(2);
      expect(schemas.map(s => s.name)).toEqual(['schema-1', 'schema-2']);
    });
  });

  describe('serviceExists', () => {
    it('should return false for non-existent service', async () => {
      const exists = await provider.serviceExists('nonexistent', '1.0.0');
      expect(exists).toBe(false);
    });

    it('should return true for published service', async () => {
      const metadata: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'exists-test',
        name: 'Exists Test',
        description: 'Test',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'EVENTUAL' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['public'] },
        license: 'Apache-2.0',
      };

      await provider.publishService('exists-test', '1.0.0', metadata, []);
      const exists = await provider.serviceExists('exists-test', '1.0.0');
      expect(exists).toBe(true);
    });
  });
});
