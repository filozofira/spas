/**
 * File templates for workspace initialization
 */

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
/spas.compose Analyze order-service and fulfillment-service contracts.
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
  #       event: OrderCreated
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

/**
 * Generate agent file content (.github/agents/spas.compose.agent.md)
 *
 * Creates the full agent instructions at project root.
 * Follows SpecKit pattern: .github/agents/*.agent.md
 *
 * @param workspaceName Name of the domain workspace
 * @param domainPath Relative path from project root to domain (e.g., "domains/my-domain")
 */
export function generateAgentFile(workspaceName: string, domainPath?: string): string {
  // Use domainPath if provided, otherwise fall back to workspaceName for backward compatibility
  const path = domainPath ?? workspaceName;
  
  return `---
description: AI-assisted choreography composition for SPAS domain workspaces
---

## User Input

\`\`\`text
$ARGUMENTS
\`\`\`

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Analyze pulled service contracts and generate choreography configuration with transformations for the **${workspaceName}** domain workspace.

## Responsibilities

1. **Contract Analysis**: Parse service metadata from \`${path}/services/*/spas.json\`
2. **Event Matching**: Identify semantic matches between published/subscribed events
3. **Choreography Generation**: Propose topic mappings and flow definitions
4. **Transformation Generation**: Create JSONata transformation files
5. **Iterative Refinement**: Confirm with developer, iterate based on feedback

## Workspace Structure

\`\`\`
${path}/
├── choreography.yaml              # Choreography configuration (you modify this)
├── services/                      # Pulled service metadata (read-only)
│   └── <service-name>/
│       ├── spas.json              # Service contract
│       └── schemas/               # Schemas (preserves archive structure)
│           ├── endpoints/         # Endpoint request/response schemas
│           │   └── <endpoint>.schema.json
│           └── events/            # Event payload schemas
│               └── <event-type>.schema.json
└── transformations/               # JSONata files (you create these)
    └── <service-name>/
        ├── inbound-<event>.jsonata
        └── outbound-<event>.jsonata
\`\`\`

## Workflow

### Step 1: Validate Workspace

Before any operation, verify:
- \`${path}/choreography.yaml\` exists
- \`${path}/services/\` directory exists with at least one service

If invalid:
\`\`\`
Error: Not in a valid domain workspace.
Run \`spas-compose init ${workspaceName}\` first, then \`spas-compose services pull\`.
\`\`\`

### Step 2: Analyze Services

When asked to analyze services:
1. Read \`${path}/services/<service-name>/spas.json\` for each service
2. Extract: \`id\`, \`version\`, \`boundedContext\`, \`events.published[]\`, \`events.subscribed[]\`
3. Read schemas from \`${path}/services/<service-name>/schemas/\`

**Output Format:**
\`\`\`
📦 order-service (1.0.0) - orders bounded context
  Published: OrderCreated, OrderCancelled
  Subscribed: PaymentReceived

📦 fulfillment-service (1.0.0) - fulfillment bounded context  
  Published: FulfillmentCompleted
  Subscribed: OrderCreated ← matches order-service.OrderCreated ✓
\`\`\`

### Step 3: Propose Choreography

Generate choreography.yaml following schema:
\`\`\`yaml
version: "1.0"
domain: ${workspaceName}

flows:
  <flow-name>:
    description: "<description>"
    participants:
      - <service-name>
    events:
      - source: <publishing-service>
        event: <EventType>
        topic: <topic-name>
        targets:
          - service: <subscribing-service>
            transform: transformations/<service>/inbound-<event>.jsonata
\`\`\`

**Ask:** "Confirm choreography changes? (yes/no/feedback)"

### Step 4: Generate Transformations

Create JSONata files at \`${path}/transformations/<service>/*.jsonata\`:
\`\`\`jsonata
/* inbound-order-created.jsonata */
/* Transforms OrderCreated (order-service) → FulfillmentRequest (fulfillment-service) */
{
  "orderId": orderId,
  "items": items.{ "sku": productId, "qty": quantity },
  "priority": priority = "express" ? "high" : "normal"
}
\`\`\`

**Ask:** "Confirm transformation? (yes/no/feedback)"

### Step 5: Next Steps

After completion, suggest:
\`\`\`
✓ Choreography complete

Next steps:
  • Validate: spas-compose choreography build --dry-run
  • Build: spas-compose choreography build --docker  
  • Run: docker compose up
\`\`\`

## Constraints

| Constraint | Behavior |
|------------|----------|
| **Read-only services/** | NEVER modify files in \`${path}/services/\` |
| **Preserve existing flows** | When adding flows, preserve all existing flows |
| **Valid JSONata** | All .jsonata files must have valid syntax |
| **Confirm before write** | ALWAYS wait for explicit confirmation |
| **Kebab-case naming** | Topics and file names use lowercase-hyphenated format |

## Error Handling

| Error | Response |
|-------|----------|
| No choreography.yaml | "Error: Workspace not initialized. Run \`spas-compose init\` first." |
| No services pulled | "Error: No services found. Run \`spas-compose services pull\` first." |
| Service not found | "Error: Service '<name>' not found in services/ directory." |
| Schema mismatch | "Warning: Cannot auto-generate transformation. Manual mapping required." |

## Example Prompts

\`\`\`
/spas.compose Analyze order-service and fulfillment-service

/spas.compose Generate transformation for OrderCreated to fulfillment-service

/spas.compose Review choreography.yaml and identify missing transformations

/spas.compose Add notification-service to order-fulfillment flow
\`\`\`

## Sidecar Configuration Mapping

The choreography.yaml flows generate sidecar configuration files. Use the schema at \`${path}/.spas/schemas/sidecar-config-v1.schema.json\` to understand the mapping:

| Choreography Field | Sidecar Config Path | Description |
|-------------------|---------------------|-------------|
| \`flows.*.events[].topic\` | \`inbound[].topic\` | Topic name for event subscription |
| \`flows.*.events[].targets[].transform\` | \`inbound[].transform\` | JSONata file path |
| \`flows.*.events[].targets[].service\` | (routing) | Determines which config file |
| Service endpoint from spas.json | \`inbound[].invokeEndpoint\` | HTTP path on target service |
| \`flows.*.events[].source\` + event | \`outbound[].topic\` + \`eventType\` | Publishing config |

**InboundEntry kinds:**
- \`kind: "event"\` - Pub/sub subscription (requires \`topic\`)
- \`kind: "command"\` - Request-response (requires \`command\`)

## References

- [Sidecar Config Schema](${path}/.spas/schemas/sidecar-config-v1.schema.json)
`;
}

/**
 * Generate prompt file content (.github/prompts/spas-compose.prompt.md)
 *
 * Creates the trigger file that references the agent.
 * Follows SpecKit pattern: .github/prompts/*.prompt.md
 */
export function generatePromptFile(): string {
  return `---
agent: spas-compose
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
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
              description:
                "Command name for /invoke/{command} endpoint. Required when kind='command'.",
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
