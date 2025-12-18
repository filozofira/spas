# spas-compose CLI

**Status**: 🚧 In Development  
**Version**: 0.1.0 (PoC)  
**Purpose**: Domain choreography composition tool for SPAS framework

## Overview

The `spas-compose` CLI enables developers to compose SPAS services into domain contexts through choreography configuration. It provides tools for workspace initialization, service metadata retrieval, and deployment generation with AI-assisted composition.

## Features

- **Workspace Initialization**: Create structured domain workspace with single command
- **Service Discovery**: Pull service metadata and schemas from SPAS Repository
- **AI-Assisted Composition**: Use `/spas.compose` agent prompt for choreography generation
- **Docker Compose Generation**: Generate deployment configurations from choreography

## Installation

### From Source (Development)

```bash
cd components/cli/spas-compose
npm install
npm run build
npm link
```

### Verify Installation

```bash
spas-compose --version
spas-compose --help
```

## Commands

### `spas-compose init <workspace-name>`

Initialize a new domain workspace with recommended folder structure.

**Arguments:**
- `<workspace-name>` - Name of the domain workspace (lowercase, hyphen-separated)

**Options:**
- `-o, --output <path>` - Output directory for domain workspace (default: current directory)
- `-f, --force` - Overwrite existing workspace
- `--json` - Output result as JSON
- `--verbose` - Enable verbose output

**Examples:**

```bash
# Create domain in current directory
spas-compose init e-commerce-domain
cd e-commerce-domain

# Create domain in a specific directory
spas-compose init public --output ./examples/domains

# This creates ./examples/domains/public/choreography.yaml
```

**Output:**

```
e-commerce-domain/
├── README.md                          # Workspace documentation
├── choreography.yaml                  # Choreography configuration (scaffold)
├── services/                          # Pulled service metadata
├── transformations/                   # JSONata transformation files
└── .spas/
    └── schemas/
        └── sidecar-config-v1.schema.json  # Sidecar config schema for AI
```

**Agent File Placement:**

The `init` command also creates AI agent files at the git repository root:

```
<project-root>/
├── .github/
│   ├── agents/
│   │   └── spas.compose.agent.md      # AI agent instructions
│   └── prompts/
│       └── spas.compose.prompt.md     # Agent trigger file
└── <output-path>/
    └── <domain>/
        └── ...
```

When using `--output`, the CLI detects the git repository root and places agent files there. The agent supports **multiple domains** under the same output path using the `DOMAIN:` prefix:

```bash
# Create multiple domains under the same output path
spas-compose init public --output ./examples/ecommerce
spas-compose init internal --output ./examples/ecommerce
spas-compose init partner --output ./examples/ecommerce

# Use agent with DOMAIN: prefix to specify which domain to compose
/spas.compose DOMAIN:public Analyze order-service
/spas.compose DOMAIN:internal Review choreography
```

---

### `spas-compose services pull <service-name> <version>`

Download service metadata and schemas from SPAS Repository.

**Arguments:**
- `<service-name>` - Service identifier (e.g., order-service)
- `<version>` - Semantic version (e.g., 1.0.0)

**Options:**
- `--repo <url>` - Repository URL (overrides SPAS_REPOSITORY_URL)
- `--json` - Output result as JSON
- `--verbose` - Show detailed progress

