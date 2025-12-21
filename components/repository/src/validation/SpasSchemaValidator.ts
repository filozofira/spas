/**
 * SPAS Schema Validator
 * 
 * Validates service metadata and schemas against SPAS specification
 * using Ajv for JSON Schema validation.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import type { ServiceMetadata } from '../models/types';

export class SpasSchemaValidator {
  private ajv: Ajv;
  private spasSchema: Record<string, unknown>;
  private validateMetadataFn: (data: unknown) => boolean;

  constructor(spasSchemaPath: string) {
    this.ajv = new Ajv({
      strict: false,
      useDefaults: true,
      coerceTypes: true,
    });
    
    // Add format validators (uuid, email, date-time, etc.)
    addFormats(this.ajv);

    // Load SPAS schema from file
    try {
      const schemaContent = readFileSync(spasSchemaPath, 'utf-8');
      this.spasSchema = JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(
        `Failed to load SPAS schema from ${spasSchemaPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Compile the schema
    try {
      this.validateMetadataFn = this.ajv.compile(this.spasSchema);
    } catch (error) {
      throw new Error(
        `Failed to compile SPAS schema: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Validate service metadata against SPAS schema
   * Throws error if validation fails
   */
  validateMetadata(metadata: unknown): asserts metadata is ServiceMetadata {
    if (!this.validateMetadataFn(metadata)) {
      const errors = (this.validateMetadataFn as any).errors || [];
      throw new ValidationError(
        'Invalid service metadata',
        errors.map((e: any) => `${e.instancePath || 'root'}: ${e.message}`).join('; ')
      );
    }
  }

  /**
   * Validate JSON schema object structure
   */
  validateJsonSchema(schema: unknown, schemaName: string): void {
    // Basic validation that schema is a valid JSON Schema object
    if (!schema || typeof schema !== 'object') {
      throw new ValidationError(
        `Invalid schema '${schemaName}'`,
        'Schema must be a valid JSON Schema object'
      );
    }

    // Try to compile the schema with Ajv to ensure it's valid
    try {
      this.ajv.compile(schema);
    } catch (error) {
      throw new ValidationError(
        `Invalid schema '${schemaName}'`,
        error instanceof Error ? error.message : 'Schema compilation failed'
      );
    }
  }

  /**
   * Validate that metadata identifiers match path
   */
  validateIdentityMatch(
    pathId: string,
    pathVersion: string,
    metadata: ServiceMetadata
  ): void {
    if (pathId !== metadata.id) {
      throw new ValidationError(
        'Identity mismatch',
        `Path serviceId '${pathId}' does not match metadata.id '${metadata.id}'`
      );
    }

    if (pathVersion !== metadata.version) {
      throw new ValidationError(
        'Identity mismatch',
        `Path version '${pathVersion}' does not match metadata.version '${metadata.version}'`
      );
    }
  }
}

export class ValidationError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'ValidationError';
  }
}
