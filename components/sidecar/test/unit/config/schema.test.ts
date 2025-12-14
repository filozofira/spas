/**
 * Config Schema Validation Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateConfig,
  validateInboundEntry,
  validateOutboundEntry,
  assertValidConfig,
  isInboundEntry,
  isOutboundEntry,
} from '../../../src/config/schema.js';

describe('Config Schema Validation', () => {
  describe('validateConfig', () => {
    it('should validate a correct config', () => {
      const config = {
        inbound: [
          { kind: 'event', topic: 'test', transform: 'tr', invokeEndpoint: '/e' },
        ],
        outbound: [
          { eventType: 'com.test', topic: 'test' },
        ],
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object config', () => {
      const result = validateConfig(null);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Configuration must be an object');
    });

    it('should require inbound to be an array', () => {
      const config = { inbound: 'not array', outbound: [] };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({ path: 'inbound', message: 'inbound must be an array' });
    });

    it('should require outbound to be an array', () => {
      const config = { inbound: [], outbound: 'not array' };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({ path: 'outbound', message: 'outbound must be an array' });
    });

    it('should collect errors from all entries', () => {
      const config = {
        inbound: [
          { kind: 'event' }, // missing topic, transform, invokeEndpoint
          { kind: 'command' }, // missing command, transform, invokeEndpoint
        ],
        outbound: [
          {}, // missing eventType, topic
        ],
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
  });

  describe('validateInboundEntry', () => {
    it('should validate event entry', () => {
      const entry = {
        kind: 'event',
        topic: 'orders.created',
        transform: 'orderTransform',
        invokeEndpoint: '/orders',
      };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toHaveLength(0);
    });

    it('should validate command entry', () => {
      const entry = {
        kind: 'command',
        command: 'CreateOrder',
        transform: 'orderTransform',
        invokeEndpoint: '/orders',
      };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toHaveLength(0);
    });

    it('should require kind', () => {
      const entry = { topic: 'test', transform: 'tr', invokeEndpoint: '/e' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({ path: 'inbound[0].kind', message: 'kind is required' });
    });

    it('should reject invalid kind', () => {
      const entry = { kind: 'invalid', transform: 'tr', invokeEndpoint: '/e' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0].kind',
        message: "kind must be 'command' or 'event'",
      });
    });

    it('should require topic for event kind', () => {
      const entry = { kind: 'event', transform: 'tr', invokeEndpoint: '/e' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0].topic',
        message: 'topic is required when kind is "event"',
      });
    });

    it('should require command for command kind', () => {
      const entry = { kind: 'command', transform: 'tr', invokeEndpoint: '/e' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0].command',
        message: 'command is required when kind is "command"',
      });
    });

    it('should accept missing transform (passthrough)', () => {
      const entry = { kind: 'event', topic: 'test', invokeEndpoint: '/e' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toHaveLength(0);
    });

    it('should reject non-string transform', () => {
      const entry = { kind: 'event', topic: 'test', invokeEndpoint: '/e', transform: 123 };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0].transform',
        message: 'transform must be a string when provided',
      });
    });

    it('should require invokeEndpoint', () => {
      const entry = { kind: 'event', topic: 'test', transform: 'tr' };

      const errors = validateInboundEntry(entry, 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0].invokeEndpoint',
        message: 'invokeEndpoint is required',
      });
    });

    it('should reject non-object entry', () => {
      const errors = validateInboundEntry('not an object', 'inbound[0]');

      expect(errors).toContainEqual({
        path: 'inbound[0]',
        message: 'Entry must be an object',
      });
    });
  });

  describe('validateOutboundEntry', () => {
    it('should validate complete outbound entry', () => {
      const entry = {
        eventType: 'com.example.order.created',
        topic: 'orders.created',
        transform: 'orderTransform',
      };

      const errors = validateOutboundEntry(entry, 'outbound[0]');

      expect(errors).toHaveLength(0);
    });

    it('should validate entry without optional transform', () => {
      const entry = {
        eventType: 'com.example.order.created',
        topic: 'orders.created',
      };

      const errors = validateOutboundEntry(entry, 'outbound[0]');

      expect(errors).toHaveLength(0);
    });

    it('should require eventType', () => {
      const entry = { topic: 'test' };

      const errors = validateOutboundEntry(entry, 'outbound[0]');

      expect(errors).toContainEqual({
        path: 'outbound[0].eventType',
        message: 'eventType is required',
      });
    });

    it('should require topic', () => {
      const entry = { eventType: 'com.test' };

      const errors = validateOutboundEntry(entry, 'outbound[0]');

      expect(errors).toContainEqual({
        path: 'outbound[0].topic',
        message: 'topic is required',
      });
    });

    it('should reject non-string transform', () => {
      const entry = { eventType: 'com.test', topic: 'test', transform: 123 };

      const errors = validateOutboundEntry(entry, 'outbound[0]');

      expect(errors).toContainEqual({
        path: 'outbound[0].transform',
        message: 'transform must be a string if provided',
      });
    });
  });

  describe('assertValidConfig', () => {
    it('should not throw for valid config', () => {
      const config = { inbound: [], outbound: [] };

      expect(() => assertValidConfig(config)).not.toThrow();
    });

    it('should throw for invalid config', () => {
      const config = { inbound: 'bad', outbound: [] };

      expect(() => assertValidConfig(config)).toThrow('Invalid configuration');
    });
  });

  describe('type guards', () => {
    it('isInboundEntry should return true for valid entry', () => {
      const entry = { kind: 'event', topic: 't', transform: 'tr', invokeEndpoint: '/e' };
      expect(isInboundEntry(entry)).toBe(true);
    });

    it('isInboundEntry should return false for invalid entry', () => {
      const entry = { kind: 'event' };
      expect(isInboundEntry(entry)).toBe(false);
    });

    it('isOutboundEntry should return true for valid entry', () => {
      const entry = { eventType: 'e', topic: 't' };
      expect(isOutboundEntry(entry)).toBe(true);
    });

    it('isOutboundEntry should return false for invalid entry', () => {
      const entry = { topic: 't' };
      expect(isOutboundEntry(entry)).toBe(false);
    });
  });
});
