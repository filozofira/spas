# Quickstart: Sidecar Config Generator

**Feature**: 006-sidecar-config-generator  
**Date**: 2025-12-14

## Overview

This enhancement adds automatic sidecar configuration file generation to `spas-compose choreography build --docker`. After this feature, a single command produces all artifacts needed to run `docker compose up`.

## Before This Feature

```bash
# Generate docker-compose.yaml
spas-compose choreography build --docker

# ❌ docker compose up fails - config files missing!
docker compose up
# Error: ./config.order-service.json not found
```

## After This Feature

```bash
# Generate docker-compose.yaml AND config files
spas-compose choreography build --docker

# Generated files:
# - docker-compose.yaml (existing)
# - config.order-service.json (NEW)
# - config.fulfillment-service.json (NEW)

# ✅ docker compose up works!
docker compose up
```

## Usage

### Basic Usage

```bash
cd my-domain
spas-compose choreography build --docker
```

**Output**:
```
✓ Validated choreography.yaml
✓ Generated docker-compose.yaml
✓ Generated config.order-service.json (0 inbound, 1 outbound)
✓ Generated config.fulfillment-service.json (1 inbound, 0 outbound)

Next steps:
  • Copy service source to workspace
  • Run: docker compose up
```

### Dry Run

```bash
spas-compose choreography build --docker --dry-run
```

**Output**:
```
✓ Validated choreography.yaml
✓ Validated 2 transformation files

Would generate:
  • docker-compose.yaml
  • config.order-service.json
    - outbound: orders-requested
  • config.fulfillment-service.json
    - inbound: orders-requested → /incoming

No files written (dry run)
```

### JSON Output

```bash
spas-compose choreography build --docker --json
```

```json
{
  "success": true,
  "message": "Generated docker-compose.yaml and 2 sidecar configs",
  "data": {
    "output": "docker-compose.yaml",
    "configs": [
      { "file": "config.order-service.json", "inbound": 0, "outbound": 1 },
      { "file": "config.fulfillment-service.json", "inbound": 1, "outbound": 0 }
    ]
  }
}
```

## Generated Config Example

### config.order-service.json

```json
{
  "inbound": [],
  "outbound": [
    {
      "topic": "orders-requested"
    }
  ]
}
```

### config.fulfillment-service.json

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-requested",
      "transform": "transformations/inbound-order-created.jsonata",
      "invokeEndpoint": "/incoming"
    }
  ],
  "outbound": []
}
```

## Error Handling

### Missing Transformation File

```bash
spas-compose choreography build --docker
```

```
✗ Missing transformation files:
  - transformations/fulfillment-service/inbound-order-created.jsonata

Hint: Create the missing file or remove the transform reference from choreography.yaml
```

### Invalid Choreography

```bash
spas-compose choreography build --docker
```

```
✗ Invalid choreography.yaml:
  - Flow 'order-to-fulfillment' references unknown service: unknown-service

Hint: Pull the service with: spas-compose services pull unknown-service <version>
```

## File Layout

After running `spas-compose choreography build --docker`:

```
my-domain/
├── choreography.yaml           # Input
├── services/                   # Pulled service metadata
│   ├── order-service/
│   └── fulfillment-service/
├── transformations/            # JSONata files (created by AI agent)
│   ├── order-service/
│   └── fulfillment-service/
│       └── inbound-order-created.jsonata
├── docker-compose.yaml         # Generated (existing)
├── config.order-service.json   # Generated (NEW)
└── config.fulfillment-service.json  # Generated (NEW)
```

## Integration with Docker Compose

The generated `docker-compose.yaml` already mounts the config files:

```yaml
services:
  order-service-sidecar:
    volumes:
      - ./config.order-service.json:/app/config.json
      - ./transformations/order-service:/app/transformations
```

The sidecar reads `/app/config.json` at startup to configure:
- Which topics to subscribe to (inbound)
- Which topics can be published to (outbound)
- Which transformations to apply
- Which service endpoints to invoke
