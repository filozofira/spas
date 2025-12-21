/**
 * Environment Configuration Loader
 * 
 * Loads and validates configuration from environment variables.
 * Provides defaults where appropriate.
 */

import type { AppConfig, StorageConfig } from './models/types';

export class ConfigLoader {
  static load(): AppConfig {
    const port = parseInt(process.env.PORT || '3000', 10);
    const nodeEnv = (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'production'
      | 'test';
    const logLevel = (process.env.LOG_LEVEL || 'info') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error';

    const storageProvider = (process.env.STORAGE_PROVIDER || 'sqlite') as 'sqlite' | 'postgres';
    const spasSchemaPath =
      process.env.SPAS_SCHEMA_PATH || './schemas/design-time-metadata-v1.schema.json';

    const storage: StorageConfig = {
      provider: storageProvider,
    };

    if (storageProvider === 'sqlite') {
      storage.sqlitePath = process.env.SQLITE_PATH || './data/repository.db';
    } else if (storageProvider === 'postgres') {
      storage.postgresUrl = process.env.POSTGRES_URL;
      storage.s3Bucket = process.env.S3_BUCKET;
      storage.s3Region = process.env.S3_REGION;

      if (!storage.postgresUrl || !storage.s3Bucket || !storage.s3Region) {
        throw new Error(
          'POSTGRES_URL, S3_BUCKET, S3_REGION required when STORAGE_PROVIDER=postgres'
        );
      }
    }

    return {
      port,
      nodeEnv,
      logLevel,
      storage,
      zipkinUrl: process.env.ZIPKIN_URL,
      spasSchemaPath,
    };
  }
}
