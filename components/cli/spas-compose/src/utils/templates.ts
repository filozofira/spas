/**
 * File templates for workspace initialization
 */

import { Eta } from "eta";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getTemplatesDir(): string {
  // Check for templates in dist (production) - relative to dist/utils/
  const distTemplates = join(__dirname, "../../templates");
  if (existsSync(distTemplates)) {
    return distTemplates;
  }
  
  // Check for templates in src (development) - relative to src/utils/
  const srcTemplates = join(__dirname, "../templates");
  if (existsSync(srcTemplates)) {
    return srcTemplates;
  }

  // Fallback for tests or other structures
  return join(process.cwd(), "src/templates");
}

// Initialize Eta with the templates directory
// We use a lazy initialization or try-catch block if we want to be safe, 
// but for now we assume templates exist if this module is loaded.
let eta: Eta;

function getEta(): Eta {
  if (!eta) {
    eta = new Eta({ 
      views: getTemplatesDir(),
      cache: true 
    });
  }
  return eta;
}

export interface AgentPromptContext {
  domainRoot: string;
}

export function renderAgentPrompt(context: AgentPromptContext): string {
  return getEta().render("agent-prompt", context);
}

/**
 * Generate workspace README.md content
 */
export function generateWorkspaceReadme(workspaceName: string): string {
  return `# ${workspaceName}

**SPAS Domain Workspace**

This workspace contains choreography configuration for composing SPAS services into a domain context.

## Structure

\`\`\`
${workspaceName}/
├── README.md                    # This file
├── choreography.yaml            # Choreography configuration
├── services/                    # Pulled service metadata
├── transformations/             # JSONata transformation files
└── .spas/
    └── schemas/                 # JSON Schemas for validation/AI
        ├── choreography-v1.schema.json
        ├── runtime-metadata-v1.schema.json
        └── sidecar-config-v1.schema.json
\`\`\`

## Workflow

### 1. Pull Services

Download service metadata from SPAS Repository:

\`\`\`bash
spas-compose services pull <service-name> <version>
\`\`\`

**Example:**

\`\`\`bash
spas-compose services pull order-service 1.0.0
spas-compose services pull fulfillment-service 1.0.0
\`\`\`

### 2. Compose Choreography

Use the \`/spas.compose\` agent prompt to analyze service contracts and generate choreography:

\`\`\`
/spas.compose DOMAIN:${workspaceName} Analyze order-service and fulfillment-service contracts.
Propose topic mappings and generate transformations.
\`\`\`

The agent will:
- Parse service contracts from \`services/*/spas.json\`
- Propose event mappings and topic routes
- Generate JSONata transformation files
- Update \`choreography.yaml\`

### 3. Build

Build Docker Compose deployment:

\`\`\`bash
spas-compose choreography build --dry-run   # Validate
spas-compose choreography build --docker    # Generate docker-compose.yaml
\`\`\`

### 4. Run

Start services:

\`\`\`bash
docker compose up
\`\`\`

## Configuration

### Repository URL

Set repository URL via:
- \`--repo\` flag: \`spas-compose services pull order-service 1.0.0 --repo http://repo.example.com\`
- Environment: \`export SPAS_REPOSITORY_URL=http://repo.example.com\`
- Default: \`http://localhost:3000\`

## Documentation

- [spas-compose CLI](../../components/cli/spas-compose/README.md)
- [SPAS Principles](../../principles/README.md)
- [Domain Choreography](../../principles/component/14-domain-choreography.md)
`;
}

/**
 * Generate choreography.yaml scaffold
 */
export function generateChoreographyScaffold(domainName: string): string {
  return `# SPAS Choreography Configuration
# See: specs/005-spas-compose-cli/contracts/choreography-schema.yaml

version: "1.0"
domain: ${domainName}

# Named choreography flows
# Use /spas.compose agent to generate flows based on service contracts
flows: {}
  # Example:
  # order-fulfillment:
  #   description: "Order to fulfillment processing flow"
  #   participants:
  #     - order-service
  #     - fulfillment-service
  #   events:
  #     - source: order-service
  #       event: order-created
  #       topic: orders
  #       targets:
  #         - service: fulfillment-service
#           transform: transformations/fulfillment-service/inbound-order-created.jsonata

# Infrastructure components (optional)
infrastructure:
  redis:
    enabled: true
    # host: redis
    # port: 6379
  zipkin:
    enabled: true
    # url: http://zipkin:9411
`;
}

