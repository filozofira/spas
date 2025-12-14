/**
 * Config Loader Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, isLegacyConfig, migrateLegacyConfig, getConfigSummary } from '../../../src/config/loader.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Config Loader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `sidecar-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should load valid configuration', async () => {
      const configPath = join(testDir, 'config.json');
      const config = {
        inbound: [
          {
            kind: 'event',
            topic: 'orders.created',
            transform: 'orderToNotification',
            invokeEndpoint: '/notifications',
          },
        ],
        outbound: [
          {
            eventType: 'com.example.order.created',
            topic: 'orders.created',
          },
        ],
      };

      await writeFile(configPath, JSON.stringify(config));

      const result = await loadConfig(configPath);

      expect(result.inbound).toHaveLength(1);
      expect(result.inbound[0].kind).toBe('event');
      expect(result.outbound).toHaveLength(1);
      expect(result.outbound[0].eventType).toBe('com.example.order.created');
    });

    it('should throw on missing file', async () => {
      const configPath = join(testDir, 'nonexistent.json');

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration file not found');
    });

    it('should throw on invalid JSON', async () => {
      const configPath = join(testDir, 'invalid.json');
      await writeFile(configPath, 'not valid json {');

      await expect(loadConfig(configPath)).rejects.toThrow('Invalid JSON');
    });

    it('should throw on invalid config structure', async () => {
      const configPath = join(testDir, 'config.json');
      const config = {
        inbound: 'not an array',
        outbound: [],
      };

      await writeFile(configPath, JSON.stringify(config));

      await expect(loadConfig(configPath)).rejects.toThrow('Invalid configuration');
    });

    it('should load config with command entries', async () => {
      const configPath = join(testDir, 'config.json');
      const config = {
        inbound: [
          {
            kind: 'command',
            command: 'CreateOrder',
            transform: 'orderTransform',
            invokeEndpoint: '/orders',
          },
        ],
        outbound: [],
      };

      await writeFile(configPath, JSON.stringify(config));

      const result = await loadConfig(configPath);

      expect(result.inbound[0].kind).toBe('command');
      expect(result.inbound[0].command).toBe('CreateOrder');
    });
  });

  describe('isLegacyConfig', () => {
    it('should detect legacy config with subscriptions', () => {
      const legacy = {
        subscriptions: [{ topic: 'test', transform: 't', invokeEndpoint: '/e' }],
      };

      expect(isLegacyConfig(legacy)).toBe(true);
    });

    it('should detect legacy config with publications', () => {
      const legacy = {
        publications: [{ topic: 'test' }],
      };

      expect(isLegacyConfig(legacy)).toBe(true);
    });

    it('should not detect new format as legacy', () => {
      const newConfig = {
        inbound: [],
        outbound: [],
      };

      expect(isLegacyConfig(newConfig)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isLegacyConfig(null)).toBe(false);
      expect(isLegacyConfig('string')).toBe(false);
    });
  });

  describe('migrateLegacyConfig', () => {
    it('should migrate subscriptions to inbound events', () => {
      const legacy = {
        subscriptions: [
          { topic: 'orders.created', transform: 'toNotification', invokeEndpoint: '/notify' },
          { topic: 'orders.shipped', transform: 'toEmail', invokeEndpoint: '/email' },
        ],
      };

      const result = migrateLegacyConfig(legacy);

      expect(result.inbound).toHaveLength(2);
      expect(result.inbound[0]).toEqual({
        kind: 'event',
        topic: 'orders.created',
        transform: 'toNotification',
        invokeEndpoint: '/notify',
      });
    });

    it('should migrate publications to outbound', () => {
      const legacy = {
        publications: [
          { topic: 'orders.created', transform: 'transformOrder' },
          { topic: 'orders.updated' },
        ],
      };

      const result = migrateLegacyConfig(legacy);

      expect(result.outbound).toHaveLength(2);
      expect(result.outbound[0]).toEqual({
        eventType: 'orders.created',
        topic: 'orders.created',
        transform: 'transformOrder',
      });
      expect(result.outbound[1].transform).toBeUndefined();
    });

    it('should handle empty legacy config', () => {
      const legacy = {};

      const result = migrateLegacyConfig(legacy);

      expect(result.inbound).toEqual([]);
      expect(result.outbound).toEqual([]);
    });
  });

  describe('getConfigSummary', () => {
    it('should summarize config correctly', () => {
      const config = {
        inbound: [
          { kind: 'event' as const, topic: 't1', transform: 'tr', invokeEndpoint: '/e' },
          { kind: 'event' as const, topic: 't2', transform: 'tr', invokeEndpoint: '/e' },
          { kind: 'command' as const, command: 'c1', transform: 'tr', invokeEndpoint: '/e' },
        ],
        outbound: [
          { eventType: 'e1', topic: 't1' },
        ],
      };

      const summary = getConfigSummary(config);

      expect(summary).toBe('2 event subscription(s), 1 command handler(s), 1 publication route(s)');
    });
  });
});
