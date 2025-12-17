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
 * Generate Technical Reference section for agent prompt
 *
 * Includes:
 * - CloudEvents type format
 * - Sidecar config schema documentation
 * - JSONata transformation patterns
 * - Endpoint routing rules
 * - Field naming conventions
 *
 * @param domainRoot Relative path from project root to domain parent
 */
function generateTechnicalReference(domainRoot: string): string {
  return `
## Technical Reference

### CloudEvents Type Format

The sidecar automatically constructs CloudEvents-compliant event envelopes. The \`type\` field follows this format:

\`\`\`
com.{bounded-context}.{event-name-kebab}
\`\`\`

**Construction Rules:**
1. **Bounded Context**: Extracted from \`x-service-name\` by removing \`-service\` suffix
   - \`order-service\` → \`order\`
   - \`inventory-service\` → \`inventory\`
2. **Event Name**: From \`x-event-name\` in choreography metadata (kebab-case)

**Examples:**
\`\`\`yaml
# Service: order-service
# Event: order-created
→ CloudEvents type: com.order.order-created

# Service: inventory-service  
# Event: stock-reserved
→ CloudEvents type: com.inventory.stock-reserved
\`\`\`

**Why this matters:** Enables event filtering by bounded context or specific event types in the event broker.

### Sidecar Configuration Schema

When generating sidecar configurations, reference these field definitions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| \`serviceId\` | string | ✅ | Unique identifier for this service |
| \`serviceName\` | string | ✅ | Human-readable name (matches x-service-name) |
| \`servicePort\` | number | ✅ | Port the actual service listens on |
| \`sidecarPort\` | number | ✅ | Port sidecar exposes (usually 8080) |
| \`choreographyPath\` | string | ✅ | Path to choreography directory |
| \`repositoryUrl\` | string | ❌ | SPAS repository URL (optional) |
| \`proxies\` | object | ❌ | Map of serviceId → proxy config |
| \`proxies.*.target\` | string | ✅* | Downstream service URL (required if proxy used) |
| \`proxies.*.timeout\` | number | ❌ | Request timeout in ms (default: 30000) |
| \`enableHealthCheck\` | boolean | ❌ | Enable /health endpoint (default: true) |
| \`healthCheckPath\` | string | ❌ | Custom health check path (default: /health) |

**Example Complete Configuration:**
\`\`\`json
{
  "serviceId": "order-service",
  "serviceName": "order-service",
  "servicePort": 3000,
  "sidecarPort": 8080,
  "choreographyPath": "/app/choreographies",
  "proxies": {
    "inventory-service": {
      "target": "http://inventory-sidecar:8080",
      "timeout": 5000
    },
    "payment-service": {
      "target": "http://payment-sidecar:8080"
    }
  }
}
\`\`\`

### JSONata Transformation Patterns

**CRITICAL**: JSONata has specific array handling requirements. Follow these patterns:

**Pattern 1: Array Construction (REQUIRED)**
\`\`\`jsonata
// ❌ WRONG - fails when source array has single element
[item1, item2, item3]

// ✅ CORRECT - always use $append
$append($append([], item1), item2)

// ✅ CORRECT - single item
$append([], singleItem)

// ✅ CORRECT - mapping arrays
$append([], items.{"sku": sku, "quantity": quantity})
\`\`\`

**Why**: JSONata returns a single object (not array) when mapping over a single-element array. \`$append([], ...)\` ensures array output.

**Pattern 2: Object Construction**
\`\`\`jsonata
{
  "orderId": orderId,
  "items": $append([], items.{"sku": productId, "qty": quantity}),
  "timestamp": $now()
}
\`\`\`

**Pattern 3: Conditional Fields**
\`\`\`jsonata
$merge([
  {"required": value},
  source.optional ? {"optional": source.optional} : {}
])
\`\`\`

### Endpoint Routing

All service-to-service communication goes through sidecar proxies.

**Endpoint Format:**
\`\`\`
http://sidecar:8080/proxy/{serviceId}/{path}
\`\`\`

**Routing Rules:**
1. \`{serviceId}\` in endpoint path MUST match a key in sidecar \`proxies\` config
2. \`{path}\` is appended to the target URL
3. Sidecar handles service discovery within Docker network

**Example:**
\`\`\`yaml
# In choreography
downstream:
  endpoint: http://sidecar:8080/proxy/inventory-service/stock

# In sidecar config.json
proxies:
  inventory-service:
    target: http://inventory-service:3000

# Actual HTTP call made by sidecar:
# POST http://inventory-service:3000/stock
\`\`\`

**Common Mistake:** Using wrong serviceId results in \`404 from sidecar proxy\`.

### Field Naming Conventions

**REQUIRED**: All field names MUST use camelCase.

\`\`\`yaml
# ✅ CORRECT
inputMapping:
  orderId: $.order.orderId
  customerEmail: $.customer.email
  itemCount: $.items.length

# ❌ WRONG - will cause null/undefined values
inputMapping:
  order_id: $.order.order_id
  customer-email: $.customer.email
  item_count: $.items.length
\`\`\`

**Consistency Rule**: Match field names across:
1. Service request/response schemas
2. Event payloads  
3. JSONata expressions

**Why**: JavaScript/TypeScript ecosystem convention. Ensures SDK serialization works correctly.

### Choreography → Sidecar Config Mapping

The choreography.yaml flows generate sidecar configuration files. Use the schema at \`${domainRoot}/{DOMAIN}/.spas/schemas/sidecar-config-v1.schema.json\` to understand the mapping:

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

### Choreography YAML Schema

Choreography files define event-driven workflows and service interactions.

**Structure:**
\`\`\`yaml
openapi: 3.1.0
info:
  title: "Choreography Title"
  version: "1.0.0"
  x-service-name: "<service-name>"        # Service that owns this choreography
  x-event-name: "<event-name>"            # Event that triggers this flow
  x-choreography-type: "event-outbound"   # Type: event-outbound | event-inbound

x-spas-choreography:
  trigger:
    type: event                            # event | http
    source: internal                       # internal | external
    eventType: "<EventType>"              # Event type in PascalCase
  
  steps:
    - name: "step-name"
      type: downstream                     # downstream | emit | parallel
      downstream:
        endpoint: "http://sidecar:8080/proxy/{serviceId}/{path}"
        method: POST                       # GET | POST | PUT | DELETE
        inputMapping:                      # JSONata expressions
          field1: $.source.field
          field2: $.source.field
        outputMapping:                     # Map response to context
          resultField: $.responseField
        onSuccess:                         # Optional success handler
          emit:
            eventType: "SuccessEvent"
            payload:
              field: $.value
        onFailure:                         # Optional failure handler
          emit:
            eventType: "FailureEvent"
            payload:
              error: $.error.message
\`\`\`

**Step Types:**
- **downstream**: HTTP call to another service (uses endpoint, method, inputMapping)
- **emit**: Publish event (uses eventType, payload)
- **parallel**: Execute multiple steps concurrently (uses branches array)

**Trigger Types:**
- **event**: Triggered by incoming event (requires source, eventType)
- **http**: Triggered by HTTP request (requires path, method)

### Service Metadata (spas.json) Schema

Service metadata files declare service identity and event contracts.

**Required Fields:**
\`\`\`json
{
  "id": "order-service",                  // Unique service identifier
  "version": "1.0.0",                      // Semantic version
  "boundedContext": "orders",             // Domain context
  "events": {
    "published": [                         // Events this service emits
      {
        "name": "order-created",
        "x-event-name": "order-created",   // REQUIRED: Event identifier
        "schema": "./schemas/order-created.schema.json"
      },
      {
        "name": "order-cancelled",
        "x-event-name": "order-cancelled",
        "schema": "./schemas/order-cancelled.schema.json"
      }
    ],
    "subscribed": [                        // Events this service listens to
      {
        "name": "payment-received",
        "x-event-name": "payment-received",
        "schema": "./schemas/payment-received.schema.json"
      }
    ]
  },
  "endpoints": [                           // HTTP endpoints exposed
    {
      "path": "/orders",
      "method": "POST",
      "x-service-name": "order-service"   // REQUIRED: Service identifier
    }
  ]
}
\`\`\`

**Critical Fields:**
- **x-service-name**: REQUIRED in endpoints. Used for sidecar routing and CloudEvents source.
- **x-event-name**: REQUIRED in events. Used for CloudEvents type construction.
- **boundedContext**: Used to derive CloudEvents type prefix (\`com.{boundedContext}.{event}\`).

**Common Mistake**: Omitting \`x-service-name\` or \`x-event-name\` causes choreography loading failures.
`;
}

