/**
 * Integration tests for POST /services/{serviceId}:{version} endpoint
 * 
 * Note: Uses real HTTP server instead of fastify.inject() because
 * multipart/form-data with streams doesn't work reliably with inject
 * 
 * Uses pre-generated fixture archives for speed and reliability
 */

import fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { SqliteStorageProvider } from '../../src/storage/SqliteStorageProvider';
import { registerPublishRoutes } from '../../src/routes/publish';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

describe('POST /services/{serviceId}:{version} Integration', () => {
  let app: FastifyInstance;
  let storageProvider: SqliteStorageProvider;
  let dbPath: string;
  let baseURL: string;
  
  // File paths to pre-generated test archives
  const fixturesDir = path.join(__dirname, '../fixtures');
  const validArchivePath = path.join(fixturesDir, 'valid-service.zip');
  const checksumArchivePath = path.join(fixturesDir, 'checksum-service.zip');
  const noMetadataArchivePath = path.join(fixturesDir, 'no-metadata.zip');
  const invalidMetadataArchivePath = path.join(fixturesDir, 'invalid-metadata.zip');
  const dupServiceArchivePath = path.join(fixturesDir, 'dup-service.zip');
  const correctIdArchivePath = path.join(fixturesDir, 'correct-id.zip');

  beforeAll(async () => {
    // Create ephemeral test database (generated per test run, not in git)
    // Using file-based DB instead of :memory: for more realistic testing
    dbPath = path.join(__dirname, `../test-${Date.now()}.test.db`);
    storageProvider = new SqliteStorageProvider(dbPath);
    await storageProvider.initialize();

    // Initialize Fastify app once for all tests
    app = fastify({ logger: false });
    await app.register(multipart, { limits: { fileSize: 104857600 } });

    // Register publish route with test storage provider
    await registerPublishRoutes(app, './test/fixtures/spas-schema.json', storageProvider);

    // Start server on random port
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to get server address');
    }
    baseURL = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    // Clean up: close server, close database connection, delete test database
    await app.close();
    
    // Close database connection before deleting file
    if (storageProvider && (storageProvider as any).db) {
      (storageProvider as any).db.close();
    }
    
    // Small delay to ensure file handles are released
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Delete test database file and WAL files
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('Valid publish scenarios', () => {
    it('should successfully publish a valid service archive', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(validArchivePath), { filename: 'test-service-1.0.0.zip' });

      const response = await axios.post(
        `${baseURL}/services/test-service:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        serviceId: 'test-service',
        version: '1.0.0',
      });
      expect(response.data.message).toContain('published successfully');

      // Verify in database
      const exists = await storageProvider.serviceExists('test-service', '1.0.0');
      expect(exists).toBe(true);

      // Verify schemas were stored
      const schemas = await storageProvider.getSchemas('test-service', '1.0.0');
      expect(schemas.length).toBe(2); // create-order and order-created schemas
      expect(schemas.some(s => s.name === 'create-order.schema')).toBe(true);
      expect(schemas.some(s => s.name === 'order-created.schema')).toBe(true);
    });

    it('should successfully publish with checksum verification', async () => {
      const checksum = calculateChecksumFromFile(checksumArchivePath);

      const form = new FormData();
      form.append('archive', fs.createReadStream(checksumArchivePath), { filename: 'checksum-service-1.0.0.zip' });
      form.append('checksum', checksum);

      const response = await axios.post(
        `${baseURL}/services/checksum-service:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );


      expect(response.status).toBe(201);
    });
  });

  describe('Path validation', () => {
    it('should reject path without version separator', async () => {
      const response = await axios.post(
        `${baseURL}/services/invalid-path`,
        {},
        { headers: { 'content-type': 'multipart/form-data' }, validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        error: 'Invalid path format',
      });
    });

    it('should reject invalid semver version', async () => {
      const response = await axios.post(
        `${baseURL}/services/test-service:invalid`,
        {},
        { headers: { 'content-type': 'multipart/form-data' }, validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        error: 'Invalid version format',
      });
    });
  });

  describe('Duplicate detection', () => {
    it('should reject duplicate service publication', async () => {
      // First publish
      const form1 = new FormData();
      form1.append('archive', fs.createReadStream(dupServiceArchivePath), { filename: 'dup-service-1.0.0.zip' });
      await axios.post(
        `${baseURL}/services/dup-service:1.0.0`,
        form1,
        { headers: form1.getHeaders() }
      );

      // Second publish (duplicate)
      const form2 = new FormData();
      form2.append('archive', fs.createReadStream(dupServiceArchivePath), { filename: 'dup-service-1.0.0.zip' });
      const response = await axios.post(
        `${baseURL}/services/dup-service:1.0.0`,
        form2,
        { headers: form2.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(409);
      expect(response.data.message).toContain('already exists');
    });
  });

  describe('Archive validation', () => {
    it('should reject request without archive part', async () => {
      const form = new FormData();
      
      const response = await axios.post(
        `${baseURL}/services/test-service:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        error: 'Archive file is required',
      });
    });

    it('should reject archive without spas.json', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(noMetadataArchivePath), { filename: 'no-metadata.zip' });

      const response = await axios.post(
        `${baseURL}/services/no-metadata-service:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.message).toContain('spas.json');
    });

    it('should reject archive with invalid spas.json', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(invalidMetadataArchivePath), { filename: 'invalid-metadata.zip' });

      const response = await axios.post(
        `${baseURL}/services/invalid-metadata-service:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('ValidationError');
    });
  });

  describe('Identity validation', () => {
    it('should reject when path serviceId does not match metadata', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(correctIdArchivePath), { filename: 'correct-id-1.0.0.zip' });

      const response = await axios.post(
        `${baseURL}/services/wrong-id:1.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.message).toContain('mismatch');
    });

    it('should reject when path version does not match metadata', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(validArchivePath), { filename: 'test-service-1.0.0.zip' });

      const response = await axios.post(
        `${baseURL}/services/test-service:2.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.message).toContain('mismatch');
    });
  });

  describe('Checksum validation', () => {
    it('should reject when checksum does not match', async () => {
      const form = new FormData();
      form.append('archive', fs.createReadStream(validArchivePath), { filename: 'test-service-1.0.0.zip' });
      form.append('checksum', 'invalid-checksum-value');

      const response = await axios.post(
        `${baseURL}/services/test-service:2.0.0`,
        form,
        { headers: form.getHeaders(), validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.message).toContain('mismatch');
    });
  });
});

// Helper functions

function calculateChecksumFromFile(filePath: string): string {
  const crypto = require('crypto');
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}
