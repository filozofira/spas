/**
 * PostgreSQL + S3 Storage Provider (Production)
 * 
 * Production implementation stub for future use.
 * Currently throws NotImplemented errors.
 * 
 * When implemented, will use:
 * - PostgreSQL with JSONB for metadata and schemas
 * - S3-compatible object store for large archives
 */

import type { IStorageProvider } from './IStorageProvider';
import type { ServiceMetadata, Schema, ServiceInfo, Runtime } from '../models/types';

interface PostgresS3Config {
  postgresUrl: string;
  s3Bucket: string;
  s3Region: string;
}

export class PostgresS3StorageProvider implements IStorageProvider {
  constructor(_config: PostgresS3Config) {}

  async initialize(): Promise<void> {
    throw new NotImplementedError(
      'PostgresS3StorageProvider is not yet implemented. Use STORAGE_PROVIDER=sqlite for PoC.'
    );
  }

  async serviceExists(_name: string, _version: string): Promise<boolean> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async publishService(
    _name: string,
    _version: string,
    _metadata: ServiceMetadata,
    _schemas: Schema[],
    _runtime?: Runtime
  ): Promise<void> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async getServiceMetadata(_name: string, _version: string): Promise<ServiceMetadata | null> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async getServiceVersions(_name: string): Promise<string[]> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async getLatestVersion(_name: string): Promise<string | null> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async getSchemas(_name: string, _version: string): Promise<Schema[]> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async getSchema(
    _name: string,
    _version: string,
    _schemaName: string
  ): Promise<Schema | null> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async searchByCapability(_capability: string): Promise<ServiceInfo[]> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async searchByBoundedContext(_context: string): Promise<ServiceInfo[]> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async deleteService(_name: string, _version: string): Promise<void> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }

  async health(): Promise<boolean> {
    throw new NotImplementedError('PostgresS3StorageProvider not implemented');
  }
}

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
