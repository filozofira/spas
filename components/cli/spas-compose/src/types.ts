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
  /** Runtime metadata (from repository pull) - T001 */
  runtime?: RuntimeMetadata;
}

/**
 * Runtime Metadata
 * Container image information from service publish
 */
export interface RuntimeMetadata {
  /** Image repository (e.g., "spas-examples/order-service") */
  repository: string;
  /** Image tag (e.g., "1.0.0") */
  tag: string;
  /** SHA256 digest (optional) */
  digest?: string;
  /** Full image reference with digest (optional) */
  image?: string;
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
  /** Output directory for domain workspace (default: current directory) - T004 */
  output?: string;
}

/**
 * Services Pull Options
 */
export interface ServicesPullOptions extends CommonOptions {
  /** Repository URL override */
  repo?: string;
}

/**
 * Choreography Build Options
 */
export interface ChoreographyBuildOptions extends CommonOptions {
  /** Generate docker-compose.yaml */
  docker?: boolean;
  /** Validate without generating files */
  dryRun?: boolean;
  /** Output filename */
  output?: string;
  /** Event backbone image or "none" to disable */
  eventBackbone?: string;
  /** Observability backbone image or "none" to disable */
  observabilityBackbone?: string;
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

// ============================================================================
// Sidecar Configuration Types
// Generated by spas-compose choreography build
// ============================================================================

/**
 * Complete sidecar configuration for a single service.
 * Generated as config.{serviceName}.json
 */
export interface SidecarConfig {
  /** Event subscriptions and command handlers */
  inbound: InboundEntry[];
  /** Event publication configurations */
  outbound: OutboundEntry[];
}

/**
 * Configuration for receiving events or commands.
 * Sidecar subscribes to topic/command and invokes service HTTP endpoint.
 */
export interface InboundEntry {
  /** Type of inbound message */
  kind: "event" | "command";
  /** Topic name (required when kind="event") */
  topic?: string;
  /** Command name (required when kind="command") */
  command?: string;
  /** Path to JSONata transformation file, relative to sidecar /app/transformations mount */
  transform?: string;
  /** HTTP endpoint path on the service to invoke */
  invokeEndpoint: string;
}

/**
 * Configuration for publishing events.
 * Sidecar transforms and publishes to topic.
 */
export interface OutboundEntry {
  /** CloudEvents type (e.g., "com.order.order.created") - T002 */
  eventType?: string;
  /** Topic name for published events */
  topic: string;
  /** Path to JSONata transformation file, relative to sidecar /app/transformations mount */
  transform?: string;
}

/**
 * Result of config generation process
 */
export interface ConfigGeneratorResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Service name → config mapping (populated on success) */
  configs: Record<string, SidecarConfig>;
  /** List of errors (populated on failure) */
  errors: ConfigError[];
  /** Summary for CLI output */
  summary: ConfigSummary;
}

/**
 * Error details for generation failures
 */
export interface ConfigError {
  /** Service name where error occurred */
  service: string;
  /** Human-readable error message */
  message: string;
  /** Error category */
  type: "MISSING_TRANSFORM" | "INVALID_PATH" | "INVALID_CHOREOGRAPHY";
}

/**
 * Summary of generated configs for CLI output
 */
export interface ConfigSummary {
  /** Total number of config files generated */
  totalConfigs: number;
  /** Services with their entry counts */
  services: ServiceSummarySidecar[];
}

/**
 * Summary for a single service
 */
export interface ServiceSummarySidecar {
  /** Service name */
  name: string;
  /** Number of inbound entries */
  inboundCount: number;
  /** Number of outbound entries */
  outboundCount: number;
}

// =============================================================================
// Backbone Configuration Types
// =============================================================================

/**
 * Port mapping for Docker container
 */
export interface PortMapping {
  host: number;
  container: number;
}

/**
 * Docker health check configuration
 */
export interface HealthCheckConfig {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
}

/**
 * Configuration for the event streaming backbone (Redis)
 */
export interface EventBackboneConfig {
  /** Whether to provision the backbone service */
  enabled: boolean;
  /** Docker image reference (e.g., "redis:7-alpine") */
  image: string;
  /** Container name */
  containerName: string;
  /** Host port binding */
  port: number;
  /** Health check configuration */
  healthcheck?: HealthCheckConfig;
}

/**
 * Configuration for the observability backbone (Zipkin/Jaeger)
 */
export interface ObservabilityBackboneConfig {
  /** Whether to provision the backbone service */
  enabled: boolean;
  /** Docker image reference (e.g., "openzipkin/zipkin:latest") */
  image: string;
  /** Container name */
  containerName: string;
  /** Backbone type (affects port configuration) */
  type: "zipkin" | "jaeger";
  /** Ports to expose */
  ports: PortMapping[];
}

/**
 * Complete backbone configuration for infrastructure services
 */
export interface BackboneConfig {
  eventBackbone: EventBackboneConfig;
  observabilityBackbone: ObservabilityBackboneConfig;
}

// =============================================================================
// Generator Configuration Types - T003
// =============================================================================

/**
 * Configuration for Docker Compose and sidecar config generation
 * Defines port and image defaults
 */
export interface GeneratorConfig {
  /** Internal port for .NET service containers (default: 8080) */
  serviceInternalPort: number;
  /** Standard sidecar port (default: 7001) */
  sidecarPort: number;
  /** Sidecar image reference (default: "spas/sidecar:latest") */
  sidecarImage: string;
  /** Default endpoint for inbound events (default: "/incoming") */
  defaultInvokeEndpoint: string;
}

/**
 * Default generator configuration
 */
export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  serviceInternalPort: 8080,
  sidecarPort: 7001,
  sidecarImage: "spas/sidecar:latest",
  defaultInvokeEndpoint: "/incoming",
};
