import { MetadataClient } from './metadata-client.js';
import { ArchiveReader } from './archive-reader.js';
import { RepositoryClient } from './repository-client.js';
import { ServiceIdentity } from '../types.js';
import * as readline from 'readline';
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
        private metadataClient: MetadataClient,
        private archiveReader: ArchiveReader,
        private repositoryClient: RepositoryClient
    ) {}

    async publish(serviceHost: string): Promise<ServiceIdentity> {
        // Step 1: Prompt user to ensure service is running
        await this.promptUser(serviceHost);

        // Step 2: Download metadata from service
        const archiveBuffer = await this.metadataClient.downloadMetadata(serviceHost);

        // Step 3: Extract service identity from archive
        const identity = await this.archiveReader.extractIdentity(archiveBuffer);

        // Step 4: Publish to repository
        await this.repositoryClient.publishService(identity.id, identity.version, archiveBuffer);

        return identity;
    }

    /**
     * Dry-run mode: download and save archive locally without publishing
     */
    async publishDryRun(serviceHost: string, outputDir: string = '.'): Promise<DryRunResult> {
        // Step 1: Prompt user to ensure service is running
        await this.promptUser(serviceHost);

        // Step 2: Download metadata from service
        const archiveBuffer = await this.metadataClient.downloadMetadata(serviceHost);

        // Step 3: Extract service identity from archive
        const identity = await this.archiveReader.extractIdentity(archiveBuffer);

        // Step 4: List schemas in archive
        const schemas = this.archiveReader.listSchemas(archiveBuffer);

        // Step 5: Save archive locally (skip repository publish)
        const filename = `${identity.id}-${identity.version}.zip`;
        const savedPath = path.join(outputDir, filename);
        fs.writeFileSync(savedPath, archiveBuffer);

        return {
            identity,
            savedPath,
            schemas,
        };
    }

    private async promptUser(serviceHost: string): Promise<void> {
        return new Promise((resolve) => {
            const rl: any = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            if (typeof rl?.question !== 'function') {
                // If readline is mocked without a question implementation, skip prompt
                rl?.close?.();
                return resolve();
            }

            rl.question(
                `\nStart your service at ${serviceHost} and press Enter to continue...\n`,
                () => {
                    rl.close();
                    resolve();
                }
            );
        });
    }
}
