import { ArchiveReader } from './archive-reader.js';
import { RepositoryClient } from './repository-client.js';
import { ServiceIdentity, RuntimeMetadata } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of a dry-run publish operation
 */
export interface DryRunResult {
    /** Service identity extracted from archive */
    identity: ServiceIdentity;
    /** Path where archive was saved */
    savedPath: string;
    /** List of schema files in archive */
    schemas: string[];
}

export class PublishService {
    constructor(
        private archiveReader: ArchiveReader,
        private repositoryClient: RepositoryClient
    ) {}

    /**
     * Dry-run mode: read a local archive, inspect contents, and write a normalized copy.
     */
    async dryRunFromArchive(archivePath: string, outputDir: string = '.'): Promise<DryRunResult> {
        const archiveBuffer = fs.readFileSync(archivePath);

        const identity = await this.archiveReader.extractIdentity(archiveBuffer);
        const schemas = this.archiveReader.listSchemas(archiveBuffer);

        const filename = `${identity.id}-${identity.version}.zip`;
        const savedPath = path.join(outputDir, filename);
        fs.writeFileSync(savedPath, archiveBuffer);

        return {
            identity,
            savedPath,
            schemas,
        };
    }

    /**
     * Archive mode: publish from local ZIP file without running service
     */
    async publishFromArchive(
        archivePath: string,
        runtimeMetadata?: RuntimeMetadata
    ): Promise<ServiceIdentity> {
        // Step 1: Read local archive file (no user prompt needed)
        const archiveBuffer = fs.readFileSync(archivePath);

        // Step 2: Extract service identity from archive (validates spas.json exists)
        const identity = await this.archiveReader.extractIdentity(archiveBuffer);

        // Step 3: Publish to repository with optional runtime metadata
        await this.repositoryClient.publishService(
            identity.id,
            identity.version,
            archiveBuffer,
            runtimeMetadata
        );

        return identity;
    }
}
