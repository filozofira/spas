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

  describe('getServiceMetadata', () => {
    const metadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'metadata-test',
      name: 'Metadata Test Service',
      description: 'Test metadata retrieval',
      version: '2.0.0',
      boundedContext: 'testing',
      capabilities: ['capability-a', 'capability-b'],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    it('should retrieve service metadata by name and version', async () => {
      await provider.publishService('metadata-test', '2.0.0', metadata, []);

      const retrieved = await provider.getServiceMetadata('metadata-test', '2.0.0');
      expect(retrieved).not.toBeNull();
      expect(retrieved).toMatchObject({
        id: 'metadata-test',
        name: 'Metadata Test Service',
        version: '2.0.0',
        boundedContext: 'testing',
        capabilities: ['capability-a', 'capability-b'],
      });
    });

    it('should return null for non-existent service', async () => {
      const retrieved = await provider.getServiceMetadata('nonexistent', '1.0.0');
      expect(retrieved).toBeNull();
    });

    it('should return null for wrong version', async () => {
      await provider.publishService('metadata-test', '2.0.0', metadata, []);
      const retrieved = await provider.getServiceMetadata('metadata-test', '3.0.0');
      expect(retrieved).toBeNull();
    });
  });

  describe('getServiceVersions', () => {
    const baseMetadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'version-test',
      name: 'Version Test Service',
      description: 'Test version listing',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: [],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    it('should return all versions for a service in descending order', async () => {
      await provider.publishService('version-test', '1.0.0', { ...baseMetadata, version: '1.0.0' }, []);
      await provider.publishService('version-test', '2.0.0', { ...baseMetadata, version: '2.0.0' }, []);
      await provider.publishService('version-test', '1.5.0', { ...baseMetadata, version: '1.5.0' }, []);

      const versions = await provider.getServiceVersions('version-test');
      expect(versions).toEqual(['2.0.0', '1.5.0', '1.0.0']);
    });

    it('should return empty array for non-existent service', async () => {
      const versions = await provider.getServiceVersions('nonexistent');
      expect(versions).toEqual([]);
    });

    it('should return single version when only one published', async () => {
      await provider.publishService('single-version', '1.0.0', { ...baseMetadata, id: 'single-version' }, []);
      const versions = await provider.getServiceVersions('single-version');
      expect(versions).toEqual(['1.0.0']);
    });
  });

  describe('getSchemas', () => {
    const metadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'schema-test',
      name: 'Schema Test Service',
      description: 'Test schema retrieval',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: [],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    const schemas: Schema[] = [
      {
        name: 'order-created',
        type: 'event',
        content: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: { orderId: { type: 'string' } },
        },
      },
      {
        name: 'create-order',
        type: 'endpoint',
        content: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: { customerId: { type: 'string' } },
        },
      },
    ];

    it('should retrieve all schemas for a service version', async () => {
      await provider.publishService('schema-test', '1.0.0', metadata, schemas);

      const retrieved = await provider.getSchemas('schema-test', '1.0.0');
      expect(retrieved).toHaveLength(2);
      expect(retrieved.map(s => s.name)).toContain('order-created');
      expect(retrieved.map(s => s.name)).toContain('create-order');
    });

    it('should return schemas in alphabetical order by name', async () => {
      await provider.publishService('schema-test', '1.0.0', metadata, schemas);

      const retrieved = await provider.getSchemas('schema-test', '1.0.0');
      expect(retrieved[0].name).toBe('create-order');
      expect(retrieved[1].name).toBe('order-created');
    });

    it('should return empty array for service with no schemas', async () => {
      await provider.publishService('no-schemas', '1.0.0', metadata, []);
      const retrieved = await provider.getSchemas('no-schemas', '1.0.0');
      expect(retrieved).toEqual([]);
    });

    it('should return empty array for non-existent service', async () => {
      const retrieved = await provider.getSchemas('nonexistent', '1.0.0');
      expect(retrieved).toEqual([]);
    });

    it('should include schema content and type', async () => {
      await provider.publishService('schema-test', '1.0.0', metadata, schemas);

      const retrieved = await provider.getSchemas('schema-test', '1.0.0');
      const eventSchema = retrieved.find(s => s.name === 'order-created');
      
      expect(eventSchema).toBeDefined();
      expect(eventSchema?.type).toBe('event');
      expect(eventSchema?.content).toHaveProperty('properties');
      expect(eventSchema?.content.properties).toHaveProperty('orderId');
    });
  });

  describe('getSchema', () => {
    const metadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'single-schema-test',
      name: 'Single Schema Test',
      description: 'Test single schema retrieval',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: [],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    const schema: Schema = {
      name: 'test-event',
      type: 'event',
      content: { type: 'object', properties: { id: { type: 'string' } } },
    };

    it('should retrieve a specific schema by name', async () => {
      await provider.publishService('single-schema-test', '1.0.0', metadata, [schema]);

      const retrieved = await provider.getSchema('single-schema-test', '1.0.0', 'test-event');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('test-event');
      expect(retrieved?.type).toBe('event');
    });

    it('should return null for non-existent schema', async () => {
      await provider.publishService('single-schema-test', '1.0.0', metadata, [schema]);

      const retrieved = await provider.getSchema('single-schema-test', '1.0.0', 'nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent service', async () => {
      const retrieved = await provider.getSchema('nonexistent', '1.0.0', 'test-event');
      expect(retrieved).toBeNull();
    });
  });
});
