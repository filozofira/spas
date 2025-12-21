/**
 * Unit tests for metadata transformation utilities
 * Tests User Story 2: Schema Version Transformation
 */

import {
  transformToRuntimeMetadata,
  needsSchemaTransformation,
  transformMetadataArray,
} from '../../../src/utils/metadata-transformer';
import type { ServiceMetadata } from '../../../src/models/types';

describe('metadata-transformer', () => {
  describe('transformToRuntimeMetadata', () => {
    it('should transform design-time metadata to runtime metadata', () => {
      const designTimeMetadata: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test-service',
        name: 'Test Service',
        description: 'Test description',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: ['test-capability'],
        endpoints: [
          {
            name: 'testEndpoint',
            type: 'Query',
            protocol: 'Http',
            methodPath: 'GET /test',
            version: '1.0',
            schemaRef: 'test-query-v1',
          },
        ],
        events: [
          {
            type: 'test.event',
            version: '1.0',
            schemaRef: 'test-event-v1',
          },
        ],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
        publishedAt: '2025-12-19T10:00:00.000Z',
      };

      const result = transformToRuntimeMetadata(designTimeMetadata);

      expect(result.schemaVersion).toBe('runtime-metadata-v1');
      expect(result.id).toBe('test-service');
      expect(result.name).toBe('Test Service');
      expect(result.description).toBe('Test description');
      expect(result.version).toBe('1.0.0');
      expect(result.boundedContext).toBe('test');
      expect(result.capabilities).toEqual(['test-capability']);
      expect(result.endpoints).toEqual(designTimeMetadata.endpoints);
      expect(result.events).toEqual(designTimeMetadata.events);
      expect(result.consistency).toEqual(designTimeMetadata.consistency);
      expect(result.network).toEqual(designTimeMetadata.network);
      expect(result.security).toEqual(designTimeMetadata.security);
      expect(result.license).toBe('MIT');
      expect(result.publishedAt).toBe('2025-12-19T10:00:00.000Z');
    });

    it('should preserve metadata with runtime schema version unchanged', () => {
      const runtimeMetadata: ServiceMetadata = {
        schemaVersion: 'runtime-metadata-v1',
        id: 'already-runtime',
        name: 'Already Runtime',
        description: 'Already has runtime schema',
        version: '2.0.0',
        boundedContext: 'runtime',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['public'] },
        license: 'Apache-2.0',
      };

      const result = transformToRuntimeMetadata(runtimeMetadata);

      expect(result.schemaVersion).toBe('runtime-metadata-v1');
      expect(result).toEqual(runtimeMetadata);
    });

    it('should preserve unknown schema versions unchanged', () => {
      const unknownSchemaMetadata: ServiceMetadata = {
        schemaVersion: 'future-schema-v2' as any, // Future schema version
        id: 'future-service',
        name: 'Future Service',
        description: 'Uses future schema',
        version: '1.0.0',
        boundedContext: 'future',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      const result = transformToRuntimeMetadata(unknownSchemaMetadata);

      expect(result.schemaVersion).toBe('future-schema-v2');
      expect(result).toEqual(unknownSchemaMetadata);
    });

    it('should preserve endpoint and event descriptions during transformation', () => {
      const metadataWithDescriptions: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'described-service',
        name: 'Described Service',
        description: 'Service with descriptions',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [
          {
            name: 'create-order',
            type: 'Command',
            protocol: 'Http',
            methodPath: 'POST /orders',
            version: '1.0',
            schemaRef: 'create-order.json',
            description: 'Creates a new order with inventory reservation',
          },
        ],
        events: [
          {
            type: 'order.created',
            version: '1.0',
            schemaRef: 'order-created.json',
            description: 'Emitted when a new order is successfully created',
          },
        ],
        consistency: { commands: 'ACID', queries: 'EVENTUAL' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      const result = transformToRuntimeMetadata(metadataWithDescriptions);

      expect(result.schemaVersion).toBe('runtime-metadata-v1');
      expect(result.endpoints[0].description).toBe('Creates a new order with inventory reservation');
      expect(result.events[0].description).toBe('Emitted when a new order is successfully created');
    });

    it('should not mutate the original metadata object', () => {
      const original: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test-service',
        name: 'Test Service',
        description: 'Test description',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: ['test-capability'],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      };

      const originalCopy = { ...original };
      const result = transformToRuntimeMetadata(original);

      expect(original).toEqual(originalCopy); // Original unchanged
      expect(result.schemaVersion).toBe('runtime-metadata-v1');
      expect(original.schemaVersion).toBe('design-time-metadata-v1');
    });

    it('should handle metadata with runtime information', () => {
      const metadataWithRuntime: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'runtime-service',
        name: 'Runtime Service',
        description: 'Service with runtime info',
        version: '1.0.0',
        boundedContext: 'runtime',
        capabilities: ['runtime-capability'],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['confidential'] },
        license: 'proprietary',
        runtime: {
          image: 'ghcr.io/example/runtime@sha256:abc123',
          repository: 'ghcr.io/example/runtime',
          tag: '1.0.0',
          digest: 'sha256:abc123',
        },
      };

      const result = transformToRuntimeMetadata(metadataWithRuntime);

      expect(result.schemaVersion).toBe('runtime-metadata-v1');
      expect(result.runtime).toEqual(metadataWithRuntime.runtime);
    });
  });

  describe('needsSchemaTransformation', () => {
    it('should return true for design-time metadata', () => {
      const designTimeMetadata: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: [] },
        license: 'MIT',
      };

      expect(needsSchemaTransformation(designTimeMetadata)).toBe(true);
    });

    it('should return false for runtime metadata', () => {
      const runtimeMetadata: ServiceMetadata = {
        schemaVersion: 'runtime-metadata-v1',
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: [] },
        license: 'MIT',
      };

      expect(needsSchemaTransformation(runtimeMetadata)).toBe(false);
    });

    it('should return false for unknown schema versions', () => {
      const unknownMetadata: ServiceMetadata = {
        schemaVersion: 'unknown-schema-v1' as any,
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0.0',
        boundedContext: 'test',
        capabilities: [],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: [] },
        license: 'MIT',
      };

      expect(needsSchemaTransformation(unknownMetadata)).toBe(false);
    });
  });

  describe('transformMetadataArray', () => {
    it('should transform array of design-time metadata to runtime metadata', () => {
      const metadataArray: ServiceMetadata[] = [
        {
          schemaVersion: 'design-time-metadata-v1',
          id: 'service-1',
          name: 'Service 1',
          description: 'First service',
          version: '1.0.0',
          boundedContext: 'domain1',
          capabilities: ['cap1'],
          endpoints: [],
          events: [],
          consistency: { commands: 'ACID', queries: 'STRONG' },
          network: { requiredEgress: [] },
          security: { dataClassification: ['internal'] },
          license: 'MIT',
        },
        {
          schemaVersion: 'design-time-metadata-v1',
          id: 'service-2',
          name: 'Service 2',
          description: 'Second service',
          version: '2.0.0',
          boundedContext: 'domain2',
          capabilities: ['cap2'],
          endpoints: [],
          events: [],
          consistency: { commands: 'ACID', queries: 'STRONG' },
          network: { requiredEgress: [] },
          security: { dataClassification: ['confidential'] },
          license: 'Apache-2.0',
        },
      ];

      const result = transformMetadataArray(metadataArray);

      expect(result).toHaveLength(2);
      expect(result[0].schemaVersion).toBe('runtime-metadata-v1');
      expect(result[0].id).toBe('service-1');
      expect(result[1].schemaVersion).toBe('runtime-metadata-v1');
      expect(result[1].id).toBe('service-2');
    });

    it('should handle empty array', () => {
      const result = transformMetadataArray([]);
      expect(result).toEqual([]);
    });

    it('should handle mixed schema versions', () => {
      const metadataArray: ServiceMetadata[] = [
        {
          schemaVersion: 'design-time-metadata-v1',
          id: 'design-service',
          name: 'Design Service',
          description: 'Design-time service',
          version: '1.0.0',
          boundedContext: 'design',
          capabilities: [],
          endpoints: [],
          events: [],
          consistency: { commands: 'ACID', queries: 'STRONG' },
          network: { requiredEgress: [] },
          security: { dataClassification: [] },
          license: 'MIT',
        },
        {
          schemaVersion: 'runtime-metadata-v1',
          id: 'runtime-service',
          name: 'Runtime Service',
          description: 'Runtime service',
          version: '1.0.0',
          boundedContext: 'runtime',
          capabilities: [],
          endpoints: [],
          events: [],
          consistency: { commands: 'ACID', queries: 'STRONG' },
          network: { requiredEgress: [] },
          security: { dataClassification: [] },
          license: 'MIT',
        },
      ];

      const result = transformMetadataArray(metadataArray);

      expect(result).toHaveLength(2);
      expect(result[0].schemaVersion).toBe('runtime-metadata-v1'); // Transformed
      expect(result[0].id).toBe('design-service');
      expect(result[1].schemaVersion).toBe('runtime-metadata-v1'); // Unchanged
      expect(result[1].id).toBe('runtime-service');
    });
  });
});