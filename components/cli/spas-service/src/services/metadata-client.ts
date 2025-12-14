/**
 * Metadata client for downloading service metadata from SPAS SDK services
 */

import axios from 'axios';
import { retryWithBackoff } from '../utils/retry.js';
import { createCliError, ErrorCode } from '../types.js';
import { verbose } from '../utils/output.js';

/**
 * Download metadata archive from a SPAS service
 *
 * @param serviceHost - URL of the running service (e.g., "http://localhost:5000")
 * @returns ZIP archive as Buffer
 * @throws CliError if download fails
 */
export async function downloadMetadata(serviceHost: string): Promise<Buffer> {
  const metadataUrl = `${serviceHost}/_spas/metadata`;
  verbose(`Downloading metadata from ${metadataUrl}`);

  try {
    const buffer = await retryWithBackoff(async () => {
      const response = await axios.get(metadataUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds
        headers: {
          'Accept': 'application/zip',
        },
      });

      // Check content type
      const contentType = response.headers['content-type'];
      if (!contentType?.includes('application/zip')) {
        throw createCliError(
          ErrorCode.METADATA_DISABLED,
          'Metadata endpoint did not return a ZIP archive',
          'Ensure the service is running in Development mode and SPAS SDK is configured'
        );
      }

      return Buffer.from(response.data);
    });

    verbose(`Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.SERVICE_UNAVAILABLE,
          `Service metadata endpoint not available at ${metadataUrl}`,
          'Ensure service is running and accessible'
        );
      }

      if (error.response?.status === 404) {
        throw createCliError(
          ErrorCode.METADATA_DISABLED,
          'Metadata endpoint returned 404',
          'Set ASPNETCORE_ENVIRONMENT=Development (for .NET) or equivalent for your SDK'
        );
      }

      if (error.response?.status === 403) {
        throw createCliError(
          ErrorCode.METADATA_DISABLED,
          'Metadata endpoint access forbidden',
          'Check if the endpoint is disabled or requires authentication'
        );
      }
    }

    // If already a CliError, rethrow
    if ((error as any).code) {
      throw error;
    }

    // Generic network error
    throw createCliError(
      ErrorCode.NETWORK_ERROR,
      `Failed to download metadata from ${serviceHost}`,
      'Check network connectivity and service availability',
      error
    );
  }
}
