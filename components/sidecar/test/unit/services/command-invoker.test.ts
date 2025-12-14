/**
 * Unit tests for CommandInvoker
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CommandInvoker } from '../../../src/services/command-invoker.js';
import type { SidecarConfig } from '../../../src/types.js';
import type { ServiceInvoker } from '../../../src/services/service-invoker.js';

describe('CommandInvoker', () => {
  let mockServiceInvoker: jest.Mocked<ServiceInvoker>;
  let config: SidecarConfig;

  beforeEach(() => {
    mockServiceInvoker = {
      invoke: jest.fn(),
      invokeCommand: jest.fn(),
    } as unknown as jest.Mocked<ServiceInvoker>;

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
          transform: '{ "order": $ }',
          invokeEndpoint: 'http://localhost:8080/api/orders',
        },
        {
          kind: 'command' as const,
          command: 'updateProduct',
          transform: '',
          invokeEndpoint: 'http://localhost:8080/api/products/:id',
        },
        {
          kind: 'event' as const,
          topic: 'orders',
          transform: '$',
          invokeEndpoint: 'http://localhost:8080/events',
        },
      ],
      outbound: [],
    };
  });

  describe('lookupCommand', () => {
    it('should find command by exact name', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = invoker.lookupCommand('getUser');

      expect(result.found).toBe(true);
      expect(result.entry?.command).toBe('getUser');
      expect(result.entry?.invokeEndpoint).toBe('http://localhost:8080/api/users/:id');
    });

    it('should return not found for unknown command', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = invoker.lookupCommand('unknownCommand');

      expect(result.found).toBe(false);
      expect(result.entry).toBeUndefined();
    });

    it('should handle empty commands config', () => {
      const emptyConfig: SidecarConfig = {
        inbound: [],
        outbound: [],
      };
      const invoker = new CommandInvoker(emptyConfig, mockServiceInvoker);

      const result = invoker.lookupCommand('anyCommand');

      expect(result.found).toBe(false);
    });

    it('should include transform in lookup result', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = invoker.lookupCommand('createOrder');

      expect(result.found).toBe(true);
      expect(result.entry?.transform).toBe('{ "order": $ }');
    });

    it('should not match event entries', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      // 'orders' is an event topic, not a command
      const result = invoker.lookupCommand('orders');

      expect(result.found).toBe(false);
    });
  });

  describe('invoke', () => {
    it('should invoke command and return response', async () => {
      mockServiceInvoker.invokeCommand.mockResolvedValue({
        status: 200,
        data: { id: '123', name: 'Test User' },
        headers: { 'x-request-id': 'req-001' },
      });

      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = await invoker.invoke(
        'getUser',
        { id: '123' },
        { 'x-correlation-id': 'corr-001' }
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ id: '123', name: 'Test User' });
      expect(mockServiceInvoker.invokeCommand).toHaveBeenCalledWith(
        'http://localhost:8080/api/users/:id',
        { id: '123' },
        expect.objectContaining({ 'x-correlation-id': 'corr-001' })
      );
    });

    it('should return 404 for unknown command', async () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = await invoker.invoke(
        'unknownCommand',
        {},
        {}
      );

      expect(result.status).toBe(404);
      expect(result.data).toEqual({
        error: 'Command not found',
        command: 'unknownCommand',
      });
      expect(mockServiceInvoker.invokeCommand).not.toHaveBeenCalled();
    });

    it('should apply transform before invoking', async () => {
      mockServiceInvoker.invokeCommand.mockResolvedValue({
        status: 201,
        data: { orderId: 'ord-001' },
        headers: {},
      });

      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = await invoker.invoke(
        'createOrder',
        { product: 'Widget', qty: 5 },
        {}
      );

      expect(result.status).toBe(201);
      // Verify transform was applied
      expect(mockServiceInvoker.invokeCommand).toHaveBeenCalledWith(
        'http://localhost:8080/api/orders',
        { order: { product: 'Widget', qty: 5 } },
        expect.any(Object)
      );
    });

    it('should return 502 when service invocation fails', async () => {
      mockServiceInvoker.invokeCommand.mockRejectedValue(new Error('Connection refused'));

      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = await invoker.invoke(
        'getUser',
        { id: '123' },
        {}
      );

      expect(result.status).toBe(502);
      expect(result.data).toEqual({
        error: 'Command invocation failed',
        message: 'Connection refused',
      });
    });

    it('should propagate headers to service', async () => {
      mockServiceInvoker.invokeCommand.mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      const invoker = new CommandInvoker(config, mockServiceInvoker);

      await invoker.invoke(
        'getUser',
        {},
        {
          'traceparent': '00-abc123-def456-01',
          'x-user-id': 'user-001',
          'x-tenant-id': 'tenant-001',
        }
      );

      expect(mockServiceInvoker.invokeCommand).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          'traceparent': '00-abc123-def456-01',
          'x-user-id': 'user-001',
          'x-tenant-id': 'tenant-001',
        })
      );
    });

    it('should return 502 on upstream 5xx', async () => {
      mockServiceInvoker.invokeCommand.mockResolvedValue({
        status: 500,
        data: { error: 'Internal Server Error' },
        headers: {},
      });

      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const result = await invoker.invoke(
        'getUser',
        { id: '123' },
        {}
      );

      expect(result.status).toBe(502);
      expect(result.data).toEqual({
        error: 'Service error',
        upstream_status: 500,
        details: { error: 'Internal Server Error' },
      });
    });
  });

  describe('getCommands', () => {
    it('should return list of command names', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const commands = invoker.getCommands();

      expect(commands).toEqual(['getUser', 'createOrder', 'updateProduct']);
    });

    it('should return empty array when no commands configured', () => {
      const emptyConfig: SidecarConfig = {
        inbound: [],
        outbound: [],
      };
      const invoker = new CommandInvoker(emptyConfig, mockServiceInvoker);

      const commands = invoker.getCommands();

      expect(commands).toEqual([]);
    });

    it('should exclude event entries', () => {
      const invoker = new CommandInvoker(config, mockServiceInvoker);

      const commands = invoker.getCommands();

      // Should not include event topic 'orders'
      expect(commands).not.toContain('orders');
    });
  });
});
