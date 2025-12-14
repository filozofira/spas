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
 * Generate agent prompt file content
 * 
 * Note: This creates/updates .github/agents/spas-compose.md in the REPOSITORY ROOT,
 * not in the domain workspace. The prompt is workspace-aware but stored globally.
 */
export function generateAgentPrompt(): string {
  return `# /spas.compose Agent Prompt

**Purpose**: AI-assisted choreography composition for SPAS domain workspaces

## Responsibilities

1. **Contract Analysis**: Parse service metadata from \`services/*/spas.json\`
2. **Event Matching**: Identify semantic matches between published/subscribed events
3. **Choreography Generation**: Propose topic mappings and flow definitions
4. **Transformation Generation**: Create JSONata transformation files
5. **Iterative Refinement**: Confirm with developer, iterate based on feedback

## Workspace Awareness

**Workspace Detection**: Agent must verify it's operating in a valid domain workspace:
- \`choreography.yaml\` exists
- \`services/\` directory exists with pulled services

**Service Discovery**: Read all \`services/*/spas.json\` files to understand:
- Service identities (\`id\`, \`version\`, \`boundedContext\`)
- Published events (\`events.published[]\`)
- Subscribed events (\`events.subscribed[]\`)
- Event schemas (from \`schemas/\` folder)

## Workflow

### Phase 1: Analysis

\`\`\`
User: /spas.compose Analyze order-service and fulfillment-service contracts
\`\`\`

**Agent Actions**:
1. Read \`services/order-service/spas.json\`
2. Read \`services/fulfillment-service/spas.json\`
3. Identify published events from each service
4. Identify subscribed events from each service
5. Present summary to user

**Expected Output**:
\`\`\`
Found 2 services:

order-service (1.0.0)
  Published: OrderCreated, OrderUpdated, OrderCancelled
  Subscribed: PaymentReceived

fulfillment-service (1.0.0)
  Published: FulfillmentCompleted, FulfillmentFailed
  Subscribed: OrderCreated

Potential matches:
  ✓ order-service.OrderCreated → fulfillment-service (subscribed)

Confirm to proceed with choreography generation? (yes/no)
\`\`\`

### Phase 2: Choreography Proposal

**Agent Actions**:
1. Propose topic names for event routes
2. Suggest flow names and participants
3. Generate \`choreography.yaml\` updates

**Expected Output**:
\`\`\`yaml
# Proposed choreography.yaml update

flows:
  order-fulfillment:
    description: "Order to fulfillment processing flow"
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: OrderCreated
        topic: orders
        targets:
          - service: fulfillment-service
            transform: choreography/transformations/fulfillment-service/inbound-order-created.jsonata

Confirm to update choreography.yaml? (yes/no/edit)
\`\`\`

### Phase 3: Transformation Generation

**Agent Actions**:
1. Analyze event schemas (source and target)
2. Generate JSONata transformation files
3. Create transformation file at correct path

**Expected Output**:
\`\`\`jsonata
/* choreography/transformations/fulfillment-service/inbound-order-created.jsonata */
/* Transforms OrderCreated (order-service) → FulfillmentRequest (fulfillment-service) */
{
  "fulfillmentId": $uuid(),
  "orderId": orderId,
  "items": items.{
    "sku": productId,
    "quantity": quantity,
    "warehouse": "default"
  },
  "priority": priority = "express" ? "high" : "normal"
}
\`\`\`

**Confirm to create transformation file? (yes/no/edit)**

### Phase 4: Validation

**Agent Actions**:
1. Verify all transformation files exist
2. Validate JSONata syntax
3. Confirm choreography.yaml schema compliance

**Expected Output**:
\`\`\`
✓ choreography.yaml is valid
✓ All transformation files exist
✓ All participants have pulled services

Ready to deploy with: spas-compose choreography deploy --docker
\`\`\`

## Error Handling

| Error | Agent Response |
|-------|----------------|
| Not in workspace | "Error: Not in a valid domain workspace. Run \`spas-compose init\` first." |
| No services pulled | "Error: No services found. Run \`spas-compose services pull\` first." |
| Schema mismatch | "Warning: Cannot auto-generate transformation for <event>. Schemas incompatible. Manual transformation required." |
| Invalid JSONata | "Error: Generated transformation has syntax error at line X. Regenerating..." |

## Example Prompts

\`\`\`
/spas.compose Analyze all pulled services and propose choreography flows

/spas.compose Generate transformation for order-service.OrderCreated to fulfillment-service

/spas.compose Review choreography.yaml and identify missing transformations

/spas.compose Add notification-service to order-fulfillment flow
\`\`\`

## Constraints

- **No File Deletion**: Agent MUST NOT delete existing transformation files without explicit confirmation
- **Schema Compliance**: All \`choreography.yaml\` updates MUST validate against \`contracts/choreography-schema.yaml\`
- **Naming Conventions**: Transformation files MUST follow pattern: \`inbound-<event-type-kebab>.jsonata\` or \`outbound-<event-type-kebab>.jsonata\`
- **Iterative Confirmation**: Agent MUST confirm each change (choreography update, file creation) before proceeding

## References

- [specs/005-spas-compose-cli/](../../specs/005-spas-compose-cli/)
- [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md)
- [ADR-037: AI-in-the-loop composition](../../principles/appendix/28-decision-log.md)
`;
}
