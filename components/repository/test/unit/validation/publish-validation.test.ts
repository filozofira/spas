/**
 * Unit tests for validation components
 */

import { SpasSchemaValidator, ValidationError } from '../../../src/validation/SpasSchemaValidator';
import { SchemaEvolutionValidator, EvolutionError } from '../../../src/validation/SchemaEvolutionValidator';
import { VersionValidator, VersionError } from '../../../src/validation/VersionValidator';
import type { ServiceMetadata, Schema } from '../../../src/models/types';

describe('SpasSchemaValidator', () => {
  let validator: SpasSchemaValidator;

  beforeEach(() => {
    validator = new SpasSchemaValidator('./test/fixtures/spas-schema.json');
  });

  describe('validateMetadata', () => {
    const validMetadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'test-service',
      name: 'Test Service',
      description: 'A test service',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: ['test-capability'],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };

    it('should validate correct metadata', () => {
      expect(() => validator.validateMetadata(validMetadata)).not.toThrow();
    });

    it('should reject metadata missing required fields', () => {
      const invalid = { ...validMetadata, id: undefined } as any;
      expect(() => validator.validateMetadata(invalid)).toThrow(ValidationError);
    });

    it('should reject metadata with invalid version format', () => {
      const invalid = { ...validMetadata, version: 'invalid' };
      expect(() => validator.validateMetadata(invalid)).toThrow(ValidationError);
    });

    it('should reject metadata with invalid service ID format', () => {
      const invalid = { ...validMetadata, id: 'Invalid_Service' };
      expect(() => validator.validateMetadata(invalid)).toThrow(ValidationError);
    });

    it('should accept metadata with optional endpoint descriptions', () => {
      const withDescriptions = {
        ...validMetadata,
        endpoints: [
          {
            name: 'test-endpoint',
            type: 'Command',
            protocol: 'Http',
            methodPath: '/api/test',
            version: '1.0',
            schemaRef: 'test.json',
            description: 'This is a test endpoint description',
          },
        ],
      };
      expect(() => validator.validateMetadata(withDescriptions)).not.toThrow();
    });

    it('should accept metadata with optional event descriptions', () => {
      const withDescriptions = {
        ...validMetadata,
        events: [
          {
            type: 'test.event',
            version: '1.0',
            schemaRef: 'event.json',
            description: 'This is a test event description',
          },
        ],
      };
      expect(() => validator.validateMetadata(withDescriptions)).not.toThrow();
    });

    it('should accept metadata without optional descriptions (backward compatibility)', () => {
      const withoutDescriptions = {
        ...validMetadata,
        endpoints: [
          {
            name: 'test-endpoint',
            type: 'Query',
            protocol: 'Http',
            methodPath: '/api/test',
            version: '1.0',
            schemaRef: 'test.json',
          },
        ],
        events: [
          {
            type: 'test.event',
            version: '1.0',
            schemaRef: 'event.json',
          },
        ],
      };
      expect(() => validator.validateMetadata(withoutDescriptions)).not.toThrow();
    });
  });

  describe('validateIdentityMatch', () => {
    const metadata: ServiceMetadata = {
      schemaVersion: 'design-time-metadata-v1',
      id: 'my-service',
      name: 'My Service',
      description: 'Test',
      version: '1.0.0',
      boundedContext: 'test',
      capabilities: [],
      endpoints: [],
      events: [],
      consistency: { commands: 'ACID', queries: 'EVENTUAL' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['public'] },
      license: 'Apache-2.0',
    };

    it('should pass when path matches metadata', () => {
      expect(() => 
        validator.validateIdentityMatch('my-service', '1.0.0', metadata)
      ).not.toThrow();
    });

    it('should fail when service ID does not match', () => {
      expect(() => 
        validator.validateIdentityMatch('different-service', '1.0.0', metadata)
      ).toThrow(ValidationError);
      expect(() => 
        validator.validateIdentityMatch('different-service', '1.0.0', metadata)
      ).toThrow('Identity mismatch');
    });

    it('should fail when version does not match', () => {
      expect(() => 
        validator.validateIdentityMatch('my-service', '2.0.0', metadata)
      ).toThrow(ValidationError);
      expect(() => 
        validator.validateIdentityMatch('my-service', '2.0.0', metadata)
      ).toThrow('Identity mismatch');
    });
  });

  describe('validateJsonSchema', () => {
    it('should validate correct JSON schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };
      expect(() => validator.validateJsonSchema(schema, 'test-schema')).not.toThrow();
    });

    it('should reject non-object schemas', () => {
      expect(() => validator.validateJsonSchema('not an object', 'test')).toThrow(ValidationError);
    });

    it('should reject invalid JSON schema', () => {
      const invalid = { type: 'invalid-type' };
      expect(() => validator.validateJsonSchema(invalid, 'test')).toThrow(ValidationError);
    });
  });
});

