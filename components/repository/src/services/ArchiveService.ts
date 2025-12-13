/**
 * Archive Service
 * 
 * Handles extraction and parsing of service archive files (ZIP)
 */

import unzipper from 'unzipper';
import { Readable } from 'stream';
import type { ServiceMetadata, Schema } from '../models/types';

export interface ExtractedArchive {
  metadata: ServiceMetadata;
  schemas: Schema[];
}

export class ArchiveService {
  /**
   * Extract and parse service archive from multipart upload
   * @param fileStream - Readable stream of ZIP file
   * @returns Extracted metadata and schemas
   */
  async extractArchive(fileStream: Readable): Promise<ExtractedArchive> {
    let metadata: ServiceMetadata | null = null;
    const schemas: Schema[] = [];
    const entries: any[] = [];

    try {
      // Collect all entries first
      for await (const entry of fileStream.pipe(unzipper.Parse({ forceStream: true }))) {
        entries.push(entry);
      }
    } catch (error) {
      throw new ArchiveError(
        'Failed to extract archive',
        error instanceof Error ? error.message : 'Unknown extraction error'
      );
    }

    // Find and parse spas.json
    const metadataEntry = entries.find(e => e.path === 'spas.json' || e.path.endsWith('/spas.json'));
    if (!metadataEntry) {
      throw new ArchiveError('Missing spas.json', 'Archive must contain spas.json at root');
    }

    const metadataContent = await this.streamToString(metadataEntry);
    try {
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      throw new ArchiveError(
        'Invalid spas.json',
        error instanceof Error ? error.message : 'Failed to parse JSON'
      );
    }

    // Extract schema files (*.json files in schemas/ or metadata/ directory)
    const schemaEntries = entries.filter(
      e =>
        e.type === 'File' &&
        e.path.endsWith('.json') &&
        (e.path.includes('schemas/') || e.path.includes('metadata/')) &&
        !e.path.endsWith('spas.json')
    );

    for (const schemaEntry of schemaEntries) {
      const content = await this.streamToString(schemaEntry);
      try {
        const schemaContent = JSON.parse(content);
        const schemaName = this.extractSchemaName(schemaEntry.path);
        const schemaType = this.inferSchemaType(schemaEntry.path, schemaName);

        schemas.push({
          name: schemaName,
          type: schemaType,
          content: schemaContent,
        });
      } catch (error) {
        throw new ArchiveError(
          `Invalid schema file: ${schemaEntry.path}`,
          error instanceof Error ? error.message : 'Failed to parse schema JSON'
        );
      }
    }

    if (!metadata) {
      throw new ArchiveError('Missing metadata', 'Failed to extract spas.json from archive');
    }

    return { metadata, schemas };
  }

  /**
   * Convert stream to string
   */
  private async streamToString(stream: any): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  /**
   * Extract schema name from file path
   */
  private extractSchemaName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace('.json', '');
  }

  /**
   * Infer schema type from path and filename
   */
  private inferSchemaType(filePath: string, name: string): 'event' | 'internal' | 'endpoint' {
    const lowerPath = filePath.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerPath.includes('event') || lowerName.includes('event')) {
      return 'event';
    }
    if (lowerPath.includes('endpoint') || lowerName.includes('endpoint')) {
      return 'endpoint';
    }
    return 'internal';
  }
}

export class ArchiveError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'ArchiveError';
  }
}