/**
 * Generate Workflow Phases section for agent prompt
 *
 * Defines the 5-phase workflow with validation checkpoints:
 * 1. Analyze - Parse service contracts and validate workspace
 * 2. Propose - Generate sequence diagram and choreography design
 * 3. Generate - Create transformation artifacts
 * 4. Validate - Verify generated files for correctness
 * 5. Build - Prepare for deployment
 *
 * @param domainRoot Relative path from project root to domain parent
 */
function generateWorkflowPhases(domainRoot: string): string {
  return `
## Workflow

Follow this 5-phase workflow with validation checkpoints at each stage.

### Phase 1: Analyze

**Entry Criteria:** User request received to analyze services or create choreography

**Actions:**
1. **Validate Workspace**
   - Verify \`${domainRoot}/{DOMAIN}/choreography.yaml\` exists
   - Verify \`${domainRoot}/{DOMAIN}/services/\` directory exists with at least one service
   - If invalid: Show error and suggest \`spas-compose init {DOMAIN} --output ${domainRoot}\`, then \`spas-compose services pull\`

2. **Read Service Contracts**
   - Read \`${domainRoot}/{DOMAIN}/services/<service-name>/spas.json\` for each service
   - Extract: \`id\`, \`version\`, \`boundedContext\`, \`events.published[]\`, \`events.subscribed[]\`
   - Read schemas from \`${domainRoot}/{DOMAIN}/services/<service-name>/schemas/\`

3. **Identify Relationships**
   - Match published events to subscribed events across services
   - Identify bounded context boundaries
   - Flag missing schemas or mismatched event names

**Output Example:**
\`\`\`
📦 order-service (1.0.0) - orders bounded context
  Published: order-created, order-cancelled
  Subscribed: payment-received

📦 fulfillment-service (1.0.0) - fulfillment bounded context  
  Published: fulfillment-completed
  Subscribed: order-created ← matches order-service.order-created ✓
\`\`\`

**Exit Criteria:** All services analyzed, relationships identified, understanding confirmed by user

---

### Phase 2: Propose

**Entry Criteria:** Analysis complete, user ready to design choreography

**Actions:**
1. **Generate Sequence Diagram**
   - Create Mermaid diagram showing service interactions
   - Include all participants, request/response flows, event emissions

2. **Design Choreography**
   - Create choreography.yaml structure with flows, participants, events
   - Propose transformation file paths following naming convention

3. **Present Design**
   - Show Mermaid diagram
   - Show choreography.yaml proposal
   - List transformation files to be created

**Mermaid Diagram Template:**
\`\`\`mermaid
sequenceDiagram
    participant OrderService as order-service
    participant FulfillmentService as fulfillment-service
    participant PaymentService as payment-service

    Note over OrderService: Order Created
    OrderService->>FulfillmentService: order-created event
    Note over FulfillmentService: Process Fulfillment
    FulfillmentService->>PaymentService: fulfillment-completed event
    Note over PaymentService: Payment Processing
\`\`\`

**Choreography Schema:**
\`\`\`yaml
version: "1.0"
domain: {DOMAIN}

flows:
  <flow-name>:
    description: "<description>"
    participants:
      - <publisher-service>
      - <subscriber-service>
    events:
      - source: <publishing-service>
        event: <event-type>
        topic: <topic-name>
        targets:
          - service: <subscribing-service>
            transform: transformations/<service>/inbound-<event>.jsonata

# Optional infrastructure configuration
infrastructure:
  redis:
    enabled: true
  zipkin:
    enabled: true
\`\`\`

**Requirements:**
- \`participants\` must include at least 2 services
- Topic names follow pattern: \`{domain}.{bounded-context}.{event-type}\`
- Transformation paths: \`transformations/{service}/inbound-{event}.jsonata\`

**Exit Criteria:** User confirms design with "yes" or provides feedback

**Confirmation Prompt:**
\`\`\`
I've proposed the choreography design above with:
  • {N} flows defined
  • {N} services participating
  • {N} transformation files to create

Do you want me to proceed with generating the choreographies? (yes/no/feedback)
\`\`\`

---

### Phase 3: Generate

**Entry Criteria:** User confirmed design, ready to create artifacts

**Actions:**
1. **Create Transformation Files**
   - Generate JSONata files at \`${domainRoot}/{DOMAIN}/transformations/<service>/*.jsonata\`
   - Follow CloudEvents type format (camelCase for data fields)
   - Use \`$append([], array.{...})\` pattern for array transformations
   - Add header comments documenting source → target mapping

2. **Update choreography.yaml**
   - Add or modify flows as designed
   - Ensure all referenced transformation files are created

**JSONata Template:**
\`\`\`jsonata
/* inbound-order-created.jsonata */
/* Transforms order-created (order-service) → fulfillment-request (fulfillment-service) */
{
  "orderId": orderId,
  "items": $append([], items.{ "sku": productId, "qty": quantity }),
  "priority": priority = "express" ? "high" : "normal"
}
\`\`\`

**Critical Patterns:**
- Array fields: Always use \`$append([], array.{...})\` to preserve arrays even for single elements
- Field casing: Match target schema (usually camelCase for CloudEvents data)
- Null handling: Use \`field ? field : "default"\` or \`$exists(field) ? field : null\`

**Validation Checklist (Phase 3):**
- [ ] All transformation files created in correct directories
- [ ] File names match \`inbound-{event}.jsonata\` or \`outbound-{event}.jsonata\` pattern
- [ ] Header comments document source and target schemas
- [ ] Array transformations use \`$append\` pattern
- [ ] Field names match target schema casing
- [ ] choreography.yaml references all created transformations

**Exit Criteria:** All artifacts created, checklist validated

---

### Phase 4: Validate

**Entry Criteria:** All artifacts generated, ready for verification

**Actions:**
1. **Syntax Validation**
   - Check choreography.yaml is valid YAML
   - Check JSONata files have valid syntax
   - Verify file paths match choreography.yaml references

2. **Schema Validation**
   - Verify referenced services exist in \`services/\` directory
   - Check transformation input schemas match event publisher schemas
   - Check transformation output schemas match event subscriber schemas

3. **Consistency Checks**
   - Verify all \`flows.*.participants\` services are in \`services/\`
   - Verify all \`flows.*.events[].source\` match a participant
   - Verify all \`flows.*.events[].targets[].service\` match a participant
   - Check topic naming follows \`{domain}.{context}.{event}\` pattern

**Validation Checklist (Phase 4):**
- [ ] choreography.yaml is valid YAML syntax
- [ ] All JSONata files have valid syntax
- [ ] All referenced services exist in services/ directory
- [ ] All transformation paths in choreography.yaml match created files
- [ ] Event source services publish the referenced events
- [ ] Target services subscribe to the referenced events
- [ ] Topic names follow naming convention
- [ ] Field names in transformations match target schemas

**Exit Criteria:** All validations pass, artifacts ready for deployment

---

### Phase 5: Build

**Entry Criteria:** Validation complete, ready for deployment preparation

**Actions:**
1. **Suggest Build Commands**
   - Dry-run validation: \`spas-compose choreography build --dry-run\`
   - Docker build: \`spas-compose choreography build --docker\`
   - Local run: \`docker compose up\`

2. **Next Steps Guidance**
   - Review generated sidecar configurations
   - Test event flow with sample payloads
   - Monitor logs for transformation errors

**Output:**
\`\`\`
✓ Choreography complete

Next steps:
  • Validate: spas-compose choreography build --dry-run
  • Build: spas-compose choreography build --docker  
  • Run: docker compose up
  • Monitor: docker compose logs -f spas-sidecar-{service}
\`\`\`

**Exit Criteria:** User has clear next steps, workflow complete

---

### Phase Transition Rules

- **Analyze → Propose**: Only after user confirms understanding of service analysis
- **Propose → Generate**: Only after user explicitly confirms with "yes" or provides feedback and confirms
- **Generate → Validate**: Automatic, but report what was created before validating
- **Validate → Build**: Only after all validation checks pass
- **Failure Handling**: If validation fails, return to appropriate phase (syntax errors → Generate, schema mismatches → Propose)
`;
}

