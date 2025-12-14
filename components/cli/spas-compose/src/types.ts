/**
 * TypeScript type definitions for spas-compose CLI
 */

/**
 * Domain Workspace
 * Root folder containing all composition artifacts
 */
export interface DomainWorkspace {
  /** Workspace name (lowercase-hyphenated) */
  name: string;
  /** Absolute filesystem path */
  path: string;
  /** Pulled services (if loaded) */
  services?: PulledService[];
  /** Choreography configuration (if loaded) */
  choreography?: Choreography;
}

/**
 * Choreography Configuration
 * YAML structure defining service interactions and event routing
 */
export interface Choreography {
  /** Schema version (currently "1.0") */
  version: string;
  /** Domain context name */
  domain: string;
  /** Named choreography flows */
  flows: Record<string, Flow>;
  /** Infrastructure configuration */
  infrastructure?: Infrastructure;
}

/**
 * Choreography Flow
 * Named pattern of service interactions
 */
export interface Flow {
  /** Human-readable flow description */
  description?: string;
  /** Service names participating in this flow */
  participants: string[];
  /** Event routing definitions */
  events: EventRoute[];
}

/**
 * Event Route
 * Maps published events to subscribing services
 */
export interface EventRoute {
  /** Publishing service name */
  source: string;
  /** Event type name */
  event: string;
  /** Message topic name */
  topic: string;
  /** Subscribing services and transformations */
  targets: Target[];
}

/**
 * Event Target
 * Service that subscribes to an event
 */
export interface Target {
  /** Subscribing service name */
  service: string;
  /** Path to JSONata transformation file (relative to workspace root) */
  transform?: string;
}

/**
 * Infrastructure Configuration
 * Optional infrastructure components
 */
export interface Infrastructure {
  /** Redis configuration */
  redis?: {
    enabled: boolean;
    host?: string;
    port?: number;
  };
  /** Zipkin configuration */
  zipkin?: {
    enabled: boolean;
    url?: string;
  };
}

/**
 * Pulled Service
 * Local copy of service metadata from SPAS Repository
 */
export interface PulledService {
  /** Service name (folder name) */
  name: string;
  /** Semantic version */
  version: string;
  /** Parsed spas.json content */
  metadata: ServiceMetadata;
  /** Event/message schemas */
  schemas?: Schema[];
  /** When the service was pulled */
  pulledAt: Date;
}

/**
 * Service Metadata (subset for composition)
 * From spas.json runtime metadata
 */
export interface ServiceMetadata {
  /** Service identifier */
  id: string;
  /** Semantic version */
  version: string;
  /** Bounded context name */
  boundedContext: string;
  /** Event definitions */
  events: {
    published: EventDefinition[];
    subscribed: EventDefinition[];
  };
  /** Network configuration */
  network?: {
    port: number;
    protocol: string;
  };
}

/**
 * Event Definition
 * Event metadata from service contract
 */
export interface EventDefinition {
  /** Event type name */
  name: string;
  /** JSON Schema path (relative to service folder) */
  schema: string;
  /** Event description */
  description?: string;
}

/**
 * Schema
 * JSON Schema definition for events/messages
 */
export interface Schema {
  /** Schema filename */
  name: string;
  /** Schema content (parsed JSON) */
  content: Record<string, any>;
}

/**
 * Transformation
 * JSONata expression file for event payload transformation
 */
export interface Transformation {
  /** Relative path from workspace root */
  path: string;
  /** Target service name */
  serviceName: string;
  /** Transform direction */
  direction: "inbound" | "outbound";
  /** Event type being transformed */
  eventType: string;
  /** JSONata expression content */
  expression: string;
}

/**
 * CLI Command Options (common)
 */
export interface CommonOptions {
  /** Enable verbose output */
  verbose?: boolean;
  /** Output results as JSON */
  json?: boolean;
}

/**
 * Init Command Options
 */
export interface InitOptions extends CommonOptions {
  /** Overwrite existing workspace */
  force?: boolean;
}

/**
 * Services Pull Options
 */
export interface ServicesPullOptions extends CommonOptions {
  /** Repository URL override */
  repo?: string;
}

/**
 * Choreography Deploy Options
 */
export interface ChoreographyDeployOptions extends CommonOptions {
  /** Generate docker-compose.yaml */
  docker?: boolean;
  /** Validate without generating files */
  dryRun?: boolean;
  /** Output filename */
  output?: string;
}

/**
 * Command Result
 * Standardized command execution result
 */
export interface CommandResult {
  /** Success flag */
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Structured data (for JSON output) */
  data?: Record<string, any>;
  /** Error details (if failed) */
  error?: {
    code: string;
    details?: string;
  };
}

/**
 * Repository Service Response
 * Response from SPAS Repository API
 */
export interface RepositoryServiceResponse {
  /** Service metadata */
  metadata: ServiceMetadata;
  /** Schema files with relative path from archive root */
  schemas: Array<{
    /** Relative path preserving archive structure (e.g., 'schemas/events/OrderCreated.schema.json') */
    path: string;
    /** Schema filename */
    name: string;
    /** Schema content (JSON string or parsed object) */
    content: string;
  }>;
}