// =============================================================================
// Agent Prompt Helper Functions
// =============================================================================

/**
 * Generate agent file content (.github/agents/spas.compose.agent.md)
 *
 * Creates the full agent instructions at project root.
 * Follows SpecKit pattern: .github/agents/*.agent.md
 *
 * The agent supports multiple domains via DOMAIN: prefix in user input.
 * The domainRoot is baked in at init time from --output arg (or "." default).
 *
 * @param domainRoot Relative path from project root to domain parent (e.g., "./examples/ecommerce" or ".")
 */
export function generateAgentFile(domainRoot: string): string {
  return renderAgentPrompt({ domainRoot });
}

/**
 * Generate prompt file content (.github/prompts/spas.compose.prompt.md)
 *
 * Creates the trigger file that references the agent.
 * Follows SpecKit pattern: .github/prompts/*.prompt.md
 */
export function generatePromptFile(): string {
  return `---
agent: spas.compose
---
`;
}

/**
 * Generate sidecar config schema (.spas/schemas/sidecar-config-v1.schema.json)
 *
 * Provides JSON Schema for sidecar configuration files to enable:
 * - AI agent understanding of choreography → sidecar config mapping
 * - IDE validation and autocomplete for config files
 * - CI/CD validation of generated configurations
 *
 * Schema version is locked to CLI version that created the workspace.
 */
export function generateSidecarConfigSchema(): string {
  return JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://spas.dev/schemas/sidecar-config-v1.schema.json",
      title: "SPAS Sidecar Configuration",
      description:
        "Schema for sidecar configuration files generated by spas-compose choreography build. Each service has a config.{serviceName}.json file mounted to the sidecar.",
      type: "object",
      required: ["inbound", "outbound"],
      additionalProperties: false,
      properties: {
        inbound: {
          type: "array",
          description:
            "Event subscriptions and command handlers. Sidecar subscribes to topics or listens for commands and invokes service HTTP endpoints.",
          items: {
            $ref: "#/definitions/InboundEntry",
          },
        },
        outbound: {
          type: "array",
          description:
            "Event publication configurations. Maps event types to target topics for publishing.",
          items: {
            $ref: "#/definitions/OutboundEntry",
          },
        },
      },
      definitions: {
        InboundEntry: {
          type: "object",
          description:
            "Configuration for receiving events or commands. Sidecar subscribes to topic/command and invokes service HTTP endpoint.",
          required: ["kind", "invokeEndpoint"],
          additionalProperties: false,
          properties: {
            kind: {
              type: "string",
              enum: ["event", "command"],
              description:
                "Type of inbound message: 'event' for pub/sub subscription, 'command' for request-response invocation",
            },
            topic: {
              type: "string",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
              description:
                "Topic/stream name to subscribe to. Required when kind='event'.",
            },
            command: {
              type: "string",
              pattern: "^([A-Z][a-zA-Z0-9]*|[a-z0-9]+(-[a-z0-9]+)*)$",
              description:
                "Command identifier for /invoke/{command}. Canonical form is kebab-case (e.g., 'reserve-stock'); PascalCase is accepted for legacy configs. Required when kind='command'.",
            },
            transform: {
              type: "string",
              pattern: "^[a-z0-9-/]+\\.jsonata$",
              description:
                "Path to JSONata transformation file relative to sidecar /app/transformations mount. When omitted, payload passes through unchanged.",
            },
            invokeEndpoint: {
              type: "string",
              pattern: "^/[a-zA-Z0-9/_-]*$",
              description:
                "HTTP endpoint path on the service to invoke with transformed payload (e.g., '/incoming', '/orders').",
            },
          },
          allOf: [
            {
              if: {
                properties: { kind: { const: "event" } },
              },
              then: {
                required: ["topic"],
              },
            },
            {
              if: {
                properties: { kind: { const: "command" } },
              },
              then: {
                required: ["command"],
              },
            },
          ],
        },
        OutboundEntry: {
          type: "object",
          description:
            "Configuration for publishing events. Maps event types to target topics.",
          required: ["topic"],
          additionalProperties: false,
          properties: {
            topic: {
              type: "string",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
              description: "Target topic/stream name for published events.",
            },
            eventType: {
              type: "string",
              description:
                "Event type from x-event-type header used for routing lookup (e.g., 'com.example.order.created'). When present, enables routing by event type.",
            },
            transform: {
              type: "string",
              pattern: "^[a-z0-9-/]+\\.jsonata$",
              description:
                "Path to JSONata transformation file for outbound transformation. When omitted, payload publishes unchanged.",
            },
          },
        },
      },
      examples: [
        {
          inbound: [
            {
              kind: "event",
              topic: "orders-requested",
              transform: "inbound-order-created.jsonata",
              invokeEndpoint: "/incoming",
            },
            {
              kind: "command",
              command: "get-order-status",
              invokeEndpoint: "/orders/status",
            },
          ],
          outbound: [
            {
              topic: "orders-fulfilled",
              eventType: "com.example.order.fulfilled",
            },
          ],
        },
      ],
    },
    null,
    2,
  );
}