/**
 * Generate Known Pitfalls section for agent prompt
 *
 * Documents common mistakes discovered during E2E testing:
 * - Missing $append for arrays
 * - Wrong endpoint service ID
 * - Inconsistent field casing
 * - Missing x-service-name
 * - Circular event dependencies
 * - Empty outputMapping
 */
function generateKnownPitfalls(): string {
  return ``;
}

/**
 * Generate Troubleshooting section for agent prompt
 *
 * Maps common errors to solutions:
 * - 400 on /incoming
 * - Transform failures
 * - Event routing misses
 * - Connection refused
 */
function generateTroubleshooting(): string {
  return ``;
}

/**
 * Generate Complete Examples section for agent prompt
 *
 * Provides 2 working examples:
 * 1. Order→Inventory reserve flow
 * 2. Inventory→Order confirmation flow
 */
/**
 * Generate Complete Examples section for agent prompt
 *
 * Provides two fully-worked choreography examples with diagrams
 */
function generateCompleteExamples(): string {
  return `
## Complete Examples

### Example 1: Order → Inventory (Reserve Stock)

\`\`\`mermaid
sequenceDiagram
    participant OrderService
    participant OrderSidecar
    participant InventorySidecar
    participant InventoryService

    OrderService->>OrderSidecar: ReserveInventory
    OrderSidecar->>InventorySidecar: POST /proxy/inventory-service/reserve
    InventorySidecar->>InventoryService: POST /reserve
    InventoryService-->>InventorySidecar: 200 {reservationId}
    InventorySidecar-->>OrderSidecar: 200
    OrderSidecar->>OrderSidecar: Emit InventoryReserved
\`\`\`

**Choreography YAML**:
\`\`\`yaml
openapi: 3.1.0
info:
  title: Reserve Inventory
  x-service-name: order-service
  x-event-name: inventory-reserve-requested

x-spas-choreography:
  trigger:
    type: event
    eventType: ReserveInventory
  steps:
    - name: reserve-stock
      type: downstream
      downstream:
        endpoint: http://sidecar:8080/proxy/inventory-service/reserve
        method: POST
        inputMapping:
          orderId: $.orderId
          items: $append([], $.items.{"sku": sku, "quantity": quantity})
        onSuccess:
          emit:
            eventType: InventoryReserved
            payload: {orderId: $.orderId, reservationId: $.reservationId}
\`\`\`

**Key**: \`$append\` for arrays, endpoint matches proxies config, onSuccess emits event.

---

### Example 2: Inventory → Order (Fulfillment)

\`\`\`mermaid
sequenceDiagram
    participant InventoryService
    participant InventorySidecar
    participant OrderSidecar
    participant OrderService

    InventoryService->>InventorySidecar: FulfillmentComplete
    InventorySidecar->>OrderSidecar: POST /proxy/order-service/fulfillment
    OrderSidecar->>OrderService: POST /fulfillment
    OrderService-->>OrderSidecar: 200
    InventorySidecar->>InventorySidecar: Emit OrderFulfilled
\`\`\`

**Choreography YAML**:
\`\`\`yaml
openapi: 3.1.0
info:
  title: Order Fulfillment
  x-service-name: inventory-service
  x-event-name: fulfillment-complete

x-spas-choreography:
  trigger:
    type: event
    eventType: FulfillmentComplete
  steps:
    - name: notify-order
      type: downstream
      downstream:
        endpoint: http://sidecar:8080/proxy/order-service/fulfillment
        method: POST
        inputMapping:
          orderId: $.orderId
          shippedItems: $append([], $.items.{"sku": sku, "qty": quantity})
          shippedAt: $now()
        onSuccess:
          emit:
            eventType: OrderFulfilled
            payload: {orderId: $.orderId, status: "completed"}
\`\`\`

**Key**: \`$now()\` for timestamps, field name transformation (qty), no onFailure = rely on retries.
`;
}