**Environment Variables:**
- `SPAS_REPOSITORY_URL` - Default repository URL (default: http://localhost:3000)

**Example:**

```bash
spas-compose services pull order-service 1.0.0
spas-compose services pull fulfillment-service 1.0.0 --repo http://repo.example.com
```

**Output:**

```
services/
├── order-service/
│   ├── spas.json                      # Service metadata
│   └── schemas/
│       ├── endpoints/                 # Endpoint schemas
│       │   └── CreateOrder.schema.json
│       └── events/                    # Event schemas
│           ├── OrderCreated.schema.json
│           └── OrderCancelled.schema.json
└── fulfillment-service/
    ├── spas.json
    └── schemas/
        └── events/
            └── OrderFulfilled.schema.json
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Service or version not found |
| 2 | Repository unreachable |
| 3 | Not in a domain workspace |
| 4 | Filesystem write error |

---

### `spas-compose choreography build [options]`

Build deployment configuration from choreography.yaml.

**Options:**
- `--docker` - Generate docker-compose.yaml and sidecar config files (required)
- `--dev` - Dev mode: use local Docker images (`spas-{name}:latest`) with `pull_policy: never`
- `--debug` - Debug mode: set `LOG_LEVEL=debug` for sidecars (verbose payload logging)
- `--disable-sidecar-tracing` - Disable sidecar tracing while keeping service tracing
- `--dry-run` - Validate and preview without generating files
- `--output <file>` - Output filename (default: docker-compose.yaml)
- `--event-backbone <image>` - Event backbone Docker image (default: redis:7-alpine)
- `--observability-backbone <image>` - Observability backbone Docker image (default: openzipkin/zipkin:latest)
- `--json` - Output result as JSON
- `--verbose` - Show detailed progress

**Dev Mode:**

The `--dev` flag enables fast local development iteration by:
- Using `spas-{service-name}:latest` as image references (ignores `runtime.image` from spas.json)
- Setting `pull_policy: never` to use local Docker Desktop images directly
- Skipping repository digest resolution

```bash
# Development workflow (fast iteration)
spas-compose choreography build --docker --dev

# Production workflow (pinned versions from repository)
spas-compose choreography build --docker
```

**Debug Mode:**

The `--debug` flag enables verbose sidecar logging for troubleshooting event flows:
- Sets `LOG_LEVEL=debug` in sidecar environment variables
- Enables detailed payload logging (`[publish] Payload:`, `[subscriber] Payload:`)
- Useful for diagnosing event routing and transformation issues

```bash
# Development with debug logging
spas-compose choreography build --docker --dev --debug

# View sidecar payload logs
docker compose up
# Look for "[publish] Payload:" and "[subscriber] Payload:" in sidecar logs
```

**Disable Sidecar Tracing:**

The `--disable-sidecar-tracing` flag disables sidecar traces while keeping service traces:
- Sets `TRACING_ENABLED=false` in sidecar environment variables
- Services still send traces to Zipkin (cleaner trace view)
- Sidecars don't add publish/receive/invoke spans
- Useful when sidecar spans clutter the trace view

```bash
# Service traces only, no sidecar spans
spas-compose choreography build --docker --dev --disable-sidecar-tracing

# Combine with debug for payload logging without sidecar traces
spas-compose choreography build --docker --dev --debug --disable-sidecar-tracing
```

**Backbone Configuration:**

The build command includes Redis and Zipkin backbone services by default. You can customize these:

```bash
# Use custom Redis version
spas-compose choreography build --docker --event-backbone redis:6.2-alpine

# Use Jaeger instead of Zipkin (auto-configures ports 16686 and 9411)
spas-compose choreography build --docker --observability-backbone jaegertracing/all-in-one:latest

# Use shorthand notation for common images
spas-compose choreography build --docker --observability-backbone jaeger:latest

# Disable backbones for BYO infrastructure (uses env var substitution)
spas-compose choreography build --docker --event-backbone none --observability-backbone none
```

When using `none`, sidecars will be configured with environment variable placeholders (`${REDIS_HOST}`, `${REDIS_PORT}`, `${ZIPKIN_URL}`) that you must provide at runtime.

**Example:**

```bash
spas-compose choreography build --docker
spas-compose choreography build --docker --dry-run  # Validation only
spas-compose choreography build --docker --output deployment.yaml
```

**Output:**

```
✓ Validated choreography.yaml
✓ Validated transformation files
✓ Generated docker-compose.yaml
✓ Generated config.order-service.json (0 inbound, 1 outbound)
✓ Generated config.fulfillment-service.json (1 inbound, 0 outbound)

Next steps:
  • Copy service source to workspace
  • Run: docker compose up
```

**Generated Files:**
- `docker-compose.yaml` - Docker Compose deployment configuration
- `config.{service}.json` - Sidecar configuration for each participating service

**Sidecar Config Schema:**
```json
{
  "inbound": [
    { "kind": "event", "topic": "orders-requested", "transform": "transformations/inbound.jsonata", "invokeEndpoint": "/incoming" }
  ],
  "outbound": [
    { "topic": "orders-fulfilled" }
  ]
}
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid choreography.yaml |
| 2 | Missing service metadata (not pulled) |
| 3 | Missing transformation file |
| 4 | Invalid JSONata syntax |
| 5 | Not in a domain workspace |

---

## AI-Assisted Composition

Use the `/spas.compose` agent prompt for semantic choreography composition. The `DOMAIN:` prefix specifies which domain workspace to operate on:

```
/spas.compose DOMAIN:public Analyze order-service and fulfillment-service contracts.
Propose topic mappings and generate transformations.

/spas.compose DOMAIN:internal Review choreography.yaml and identify missing transformations.

/spas.compose DOMAIN:partner Add notification-service to order-fulfillment flow.
```

The agent will:
1. Parse service contracts from `<domain-root>/{DOMAIN}/services/*/spas.json`
2. Propose event mappings and topic routes
3. Generate JSONata transformation files
4. Update `choreography.yaml` with validated configuration

**Agent Prompt Features:**

The enriched agent prompt (generated by `spas-compose init`) includes:

- **Self-Contained Documentation**: Complete CloudEvents format, sidecar config schema, JSONata patterns, endpoint routing rules, and field naming conventions — no external documentation required
- **Phased Workflow**: 5-phase systematic approach (Analyze → Propose → Generate → Validate → Build) with entry/exit criteria, validation checklists, and confirmation prompts
- **Technical Reference**: Full choreography YAML schema, service metadata (spas.json) schema, and complete working examples with Mermaid diagrams
- **Known Pitfalls**: 6 documented common mistakes with symptom/cause/fix format, plus troubleshooting guide mapping errors to solutions
- **Domain-Relative Paths**: All paths use `${domainRoot}/{DOMAIN}/` pattern to support multiple domains under the same output path

**File Size**: Agent prompt is optimized to stay under 25 KB (~24.7 KB) for fast loading and token efficiency.

**Note:** The `DOMAIN:` prefix is required. Without it, the agent will prompt for the domain name.

See [.github/agents/spas.compose.agent.md](../../.github/agents/spas.compose.agent.md) for full agent capabilities.

---

## Workflow Example

```bash
# 1. Initialize workspace
spas-compose init e-commerce-domain
cd e-commerce-domain

# 2. Pull service metadata
spas-compose services pull order-service 1.0.0
spas-compose services pull fulfillment-service 1.0.0

# 3. Use AI to compose choreography
# (Interactive prompt session with /spas.compose agent)

# 4. Validate and build
spas-compose choreography build --dry-run
spas-compose choreography build --docker

# 5. Start services
docker compose up
```

---

## Configuration

### Repository URL Resolution

1. `--repo` flag (highest priority)
2. `SPAS_REPOSITORY_URL` environment variable
3. Default: `http://localhost:3000`

### Workspace Detection

Commands requiring workspace context (`services pull`, `choreography build`) validate:
- `choreography.yaml` exists
- `services/` directory exists

---

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

### Lint and Format

```bash
npm run lint
npm run format
```

---

## Architecture

- **CLI Framework**: Commander.js 11.x
- **YAML Parsing**: js-yaml 4.x
- **Transformation Validation**: jsonata 2.x
- **HTTP Client**: axios 1.x
- **Terminal Output**: chalk 4.x

### Project Structure

```
src/
├── index.ts                          # CLI entry point
├── types.ts                          # TypeScript interfaces
├── commands/
│   ├── init.ts                       # init command
│   ├── services-pull.ts              # services pull command
│   └── choreography-build.ts         # choreography build command
├── services/
│   ├── repository-client.ts          # SPAS Repository HTTP client
│   ├── workspace-service.ts          # Workspace operations
│   ├── pull-service.ts               # Service metadata download
│   ├── choreography-loader.ts        # YAML parsing and validation
│   ├── jsonata-validator.ts          # JSONata syntax validation
│   └── docker-generator.ts           # Docker Compose generation
└── utils/
    ├── config.ts                     # Configuration resolution
    ├── output.ts                     # Terminal output formatting
    └── templates.ts                  # File templates
```

---

## JSONata Transformations

Transformation files use [JSONata](https://jsonata.org/) — a declarative JSON query and transformation language:

```jsonata
{
  "orderId": payload.id,
  "items": payload.lineItems.{ "sku": sku, "qty": quantity },
  "priority": payload.total > 1000 ? "high" : "normal"
}
```

**Why JSONata?**
- Language-agnostic: Works in Node.js and Go sidecars
- Human-readable: Suitable for AI generation and developer review
- Declarative: No side effects, testable, version-controllable

---

## Specification

Full specification: [specs/005-spas-compose-cli/](../../specs/005-spas-compose-cli/)

- [spec.md](../../specs/005-spas-compose-cli/spec.md) - Feature requirements
- [plan.md](../../specs/005-spas-compose-cli/plan.md) - Technical design
- [data-model.md](../../specs/005-spas-compose-cli/data-model.md) - Domain entities
- [contracts/cli-commands.md](../../specs/005-spas-compose-cli/contracts/cli-commands.md) - Command contracts
- [contracts/choreography-schema.yaml](../../specs/005-spas-compose-cli/contracts/choreography-schema.yaml) - Configuration schema
- [quickstart.md](../../specs/005-spas-compose-cli/quickstart.md) - Getting started guide

---

## Related Documentation

- [SPAS CLI Specification](../../../principles/component/13-cli.md)
- [Domain Choreography](../../../principles/component/14-domain-choreography.md)
- [ADR-036: JSONata transformations](../../../principles/appendix/28-decision-log.md)
- [ADR-037: AI-in-the-loop composition](../../../principles/appendix/28-decision-log.md)

---

## License

MIT