/**
 * Generate choreography schema (.spas/schemas/choreography-v1.schema.json)
 *
 * Provides JSON Schema for choreography.yaml files to enable:
 * - AI agent understanding of choreography structure
 * - IDE validation and autocomplete for choreography files
 * - CI/CD validation of choreography configurations
 */
export function generateChoreographySchema(): string {
  return JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://spas.dev/schemas/choreography-v1.schema.json",
      title: "SPAS Choreography Configuration",
      description:
        "Schema for domain choreography configuration defining service interactions and event routing",
      type: "object",
      required: ["version", "domain", "flows"],
      additionalProperties: false,
      properties: {
        version: {
          type: "string",
          description: "Schema version",
          enum: ["1.0"],
        },
        domain: {
          type: "string",
          description: "Domain context name",
          pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
          examples: ["e-commerce", "order-management"],
        },
        flows: {
          type: "object",
          description: "Named choreography flows",
          additionalProperties: {
            $ref: "#/definitions/Flow",
          },
          minProperties: 1,
        },
        infrastructure: {
          $ref: "#/definitions/Infrastructure",
        },
      },
      definitions: {
        Flow: {
          type: "object",
          description:
            "A named choreography flow defining event routing between services",
          required: ["participants"],
          anyOf: [{ required: ["events"] }, { required: ["commands"] }],
          additionalProperties: false,
          properties: {
            description: {
              type: "string",
              description: "Human-readable description of the flow",
            },
            participants: {
              type: "array",
              description: "Service names participating in this flow",
              items: {
                type: "string",
                pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
              },
              minItems: 2,
              uniqueItems: true,
            },
            commands: {
              type: "array",
              description: "Command entry points that initiate this flow",
              items: {
                $ref: "#/definitions/CommandEntry",
              },
              minItems: 1,
            },
            events: {
              type: "array",
              description: "Event routing definitions",
              items: {
                $ref: "#/definitions/EventRoute",
              },
              minItems: 1,
            },
          },
        },
        CommandEntry: {
          type: "object",
          description: "Entry point command that can initiate a flow",
          required: ["service", "command", "endpoint"],
          additionalProperties: false,
          properties: {
            service: {
              type: "string",
              description: "Service exposing the command",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
            },
            command: {
              type: "string",
              description:
                "Command identifier (kebab-case preferred; PascalCase supported for legacy endpoint-style names)",
              pattern: "(^[a-z0-9]+(-[a-z0-9]+)*$)|(^[A-Z][A-Za-z0-9]*$)",
              examples: ["create-order", "CreateOrder"],
            },
            endpoint: {
              type: "string",
              description: "HTTP endpoint path",
              pattern: "^/.*$",
              examples: ["/orders", "/inventory/reserve"],
            },
          },
        },
        EventRoute: {
          type: "object",
          description: "Defines how an event is routed from source to targets",
          required: ["source", "event", "topic", "targets"],
          additionalProperties: false,
          properties: {
            source: {
              type: "string",
              description: "Publishing service name",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
            },
            event: {
              type: "string",
              description: "Event type name (kebab-case)",
              pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
              examples: ["order-created", "fulfillment-completed"],
            },
            topic: {
              type: "string",
              description:
                "Message topic name. Convention: {boundedContext}-events",
              pattern: "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
              examples: ["order-events", "inventory-events"],
            },
            targets: {
              type: "array",
              description: "Subscribing services. Empty array for terminal events.",
              items: {
                $ref: "#/definitions/Target",
              },
              minItems: 0,
            },
          },
        },
        Target: {
          type: "object",
          description: "A subscribing service and optional transformation",
          required: ["service"],
          additionalProperties: false,
          properties: {
            service: {
              type: "string",
              description: "Subscribing service name",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
            },
            command: {
              type: "string",
              description:
                "Command to invoke on the subscribing service (kebab-case preferred; PascalCase supported for legacy endpoint-style names)",
              pattern: "(^[a-z0-9]+(-[a-z0-9]+)*$)|(^[A-Z][A-Za-z0-9]*$)",
              examples: ["reserve-stock", "ReserveStock"],
            },
            transform: {
              type: "string",
              description: "Relative path to JSONata transformation file",
              pattern:
                "^transformations/[a-z][a-z0-9-]*[a-z0-9]/[a-z0-9-]+\\.jsonata$",
              examples: [
                "transformations/fulfillment-service/inbound-order-created.jsonata",
              ],
            },
          },
        },
        Infrastructure: {
          type: "object",
          description: "Infrastructure component configuration",
          additionalProperties: false,
          properties: {
            redis: {
              $ref: "#/definitions/InfraComponent",
            },
            zipkin: {
              $ref: "#/definitions/InfraComponent",
            },
          },
        },
        InfraComponent: {
          type: "object",
          additionalProperties: false,
          properties: {
            enabled: {
              type: "boolean",
              default: true,
            },
            port: {
              type: "integer",
              minimum: 1024,
              maximum: 65535,
            },
          },
        },
      },
      examples: [
        {
          version: "1.0",
          domain: "e-commerce",
          flows: {
            "order-fulfillment": {
              description: "Order to fulfillment processing flow",
              participants: ["order-service", "fulfillment-service"],
              events: [
                {
                  source: "order-service",
                  event: "order-created",
                  topic: "order-events",
                  targets: [
                    {
                      service: "fulfillment-service",
                      transform:
                        "transformations/fulfillment-service/inbound-order-created.jsonata",
                    },
                  ],
                },
              ],
            },
          },
          infrastructure: {
            redis: {
              enabled: true,
            },
            zipkin: {
              enabled: true,
            },
          },
        },
      ],
    },
    null,
    2,
  );
}

