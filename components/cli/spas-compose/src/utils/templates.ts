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
com.{service-name}.{event-name-kebab}
\`\`\`

**Construction Rules:**
1. **Service Name**: From \`x-service-name\` header (full service name as-is)
   - \`order-service\` → \`order-service\`
   - \`inventory-service\` → \`inventory-service\`
2. **Event Name**: From \`x-event-name\` header (kebab-case)
   - \`order-created\` → \`order-created\`
   - \`stock-reserved\` → \`stock-reserved\`

**Examples:**
\`\`\`yaml
# Service: order-service
# Event: order-created
→ CloudEvents type: com.order-service.order-created

# Service: inventory-service  
# Event: stock-reserved
→ CloudEvents type: com.inventory-service.stock-reserved
\`\`\`

**Why this matters:** Enables consistent event type format across all services and supports event filtering by service or event type.

### Sidecar Configuration Schema

Sidecar configurations define how sidecars route events and commands to service endpoints.

**Essential Structure:**
| Field | Type | Description |
|-------|------|-------------|
| \`inbound\` | array | Event subscriptions & command handlers (sidecar → service) |
| \`outbound\` | array | Event publication routing (service → topics) |

**Inbound Entry** (event or command → service invocation):
- \`kind\`: \`"event"\` (pub/sub) or \`"command"\` (request-response)
- \`topic\` or \`command\`: Subscription identifier
- \`transform\`: JSONata file path (optional)
- \`invokeEndpoint\`: Service HTTP path to invoke (e.g., \`"/incoming"\`)

**Outbound Entry** (service events → topic routing):
- \`topic\`: Target topic/stream name
- \`eventType\`: CloudEvents type for routing (optional)
- \`transform\`: JSONata file path (optional)

**Complete Schema**: \`\${domainRoot}/{DOMAIN}/.spas/schemas/sidecar-config-v1.schema.json\`

**Example:**
\`\`\`json
{
  "inbound": [{
    "kind": "event",
    "topic": "orders-requested",
    "transform": "inbound-order.jsonata",
    "invokeEndpoint": "/incoming"
  }],
  "outbound": [{
    "topic": "orders-fulfilled",
    "eventType": "com.example.order.fulfilled"
  }]
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

### Sidecar Communication Patterns

Services NEVER call other services directly - all communication via sidecars.

**Event Publishing**: Service calls \`POST /publish\` with headers \`x-service-name\`, \`x-event-name\`. Sidecar publishes CloudEvents type \`com.{service}.{event}\` to Redis. Consuming sidecar invokes target service endpoint.

**Command Invocation**: Choreography uses \`command: name\` field. Sidecar resolves endpoint from config, transforms via \`inputMapping\`, invokes target service, returns response for \`outputMapping\`.

**Common Mistake:** Direct service calls bypass sidecar (breaks tracing/policy).

### Service Metadata (spas.json) Schema

Service metadata files define service capabilities, contracts, and runtime configuration.

**Essential Structure:**
| Field | Type | Description |
|-------|------|-------------|
| \`schemaVersion\` | string | Schema version ("runtime-metadata-v1") |
| \`id\` | string | Service identifier (kebab-case) |
| \`name\` | string | Display name |
| \`version\` | string | Semantic version |
| \`boundedContext\` | string | Domain context name |
| \`endpoints\` | array | Command/Query endpoints |
| \`events\` | array | Event types published |
| \`runtime\` | object | Container image/digest info |

**Endpoint Structure:**
- \`name\`: Endpoint identifier
- \`type\`: "Command" or "Query"
- \`protocol\`: "Http" or "Grpc"
- \`methodPath\`: "POST /api/orders"
- \`version\`: Semantic version
- \`schemaRef\`: Path to request/response schema

**Event Structure:**
- \`type\`: Event type name (PascalCase)
- \`version\`: Semantic version
- \`schemaRef\`: Path to event schema

**Complete Schema**: \`\${domainRoot}/{DOMAIN}/.spas/schemas/runtime-metadata-v1.schema.json\`

**Example:**
\`\`\`json
{
  "schemaVersion": "runtime-metadata-v1",
  "id": "order-service",
  "name": "Order Service",
  "version": "1.0.0",
  "boundedContext": "ecommerce",
  "endpoints": [
    {
      "name": "CreateOrder",
      "type": "Command",
      "protocol": "Http",
      "methodPath": "POST /api/orders",
      "version": "1.0",
      "schemaRef": "schemas/create-order.schema.json"
    }
  ],
  "events": [
    {
      "type": "OrderCreated",
      "version": "1.0",
      "schemaRef": "schemas/order-created.schema.json"
    }
  ],
  "runtime": {
    "image": "spas/order-service",
    "repository": "localhost:5000",
    "tag": "1.0.0",
    "digest": "sha256:abc123..."
  }
}
\`\`\`

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

Choreography files define event-driven workflows and service interactions between services.

**Essential Structure:**
| Field | Type | Description |
|-------|------|-------------|
| \`version\` | string | Schema version ("1.0") |
| \`domain\` | string | Domain context name |
| \`flows\` | object | Named choreography flows (key = flow name) |
| \`infrastructure\` | object | Redis/Zipkin config (optional) |

**Flow Definition:**
- \`participants\`: Array of service names (minimum 2)
- \`events\`: Array of event routing rules
  - \`source\`: Publishing service name
  - \`event\`: Event type (kebab-case)
  - \`topic\`: Message topic/stream name
  - \`targets\`: Array of subscribing services
    - \`service\`: Subscriber name
    - \`transform\`: JSONata file path (optional)

**Complete Schema**: \`\${domainRoot}/{DOMAIN}/.spas/schemas/choreography-v1.schema.json\`

**Example:**
\`\`\`yaml
version: "1.0"
domain: "e-commerce"
flows:
  order-fulfillment:
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: order-created
        topic: orders
        targets:
          - service: fulfillment-service
            transform: transformations/fulfillment-service/inbound-order.jsonata
\`\`\`

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
  return `
