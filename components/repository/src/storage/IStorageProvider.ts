/**
 * Storage Provider Interface
 * 
 * Defines contract for repository storage implementations.
 * Enables swapping between SQLite (PoC) and PostgreSQL+S3 (Production)
 * without modifying business logic (Open-Closed Principle).
 */

import type { ServiceMetadata, Schema } from '../models/types';

export interface IStorageProvider {
  /**
   * Initialize storage (create tables, run migrations, create indexes)
   */
  initialize(): Promise<void>;

  /**
   * Check if service version already exists
   */
  serviceExists(name: string, version: string): Promise<boolean>;

  /**
   * Publish a new service version with metadata and schemas
   * Must be atomic (all or nothing per FR-026)
   */
  publishService(
    name: string,
    version: string,
    metadata: ServiceMetadata,
    schemas: Schema[]
  ): Promise<void>;

  /**
   * Retrieve metadata for specific service version
   */
  getServiceMetadata(name: string, version: string): Promise<ServiceMetadata | null>;

  /**
   * Get all versions of a service (descending order per FR-012)
   */
  getServiceVersions(name: string): Promise<string[]>;

  /**
   * Get latest version of a service
   */
  getLatestVersion(name: string): Promise<string | null>;

  /**
   * Get all schemas for a service version
   */
  getSchemas(name: string, version: string): Promise<Schema[]>;

  /**
   * Get specific schema by name
   */
  getSchema(name: string, version: string, schemaName: string): Promise<Schema | null>;

  /**
   * Search services by capability (JSON array field)
   * Returns service names that include the capability
   */
  searchByCapability(
    capability: string,
    limit?: number,
    offset?: number
  ): Promise<{ results: Array<{ name: string; version: string; title: string }>, total: number }>;

  /**
   * Search services by bounded context
   */
  searchByBoundedContext(
    context: string,
    limit?: number,
    offset?: number
  ): Promise<{ results: Array<{ name: string; version: string; title: string }>, total: number }>;

  /**
   * Delete a service version (cascades to schemas)
   * Must be atomic per FR-021
   */
  deleteService(name: string, version: string): Promise<void>;

  /**
   * Health check - returns true if storage is accessible
   */
  health(): Promise<boolean>;
}