/**
 * Generate runtime metadata schema (runtime-metadata-v1.schema.json)
 *
 * Returns the complete JSON Schema for SPAS runtime service metadata.
 * This schema defines the structure of metadata with design-time fields
 * enriched with runtime deployment information.
 *
 * @returns JSON Schema as formatted string
 */
export function generateRuntimeMetadataSchema(): string {
  return JSON.stringify(
    {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://spas.io/schemas/runtime-metadata-v1.schema.json",
      title: "SPAS Runtime Metadata",
      description:
        "Schema for SPAS runtime service metadata - Repository output with design-time metadata enriched with runtime deployment fields",
      type: "object",
      required: ["schemaVersion", "id", "name", "version", "boundedContext"],
      properties: {
        schemaVersion: {
          type: "string",
          const: "runtime-metadata-v1",
          description: "Schema version identifier for runtime metadata",
        },
        id: {
          type: "string",
          description: "Unique service identifier (kebab-case recommended)",
        },
        name: {
          type: "string",
          description: "Human-readable service name",
        },
        description: {
          type: "string",
          description: "Service description",
        },
        version: {
          type: "string",
          pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?$",
          description: "Service version (semver)",
        },
        boundedContext: {
          type: "string",
          description: "Domain bounded context (e.g., Payments, Orders)",
        },
        capabilities: {
          type: "array",
          items: {
            type: "string",
          },
          description: "List of service capabilities",
        },
        commands: {
          type: "array",
          description: "Canonical commands and their produced event relationships",
          items: {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
                description: "Canonical command identifier (kebab-case)",
              },
              version: {
                type: "string",
                description: "Command contract version (semver recommended)",
              },
              produces: {
                type: "array",
                description: "Events this command produces when it succeeds",
                items: {
                  type: "object",
                  required: ["type", "version", "when"],
                  properties: {
                    type: {
                      type: "string",
                      description: "Produced event type; must match an entry in events[].type",
                    },
                    version: {
                      type: "string",
                      description:
                        "Produced event version; must match the referenced event's version",
                    },
                    when: {
                      const: "success",
                      description: "For PoC, only 'success' is supported",
                    },
                  },
                },
              },
            },
          },
        },
        endpoints: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "type", "protocol", "methodPath", "version", "schemaRef"],
            properties: {
              name: {
                type: "string",
                description: "Endpoint name",
              },
              type: {
                type: "string",
                enum: ["Command", "Query"],
                description: "Endpoint type: Command (write) or Query (read)",
              },
              protocol: {
                type: "string",
                enum: ["Http", "Grpc"],
                description: "Communication protocol",
              },
              methodPath: {
                type: "string",
                description:
                  "HTTP method and path (e.g., POST /api/orders) or gRPC method",
              },
              version: {
                type: "string",
                description: "Endpoint version",
              },
              schemaRef: {
                type: "string",
                format: "uri-reference",
                description:
                  "Relative or absolute URI reference to endpoint schema (e.g., schemas/create-order.schema.json)",
              },
            },
          },
          description: "Service endpoints (commands and queries)",
        },
        events: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "version", "schemaRef"],
            properties: {
              type: {
                type: "string",
                description: "Event type identifier (e.g., OrderCreated)",
              },
              version: {
                type: "string",
                description: "Event schema version",
              },
              schemaRef: {
                type: "string",
                format: "uri-reference",
                description: "Relative or absolute URI reference to event schema",
              },
            },
          },
          description: "Events published by this service (outbound only)",
        },
        consistency: {
          type: "object",
          properties: {
            commands: {
              type: "string",
              enum: ["ACID", "EVENTUAL"],
              description: "Consistency guarantee for command endpoints",
            },
            queries: {
              type: "string",
              enum: ["STRONG", "EVENTUAL"],
              description: "Consistency guarantee for query endpoints",
            },
          },
          description: "Consistency guarantees",
        },
        network: {
          type: "object",
          properties: {
            requiredEgress: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Required outbound network dependencies (hostnames or service IDs)",
            },
          },
          description: "Network requirements",
        },
        security: {
          type: "object",
          required: ["dataClassification"],
          properties: {
            authentication: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["OAuth2", "JWT", "ApiKey", "mTLS", "None"],
                  description: "Authentication mechanism",
                },
                requiredScopes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Required OAuth2/OIDC scopes",
                },
              },
              description: "Authentication configuration (optional)",
            },
            dataClassification: {
              type: "array",
              items: {
                type: "string",
                enum: ["Public", "Internal", "Confidential", "Restricted"],
              },
              minItems: 1,
              description:
                "Data classification levels handled by this service",
            },
          },
          description: "Security metadata",
        },
        license: {
          type: "string",
          description: "License identifier (e.g., MIT, Apache-2.0)",
        },
        runtime: {
          type: "object",
          description:
            "Runtime deployment metadata - added by Repository at publish time",
          properties: {
            image: {
              type: "string",
              description:
                "Full OCI image reference with digest (e.g., ghcr.io/org/service@sha256:abc123...)",
              pattern: "^[a-zA-Z0-9][a-zA-Z0-9._/-]*@sha256:[a-fA-F0-9]{64}$",
            },
            repository: {
              type: "string",
              description: "OCI image repository (e.g., ghcr.io/org/service)",
              pattern: "^[a-zA-Z0-9][a-zA-Z0-9._/-]*$",
            },
            tag: {
              type: "string",
              description: "Image tag (e.g., 1.0.0, latest)",
            },
            digest: {
              type: "string",
              description:
                "SHA256 digest of the container image (e.g., sha256:abc123...)",
              pattern: "^sha256:[a-fA-F0-9]{64}$",
            },
            resources: {
              type: "object",
              description: "Resource requirements (optional)",
              properties: {
                cpu: {
                  type: "string",
                  description: "CPU requirement (e.g., 100m, 2)",
                  pattern: "^\\d+m?$",
                },
                memory: {
                  type: "string",
                  description: "Memory requirement (e.g., 128Mi, 2Gi)",
                  pattern: "^\\d+(Mi|Gi|M|G)$",
                },
              },
            },
            env: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Environment variable names required (values not stored for security)",
            },
          },
        },
        publishedAt: {
          type: "string",
          format: "date-time",
          description:
            "ISO 8601 timestamp when the service was published to the repository",
        },
      },
    },
    null,
    2,
  );
}
