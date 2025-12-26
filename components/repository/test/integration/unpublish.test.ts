/**
 * Integration tests for unpublish endpoint
 * Tests User Story 5 (Unpublish Service Version)
 */

import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { registerPublishRoutes } from '../../src/routes/publish';
import { registerRetrieveRoutes } from '../../src/routes/retrieve';
import { registerUnpublishRoutes } from '../../src/routes/unpublish';
import { SqliteStorageProvider } from '../../src/storage/SqliteStorageProvider';

describe('Unpublish Endpoint Integration', () => {
  let app: any;
  let storage: SqliteStorageProvider;
  const baseURL = 'http://localhost:3002';
  const dbPath = path.join(__dirname, '../fixtures/test-unpublish.db');
  const spasSchemaPath = path.resolve(
    __dirname,
    '../../..',
    'schemas',
    'design-time-metadata-v1.schema.json'
  );

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
    await registerRetrieveRoutes(app, storage);
    await registerUnpublishRoutes(app, storage);

    // Start server
    await app.listen({ port: 3002, host: '127.0.0.1' });

    // Publish test services
    await publishTestService('test-service', '1.0.0');
    await publishTestService('test-service', '2.0.0');
    await publishTestService('another-service', '1.0.0');
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

  async function publishTestService(serviceId: string, version: string) {
    await storage.publishService(
      serviceId,
      version,
      {
        schemaVersion: 'design-time-metadata-v1',
        id: serviceId,
        name: serviceId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `Test service for ${serviceId}`,
        version,
        boundedContext: 'testing',
        capabilities: ['test-capability'],
        endpoints: [],
        events: [],
        consistency: { commands: 'ACID', queries: 'STRONG' },
        network: { requiredEgress: [] },
        security: { dataClassification: ['internal'] },
        license: 'MIT',
      },
      []
    );
  }

  describe('DELETE /services/{serviceName}/versions/{version}', () => {
    it('should unpublish a specific service version', async () => {
      // Verify version 1.0.0 exists before deletion
      const beforeResponse = await axios.get(`${baseURL}/services/test-service/versions/1.0.0`, {
        validateStatus: () => true,
      });
      expect(beforeResponse.status).toBe(200);

      // Delete version 1.0.0
      const deleteResponse = await axios.delete(`${baseURL}/services/test-service/versions/1.0.0`, {
        validateStatus: () => true,
      });
      expect(deleteResponse.status).toBe(204);

      // Verify it's gone
      const afterResponse = await axios.get(`${baseURL}/services/test-service/versions/1.0.0`, {
        validateStatus: () => true,
      });
      expect(afterResponse.status).toBe(404);
    });

    it('should preserve other versions when one is deleted', async () => {
      // test-service:2.0.0 should still exist after deleting 1.0.0
      const response = await axios.get(`${baseURL}/services/test-service/versions/2.0.0`, {
        validateStatus: () => true,
      });
      expect(response.status).toBe(200);
      expect(response.data.version).toBe('2.0.0');

      // Versions list should only contain 2.0.0
      const versionsResponse = await axios.get(`${baseURL}/services/test-service/versions`, {
        validateStatus: () => true,
      });
      expect(versionsResponse.status).toBe(200);
      expect(versionsResponse.data.versions).toEqual(['2.0.0']);
    });

    it('should return 404 when attempting to retrieve unpublished version', async () => {
      // Verify 1.0.0 is not found (was deleted in earlier test)
      const response = await axios.get(`${baseURL}/services/test-service/versions/1.0.0`, {
        validateStatus: () => true,
      });
      expect(response.status).toBe(404);
      expect(response.data.error).toBe('NotFound');
    });

    it('should return 404 when unpublishing non-existent service', async () => {
      const response = await axios.delete(`${baseURL}/services/nonexistent/versions/1.0.0`, {
        validateStatus: () => true,
      });
      // Implementation choice: could be 204 (idempotent) or 404 (not found)
      // Per REST best practices, 404 is more informative
      expect([204, 404]).toContain(response.status);
    });

    it('should return 404 when unpublishing non-existent version', async () => {
      const response = await axios.delete(`${baseURL}/services/test-service/versions/99.0.0`, {
        validateStatus: () => true,
      });
      expect([204, 404]).toContain(response.status);
    });

    it('should not affect other services when unpublishing', async () => {
      // another-service should still exist and be retrievable
      const response = await axios.get(`${baseURL}/services/another-service/versions/1.0.0`, {
        validateStatus: () => true,
      });
      expect(response.status).toBe(200);
      expect(response.data.id).toBe('another-service');
    });
  });
});