/**
 * Generate Constraints section for agent prompt
 *
 * @param domainRoot Relative path from project root to domain parent
 */
function generateConstraints(domainRoot: string): string {
  return `
## Constraints

| Constraint | Behavior |
|------------|----------|
| **Read-only services/** | NEVER modify files in \`${domainRoot}/{DOMAIN}/services/\` |
| **Preserve existing flows** | When adding flows, preserve all existing flows |
| **Valid JSONata** | All .jsonata files must have valid syntax |
| **Confirm before write** | ALWAYS wait for explicit confirmation |
| **Kebab-case naming** | Topics and file names use lowercase-hyphenated format |
`;
}

/**
 * Generate Error Handling section for agent prompt
 *
 * @param domainRoot Relative path from project root to domain parent
 */
function generateErrorHandling(domainRoot: string): string {
  return `
## Error Handling

| Error | Response |
|-------|----------|
| No DOMAIN specified | "Error: No domain specified. Usage: /spas.compose DOMAIN:<name> <action>" |
| No choreography.yaml | "Error: Workspace not initialized. Run \`spas-compose init {DOMAIN} --output ${domainRoot}\` first." |
| No services pulled | "Error: No services found. Run \`spas-compose services pull\` first." |
| Service not found | "Error: Service '<name>' not found in services/ directory." |
| Schema mismatch | "Warning: Cannot auto-generate transformation. Manual mapping required." |
`;
}

