import axios from 'axios';
import FormData from 'form-data';
import { createCliError, ErrorCode, RuntimeMetadata } from '../types.js';
import { verbose } from '../utils/output.js';
import { retryWithBackoff } from '../utils/retry.js';

/**
 * Repository client for publishing and downloading service metadata
 */
export class RepositoryClient {
  constructor(private readonly repositoryUrl: string) {}

  /**
   * Publish service metadata archive to repository
   */
  async publishService(
    serviceId: string,
    version: string,
    archiveBuffer: Buffer,
    runtimeMetadata?: RuntimeMetadata
  ): Promise<void> {
    const url = `${this.repositoryUrl}/services/${serviceId}:${version}`;
    verbose(`Publishing service ${serviceId}:${version} to ${url}`);

    const formData: any = new FormData();
    if (typeof formData.append !== 'function') {
      // Provide minimal append/getHeaders implementations for tests when FormData is mocked
      formData._fields = [];
      formData.append = (...args: unknown[]) => formData._fields.push(args);
    }
    if (typeof formData.getHeaders !== 'function') {
      formData.getHeaders = () => ({ 'Content-Type': 'multipart/form-data' });
    }

    formData.append('archive', archiveBuffer, {
      filename: `${serviceId}-${version}.zip`,
      contentType: 'application/zip',
    });

    // Add runtime metadata fields if provided
    if (runtimeMetadata?.imageDigest) {
      formData.append('imageDigest', runtimeMetadata.imageDigest);
    }
    if (runtimeMetadata?.imageRepository) {
      formData.append('imageRepository', runtimeMetadata.imageRepository);
    }
    if (runtimeMetadata?.imageTag) {
      formData.append('imageTag', runtimeMetadata.imageTag);
    }

    try {
      await retryWithBackoff(async () => {
        const response = await axios.post(url, formData, {
          headers: formData.getHeaders(),
          timeout: 30000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        verbose(`Repository response status ${response.status}`);
      }, {
        shouldRetry: (err: any) => {
          const status = err?.response?.status ?? err?.status;
          const code = err?.code;

          if (status && status < 500) {
            return false; // don't retry client errors
          }

          if (code === 'ECONNABORTED') {
            return true; // retry timeouts
          }

          if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
            return false; // unreachable
          }

          return true;
        },
        initialDelay: 100,
      });
    } catch (error) {
      const err: any = error;
      const status = err?.response?.status ?? err?.status;
      const code = err?.code;

      if (status === 400) {
        throw createCliError(
          ErrorCode.VALIDATION_ERROR,
          'Repository rejected metadata (400 Bad Request)',
          'Inspect repository validation rules and retry',
          error
        );
      }

      if (status === 409) {
        throw createCliError(
          ErrorCode.VERSION_CONFLICT,
          'Version already exists in repository (409 Conflict)',
          'Use a new version or delete the existing one before retrying',
          error
        );
      }

      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.REPOSITORY_UNREACHABLE,
          'Repository is unreachable',
          'Ensure repository URL is correct and the service is running',
          error
        );
      }

      throw createCliError(
        ErrorCode.REPOSITORY_UNREACHABLE,
        'Failed to publish metadata',
        'Check repository availability and retry',
        error
      );
    }
  }

  /**
   * Download service metadata archive from repository
   */
  async downloadService(serviceId: string, version: string): Promise<Buffer> {
    const url = `${this.repositoryUrl}/services/${serviceId}/versions/${version}/download`;
    verbose(`Downloading service ${serviceId} version ${version} from ${url}`);

    try {
      const buffer = await retryWithBackoff(async () => {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
        });

        return Buffer.from(response.data);
      }, {
        shouldRetry: (err: any) => {
          const status = err?.response?.status ?? err?.status;
          const code = err?.code;

          if (status && status < 500) {
            return false; // do not retry client errors like 404
          }

          if (code === 'ECONNABORTED') {
            return true; // retry timeouts
          }

          if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
            return false; // unreachable
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

      if (status === 404) {
        throw createCliError(
          ErrorCode.NOT_FOUND,
          'Service version not found in repository (404)',
          'Verify the service ID and version before retrying',
          error
        );
      }

      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.REPOSITORY_UNREACHABLE,
          'Repository is unreachable',
          'Ensure repository URL is correct and the service is running',
          error
        );
      }

      throw createCliError(
        ErrorCode.REPOSITORY_UNREACHABLE,
        'Failed to download service metadata',
        'Check repository availability and retry',
        error
      );
    }
  }
}
