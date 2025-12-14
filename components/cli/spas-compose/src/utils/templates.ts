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
└── choreography/
    └── transformations/         # JSONata transformation files
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

### 3. Deploy

Generate Docker Compose deployment:

\`\`\`bash
spas-compose choreography deploy --dry-run   # Validate
spas-compose choreography deploy --docker    # Generate docker-compose.yaml
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
  #           transform: choreography/transformations/fulfillment-service/inbound-order-created.jsonata

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
 * Generate agent file content (.github/agents/spas-compose.agent.md)
 * 
 * Creates the full agent instructions at project root.
 * Follows SpecKit pattern: .github/agents/*.agent.md
 */
export function generateAgentFile(workspaceName: string): string {
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

1. **Contract Analysis**: Parse service metadata from \`${workspaceName}/services/*/spas.json\`
2. **Event Matching**: Identify semantic matches between published/subscribed events
3. **Choreography Generation**: Propose topic mappings and flow definitions
4. **Transformation Generation**: Create JSONata transformation files
5. **Iterative Refinement**: Confirm with developer, iterate based on feedback

## Workspace Structure

\`\`\`
${workspaceName}/
├── choreography.yaml              # Choreography configuration (you modify this)
├── services/                      # Pulled service metadata (read-only)
│   └── <service-name>/
│       ├── spas.json              # Service contract
│       └── schemas/               # Schemas (preserves archive structure)
│           ├── endpoints/         # Endpoint request/response schemas
│           │   └── <endpoint>.schema.json
│           └── events/            # Event payload schemas
│               └── <event-type>.schema.json
└── choreography/
    └── transformations/           # JSONata files (you create these)
        └── <service-name>/
            ├── inbound-<event>.jsonata
            └── outbound-<event>.jsonata
\`\`\`

## Workflow

### Step 1: Validate Workspace

Before any operation, verify:
- \`${workspaceName}/choreography.yaml\` exists
- \`${workspaceName}/services/\` directory exists with at least one service

If invalid:
\`\`\`
Error: Not in a valid domain workspace.
Run \`spas-compose init ${workspaceName}\` first, then \`spas-compose services pull\`.
\`\`\`

### Step 2: Analyze Services

When asked to analyze services:
1. Read \`${workspaceName}/services/<service-name>/spas.json\` for each service
2. Extract: \`id\`, \`version\`, \`boundedContext\`, \`events.published[]\`, \`events.subscribed[]\`
3. Read schemas from \`${workspaceName}/services/<service-name>/schemas/\`

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
            transform: choreography/transformations/<service>/inbound-<event>.jsonata
\`\`\`

**Ask:** "Confirm choreography changes? (yes/no/feedback)"

### Step 4: Generate Transformations

Create JSONata files at \`${workspaceName}/choreography/transformations/<service>/*.jsonata\`:
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
  • Validate: spas-compose choreography deploy --dry-run
  • Deploy: spas-compose choreography deploy --docker  
  • Run: docker compose up
\`\`\`

## Constraints

| Constraint | Behavior |
|------------|----------|
| **Read-only services/** | NEVER modify files in \`${workspaceName}/services/\` |
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

## References

- [specs/005-spas-compose-cli/](specs/005-spas-compose-cli/)
- [principles/component/14-domain-choreography.md](principles/component/14-domain-choreography.md)
- [ADR-037: AI-in-the-loop composition](principles/appendix/28-decision-log.md)
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
