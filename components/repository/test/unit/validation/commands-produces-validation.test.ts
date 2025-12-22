/**
 * Unit tests for commands[].produces[] cross-field validation.
 */

import { SpasSchemaValidator, ValidationError } from '../../../src/validation/SpasSchemaValidator';
import type { ServiceMetadata } from '../../../src/models/types';

describe('SpasSchemaValidator commands[].produces[]', () => {
  let validator: SpasSchemaValidator;

  beforeEach(() => {
    validator = new SpasSchemaValidator('./test/fixtures/spas-schema.json');
  });

  function baseMetadata(): ServiceMetadata {
    return {
      schemaVersion: 'design-time-metadata-v1',
      id: 'test-service',
      name: 'Test Service',
      description: 'A test service',
      version: '1.0.0',
      boundedContext: 'testing',
      capabilities: [],
      endpoints: [],
      events: [
        {
          type: 'com.test.order.created',
          version: '1.0',
          schemaRef: 'schemas/events/order-created.schema.json',
        },
      ],
      consistency: { commands: 'ACID', queries: 'STRONG' },
      network: { requiredEgress: [] },
      security: { dataClassification: ['internal'] },
      license: 'MIT',
    };
  }

  it('accepts metadata when produced event exists in events[]', () => {
    const metadata: ServiceMetadata = {
      ...baseMetadata(),
      commands: [
        {
          name: 'create-order',
          version: '1.0',
          produces: [
            {
              type: 'com.test.order.created',
              version: '1.0',
              when: 'success',
            },
          ],
        },
      ],
    };

    expect(() => validator.validateMetadata(metadata)).not.toThrow();
  });

  it('rejects metadata when produced event is missing from events[]', () => {
    const metadata: ServiceMetadata = {
      ...baseMetadata(),
      commands: [
        {
          name: 'create-order',
          version: '1.0',
          produces: [
            {
              type: 'com.test.order.cancelled',
              version: '1.0',
              when: 'success',
            },
          ],
        },
      ],
    };

    expect(() => validator.validateMetadata(metadata)).toThrow(ValidationError);
    expect(() => validator.validateMetadata(metadata)).toThrow('Missing produced event reference');
  });

  it('rejects metadata when a command declares duplicate produced events', () => {
    const metadata: ServiceMetadata = {
      ...baseMetadata(),
      commands: [
        {
          name: 'create-order',
          version: '1.0',
          produces: [
            {
              type: 'com.test.order.created',
              version: '1.0',
              when: 'success',
            },
            {
              type: 'com.test.order.created',
              version: '1.0',
              when: 'success',
            },
          ],
        },
      ],
    };

    expect(() => validator.validateMetadata(metadata)).toThrow(ValidationError);
    expect(() => validator.validateMetadata(metadata)).toThrow('Duplicate produced event');
  });
});
