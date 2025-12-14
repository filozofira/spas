import { MetadataClient } from './metadata-client.js';
import { ArchiveReader } from './archive-reader.js';
import { RepositoryClient } from './repository-client.js';
import { ServiceIdentity } from '../types.js';
import * as readline from 'readline';

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
