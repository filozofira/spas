/**
 * Repository HTTP client for SPAS Repository service
 *
 * TODO: Extract to @spas/cli-common post-PoC
 * This pattern is copied from spas-service CLI for consistency
 */

import axios, { AxiosError } from "axios";
import AdmZip from "adm-zip";
import type { RepositoryServiceResponse } from "../types.js";

/**
 * Error codes for repository operations
 */
export enum RepositoryErrorCode {
  NOT_FOUND = "NOT_FOUND",
  UNREACHABLE = "UNREACHABLE",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  NETWORK_ERROR = "NETWORK_ERROR",
}

/**
 * Repository operation error
 */
export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
    public readonly remediation?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * Repository client for downloading service metadata
 */
export class RepositoryClient {
  constructor(private readonly repositoryUrl: string) {}

  /**
   * Download service metadata and schemas from repository
   *
   * @param serviceId Service identifier (e.g., 'order-service')
   * @param version Semantic version (e.g., '1.0.0')
   * @returns Service metadata and schemas
   * @throws RepositoryError
   */
  async downloadService(
    serviceId: string,
    version: string,
  ): Promise<RepositoryServiceResponse> {
    const url = `${this.repositoryUrl}/services/${serviceId}/versions/${version}/download`;

    try {
      const response = await this.retryWithBackoff(async () => {
        return await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 30000,
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        });
      });

      // Handle 404 - service/version not found
      if (response.status === 404) {
        throw new RepositoryError(
          RepositoryErrorCode.NOT_FOUND,
          `Service ${serviceId}:${version} not found in repository`,
          "Verify the service ID and version are correct",
        );
      }

      // Handle other client errors
      if (response.status >= 400 && response.status < 500) {
        throw new RepositoryError(
          RepositoryErrorCode.INVALID_RESPONSE,
          `Repository returned error ${response.status}`,
          "Check repository logs for details",
        );
      }

      // Parse ZIP archive and extract metadata
      return this.parseServiceArchive(Buffer.from(response.data));
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const code = axiosError.code;

      if (
        code === "ECONNREFUSED" ||
        code === "ENOTFOUND" ||
        code === "ETIMEDOUT"
      ) {
        throw new RepositoryError(
          RepositoryErrorCode.UNREACHABLE,
          `Repository is unreachable at ${this.repositoryUrl}`,
          "Ensure repository URL is correct and the service is running",
          axiosError,
        );
      }

      throw new RepositoryError(
        RepositoryErrorCode.NETWORK_ERROR,
        "Failed to download service from repository",
        "Check network connectivity and repository availability",
        axiosError,
      );
    }
  }

  /**
   * Parse service archive (ZIP) and extract metadata and schemas
   */
  private parseServiceArchive(buffer: Buffer): RepositoryServiceResponse {
    try {
      const zip = new AdmZip(buffer);

      // Extract spas.json
      const metadataEntry = zip.getEntry("spas.json");
      if (!metadataEntry) {
        throw new Error("Archive missing spas.json");
      }
      const metadata = JSON.parse(metadataEntry.getData().toString("utf-8"));

      // Extract schema files
      const schemas: Array<{ path: string; name: string; content: string }> = [];
      for (const entry of zip.getEntries()) {
        if (entry.entryName.includes("schemas/") && entry.entryName.endsWith(".json")) {
          schemas.push({
            path: entry.entryName,
            name: entry.entryName.split("/").pop() || entry.entryName,
            content: entry.getData().toString("utf-8"),
          });
        }
      }

      return { metadata, schemas };
    } catch (error) {
      throw new RepositoryError(
        RepositoryErrorCode.INVALID_RESPONSE,
        "Failed to parse service archive",
        "Archive may be corrupted or missing spas.json",
        error as Error,
      );
    }
  }

  /**
   * Retry operation with exponential backoff
   *
   * TODO: Extract to @spas/cli-common post-PoC
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 100,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        // Don't retry client errors (4xx)
        if (axiosError.response?.status && axiosError.response.status < 500) {
          throw error;
        }

        // Don't retry connection refused (likely config issue, not transient)
        if (
          axiosError.code === "ECONNREFUSED" ||
          axiosError.code === "ENOTFOUND"
        ) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if repository is reachable
   *
   * @returns true if repository health endpoint responds
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.repositoryUrl}/health`, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