## Known Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| **Missing $append for Arrays** | JSONata evaluation error | Always use \`$append([], array)\` pattern. JSONata returns single object (not array) for single-element arrays. |
| **Wrong Command Name** | Choreography execution failure | \`command\` field must match invocation config. Sidecar resolves target endpoint from command name. |
| **Inconsistent Field Casing** | \`null\`/\`undefined\` values | Match exact field names from service schemas (camelCase vs snake_case). |
| **Missing x-service-name** | Choreography not loaded | Add \`x-service-name\` to all endpoints in spas.json (REQUIRED field). |
| **Circular Event Dependencies** | Infinite event loop | Design acyclic flows. Validate no event chain creates a loop. |
| **Empty outputMapping** | Empty payload downstream | Test JSONata with sample data. Use \`$exists(field)\` or fallback values. |
`;
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
  return `
## Troubleshooting

| Error | Solution |
|-------|----------|
| **400 on /incoming** | Check service endpoint expects transformed payload format. Verify inputMapping produces valid schema. |
| **Transform failures** | Test JSONata with sample data. Use \`$exists(field)\` checks. Verify field name casing. |
| **Events not routing** | Check CloudEvents type follows \`com.<service-name>.<event>\` format. Verify \`x-event-name\` matches. |
| **Connection refused** | Verify target service running (\`docker ps\`). Check invocation config has correct endpoint URL. |
| **Choreography not loaded** | Validate YAML syntax. Ensure \`x-service-name\` in info section matches service identity. |
| **Empty payload** | Use fallback values in JSONata. Test outputMapping with actual response data. |

**Debug**: \`docker compose logs -f spas-sidecar-<service>\` | Validate YAML online | Test JSONata at try.jsonata.org
`;
}

/**
 * Generate Known Limitations section for agent prompt
 *
 * Documents current system constraints and design decisions
 */
function generateKnownLimitations(): string {
  return `
## Known Limitations

- **/incoming endpoint**: Cannot customize path. Expects CloudEvents format.
- **Array handling**: JSONata returns object (not array) for single elements. Use \`$append\`.
- **Single bounded context**: Each service belongs to one context only.
- **Choreography naming**: Must follow pattern in \`choreographies/\` directory.
- **Transformation paths**: Must be relative to domain root. No absolute paths.
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
  const knownLimitations = generateKnownLimitations();
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
${technicalReference}${workflowPhases}${knownPitfalls}${troubleshooting}${knownLimitations}${constraints}${errorHandling}${examplePrompts}`;
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
          required: ["participants", "events"],
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
              description: "Message topic/stream name",
              pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
              examples: ["orders", "fulfillment"],
            },
            targets: {
              type: "array",
              description: "Subscribing services and their transformations",
              items: {
                $ref: "#/definitions/Target",
              },
              minItems: 1,
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
                  event: "OrderCreated",
                  topic: "orders",
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
