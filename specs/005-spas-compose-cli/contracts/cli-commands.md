# CLI Command Contracts: spas-compose

**Spec**: [../spec.md](../spec.md) | **Data Model**: [../data-model.md](../data-model.md)

## Overview

This document defines the CLI command interface contracts for spas-compose, following the text I/O protocol specified in the Constitution.

---

## Global Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--version` | flag | - | Display CLI version |
| `--help` | flag | - | Display help for command |
| `--json` | flag | false | Output in JSON format (machine-readable) |
| `--verbose` | flag | false | Enable verbose output |

---

## Commands

### `spas-compose init`

Initialize a new domain workspace.

**Synopsis**:
```
spas-compose init <domain-name> [options]
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `domain-name` | Yes | Name for the domain workspace (lowercase, hyphenated) |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--force` | flag | false | Overwrite existing workspace |

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Domain folder already exists (without --force) |
| 2 | Invalid domain name format |
| 3 | Filesystem write error |

**Output (stdout)**:
```
Created domain workspace: e-commerce/
├── README.md
├── choreography.yaml
├── services/
└── transformations/

Agent prompt available at: .github/agents/spas-compose.md
Run `/spas.compose` to start AI-assisted composition.
```

**Output (--json)**:
```json
{
  "success": true,
  "domain": "e-commerce",
  "path": "/path/to/e-commerce",
  "artifacts": [
    "README.md",
    "choreography.yaml",
    "services/",
    "transformations/"
  ],
  "agentPrompt": ".github/agents/spas-compose.md"
}
```

**Errors (stderr)**:
```
Error: Domain 'e-commerce' already exists.
Hint: Use --force to overwrite or choose a different name.
```

---

### `spas-compose services pull`

Download service metadata from SPAS Repository.

**Synopsis**:
```
spas-compose services pull <name> <version> [options]
```

**Arguments**:
| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Service name to download |
| `version` | Yes | Semver version to download |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--repo <url>` | string | `SPAS_REPOSITORY_URL` or `http://localhost:3000` | Repository URL |

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Service or version not found |
| 2 | Repository unreachable |
| 3 | Not in a domain workspace |
| 4 | Filesystem write error |

**Output (stdout)**:
```
Downloading order-service:1.0.0 from http://localhost:3000...
Downloaded order-service:1.0.0
├── spas.json (2.3 KB)
└── schemas/
    ├── OrderCreated.schema.json
    ├── OrderUpdated.schema.json
    └── OrderCancelled.schema.json

Saved to services/order-service/
```

**Output (--json)**:
```json
{
  "success": true,
  "service": {
    "name": "order-service",
    "version": "1.0.0",
    "boundedContext": "orders"
  },
  "path": "services/order-service",
  "artifacts": {
    "metadata": "spas.json",
    "schemas": ["OrderCreated.schema.json", "OrderUpdated.schema.json", "OrderCancelled.schema.json"]
  },
  "bytes": 4567
}
```

**Errors (stderr)**:
```
Error: Service 'order-service:1.0.0' not found in repository.
Hint: Verify service exists with Repository API:
  GET http://localhost:3000/services/order-service/versions
```

---

### `spas-compose choreography build`

Generate deployment artifacts from choreography configuration.

**Synopsis**:
```
spas-compose choreography build [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--docker` | flag | false | Generate Docker Compose deployment |
| `--dry-run` | flag | false | Validate and preview without writing files |
| `--output <file>` | string | `docker-compose.yaml` | Output filename |

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Invalid choreography.yaml |
| 2 | Missing service metadata (not pulled) |
| 3 | Missing transformation file |
| 4 | Invalid JSONata syntax |
| 5 | Not in a domain workspace |
| 6 | Filesystem write error |

**Output (stdout)**:
```
Validating choreography.yaml...
✓ 2 flows defined
✓ 3 services referenced

Validating services...
✓ order-service (pulled)
✓ fulfillment-service (pulled)
✓ notification-service (pulled)

Validating transformations...
✓ transformations/fulfillment-service/inbound-order-created.jsonata
✓ transformations/notification-service/inbound-fulfillment-completed.jsonata

Generating Docker Compose deployment...
Generated docker-compose.yaml

Services:
  - order-service (port 8001)
  - fulfillment-service (port 8002)
  - notification-service (port 8003)

Sidecars:
  - order-service-sidecar (port 9001)
  - fulfillment-service-sidecar (port 9002)
  - notification-service-sidecar (port 9003)

Infrastructure:
  - redis (port 6379)
  - zipkin (port 9411)

Run: docker compose up
```

**Output (--json)**:
```json
{
  "success": true,
  "validation": {
    "flows": 2,
    "services": 3,
    "transformations": 2
  },
  "output": "docker-compose.yaml",
  "services": [
    {"name": "order-service", "port": 8001, "sidecarPort": 9001},
    {"name": "fulfillment-service", "port": 8002, "sidecarPort": 9002},
    {"name": "notification-service", "port": 8003, "sidecarPort": 9003}
  ],
  "infrastructure": ["redis", "zipkin"]
}
```

**Output (--dry-run)**:
```
[DRY RUN] Validating choreography.yaml...
✓ Validation passed

Would generate: docker-compose.yaml
Would include:
  - 3 services with sidecars
  - Redis for event streaming
  - Zipkin for distributed tracing
```

**Errors (stderr)**:
```
Error: Service 'payment-service' referenced in flow 'payment-processing' but not pulled.
Hint: Run 'spas-compose services pull payment-service <version>' first.
```

```
Error: Transformation file not found: transformations/fulfillment-service/inbound-order-created.jsonata
Hint: Create the transformation file or use /spas.compose to generate it.
```

```
Error: Invalid JSONata syntax in transformations/fulfillment-service/inbound-order-created.jsonata
Line 5: Unexpected token '}'
Hint: Validate syntax at https://try.jsonata.org/
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPAS_REPOSITORY_URL` | Repository service URL | `http://localhost:3000` |
| `SPAS_COMPOSE_VERBOSE` | Enable verbose output | `false` |

---

## References

- [FR-001 through FR-012](../spec.md) — Functional requirements
- [Constitution: CLI Tools](../../../.specify/memory/constitution.md) — CLI design constraints
