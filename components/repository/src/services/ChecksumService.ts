/**
 * Checksum Service
 * 
 * Handles SHA-256 checksum verification for uploaded archives
 */

import { createHash } from 'crypto';
import { Readable } from 'stream';

export class ChecksumService {
  /**
   * Calculate SHA-256 checksum of a stream
   * @param stream - Readable stream to hash
   * @returns SHA-256 hash as hexadecimal string
   */
  async calculateChecksum(stream: Readable): Promise<string> {
    const hash = createHash('sha256');

    for await (const chunk of stream) {
      hash.update(chunk);
    }

    return hash.digest('hex');
  }

  /**
   * Verify checksum matches expected value
   * @param stream - Readable stream to hash
   * @param expectedChecksum - Expected SHA-256 hash
   * @throws ChecksumError if checksums don't match
   */
  async verifyChecksum(stream: Readable, expectedChecksum: string): Promise<void> {
    const actualChecksum = await this.calculateChecksum(stream);

    if (actualChecksum !== expectedChecksum.toLowerCase()) {
      throw new ChecksumError(
        'Checksum mismatch',
        `Expected ${expectedChecksum}, got ${actualChecksum}`
      );
    }
  }

  /**
   * Calculate checksum from buffer
   * @param buffer - Buffer to hash
   * @returns SHA-256 hash as hexadecimal string
   */
  calculateChecksumFromBuffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}

export class ChecksumError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'ChecksumError';
  }
}
