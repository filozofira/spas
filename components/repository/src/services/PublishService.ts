/**
 * Publish Service
 * 
 * Orchestrates service publishing workflow:
 * - Extract archive
 * - Validate metadata and schemas
 * - Check for duplicates
 * - Store in repository
 */

import type { IStorageProvider } from '../storage/IStorageProvider';
import type { Runtime } from '../models/types';
import { ArchiveService } from './ArchiveService';
import { SpasSchemaValidator } from '../validation/SpasSchemaValidator';
import { SchemaEvolutionValidator } from '../validation/SchemaEvolutionValidator';
import { VersionValidator } from '../validation/VersionValidator';
import { Readable } from 'stream';

export interface PublishRequest {
  serviceId: string;
  version: string;
  archiveStream: Readable;
  checksum?: string;
  runtime?: {
    digest?: string;
    repository?: string;
    tag?: string;
  };
}

export class PublishService {
  private archiveService: ArchiveService;
  private schemaValidator: SpasSchemaValidator;
  private evolutionValidator: SchemaEvolutionValidator;

  constructor(
    private storage: IStorageProvider,
    spasSchemaPath: string
  ) {
    this.archiveService = new ArchiveService();
    this.schemaValidator = new SpasSchemaValidator(spasSchemaPath);
    this.evolutionValidator = new SchemaEvolutionValidator();
  }

  /**
   * Publish a new service version
   * Implements FR-001 through FR-010
   */
  async publish(request: PublishRequest): Promise<void> {
    const { serviceId, version, archiveStream, checksum, runtime } = request;

    // FR-002: Validate version format
    VersionValidator.validate(version);

    // FR-003: Check for duplicate
    const exists = await this.storage.serviceExists(serviceId, version);
    if (exists) {
      throw new PublishError(
        'Duplicate service version',
        `Service ${serviceId}:${version} already exists`
      );
    }

    // FR-008a & FR-004: Stream checksum validation + archive extraction in one pass
    // Use PassThrough stream to avoid buffering entire file in memory (important for 10MB limit)
    let extractedData: { metadata: any; schemas: any[] };
    let actualChecksum: string | undefined;

    if (checksum) {
      // Calculate checksum while streaming (memory-efficient)
      const { createHash } = await import('crypto');
      const { PassThrough } = await import('stream');
      const { pipeline } = await import('stream/promises');
      
      const hash = createHash('sha256');
      const passThrough = new PassThrough();

      // Calculate hash as data flows through
      passThrough.on('data', (chunk) => {
        hash.update(chunk);
      });

      // Start extraction from passThrough stream
      const extractionPromise = this.archiveService.extractArchive(passThrough);

      // Pipe original stream through passThrough
      try {
        await pipeline(archiveStream, passThrough);
      } catch (err) {
        throw new Error('Failed to process archive stream');
      }

      // Get extraction results and calculated checksum
      extractedData = await extractionPromise;
      actualChecksum = hash.digest('hex');

      // Verify checksum matches
      if (actualChecksum !== checksum.toLowerCase()) {
        const { ChecksumError } = await import('./ChecksumService');
        throw new ChecksumError(
          'Checksum mismatch',
          `Expected ${checksum}, got ${actualChecksum}`
        );
      }
    } else {
      // No checksum validation - direct extraction
      extractedData = await this.archiveService.extractArchive(archiveStream);
    }

    const { metadata, schemas } = extractedData;

    // FR-005: Validate metadata against SPAS schema
    this.schemaValidator.validateMetadata(metadata);

    // FR-006: Validate path authority (identity match)
    this.schemaValidator.validateIdentityMatch(serviceId, version, metadata);

    // FR-007: Validate all schemas
    for (const schema of schemas) {
      this.schemaValidator.validateJsonSchema(schema.content, schema.name);
    }

    // FR-009: Check schema evolution (additive-only)
    const latestVersion = await this.storage.getLatestVersion(serviceId);
    if (latestVersion && VersionValidator.compare(version, latestVersion) > 0) {
      const previousSchemas = await this.storage.getSchemas(serviceId, latestVersion);
      
      // Check each schema that exists in both versions
      for (const newSchema of schemas) {
        const prevSchema = previousSchemas.find(s => s.name === newSchema.name);
        if (prevSchema) {
          this.evolutionValidator.validateEvolution(prevSchema, newSchema);
        }
      }
    }

    // FR-010 & FR-026: Store metadata and schemas atomically
    // Add publishedAt timestamp
    const runtimeMetadata = {
      ...metadata,
      publishedAt: new Date().toISOString(),
    };

    // Build runtime metadata from request if provided
    let runtimeInfo: Runtime | undefined;
    if (runtime?.digest || runtime?.repository || runtime?.tag) {
      runtimeInfo = {
        digest: runtime.digest,
        repository: runtime.repository,
        tag: runtime.tag,
        // Construct full image reference if we have repository and either tag or digest
        image: runtime.repository 
          ? runtime.digest 
            ? `${runtime.repository}@${runtime.digest}`
            : runtime.tag
              ? `${runtime.repository}:${runtime.tag}`
              : undefined
          : undefined,
      };
    }

    await this.storage.publishService(serviceId, version, runtimeMetadata, schemas, runtimeInfo);
  }
}

export class PublishError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'PublishError';
  }
}
