/**
 * Core TypeScript interfaces for SPAS Repository Service
 */

/**
 * Endpoint definition (Command or Query)
 */
export interface Endpoint {
  name: string;
  type: 'Command' | 'Query';
  protocol: 'Http' | 'gRPC';
  methodPath: string;
  version: string;
  schemaRef: string;
  description?: string;
}

/**
 * Event definition (outbound only)
 */
export interface Event {
  type: string; // CloudEvents type
  version: string;
  schemaRef: string;
}

/**
 * Consistency requirements
 */
export interface Consistency {
  commands: 'ACID';
  queries: 'STRONG' | 'EVENTUAL';
}

/**
 * Network egress requirements
 */
export interface Network {
  requiredEgress: string[]; // host:port patterns
}

/**
 * Security configuration
 */
export interface Security {
  authentication?: {
    type: string;
    requiredScopes?: string[];
  };
  dataClassification: ('public' | 'internal' | 'confidential' | 'pii')[];
}

/**
 * Runtime deployment details (added by repository)
 */
export interface Runtime {
  image: string; // OCI image reference or digest
  resources?: {
    cpu?: string;
    memory?: string;
  };
  env?: string[]; // Environment variable names (no values)
}

/**
 * Service metadata - Runtime schema (design-time + runtime fields)
 * Combines design-time metadata from spas.json with runtime deployment details
 */
export interface ServiceMetadata {
  schemaVersion: string; // "design-time-metadata-v1" or "runtime-metadata-v1"
  id: string; // Service identifier (kebab-case)
  name: string; // Human-readable name
  description: string;
  version: string; // Semantic version
  boundedContext: string;
  capabilities: string[];
  endpoints: Endpoint[];
  events: Event[];
  consistency: Consistency;
  network: Network;
  security: Security;
  license: string; // SPDX identifier
  runtime?: Runtime; // Added by repository during publish
  publishedAt?: string; // ISO 8601 timestamp, added by repository
}

/**
 * JSON Schema definition for service contract
 */
export interface Schema {
  name: string;
  type: 'event' | 'internal' | 'endpoint';
  content: Record<string, unknown>; // JSON Schema object
}

/**
 * Service version information (returned from queries)
 * Lightweight version without full metadata
 */
export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  boundedContext: string;
  capabilities: string[];
  publishedAt?: string;
}

/**
 * Service version with full metadata and schemas
 */
export interface ServiceDetails extends ServiceInfo {
  schemas: Schema[];
}

/**
 * Paginated search results
 */
export interface SearchResults {
  total: number;
  limit: number;
  offset: number;
  results: ServiceInfo[];
}

/**
 * Storage provider configuration
 */
export interface StorageConfig {
  provider: 'sqlite' | 'postgres';
  sqlitePath?: string;
  postgresUrl?: string;
  s3Bucket?: string;
  s3Region?: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  storage: StorageConfig;
  zipkinUrl?: string;
  spasSchemaPath: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  storage: {
    status: 'ok' | 'error';
    message?: string;
  };
}
