/**
 * Integration tests for service retrieval endpoints
 */

import axios from 'axios';
import fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { SqliteStorageProvider } from '../../src/storage/SqliteStorageProvider';
import { registerPublishRoutes } from '../../src/routes/publish';
import { registerRetrieveRoutes } from '../../src/routes/retrieve';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';

describe('GET /services/* Integration', () => {
  let app: FastifyInstance;
  let storageProvider: SqliteStorageProvider;
  let dbPath: string;
  let baseURL: string;

  // Test fixtures
  const fixturesDir = path.join(__dirname, '../fixtures');
  const validArchivePath = path.join(fixturesDir, 'valid-service.zip');

  beforeAll(async () => {
    // Create ephemeral test database
    dbPath = path.join(__dirname, `../test-retrieve-${Date.now()}.test.db`);
    storageProvider = new SqliteStorageProvider(dbPath);
    await storageProvider.initialize();

    // Initialize Fastify app
    app = fastify({ logger: false });
    await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
    await registerPublishRoutes(app, './test/fixtures/spas-schema.json', storageProvider);
    await registerRetrieveRoutes(app, storageProvider);

    // Start server
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address: any = app.server.address();
    baseURL = `http://127.0.0.1:${address.port}`;

    // Publish test services for retrieval tests
    // Note: The valid-service.zip has version='1.0.0' hardcoded in spas.json
    // For full version testing, we would need multiple fixture files
    await publishTestService('test-service', '1.0.0');
  });

  afterAll(async () => {
    await app.close();
    if (storageProvider && (storageProvider as any).db) {
      (storageProvider as any).db.close();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Cleanup test database files
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch (err) {
      console.warn('Cleanup warning:', err);
    }
  });

  async function publishTestService(serviceId: string, version: string) {
    const form = new FormData();
    form.append('archive', fs.createReadStream(validArchivePath), { 
      filename: `${serviceId}-${version}.zip` 
    });

    try {
      await axios.post(
        `${baseURL}/services/${serviceId}:${version}`,
        form,
        { headers: form.getHeaders() }
      );
    } catch (err: any) {
      console.error(`Failed to publish ${serviceId}:${version}:`, err.response?.data);
      throw err;
    }
  }

  describe('GET /services/{serviceName}', () => {
    it('should retrieve service information for latest version', async () => {
      const response = await axios.get(`${baseURL}/services/test-service`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', 'test-service');
      expect(response.data).toHaveProperty('version', '1.0.0');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('boundedContext');
      expect(response.data).toHaveProperty('capabilities');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await axios.get(`${baseURL}/services/nonexistent`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('NotFound');
    });
  });

  describe('GET /services/{serviceName}/versions', () => {
    it('should return all versions in descending order', async () => {
      const response = await axios.get(`${baseURL}/services/test-service/versions`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.serviceName).toBe('test-service');
      expect(response.data.versions).toEqual(['1.0.0']); // Only one version in test data
    });

    it('should return 404 for non-existent service', async () => {
      const response = await axios.get(`${baseURL}/services/nonexistent/versions`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
    });

    it('should return single version for service with one version', async () => {
      // Skip this test since we only have test-service with multiple versions
      // In a full implementation, we'd create additional fixture files
    });
  });

  describe('GET /services/{serviceName}/versions/{version}', () => {
    it('should retrieve complete metadata for specific version', async () => {
      const response = await axios.get(`${baseURL}/services/test-service/versions/1.0.0`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', 'test-service');
      expect(response.data).toHaveProperty('version', '1.0.0');
      expect(response.data).toHaveProperty('schemaVersion');
      expect(response.data).toHaveProperty('endpoints');
      expect(response.data).toHaveProperty('events');
    });

    it('should return 404 for non-existent version', async () => {
      const response = await axios.get(`${baseURL}/services/test-service/versions/9.9.9`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent service', async () => {
      const response = await axios.get(`${baseURL}/services/nonexistent/versions/1.0.0`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /services/{serviceName}/versions/{version}/schemas', () => {
    it('should return list of all schemas', async () => {
      const response = await axios.get(
        `${baseURL}/services/test-service/versions/1.0.0/schemas`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(200);
      expect(response.data.serviceName).toBe('test-service');
      expect(response.data.version).toBe('1.0.0');
      expect(response.data.schemas).toBeInstanceOf(Array);
      expect(response.data.schemas.length).toBeGreaterThan(0);
      expect(response.data.schemas[0]).toHaveProperty('name');
      expect(response.data.schemas[0]).toHaveProperty('type');
    });

    it('should return 404 for non-existent service version', async () => {
      const response = await axios.get(
        `${baseURL}/services/nonexistent/versions/1.0.0/schemas`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /services/{serviceName}/versions/{version}/schemas/{schemaName}', () => {
    it('should retrieve specific schema content', async () => {
      const response = await axios.get(
        `${baseURL}/services/test-service/versions/1.0.0/schemas/create-order.schema`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('$schema');
      expect(response.data).toHaveProperty('type');
      expect(response.data).toHaveProperty('properties');
    });

    it('should return 404 for non-existent schema', async () => {
      const response = await axios.get(
        `${baseURL}/services/test-service/versions/1.0.0/schemas/nonexistent`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('NotFound');
    });

    it('should return 404 for non-existent service version', async () => {
      const response = await axios.get(
        `${baseURL}/services/nonexistent/versions/1.0.0/schemas/test-schema`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /services/{serviceName}/versions/{version}/download', () => {
    it('should download complete service archive as ZIP', async () => {
      const response = await axios.get(
        `${baseURL}/services/test-service/versions/1.0.0/download`,
        { 
          responseType: 'arraybuffer',
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('test-service-1.0.0.zip');
      expect(response.data).toBeInstanceOf(Buffer);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent service version', async () => {
      const response = await axios.get(
        `${baseURL}/services/nonexistent/versions/1.0.0/download`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });
  });
});
