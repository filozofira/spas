/**
 * Schema Evolution Validator
 * 
 * Enforces additive-only schema evolution rules per SPAS specification.
 * Prevents breaking changes when new schema versions are published.
 */

import type { Schema } from '../models/types';

export class SchemaEvolutionValidator {
  /**
   * Validate that new schema only adds fields (additive-only evolution)
   * Compares against previous version schema
   *
   * Rules:
   * - New properties can be added
   * - Existing properties cannot be removed
   * - Existing properties cannot change type (for same key)
   * - Required array can only add new fields
   */
  validateEvolution(previousSchema: Schema, newSchema: Schema): void {
    if (previousSchema.name !== newSchema.name) {
      throw new EvolutionError(
        'Schema name mismatch',
        `Cannot evolve schema '${previousSchema.name}' to '${newSchema.name}'`
      );
    }

    if (previousSchema.type !== newSchema.type) {
      throw new EvolutionError(
        'Schema type changed',
        `Cannot change schema type from '${previousSchema.type}' to '${newSchema.type}'`
      );
    }

    const prevContent = previousSchema.content as Record<string, unknown>;
    const newContent = newSchema.content as Record<string, unknown>;

    // Check that no properties were removed
    const prevProps = prevContent.properties as Record<string, unknown> | undefined;
    const newProps = newContent.properties as Record<string, unknown> | undefined;

    if (prevProps && newProps) {
      for (const [key, prevProp] of Object.entries(prevProps)) {
        if (!(key in newProps)) {
          throw new EvolutionError(
            'Property removed',
            `Property '${key}' was removed in new schema version`
          );
        }

        // Check that property type hasn't changed
        const prevPropType = this.getSchemaType(prevProp);
        const newPropType = this.getSchemaType(newProps[key]);

        if (prevPropType !== newPropType && prevPropType !== null && newPropType !== null) {
          throw new EvolutionError(
            'Property type changed',
            `Property '${key}' type changed from '${prevPropType}' to '${newPropType}'`
          );
        }
      }
    }

    // Check that required array doesn't make previously optional fields required
    const prevRequired = (prevContent.required as string[]) || [];
    const newRequired = (newContent.required as string[]) || [];

    // Check for removed required fields (making required fields optional)
    const removedRequired = prevRequired.filter(r => !newRequired.includes(r));
    if (removedRequired.length > 0) {
      throw new EvolutionError(
        'Required properties removed',
        `Properties can no longer be optional: ${removedRequired.join(', ')}`
      );
    }

    // Check for added required fields that existed previously as optional
    const addedRequired = newRequired.filter(r => !prevRequired.includes(r));
    const prevPropKeys = Object.keys(prevProps || {});
    const invalidRequired = addedRequired.filter(r => prevPropKeys.includes(r));
    
    if (invalidRequired.length > 0) {
      throw new EvolutionError(
        'Optional fields made required',
        `Cannot make optional fields required: ${invalidRequired.join(', ')}`
      );
    }
  }

  /**
   * Extract type from a JSON Schema property definition
   */
  private getSchemaType(prop: unknown): string | null {
    if (!prop || typeof prop !== 'object') {
      return null;
    }

    const propObj = prop as Record<string, unknown>;
    return (propObj.type as string) || null;
  }
}

export class EvolutionError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'EvolutionError';
  }
}
