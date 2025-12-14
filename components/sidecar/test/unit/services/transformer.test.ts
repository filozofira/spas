/**
 * Transformer Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  applyTransform,
  applyTransformSync,
  validateTransform,
  clearTransformCache,
  CommonTransforms,
} from '../../../src/services/transformer.js';

describe('Transformer', () => {
  beforeEach(() => {
    clearTransformCache();
  });

  describe('applyTransform', () => {
    it('should return payload unchanged with passthrough transform', async () => {
      const payload = { orderId: '123', amount: 100 };

      const result = await applyTransform(payload, '$');

      expect(result).toEqual(payload);
    });

    it('should extract nested field', async () => {
      const payload = { data: { orderId: '123' }, metadata: {} };

      const result = await applyTransform(payload, 'data.orderId');

      expect(result).toBe('123');
    });

    it('should transform with object construction', async () => {
      const payload = { firstName: 'John', lastName: 'Doe' };

      const result = await applyTransform(payload, '{ "fullName": firstName & " " & lastName }');

      expect(result).toEqual({ fullName: 'John Doe' });
    });

    it('should handle array transformations', async () => {
      const payload = { items: [{ price: 10 }, { price: 20 }, { price: 30 }] };

      const result = await applyTransform(payload, '$sum(items.price)');

      expect(result).toBe(60);
    });

    it('should return undefined for non-existent path', async () => {
      const payload = { orderId: '123' };

      const result = await applyTransform(payload, 'nonExistent');

      expect(result).toBeUndefined();
    });

    it('should return payload unchanged for empty transform', async () => {
      const payload = { test: true };

      const result = await applyTransform(payload, '');

      expect(result).toEqual(payload);
    });

    it('should throw on invalid transform expression', async () => {
      const payload = { test: true };

      await expect(applyTransform(payload, '{ invalid :')).rejects.toThrow('Transform failed');
    });

    it('should cache compiled expressions', async () => {
      const payload = { value: 1 };
      const transform = 'value * 2';

      // First call
      const result1 = await applyTransform(payload, transform);
      // Second call (should use cache)
      const result2 = await applyTransform(payload, transform);

      expect(result1).toBe(2);
      expect(result2).toBe(2);
    });
  });

  describe('applyTransformSync', () => {
    it('should transform (delegates to async)', async () => {
      const payload = { orderId: '123' };

      const result = await applyTransformSync(payload, 'orderId');

      expect(result).toBe('123');
    });

    it('should return payload for empty transform', async () => {
      const payload = { test: true };

      const result = await applyTransformSync(payload, '');

      expect(result).toEqual(payload);
    });
  });

  describe('validateTransform', () => {
    it('should return true for valid expression', () => {
      expect(validateTransform('$')).toBe(true);
      expect(validateTransform('data.field')).toBe(true);
      expect(validateTransform('{ "key": $.value }')).toBe(true);
    });

    it('should throw for invalid expression', () => {
      expect(() => validateTransform('{ invalid :')).toThrow('Invalid transform expression');
    });
  });

  describe('CommonTransforms', () => {
    it('PASSTHROUGH should return unchanged', async () => {
      const payload = { a: 1, b: 2 };

      const result = await applyTransform(payload, CommonTransforms.PASSTHROUGH);

      expect(result).toEqual(payload);
    });

    it('DATA_ONLY should extract data field', async () => {
      const payload = { data: { orderId: '123' }, meta: {} };

      const result = await applyTransform(payload, CommonTransforms.DATA_ONLY);

      expect(result).toEqual({ orderId: '123' });
    });

    it('WRAP_EVENT should wrap in event object', async () => {
      const payload = { orderId: '123' };

      const result = await applyTransform(payload, CommonTransforms.WRAP_EVENT);

      expect(result).toEqual({ event: { orderId: '123' } });
    });
  });

  describe('clearTransformCache', () => {
    it('should clear the cache', async () => {
      // Add to cache
      await applyTransform({ a: 1 }, 'a');

      // Clear
      clearTransformCache();

      // Should not throw (expression recompiled)
      const result = await applyTransform({ a: 2 }, 'a');
      expect(result).toBe(2);
    });
  });
});
