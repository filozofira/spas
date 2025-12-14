import axios from 'axios';
import { retryWithBackoff } from '../utils/retry.js';
import { createCliError, ErrorCode } from '../types.js';
import { verbose } from '../utils/output.js';

export class MetadataClient {
  /**
   * Download metadata archive from a SPAS service
   *
   * @param serviceHost - URL of the running service (e.g., "http://localhost:5000")
   * @returns ZIP archive as Buffer
   * @throws CliError if download fails
   */
  async downloadMetadata(serviceHost: string): Promise<Buffer> {
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
        if (contentType && !contentType.includes('application/zip')) {
          throw createCliError(
            ErrorCode.METADATA_DISABLED,
            'Metadata endpoint did not return a ZIP archive',
            'Ensure the service is running in Development mode and SPAS SDK is configured'
          );
        }

        return Buffer.from(response.data);
      }, {
        // Retry on transient network timeouts only
        shouldRetry: (err: any) => {
          const status = err?.response?.status ?? err?.status;
          const code = err?.code;

          if (status === 404) {
            return false; // do not retry when endpoint missing
          }

          if (code === 'ECONNABORTED') {
            return true; // retry on timeout
          }

          if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
            return false; // immediate failure for unreachable host
          }

          return true;
        },
        initialDelay: 100,
      });

      verbose(`Downloaded ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      const err: any = error;
      const status = err?.response?.status ?? err?.status;
      const code = err?.code;

      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Service is not reachable',
          'Ensure the service is running and the URL is correct'
        );
      }

      if (code === 'ECONNABORTED') {
        throw createCliError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Metadata download timed out',
          'Ensure the service is responsive and try again'
        );
      }

      if (status === 404) {
        throw createCliError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'Metadata endpoint returned 404',
          'Ensure the service exposes /_spas/metadata'
        );
      }

      throw createCliError(
        ErrorCode.NETWORK_ERROR,
        'Failed to download metadata',
        'Check your network connection and try again',
        error
      );
    }
  }
}
