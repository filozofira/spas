/**
 * Retrieval Service
 * 
 * Orchestrates service metadata and schema retrieval operations
 * Includes schema version transformation for User Story 2 bug fix
 */

import type { IStorageProvider } from '../storage/IStorageProvider';
import type { ServiceMetadata, Schema, ServiceInfo } from '../models/types';
import { ArchiveBuilder } from './ArchiveBuilder';
import { Readable } from 'stream';
import { transformToRuntimeMetadata } from '../utils/metadata-transformer';

export interface ServiceVersionInfo {
  version: string;
  publishedAt?: string;
}

export class RetrievalService {
  private archiveBuilder: ArchiveBuilder;

  constructor(private storage: IStorageProvider) {
    this.archiveBuilder = new ArchiveBuilder();
  }

  /**
   * Get service information (latest version)
   * @param serviceName - Service identifier
   * @returns Service information or null if not found
   */
  async getServiceInfo(serviceName: string): Promise<ServiceInfo | null> {
    const latestVersion = await this.storage.getLatestVersion(serviceName);
    if (!latestVersion) {
      return null;
    }

    const metadata = await this.storage.getServiceMetadata(serviceName, latestVersion);
    if (!metadata) {
      return null;
    }

    return {
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
      description: metadata.description || '',
      boundedContext: metadata.boundedContext,
      capabilities: metadata.capabilities || [],
      runtime: metadata.runtime,
    };
  }

  /**
   * Get all versions for a service
   * @param serviceName - Service identifier
   * @returns Array of versions in descending order
   */
  async getVersions(serviceName: string): Promise<string[]> {
    return this.storage.getServiceVersions(serviceName);
  }

  /**
   * Get complete metadata for a specific service version
   * User Story 2: Transform schema version from design-time to runtime
   * @param serviceName - Service identifier
   * @param version - Version number
   * @returns Service metadata with runtime schema version or null if not found
   */
  async getMetadata(serviceName: string, version: string): Promise<ServiceMetadata | null> {
    const metadata = await this.storage.getServiceMetadata(serviceName, version);
    if (!metadata) {
      return null;
    }

    // Transform schema version from design-time to runtime
    return transformToRuntimeMetadata(metadata);
  }

  /**
   * Get all schemas for a service version
   * @param serviceName - Service identifier
   * @param version - Version number
   * @returns Array of schemas
   */
  async getSchemas(serviceName: string, version: string): Promise<Schema[]> {
    return this.storage.getSchemas(serviceName, version);
  }

  /**
   * Get a specific schema by name
   * @param serviceName - Service identifier
   * @param version - Version number
   * @param schemaName - Schema name
   * @returns Schema or null if not found
   */
  async getSchema(
    serviceName: string,
    version: string,
    schemaName: string
  ): Promise<Schema | null> {
    return this.storage.getSchema(serviceName, version, schemaName);
  }

  /**
   * Build downloadable archive for a service version
   * User Story 2: Transform metadata before archive creation  
   * @param serviceName - Service identifier
   * @param version - Version number
   * @returns ZIP archive stream or null if service not found
   */
  async buildDownloadArchive(
    serviceName: string,
    version: string
  ): Promise<Readable | null> {
    const rawMetadata = await this.storage.getServiceMetadata(serviceName, version);
    if (!rawMetadata) {
      return null;
    }

    // Transform schema version from design-time to runtime for download
    const metadata = transformToRuntimeMetadata(rawMetadata);
    const schemas = await this.storage.getSchemas(serviceName, version);

    return this.archiveBuilder.buildArchive(metadata, schemas);
  }
}

export class RetrievalError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'RetrievalError';
  }
}
