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
- `--force` - Overwrite existing workspace
- `--json` - Output result as JSON

**Example:**

```bash
spas-compose init e-commerce-domain
cd e-commerce-domain
```

**Output:**

```
e-commerce-domain/
├── README.md                          # Workspace documentation
├── choreography.yaml                  # Choreography configuration (scaffold)
├── services/                          # Pulled service metadata
└── choreography/
    └── transformations/               # JSONata transformation files
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
│       ├── OrderCreated.schema.json
│       └── OrderCancelled.schema.json
└── fulfillment-service/
    ├── spas.json
    └── schemas/
        └── OrderFulfilled.schema.json
```

---

### `spas-compose choreography deploy [options]`

Generate deployment configuration from choreography.yaml.

**Options:**
- `--docker` - Generate docker-compose.yaml
- `--dry-run` - Validate without generating files
- `--json` - Output result as JSON
- `--verbose` - Show detailed progress

**Example:**

```bash
spas-compose choreography deploy --docker
spas-compose choreography deploy --dry-run  # Validation only
```

**Output:**

```
✓ Validated choreography.yaml
✓ Validated transformation files
✓ Generated docker-compose.yaml
```

---

## AI-Assisted Composition

Use the `/spas.compose` agent prompt for semantic choreography composition:

```
/spas.compose Analyze order-service and fulfillment-service contracts.
Propose topic mappings and generate transformations.
```

The agent will:
1. Parse service contracts from `services/*/spas.json`
2. Propose event mappings and topic routes
3. Generate JSONata transformation files
4. Update `choreography.yaml` with validated configuration

See [.github/agents/spas-compose.md](../../.github/agents/spas-compose.md) for full agent capabilities.

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

# 4. Validate and deploy
spas-compose choreography deploy --dry-run
spas-compose choreography deploy --docker

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

Commands requiring workspace context (`services pull`, `choreography deploy`) validate:
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
│   └── choreography-deploy.ts        # choreography deploy command
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
