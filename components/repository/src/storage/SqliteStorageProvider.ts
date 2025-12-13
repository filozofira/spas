/**
 * SQLite Storage Provider
 * 
 * PoC implementation of IStorageProvider using better-sqlite3
 * Provides ACID transactions, JSON support, and fast queries
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { IStorageProvider } from './IStorageProvider';
import type { ServiceMetadata, Schema, ServiceInfo, Runtime } from '../models/types';

export class SqliteStorageProvider implements IStorageProvider {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
  }

  async initialize(): Promise<void> {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by statement and execute each
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        this.db.exec(statement);
      }
    }
  }

  async serviceExists(name: string, version: string): Promise<boolean> {
    const stmt = this.db.prepare(
      'SELECT 1 FROM services WHERE service_id = ? AND version = ? LIMIT 1'
    );
    const result = stmt.get(name, version);
    return !!result;
  }

  async publishService(
    name: string,
    version: string,
    metadata: ServiceMetadata,
    schemas: Schema[],
    runtime?: Runtime
  ): Promise<void> {
    try {
      const transaction = this.db.transaction(() => {
        // Insert service metadata
        const capabilities = JSON.stringify(metadata.capabilities);
        const metadataJson = JSON.stringify(metadata);

        const insertService = this.db.prepare(`
          INSERT INTO services (
            service_id, version, name, description, bounded_context, capabilities, metadata,
            image_digest, image_repository, image_tag
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertService.run(
          name,
          version,
          metadata.name,
          metadata.description,
          metadata.boundedContext,
          capabilities,
          metadataJson,
          runtime?.digest || null,
          runtime?.repository || null,
          runtime?.tag || null
        );

        // Insert schemas
        const insertSchema = this.db.prepare(`
          INSERT INTO schemas (service_id, service_version, name, type, content)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const schema of schemas) {
          insertSchema.run(name, version, schema.name, schema.type, JSON.stringify(schema.content));
        }
      });

      transaction();
    } catch (error: any) {
      // Check for unique constraint violations (duplicate service/version)
      if (error.message && error.message.includes('UNIQUE constraint')) {
        throw new Error(`Service ${name}:${version} already exists`);
      }
      throw error;
    }
  }

  async getServiceMetadata(name: string, version: string): Promise<ServiceMetadata | null> {
    const stmt = this.db.prepare(`
      SELECT metadata, image_digest, image_repository, image_tag 
      FROM services 
      WHERE service_id = ? AND version = ? 
      LIMIT 1
    `);
    const result = stmt.get(name, version) as any;

    if (!result) {
      return null;
    }

    const metadata = JSON.parse(result.metadata) as ServiceMetadata;

    // Add runtime metadata if available
    if (result.image_digest || result.image_repository || result.image_tag) {
      metadata.runtime = {
        digest: result.image_digest || undefined,
        repository: result.image_repository || undefined,
        tag: result.image_tag || undefined,
        image: result.image_repository
          ? result.image_digest
            ? `${result.image_repository}@${result.image_digest}`
            : result.image_tag
              ? `${result.image_repository}:${result.image_tag}`
              : undefined
          : undefined,
      };
    }

    return metadata;
  }

  async getServiceVersions(name: string): Promise<string[]> {
    const stmt = this.db.prepare(
      'SELECT version FROM services WHERE service_id = ? ORDER BY version DESC'
    );
    const results = stmt.all(name) as Array<{ version: string }>;
    return results.map(r => r.version);
  }

  async getLatestVersion(name: string): Promise<string | null> {
    const stmt = this.db.prepare(
      'SELECT version FROM services WHERE service_id = ? ORDER BY version DESC LIMIT 1'
    );
    const result = stmt.get(name) as any;
    return result?.version || null;
  }

  async getSchemas(name: string, version: string): Promise<Schema[]> {
    const stmt = this.db.prepare(
      'SELECT name, type, content FROM schemas WHERE service_id = ? AND service_version = ? ORDER BY name'
    );
    const results = stmt.all(name, version) as Array<{ name: string; type: string; content: string }>;

    return results.map(r => ({
      name: r.name,
      type: r.type as 'event' | 'internal' | 'endpoint',
      content: JSON.parse(r.content),
    }));
  }

  async getSchema(name: string, version: string, schemaName: string): Promise<Schema | null> {
    const stmt = this.db.prepare(
      'SELECT name, type, content FROM schemas WHERE service_id = ? AND service_version = ? AND name = ? LIMIT 1'
    );
    const result = stmt.get(name, version, schemaName) as any;

    if (!result) {
      return null;
    }

    return {
      name: result.name,
      type: result.type,
      content: JSON.parse(result.content),
    };
  }

  async searchByCapability(capability: string): Promise<ServiceInfo[]> {
    // Use json_each to query JSON array of capabilities
    // Return latest version only per service using GROUP BY and MAX(version)
    const stmt = this.db.prepare(`
      SELECT 
        service_id,
        MAX(version) as version,
        name,
        description,
        bounded_context,
        capabilities,
        published_at,
        image_digest,
        image_repository,
        image_tag
      FROM services, json_each(services.capabilities)
      WHERE json_each.value = ?
      GROUP BY service_id
      ORDER BY published_at DESC
    `);
    
    const results = stmt.all(capability) as Array<{
      service_id: string;
      version: string;
      name: string;
      description: string;
      bounded_context: string;
      capabilities: string;
      published_at: string;
      image_digest: string | null;
      image_repository: string | null;
      image_tag: string | null;
    }>;

    return results.map(r => {
      const info: ServiceInfo = {
        id: r.service_id,
        name: r.name,
        version: r.version,
        description: r.description,
        boundedContext: r.bounded_context,
        capabilities: JSON.parse(r.capabilities),
        publishedAt: r.published_at,
      };

      // Add runtime if available
      if (r.image_digest || r.image_repository || r.image_tag) {
        info.runtime = {
          digest: r.image_digest || undefined,
          repository: r.image_repository || undefined,
          tag: r.image_tag || undefined,
          image: r.image_repository
            ? r.image_digest
              ? `${r.image_repository}@${r.image_digest}`
              : r.image_tag
                ? `${r.image_repository}:${r.image_tag}`
                : undefined
            : undefined,
        };
      }

      return info;
    });
  }

  async searchByBoundedContext(context: string): Promise<ServiceInfo[]> {
    // Return latest version only per service using GROUP BY and MAX(version)
    const stmt = this.db.prepare(`
      SELECT 
        service_id,
        MAX(version) as version,
        name,
        description,
        bounded_context,
        capabilities,
        published_at,
        image_digest,
        image_repository,
        image_tag
      FROM services
      WHERE bounded_context = ?
      GROUP BY service_id
      ORDER BY published_at DESC
    `);
    
    const results = stmt.all(context) as Array<{
      service_id: string;
      version: string;
      name: string;
      description: string;
      bounded_context: string;
      capabilities: string;
      published_at: string;
      image_digest: string | null;
      image_repository: string | null;
      image_tag: string | null;
    }>;

    return results.map(r => {
      const info: ServiceInfo = {
        id: r.service_id,
        name: r.name,
        version: r.version,
        description: r.description,
        boundedContext: r.bounded_context,
        capabilities: JSON.parse(r.capabilities),
        publishedAt: r.published_at,
      };

      // Add runtime if available
      if (r.image_digest || r.image_repository || r.image_tag) {
        info.runtime = {
          digest: r.image_digest || undefined,
          repository: r.image_repository || undefined,
          tag: r.image_tag || undefined,
          image: r.image_repository
            ? r.image_digest
              ? `${r.image_repository}@${r.image_digest}`
              : r.image_tag
                ? `${r.image_repository}:${r.image_tag}`
                : undefined
            : undefined,
        };
      }

      return info;
    });
  }

  async deleteService(name: string, version: string): Promise<void> {
    const transaction = this.db.transaction(() => {
      const deleteSchemas = this.db.prepare(
        'DELETE FROM schemas WHERE service_id = ? AND service_version = ?'
      );
      deleteSchemas.run(name, version);

      const deleteService = this.db.prepare(
        'DELETE FROM services WHERE service_id = ? AND version = ?'
      );
      deleteService.run(name, version);
    });

    transaction();
  }

  async health(): Promise<boolean> {
    try {
      const stmt = this.db.prepare('SELECT 1');
      stmt.get();
      return true;
    } catch {
      return false;
    }
  }
}
