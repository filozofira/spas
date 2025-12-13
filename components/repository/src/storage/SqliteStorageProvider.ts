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
import type { ServiceMetadata, Schema } from '../models/types';

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
    schemas: Schema[]
  ): Promise<void> {
    try {
      const transaction = this.db.transaction(() => {
        // Insert service metadata
        const capabilities = JSON.stringify(metadata.capabilities);
        const metadataJson = JSON.stringify(metadata);

        const insertService = this.db.prepare(`
          INSERT INTO services (service_id, version, name, description, bounded_context, capabilities, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertService.run(
          name,
          version,
          metadata.name,
          metadata.description,
          metadata.boundedContext,
          capabilities,
          metadataJson
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
    const stmt = this.db.prepare(
      'SELECT metadata FROM services WHERE service_id = ? AND version = ? LIMIT 1'
    );
    const result = stmt.get(name, version) as any;

    if (!result) {
      return null;
    }

    return JSON.parse(result.metadata);
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

  async searchByCapability(
    capability: string,
    limit = 10,
    offset = 0
  ): Promise<{ results: Array<{ name: string; version: string; title: string }>; total: number }> {
    // Count total matching
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM services
      WHERE json_extract(capabilities, '$') LIKE ?
    `);
    const countResult = countStmt.get(`%"${capability}"%`) as any;
    const total = countResult?.count || 0;

    // Get paginated results
    const stmt = this.db.prepare(`
      SELECT service_id, version, name FROM services
      WHERE json_extract(capabilities, '$') LIKE ?
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `);
    const results = stmt.all(`%"${capability}"%`, limit, offset) as Array<{
      service_id: string;
      version: string;
      name: string;
    }>;

    return { 
      results: results.map(r => ({ name: r.service_id, version: r.version, title: r.name })), 
      total 
    };
  }

  async searchByBoundedContext(
    context: string,
    limit = 10,
    offset = 0
  ): Promise<{ results: Array<{ name: string; version: string; title: string }>; total: number }> {
    // Count total matching
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM services WHERE bounded_context = ?
    `);
    const countResult = countStmt.get(context) as any;
    const total = countResult?.count || 0;

    // Get paginated results
    const stmt = this.db.prepare(`
      SELECT service_id, version, name FROM services
      WHERE bounded_context = ?
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `);
    const results = stmt.all(context, limit, offset) as Array<{
      service_id: string;
      version: string;
      name: string;
    }>;

    return { 
      results: results.map(r => ({ name: r.service_id, version: r.version, title: r.name })), 
      total 
    };
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
