/**
 * Unit tests for Invoke Handler
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import { createInvokeRouter } from '../../../src/handlers/invoke.js';
import type { SidecarConfig } from '../../../src/types.js';
import type { HttpClient } from '../../../src/transport/http.js';

describe('Invoke Handler', () => {
  let app: Express;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let config: SidecarConfig;

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>;

    config = {
      inbound: [
        {
          kind: 'command' as const,
          command: 'getUser',
          transform: '',
          invokeEndpoint: 'http://localhost:8080/api/users/:id',
        },
        {
          kind: 'command' as const,
          command: 'createOrder',
          transform: '',
          invokeEndpoint: 'http://localhost:8080/api/orders',
        },
      ],
      outbound: [],
    };

    app = express();
    app.use(express.json());
    app.use('/invoke', createInvokeRouter(config, mockHttpClient));
  });

  describe('POST /invoke/:command', () => {
    it('should invoke command and return response', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: { id: '123', name: 'Test User' },
        headers: { 'x-request-id': 'req-001' },
      });

      const response = await request(app)
        .post('/invoke/getUser')
        .send({ id: '123' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '123', name: 'Test User' });
    });

    it('should return 404 for unknown command', async () => {
      const response = await request(app)
        .post('/invoke/unknownCommand')
        .send({ data: 'test' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Command not found',
        command: 'unknownCommand',
      });
    });

    it('should propagate traceparent header', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      await request(app)
        .post('/invoke/getUser')
        .send({})
        .set('Content-Type', 'application/json')
        .set('traceparent', '00-abc123-def456-01');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          'traceparent': '00-abc123-def456-01',
        })
      );
    });

    it('should propagate x-correlation-id header', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      await request(app)
        .post('/invoke/createOrder')
        .send({ product: 'Widget' })
        .set('Content-Type', 'application/json')
        .set('x-correlation-id', 'corr-12345');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          'x-correlation-id': 'corr-12345',
        })
      );
    });

    it('should propagate x-user-id and x-tenant-id headers', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      await request(app)
        .post('/invoke/getUser')
        .send({})
        .set('Content-Type', 'application/json')
        .set('x-user-id', 'user-001')
        .set('x-tenant-id', 'tenant-001');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          'x-user-id': 'user-001',
          'x-tenant-id': 'tenant-001',
        })
      );
    });

    it('should return 502 when service fails', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await request(app)
        .post('/invoke/getUser')
        .send({ id: '123' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(502);
      expect(response.body).toEqual({
        error: 'Command invocation failed',
        message: 'ECONNREFUSED',
      });
    });

    it('should propagate response headers from service', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: { result: 'ok' },
        headers: {
          'x-request-id': 'req-001',
          'x-trace-id': 'trace-001',
        },
      });

      const response = await request(app)
        .post('/invoke/getUser')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe('req-001');
      expect(response.headers['x-trace-id']).toBe('trace-001');
    });

    it('should handle empty request body', async () => {
      mockHttpClient.post.mockResolvedValue({
        status: 200,
        data: { users: [] },
        headers: {},
      });

      const response = await request(app)
        .post('/invoke/getUser')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });
  });
});
