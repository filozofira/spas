/**
 * Unit tests for RetrievalService
 * Tests User Story 2: Correct Schema Version for Retrieved Services
 */

import { RetrievalService } from '../../../src/services/RetrievalService';
import type { IStorageProvider } from '../../../src/storage/IStorageProvider';
import type { ServiceMetadata, Schema } from '../../../src/models/types';

// Mock storage provider
const createMockStorage = (overrides: Partial<IStorageProvider> = {}): IStorageProvider => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  serviceExists: jest.fn().mockResolvedValue(false),
  publishService: jest.fn().mockResolvedValue(undefined),
  getServiceMetadata: jest.fn().mockResolvedValue(null),
  getServiceVersions: jest.fn().mockResolvedValue([]),
  getLatestVersion: jest.fn().mockResolvedValue(null),
  getSchemas: jest.fn().mockResolvedValue([]),
  getSchema: jest.fn().mockResolvedValue(null),
  searchByCapability: jest.fn().mockResolvedValue([]),
  searchByBoundedContext: jest.fn().mockResolvedValue([]),
  getAllServices: jest.fn().mockResolvedValue([]),
  deleteService: jest.fn().mockResolvedValue(undefined),
  health: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('RetrievalService', () => {
  describe('getServiceInfo (schema version transformation)', () => {
    it('should transform design-time metadata to runtime metadata', async () => {
      const mockMetadata: ServiceMetadata = {
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
        runtime: {
          image: 'ghcr.io/example/test@sha256:abc123',
          repository: 'ghcr.io/example/test',
          tag: '1.0.0',
          digest: 'sha256:abc123',
        },
      };

      const storage = createMockStorage({
        getLatestVersion: jest.fn().mockResolvedValue('1.0.0'),
        getServiceMetadata: jest.fn().mockResolvedValue(mockMetadata),
      });

      const service = new RetrievalService(storage);
      const result = await service.getServiceInfo('test-service');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-service');
      expect(result!.runtime).toBeDefined();
      // Note: The schema version fix will be implemented in the service layer
      // For now, ServiceInfo doesn't include schemaVersion field
    });

    it('should handle services without runtime metadata', async () => {
      const mockMetadata: ServiceMetadata = {
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

      const storage = createMockStorage({
        getLatestVersion: jest.fn().mockResolvedValue('1.0.0'),
        getServiceMetadata: jest.fn().mockResolvedValue(mockMetadata),
      });

      const service = new RetrievalService(storage);
      const result = await service.getServiceInfo('test-service');

      expect(result).toBeDefined();
      expect(result!.id).toBe('test-service');
      expect(result!.runtime).toBeUndefined();
    });

    it('should return null for non-existent service', async () => {
      const storage = createMockStorage({
        getLatestVersion: jest.fn().mockResolvedValue(null),
      });

      const service = new RetrievalService(storage);
      const result = await service.getServiceInfo('nonexistent-service');

      expect(result).toBeNull();
    });
  });

  describe('getMetadata (schema version transformation)', () => {
    it('should transform stored metadata to runtime metadata format', async () => {
      const mockMetadata: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1', // Stored with design-time schema
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
        publishedAt: '2025-12-19T10:00:00.000Z',
      };

      const storage = createMockStorage({
        getServiceMetadata: jest.fn().mockResolvedValue(mockMetadata),
      });

      const service = new RetrievalService(storage);
      const result = await service.getMetadata('test-service', '1.0.0');

      expect(result).toBeDefined();
      // Schema version should be transformed from design-time to runtime
      expect(result!.schemaVersion).toBe('runtime-metadata-v1');
    });

    it('should preserve all other metadata fields', async () => {
      const mockMetadata: ServiceMetadata = {
        schemaVersion: 'design-time-metadata-v1',
        id: 'payment-service',
        name: 'Payment Service',
        description: 'Processes payments',
        version: '2.0.0',
        boundedContext: 'payments',
        capabilities: ['payment-processing', 'refunds'],
        endpoints: [
          {
            name: 'processPayment',
            type: 'Command',
            protocol: 'Http',
            methodPath: 'POST /payments',
            version: '1.0',
            schemaRef: 'payment-command-v1',
          },
        ],
        events: [
          {
            type: 'payment.processed',
            version: '1.0',
            schemaRef: 'payment-processed-v1',
          },
        ],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: ['bank-api:443'] },
        security: { dataClassification: ['confidential'] },
        license: 'proprietary',
        runtime: {
          image: 'ghcr.io/example/payments@sha256:def456',
          repository: 'ghcr.io/example/payments',
          tag: '2.0.0',
          digest: 'sha256:def456',
        },
        publishedAt: '2025-12-19T11:00:00.000Z',
      };

      const storage = createMockStorage({
        getServiceMetadata: jest.fn().mockResolvedValue(mockMetadata),
      });

      const service = new RetrievalService(storage);
      const result = await service.getMetadata('payment-service', '2.0.0');

      expect(result).toBeDefined();
      expect(result!.id).toBe('payment-service');
      expect(result!.capabilities).toEqual(['payment-processing', 'refunds']);
      expect(result!.endpoints).toHaveLength(1);
      expect(result!.events).toHaveLength(1);
      expect(result!.runtime).toBeDefined();
      expect(result!.publishedAt).toBe('2025-12-19T11:00:00.000Z');
    });
  });

  describe('getVersions', () => {
    it('should return all versions for a service', async () => {
      const storage = createMockStorage({
        getServiceVersions: jest.fn().mockResolvedValue(['2.0.0', '1.0.0']),
      });

      const service = new RetrievalService(storage);
      const result = await service.getVersions('test-service');

      expect(result).toEqual(['2.0.0', '1.0.0']);
    });
  });

  describe('getSchemas', () => {
    it('should return all schemas for a service version', async () => {
      const mockSchemas: Schema[] = [
        {
          name: 'payment-command-v1',
          type: 'endpoint',
          content: { type: 'object' },
        },
        {
          name: 'payment-processed-v1',
          type: 'event',
          content: { type: 'object' },
        },
      ];

      const storage = createMockStorage({
        getSchemas: jest.fn().mockResolvedValue(mockSchemas),
      });

      const service = new RetrievalService(storage);
      const result = await service.getSchemas('payment-service', '2.0.0');

      expect(result).toEqual(mockSchemas);
    });
  });
});