describe('SchemaEvolutionValidator', () => {
  let validator: SchemaEvolutionValidator;

  beforeEach(() => {
    validator = new SchemaEvolutionValidator();
  });

  describe('validateEvolution', () => {
    const baseSchema: Schema = {
      name: 'order-created',
      type: 'event',
      content: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['orderId'],
      },
    };

    it('should allow adding new optional properties', () => {
      const newSchema: Schema = {
        ...baseSchema,
        content: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'number' },
            newField: { type: 'string' },
          },
          required: ['orderId'],
        },
      };

      expect(() => validator.validateEvolution(baseSchema, newSchema)).not.toThrow();
    });

    it('should reject removing properties', () => {
      const newSchema: Schema = {
        ...baseSchema,
        content: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
          },
          required: ['orderId'],
        },
      };

      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow(EvolutionError);
      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow('Property removed');
    });

    it('should reject changing property types', () => {
      const newSchema: Schema = {
        ...baseSchema,
        content: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'string' }, // Changed from number to string
          },
          required: ['orderId'],
        },
      };

      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow(EvolutionError);
      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow('Property type changed');
    });

    it('should reject making optional fields required', () => {
      const newSchema: Schema = {
        ...baseSchema,
        content: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'number' },
          },
          required: ['orderId', 'amount'], // Added amount to required
        },
      };

      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow(EvolutionError);
    });

    it('should reject changing schema type', () => {
      const newSchema: Schema = {
        ...baseSchema,
        type: 'internal',
      };

      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow(EvolutionError);
      expect(() => validator.validateEvolution(baseSchema, newSchema)).toThrow('Schema type changed');
    });
  });
});

describe('VersionValidator', () => {
  describe('validate', () => {
    it('should accept valid semver versions', () => {
      expect(() => VersionValidator.validate('1.0.0')).not.toThrow();
      expect(() => VersionValidator.validate('0.1.0')).not.toThrow();
      expect(() => VersionValidator.validate('10.20.30')).not.toThrow();
    });

    it('should reject invalid version formats', () => {
      expect(() => VersionValidator.validate('1.0')).toThrow(VersionError);
      expect(() => VersionValidator.validate('v1.0.0')).toThrow(VersionError);
      expect(() => VersionValidator.validate('1.0.0-beta')).toThrow(VersionError);
      expect(() => VersionValidator.validate('invalid')).toThrow(VersionError);
    });
  });

  describe('compare', () => {
    it('should correctly compare versions', () => {
      expect(VersionValidator.compare('1.0.0', '1.0.0')).toBe(0);
      expect(VersionValidator.compare('2.0.0', '1.0.0')).toBe(1);
      expect(VersionValidator.compare('1.0.0', '2.0.0')).toBe(-1);
      expect(VersionValidator.compare('1.5.0', '1.4.0')).toBe(1);
      expect(VersionValidator.compare('1.0.5', '1.0.4')).toBe(1);
    });
  });

  describe('latest', () => {
    it('should return latest version from array', () => {
      const versions = ['1.0.0', '2.0.0', '1.5.0', '2.1.0'];
      expect(VersionValidator.latest(versions)).toBe('2.1.0');
    });

    it('should return null for empty array', () => {
      expect(VersionValidator.latest([])).toBe(null);
    });
  });

  describe('sortDescending', () => {
    it('should sort versions in descending order', () => {
      const versions = ['1.0.0', '2.0.0', '1.5.0', '2.1.0'];
      const sorted = VersionValidator.sortDescending(versions);
      expect(sorted).toEqual(['2.1.0', '2.0.0', '1.5.0', '1.0.0']);
    });
  });
});
