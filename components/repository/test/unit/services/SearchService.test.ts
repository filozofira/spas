/**
 * Unit tests for SearchService
 * Tests User Story 1: Service Discovery Without Filters
 */

import { SearchService } from '../../../src/services/SearchService';
import type { IStorageProvider } from '../../../src/storage/IStorageProvider';
import type { ServiceInfo } from '../../../src/models/types';

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

describe('SearchService', () => {
  describe('getAllServices', () => {
    it('should return all services from storage', async () => {
      const mockServices: ServiceInfo[] = [
        {
          id: 'inventory-service',
          name: 'Inventory Service',
          version: '1.0.0',
          description: 'Manages inventory',
          boundedContext: 'inventory',
          capabilities: ['stock-management'],
          publishedAt: '2025-12-19T10:00:00.000Z',
        },
        {
          id: 'order-service',
          name: 'Order Service',
          version: '2.0.0',
          description: 'Handles orders',
          boundedContext: 'orders',
          capabilities: ['order-processing'],
          publishedAt: '2025-12-19T11:00:00.000Z',
        },
      ];

      const storage = createMockStorage({
        getAllServices: jest.fn().mockResolvedValue(mockServices),
      });
      const service = new SearchService(storage);

      const result = await service.getAllServices();

      expect(result.total).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].id).toBe('inventory-service');
      expect(result.results[1].id).toBe('order-service');
      expect(storage.getAllServices).toHaveBeenCalledTimes(1);
    });

    it('should return empty results when no services exist', async () => {
      const storage = createMockStorage({
        getAllServices: jest.fn().mockResolvedValue([]),
      });
      const service = new SearchService(storage);

      const result = await service.getAllServices();

      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.limit).toBe(0);
      expect(result.offset).toBe(0);
    });

    it('should include services from all bounded contexts', async () => {
      const mockServices: ServiceInfo[] = [
        {
          id: 'payment-service',
          name: 'Payment Service',
          version: '1.0.0',
          description: 'Processes payments',
          boundedContext: 'payments',
          capabilities: ['payment-processing'],
        },
        {
          id: 'order-service',
          name: 'Order Service',
          version: '1.0.0',
          description: 'Handles orders',
          boundedContext: 'orders',
          capabilities: ['order-management'],
        },
        {
          id: 'inventory-service',
          name: 'Inventory Service',
          version: '1.0.0',
          description: 'Manages inventory',
          boundedContext: 'warehouse',
          capabilities: ['inventory-tracking'],
        },
      ];

      const storage = createMockStorage({
        getAllServices: jest.fn().mockResolvedValue(mockServices),
      });
      const service = new SearchService(storage);

      const result = await service.getAllServices();

      expect(result.total).toBe(3);
      const contexts = result.results.map(s => s.boundedContext);
      expect(contexts).toContain('payments');
      expect(contexts).toContain('orders');
      expect(contexts).toContain('warehouse');
    });

    it('should include runtime information when available', async () => {
      const mockServices: ServiceInfo[] = [
        {
          id: 'order-service',
          name: 'Order Service',
          version: '1.0.0',
          description: 'Handles orders',
          boundedContext: 'orders',
          capabilities: ['order-processing'],
          runtime: {
            image: 'ghcr.io/example/orders@sha256:abc123',
            repository: 'ghcr.io/example/orders',
            tag: '1.0.0',
            digest: 'sha256:abc123',
          },
        },
      ];

      const storage = createMockStorage({
        getAllServices: jest.fn().mockResolvedValue(mockServices),
      });
      const service = new SearchService(storage);

      const result = await service.getAllServices();

      expect(result.results[0].runtime).toBeDefined();
      expect(result.results[0].runtime?.image).toBe('ghcr.io/example/orders@sha256:abc123');
    });
  });

  describe('searchByCapability', () => {
    it('should throw error for empty capability', async () => {
      const storage = createMockStorage();
      const service = new SearchService(storage);

      await expect(service.searchByCapability('')).rejects.toThrow('Capability parameter is required');
    });

    it('should throw error for whitespace-only capability', async () => {
      const storage = createMockStorage();
      const service = new SearchService(storage);

      await expect(service.searchByCapability('   ')).rejects.toThrow('Capability parameter is required');
    });

    it('should return matching services', async () => {
      const mockServices: ServiceInfo[] = [
        {
          id: 'order-service',
          name: 'Order Service',
          version: '1.0.0',
          description: 'Handles orders',
          boundedContext: 'orders',
          capabilities: ['order-processing'],
        },
      ];

      const storage = createMockStorage({
        searchByCapability: jest.fn().mockResolvedValue(mockServices),
      });
      const service = new SearchService(storage);

      const result = await service.searchByCapability('order-processing');

      expect(result.total).toBe(1);
      expect(result.results[0].id).toBe('order-service');
    });
  });

  describe('searchByBoundedContext', () => {
    it('should throw error for empty context', async () => {
      const storage = createMockStorage();
      const service = new SearchService(storage);

      await expect(service.searchByBoundedContext('')).rejects.toThrow('Bounded context parameter is required');
    });

    it('should return matching services', async () => {
      const mockServices: ServiceInfo[] = [
        {
          id: 'payment-service',
          name: 'Payment Service',
          version: '1.0.0',
          description: 'Processes payments',
          boundedContext: 'payments',
          capabilities: ['payment-processing'],
        },
      ];

      const storage = createMockStorage({
        searchByBoundedContext: jest.fn().mockResolvedValue(mockServices),
      });
      const service = new SearchService(storage);

      const result = await service.searchByBoundedContext('payments');

      expect(result.total).toBe(1);
      expect(result.results[0].boundedContext).toBe('payments');
    });
  });
});
