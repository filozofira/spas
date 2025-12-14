/**
 * TypeScript type definitions for SPAS CLI
 */

/**
 * Options for the publish command
 */
export interface PublishOptions {
  /** URL of running service (e.g., "http://localhost:5000") */
  serviceHost?: string;
  /** Path to local ZIP file (alternative to serviceHost) */
  archive?: string;
  /** Repository URL (default: from env or localhost:3000) */
  repo?: string;
  /** Download only, don't publish */
  dryRun?: boolean;
}

/**
 * Options for the pull command
 */
export interface PullOptions {
  /** Service ID to download */
  serviceName: string;
  /** Version to download */
  version: string;
  /** Repository URL */
  repo?: string;
  /** Output directory (default: current directory) */
  output?: string;
}

/**
 * Service identity extracted from spas.json
 */
export interface ServiceIdentity {
  /** Service ID (e.g., "order-service") */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Semver version (e.g., "1.0.0") */
  version: string;
  /** Schema version */
  schemaVersion?: string;
  /** Bounded context */
  boundedContext?: string;
}

/**
 * CLI configuration
 */
export interface CliConfig {
  /** Resolved repository URL */
  repositoryUrl: string;
}

/**
 * CLI error with actionable hints
 */
export interface CliError extends Error {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** User-friendly error message */
  message: string;
  /** Actionable remediation hint */
  hint?: string;
  /** Technical details for debugging */
  details?: unknown;
}

/**
 * Error codes for CLI operations
 */
export enum ErrorCode {
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  METADATA_DISABLED = 'METADATA_DISABLED',
  ARCHIVE_INVALID = 'ARCHIVE_INVALID',
  REPOSITORY_UNREACHABLE = 'REPOSITORY_UNREACHABLE',
  REPOSITORY_VALIDATION_ERROR = 'REPOSITORY_VALIDATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Alias for consistency
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Create a CLI error with code and hint
 */
export function createCliError(
  code: ErrorCode,
  message: string,
  hint?: string,
  details?: unknown
): CliError {
  const error = new Error(message) as CliError;
  error.code = code;
  error.hint = hint;
  error.details = details;
  return error;
}
