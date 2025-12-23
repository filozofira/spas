import { MetadataClient } from './metadata-client.js';
import { ArchiveReader } from './archive-reader.js';
import { RepositoryClient } from './repository-client.js';
import { ServiceIdentity, RuntimeMetadata, ErrorCode, CliError } from '../types.js';
import { retryWithBackoff } from '../utils/retry.js';
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

    async publish(serviceHost: string, runtimeMetadata?: RuntimeMetadata, skipRetry: boolean = false): Promise<ServiceIdentity> {
        // Step 1: Download metadata from service with retry logic
        const archiveBuffer = await this.downloadMetadataWithRetry(serviceHost, skipRetry);

        // Step 3: Extract service identity from archive
        const identity = await this.archiveReader.extractIdentity(archiveBuffer);

        // Step 4: Publish to repository with optional runtime metadata
        await this.repositoryClient.publishService(
            identity.id,
            identity.version,
            archiveBuffer,
            runtimeMetadata
        );

        return identity;
    }

    /**
     * Dry-run mode: download and save archive locally without publishing
     */
    async publishDryRun(serviceHost: string, outputDir: string = '.', skipRetry: boolean = false): Promise<DryRunResult> {
        // Step 1: Download metadata from service with retry logic
        const archiveBuffer = await this.downloadMetadataWithRetry(serviceHost, skipRetry);

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

    /**
     * Download metadata with retry logic and error classification
     */
    private async downloadMetadataWithRetry(serviceHost: string, skipRetry: boolean): Promise<Buffer> {
        if (skipRetry) {
            // No retry - fail immediately
            return await this.metadataClient.downloadMetadata(serviceHost);
        }

        const startTime = Date.now();
        let attemptCount = 0;
        const maxAttempts = 4;
        const delays = [1000, 2000, 4000, 8000]; // 1s, 2s, 4s, 8s

        try {
            return await retryWithBackoff(
                async () => {
                    attemptCount++;
                    if (attemptCount > 1) {
                        console.log(`Waiting for service... (attempt ${attemptCount}/${maxAttempts})`);
                    }
                    return await this.metadataClient.downloadMetadata(serviceHost);
                },
                {
                    maxRetries: maxAttempts - 1, // 3 retries after initial attempt = 4 total attempts
                    initialDelay: delays[0],
                    multiplier: 2,
                    shouldRetry: (error: Error) => {
                        // Check for CLI error codes that represent connection issues
                        const cliError = error as CliError;
                        if (cliError.code === ErrorCode.SERVICE_UNAVAILABLE) {
                            return true; // Retry service unavailable errors
                        }
                        
                        // Also check for raw connection-level errors (in case not wrapped)
                        const code = (error as any).code;
                        const isConnectionError = 
                            code === 'ECONNREFUSED' || 
                            code === 'ETIMEDOUT' || 
                            code === 'ENOTFOUND' ||
                            code === 'ECONNRESET' ||
                            code === 'ENETUNREACH';
                        
                        // Don't retry HTTP errors (404, 500, etc.) or metadata disabled
                        if (cliError.code === ErrorCode.METADATA_DISABLED) {
                            return false;
                        }
                        if (!isConnectionError && (error as any).status) {
                            return false;
                        }
                        
                        return isConnectionError;
                    }
                }
            );
        } catch (error: any) {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            
            // Check if it's a CLI error for service unavailable (wrapped connection error)
            const cliError = error as CliError;
            if (cliError.code === ErrorCode.SERVICE_UNAVAILABLE) {
                throw new Error(
                    `Failed to connect to ${serviceHost} after ${attemptCount} attempts (${elapsedTime}s).\n` +
                    `Ensure your service is running and accessible.`
                );
            }
            
            // Check if it's a raw connection error that exhausted retries
            const code = error.code;
            if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' || code === 'ECONNRESET' || code === 'ENETUNREACH') {
                throw new Error(
                    `Failed to connect to ${serviceHost} after ${attemptCount} attempts (${elapsedTime}s).\n` +
                    `Ensure your service is running and accessible.`
                );
            }
            
            // For metadata disabled errors, throw with appropriate message
            if (cliError.code === ErrorCode.METADATA_DISABLED) {
                throw new Error(
                    `Endpoint not found: GET /_spas/metadata returned 404.\n` +
                    `Ensure service is running in Development mode with metadata endpoint enabled.`
                );
            }
            
            // For HTTP errors, throw with appropriate message
            if (error.status === 404) {
                throw new Error(
                    `Endpoint not found: GET /_spas/metadata returned 404.\n` +
                    `Ensure service is running in Development mode with metadata endpoint enabled.`
                );
            }
            
            // Re-throw other errors as-is
            throw error;
        }
    }
}