/**
 * Generate Example Prompts section for agent prompt
 */
function generateExamplePrompts(): string {
  return `
## Example Prompts

\`\`\`
/spas.compose DOMAIN:public Analyze order-service and fulfillment-service

/spas.compose DOMAIN:public Generate transformation for order-created to fulfillment-service

/spas.compose DOMAIN:internal Review choreography.yaml and identify missing transformations

/spas.compose DOMAIN:partner Add notification-service to order-fulfillment flow
\`\`\`
`;
}

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
  // Compose from helper functions for maintainability
  const technicalReference = generateTechnicalReference(domainRoot);
  const workflowPhases = generateWorkflowPhases(domainRoot);
  const knownPitfalls = generateKnownPitfalls();
  const troubleshooting = generateTroubleshooting();
  const completeExamples = generateCompleteExamples();
  const constraints = generateConstraints(domainRoot);
  const errorHandling = generateErrorHandling(domainRoot);
  const examplePrompts = generateExamplePrompts();

  return `---
description: AI-assisted choreography composition for SPAS domain workspaces
---

## User Input

\`\`\`text
$ARGUMENTS
\`\`\`

You **MUST** consider the user input before proceeding (if not empty).

## Domain Selection

**REQUIRED**: User input must include \`DOMAIN:<name>\` to specify which domain to work with.

**Parse the domain name:**
1. Extract \`DOMAIN:<name>\` from user input (e.g., \`DOMAIN:public\`, \`DOMAIN:internal\`)
2. Use \`<name>\` to construct paths: \`${domainRoot}/<name>/...\`
3. If no \`DOMAIN:\` specified, respond with error:
   \`\`\`
   Error: No domain specified.
   Usage: /spas.compose DOMAIN:<name> <action>
   Example: /spas.compose DOMAIN:public Analyze order-service
   \`\`\`

**Domain root**: \`${domainRoot}\`
**Full domain path**: \`${domainRoot}/{DOMAIN}/\`

## Goal

Analyze pulled service contracts and generate choreography configuration with transformations for the specified domain workspace.

## Responsibilities

1. **Contract Analysis**: Parse service metadata from \`${domainRoot}/{DOMAIN}/services/*/spas.json\`
2. **Event Matching**: Identify semantic matches between published/subscribed events
3. **Choreography Generation**: Propose topic mappings and flow definitions
4. **Transformation Generation**: Create JSONata transformation files
5. **Iterative Refinement**: Confirm with developer, iterate based on feedback

## Workspace Structure

\`\`\`
${domainRoot}/{DOMAIN}/
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
${technicalReference}${workflowPhases}${knownPitfalls}${troubleshooting}${completeExamples}${constraints}${errorHandling}${examplePrompts}`;
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
