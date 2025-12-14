import { RepositoryClient } from './repository-client.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of a pull operation
 */
export interface PullResult {
    /** Service name that was downloaded */
    serviceName: string;
    /** Version that was downloaded */
    version: string;
    /** Path where archive was saved */
    savedPath: string;
    /** Size of downloaded archive in bytes */
    bytes: number;
}

/**
 * Service for pulling (downloading) service metadata from Repository
 */
export class PullService {
    constructor(private repositoryClient: RepositoryClient) {}

    /**
     * Download service metadata from Repository and save to file
     * 
     * @param serviceName - Service identifier
     * @param version - Version to download
     * @param outputDir - Output directory (default: current directory)
     * @returns Pull result with saved path and metadata
     */
    async pull(serviceName: string, version: string, outputDir: string = '.'): Promise<PullResult> {
        // Step 1: Download archive from Repository
        const archiveBuffer = await this.repositoryClient.downloadService(serviceName, version);

        // Step 2: Save to local file
        const filename = `${serviceName}-${version}.zip`;
        const savedPath = path.join(outputDir, filename);
        fs.writeFileSync(savedPath, archiveBuffer);

        return {
            serviceName,
            version,
            savedPath,
            bytes: archiveBuffer.length,
        };
    }
}
