/**
 * Integration tests for search endpoints
 * Tests User Story 3 (Capability Search) and User Story 4 (Bounded Context Search)
 */

import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { registerPublishRoutes } from '../../src/routes/publish';
import { registerSearchRoutes } from '../../src/routes/search';
import { SqliteStorageProvider } from '../../src/storage/SqliteStorageProvider';
import FormData from 'form-data';

describe('Search Endpoints Integration', () => {
  let app: any;
  let storage: SqliteStorageProvider;
  const baseURL = 'http://localhost:3001';
  const dbPath = path.join(__dirname, '../fixtures/test-search.db');
  const validArchivePath = path.join(__dirname, '../fixtures/valid-service.zip');
  const spasSchemaPath = path.join(__dirname, '../../node_modules/@spas/schemas/design-time-metadata-v1.schema.json');

  beforeAll(async () => {
    // Clean up test database
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    // Initialize storage
    storage = new SqliteStorageProvider(dbPath);
    await storage.initialize();

    // Create Fastify app
    app = Fastify({ logger: false });
    await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

    // Register routes
    await registerPublishRoutes(app, spasSchemaPath, storage);
    await registerSearchRoutes(app, storage);

    // Start server
    await app.listen({ port: 3001, host: '127.0.0.1' });

    // Publish test services with different capabilities
    await publishTestService('payment-service', '1.0.0', ['payment-processing', 'refunds'], 'payments');
    await publishTestService('payment-service', '2.0.0', ['payment-processing', 'refunds', 'subscriptions'], 'payments');
    await publishTestService('order-service', '1.0.0', ['order-management', 'payment-processing'], 'orders');
    await publishTestService('inventory-service', '1.0.0', ['inventory-tracking'], 'warehouse');
    await publishTestService('shipping-service', '1.0.0', ['shipping', 'tracking'], 'logistics');
  });

  afterAll(async () => {
    await app.close();
    // Give file system time to release the lock
    await new Promise(resolve => setTimeout(resolve, 100));
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });

  async function publishTestService(
    serviceId: string,
    version: string,
    capabilities: string[],
    boundedContext: string
  ) {
    // Read the valid archive to extract its metadata
    const archiveBuffer = fs.readFileSync(validArchivePath);
    
    // Create modified archive with custom metadata
    // For now, we'll use the archive as-is and rely on metadata in DB
    // In real scenario, we'd regenerate the archive with correct metadata
    const form = new FormData();
    form.append('archive', archiveBuffer, {
      filename: `${serviceId}-${version}.zip`,
      contentType: 'application/zip',
    });

    try {
      // Note: This will fail validation because archive metadata won't match
      // For integration test, we'll publish directly to storage
      await storage.publishService(
        serviceId,
        version,
        {
          schemaVersion: 'design-time-metadata-v1',
          id: serviceId,
          name: serviceId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: `Test service for ${serviceId}`,
          version,
          boundedContext,
          capabilities,
          endpoints: [],
          events: [],
          consistency: { commands: 'ACID', queries: 'STRONG' },
          network: { requiredEgress: [] },
          security: { dataClassification: ['internal'] },
          license: 'MIT',
        },
        []
      );
    } catch (err: any) {
      console.error(`Failed to publish ${serviceId}:${version}:`, err.message);
      throw err;
    }
  }

  describe('GET /services?capability={cap}', () => {
    it('should find services with matching capability', async () => {
      const response = await axios.get(`${baseURL}/services?capability=payment-processing`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('results');
      expect(response.data.results).toHaveLength(2); // payment-service and order-service
      
      const serviceIds = response.data.results.map((r: any) => r.id);
      expect(serviceIds).toContain('payment-service');
      expect(serviceIds).toContain('order-service');
    });

    it('should return latest version only per service', async () => {
      const response = await axios.get(`${baseURL}/services?capability=payment-processing`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      const paymentService = response.data.results.find((r: any) => r.id === 'payment-service');
      expect(paymentService.version).toBe('2.0.0'); // Latest version
    });

    it('should return service with multiple capabilities when searching by any', async () => {
      const response = await axios.get(`${baseURL}/services?capability=subscriptions`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toHaveLength(1);
      expect(response.data.results[0].id).toBe('payment-service');
      expect(response.data.results[0].capabilities).toContain('subscriptions');
      expect(response.data.results[0].capabilities).toContain('payment-processing');
    });

    it('should return empty array when no services match', async () => {
      const response = await axios.get(`${baseURL}/services?capability=nonexistent-capability`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toEqual([]);
    });

    it('should return 400 for missing capability parameter', async () => {
      const response = await axios.get(`${baseURL}/services?capability=`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('BadRequest');
    });
  });

  describe('GET /services?boundedContext={context}', () => {
    it('should find services in matching bounded context', async () => {
      const response = await axios.get(`${baseURL}/services?boundedContext=payments`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toHaveLength(1);
      expect(response.data.results[0].id).toBe('payment-service');
      expect(response.data.results[0].boundedContext).toBe('payments');
    });

    it('should return latest version only per service', async () => {
      const response = await axios.get(`${baseURL}/services?boundedContext=payments`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      const paymentService = response.data.results[0];
      expect(paymentService.version).toBe('2.0.0'); // Latest version
    });

    it('should return empty array when no services match', async () => {
      const response = await axios.get(`${baseURL}/services?boundedContext=nonexistent`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toEqual([]);
    });

    it('should return 400 for missing boundedContext parameter', async () => {
      const response = await axios.get(`${baseURL}/services?boundedContext=`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('BadRequest');
    });
  });
});
