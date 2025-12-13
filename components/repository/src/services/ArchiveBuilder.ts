/**
 * Archive Builder Service
 * 
 * Creates ZIP archives containing spas.json and schemas for download
 */

import archiver from 'archiver';
import type { ServiceMetadata, Schema } from '../models/types';
import { Readable } from 'stream';

export class ArchiveBuilder {
  /**
   * Build a ZIP archive containing service metadata and schemas
   * @param metadata - Service metadata (spas.json content)
   * @param schemas - Array of schemas to include
   * @returns Readable stream of ZIP archive
   */
  async buildArchive(metadata: ServiceMetadata, schemas: Schema[]): Promise<Readable> {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Add spas.json
    archive.append(JSON.stringify(metadata, null, 2), { name: 'spas.json' });

    // Add schemas
    for (const schema of schemas) {
      const schemaPath = this.getSchemaPath(schema);
      archive.append(JSON.stringify(schema.content, null, 2), { name: schemaPath });
    }

    // Finalize the archive
    archive.finalize();

    return archive;
  }

  /**
   * Determine the file path for a schema based on its type and name
   * @param schema - Schema object
   * @returns Relative file path for the schema
   */
  private getSchemaPath(schema: Schema): string {
    // Infer directory from schema type
    const directory = schema.type === 'event' 
      ? 'schemas/events' 
      : schema.type === 'endpoint'
      ? 'schemas/endpoints'
      : 'schemas/internal';

    // Ensure .json extension
    const fileName = schema.name.endsWith('.json') 
      ? schema.name 
      : `${schema.name}.json`;

    return `${directory}/${fileName}`;
  }
}

export class ArchiveBuilderError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'ArchiveBuilderError';
  }
}
