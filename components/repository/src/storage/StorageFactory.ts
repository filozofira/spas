/**
 * Storage Factory
 * 
 * Creates appropriate storage provider based on environment configuration.
 * Enables switching between SQLite (PoC) and PostgreSQL+S3 (Production)
 */

import type { StorageConfig } from '../models/types';
import type { IStorageProvider } from './IStorageProvider';
import { SqliteStorageProvider } from './SqliteStorageProvider';
import { PostgresS3StorageProvider } from './PostgresS3StorageProvider';

export class StorageFactory {
  static createProvider(config: StorageConfig): IStorageProvider {
    if (config.provider === 'sqlite') {
      if (!config.sqlitePath) {
        throw new Error('SQLITE_PATH required when STORAGE_PROVIDER=sqlite');
      }
      return new SqliteStorageProvider(config.sqlitePath);
    }

    if (config.provider === 'postgres') {
      if (!config.postgresUrl || !config.s3Bucket || !config.s3Region) {
        throw new Error(
          'POSTGRES_URL, S3_BUCKET, S3_REGION required when STORAGE_PROVIDER=postgres'
        );
      }
      return new PostgresS3StorageProvider({
        postgresUrl: config.postgresUrl,
        s3Bucket: config.s3Bucket,
        s3Region: config.s3Region,
      });
    }

    throw new Error(`Unknown storage provider: ${config.provider}`);
  }
}
