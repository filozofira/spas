/**
 * Repository client for publishing and downloading service metadata
 */

import axios from 'axios';
import FormData from 'form-data';
import { createCliError, ErrorCode } from '../types.js';
import { verbose } from '../utils/output.js';

/**
 * Publish a service metadata archive to the Repository
 *
 * @param repositoryUrl - Base URL of the Repository (e.g., "http://localhost:3000")
 * @param serviceId - Service identifier
 * @param version - Service version
 * @param archiveBuffer - ZIP archive as Buffer
 * @throws CliError if publish fails
 */
export async function publishService(
  repositoryUrl: string,
  serviceId: string,
  version: string,
  archiveBuffer: Buffer
): Promise<void> {
  const publishUrl = `${repositoryUrl}/services/${serviceId}:${version}`;
  verbose(`Publishing to ${publishUrl}`);

  try {
    const formData = new FormData();
    formData.append('archive', archiveBuffer, {
      filename: `${serviceId}-${version}.zip`,
      contentType: 'application/zip',
    });

    const response = await axios.post(publishUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60 seconds
      maxContentLength: 100 * 1024 * 1024, // 100 MB
      maxBodyLength: 100 * 1024 * 1024,
    });

    verbose(`Publish succeeded with status ${response.status}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.REPOSITORY_UNREACHABLE,
          `Repository not accessible at ${repositoryUrl}`,
          'Ensure the Repository service is running'
        );
      }

      if (error.response?.status === 400) {
        const details = error.response.data;
        throw createCliError(
          ErrorCode.REPOSITORY_VALIDATION_ERROR,
          'Repository rejected the archive due to validation errors',
          'Check that spas.json and schemas match the SPAS schema requirements',
          details
        );
      }

      if (error.response?.status === 409) {
        throw createCliError(
          ErrorCode.VERSION_CONFLICT,
          `Version ${version} of ${serviceId} already exists in the Repository`,
          'Increment the service version or unpublish the existing version'
        );
      }

      if (error.response?.status === 404) {
        throw createCliError(
          ErrorCode.REPOSITORY_UNREACHABLE,
          'Repository endpoint not found',
          `Verify the Repository URL is correct: ${repositoryUrl}`
        );
      }
    }

    // If already a CliError, rethrow
    if ((error as any).code) {
      throw error;
    }

    throw createCliError(
      ErrorCode.NETWORK_ERROR,
      `Failed to publish to Repository`,
      'Check network connectivity and Repository availability',
      error
    );
  }
}

/**
 * Download a service metadata archive from the Repository
 *
 * @param repositoryUrl - Base URL of the Repository
 * @param serviceId - Service identifier
 * @param version - Service version
 * @returns ZIP archive as Buffer
 * @throws CliError if download fails
 */
export async function downloadService(
  repositoryUrl: string,
  serviceId: string,
  version: string
): Promise<Buffer> {
  const downloadUrl = `${repositoryUrl}/services/${serviceId}/versions/${version}/download`;
  verbose(`Downloading from ${downloadUrl}`);

  try {
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 seconds
    });

    const buffer = Buffer.from(response.data);
    verbose(`Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw createCliError(
          ErrorCode.REPOSITORY_UNREACHABLE,
          `Repository not accessible at ${repositoryUrl}`,
          'Ensure the Repository service is running'
        );
      }

      if (error.response?.status === 404) {
        throw createCliError(
          ErrorCode.NOT_FOUND,
          `Service ${serviceId}:${version} not found in Repository`,
          'Check the service name and version are correct'
        );
      }
    }

    // If already a CliError, rethrow
    if ((error as any).code) {
      throw error;
    }

    throw createCliError(
      ErrorCode.NETWORK_ERROR,
      `Failed to download from Repository`,
      'Check network connectivity and Repository availability',
      error
    );
  }
}
