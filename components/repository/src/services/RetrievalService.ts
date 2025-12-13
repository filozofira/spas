/**
 * Retrieval Service
 * 
 * Orchestrates service metadata and schema retrieval operations
 */

import type { IStorageProvider } from '../storage/IStorageProvider';
import type { ServiceMetadata, Schema } from '../models/types';
import { ArchiveBuilder } from './ArchiveBuilder';
import { Readable } from 'stream';

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  boundedContext: string;
  capabilities: string[];
}

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
   * @param serviceName - Service identifier
   * @param version - Version number
   * @returns Service metadata or null if not found
   */
  async getMetadata(serviceName: string, version: string): Promise<ServiceMetadata | null> {
    return this.storage.getServiceMetadata(serviceName, version);
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
   * @param serviceName - Service identifier
   * @param version - Version number
   * @returns ZIP archive stream or null if service not found
   */
  async buildDownloadArchive(
    serviceName: string,
    version: string
  ): Promise<Readable | null> {
    const metadata = await this.storage.getServiceMetadata(serviceName, version);
    if (!metadata) {
      return null;
    }

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
