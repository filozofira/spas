/**
 * Utility functions for transforming service metadata
 * 
 * Handles transformation from design-time metadata schema to runtime metadata schema.
 * This fixes the User Story 2 bug where retrieved services show 'design-time-metadata-v1'
 * instead of the correct 'runtime-metadata-v1' schema version.
 */

import type { ServiceMetadata } from '../models/types';

/**
 * Transforms service metadata from design-time schema to runtime metadata schema
 * 
 * This function addresses the schema version transformation requirement where:
 * - Stored metadata uses 'design-time-metadata-v1' schema 
 * - Retrieved/displayed metadata should use 'runtime-metadata-v1' schema
 * 
 * @param metadata - Service metadata with design-time schema version
 * @returns Service metadata with runtime schema version
 */
export function transformToRuntimeMetadata(metadata: ServiceMetadata): ServiceMetadata {
  // Clone the metadata to avoid mutating the original
  const transformed: ServiceMetadata = {
    ...metadata,
  };

  // Transform schema version from design-time to runtime
  if (transformed.schemaVersion === 'design-time-metadata-v1') {
    transformed.schemaVersion = 'runtime-metadata-v1';
  }

  // Note: Currently this is a simple schema version transformation.
  // Future versions might require more complex field transformations
  // between design-time and runtime metadata structures.

  return transformed;
}

/**
 * Checks if metadata needs schema version transformation
 * 
 * @param metadata - Service metadata to check
 * @returns true if transformation is needed, false otherwise
 */
export function needsSchemaTransformation(metadata: ServiceMetadata): boolean {
  return metadata.schemaVersion === 'design-time-metadata-v1';
}

/**
 * Transforms an array of service metadata objects to runtime schema
 * 
 * @param metadataArray - Array of service metadata objects
 * @returns Array of transformed metadata objects
 */
export function transformMetadataArray(metadataArray: ServiceMetadata[]): ServiceMetadata[] {
  return metadataArray.map(transformToRuntimeMetadata);
}